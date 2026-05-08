package com.housing.ownertenantapi.service;

import com.housing.ownertenantapi.dto.AlertsSummaryResponse;
import com.housing.ownertenantapi.dto.MatchItemResponse;
import com.housing.ownertenantapi.dto.MatchesResponse;
import com.housing.ownertenantapi.dto.PaginationResponse;
import com.housing.ownertenantapi.dto.TenantDashboardResponse;
import com.housing.ownertenantapi.dto.VisitItemResponse;
import com.housing.ownertenantapi.dto.VisitPropertySummaryResponse;
import com.housing.ownertenantapi.dto.VisitScheduleRequest;
import com.housing.ownertenantapi.dto.VisitScheduleResponse;
import com.housing.ownertenantapi.dto.VisitSlotResponse;
import com.housing.ownertenantapi.dto.VisitSlotsResponse;
import com.housing.ownertenantapi.dto.VisitsResponse;
import java.util.List;
import org.springframework.dao.EmptyResultDataAccessException;
import org.springframework.http.HttpStatus;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Service;
import org.springframework.web.server.ResponseStatusException;

@Service
public class TenantJourneyService {

  private final JdbcTemplate jdbcTemplate;
  private final CurrentSessionService currentSessionService;

  public TenantJourneyService(
      JdbcTemplate jdbcTemplate,
      CurrentSessionService currentSessionService
  ) {
    this.jdbcTemplate = jdbcTemplate;
    this.currentSessionService = currentSessionService;
  }

  public MatchesResponse getMatches(String authorizationHeader, int page, int pageSize, String city) {
    String currentUserId = currentSessionService.resolveUserId(authorizationHeader);
    int safePage = sanitizePage(page);
    int safePageSize = sanitizePageSize(pageSize);
    long totalItems = city == null || city.isBlank()
        ? jdbcTemplate.queryForObject("""
            SELECT COUNT(*)
            FROM matches m
            JOIN listings l ON l.listing_id = m.listing_id
            WHERE m.user_id = ?
            """, Long.class, currentUserId)
        : jdbcTemplate.queryForObject("""
            SELECT COUNT(*)
            FROM matches m
            JOIN listings l ON l.listing_id = m.listing_id
            WHERE m.user_id = ?
              AND l.city = ?
            """, Long.class, currentUserId, city);

    List<MatchItemResponse> items = city == null || city.isBlank()
        ? jdbcTemplate.query("""
                SELECT l.listing_id, l.title, l.locality, l.city, l.rent, l.bhk,
                       l.verified, l.premium, l.posted_label, m.match_score, m.match_reason
                FROM matches m
                JOIN listings l ON l.listing_id = m.listing_id
                WHERE m.user_id = ?
                ORDER BY m.match_score DESC
                LIMIT ? OFFSET ?
                """,
            (rs, rowNum) -> new MatchItemResponse(
                rs.getString("listing_id"),
                rs.getString("title"),
                rs.getString("locality"),
                rs.getString("city"),
                rs.getInt("rent"),
                rs.getString("bhk"),
                rs.getBoolean("verified"),
                rs.getBoolean("premium"),
                rs.getString("posted_label"),
                rs.getDouble("match_score"),
                rs.getString("match_reason")
            ),
            currentUserId,
            safePageSize,
            safePage * safePageSize
        )
        : jdbcTemplate.query("""
                SELECT l.listing_id, l.title, l.locality, l.city, l.rent, l.bhk,
                       l.verified, l.premium, l.posted_label, m.match_score, m.match_reason
                FROM matches m
                JOIN listings l ON l.listing_id = m.listing_id
                WHERE m.user_id = ?
                  AND l.city = ?
                ORDER BY m.match_score DESC
                LIMIT ? OFFSET ?
                """,
            (rs, rowNum) -> new MatchItemResponse(
                rs.getString("listing_id"),
                rs.getString("title"),
                rs.getString("locality"),
                rs.getString("city"),
                rs.getInt("rent"),
                rs.getString("bhk"),
                rs.getBoolean("verified"),
                rs.getBoolean("premium"),
                rs.getString("posted_label"),
                rs.getDouble("match_score"),
                rs.getString("match_reason")
            ),
            currentUserId,
            city,
            safePageSize,
            safePage * safePageSize
        );

    return new MatchesResponse(items, buildPagination(totalItems, safePage, safePageSize));
  }

  public TenantDashboardResponse getTenantDashboard(String authorizationHeader) {
    String currentUserId = currentSessionService.resolveUserId(authorizationHeader);
    int savedCount = jdbcTemplate.queryForObject("""
            SELECT COUNT(*)
            FROM saved_listings
            WHERE user_id = ?
            """, Integer.class, currentUserId);
    int scheduledVisits = jdbcTemplate.queryForObject("""
            SELECT COUNT(*)
            FROM visits
            WHERE user_id = ?
              AND status = 'SCHEDULED'
            """, Integer.class, currentUserId);
    int recommendedCount = jdbcTemplate.queryForObject("""
            SELECT COUNT(*)
            FROM matches
            WHERE user_id = ?
            """, Integer.class, currentUserId);
    int profileCompletion = jdbcTemplate.queryForObject("""
            SELECT profile_completion
            FROM users
            WHERE user_id = ?
            """, Integer.class, currentUserId);
    int unreadCount = jdbcTemplate.queryForObject("""
            SELECT COUNT(*)
            FROM alerts
            WHERE user_id = ?
              AND is_read = FALSE
            """, Integer.class, currentUserId);
    int urgentCount = jdbcTemplate.queryForObject("""
            SELECT COUNT(*)
            FROM alerts
            WHERE user_id = ?
              AND is_read = FALSE
              AND is_urgent = TRUE
            """, Integer.class, currentUserId);
    int matchAlerts = Math.max(unreadCount - urgentCount, 0);

    return new TenantDashboardResponse(
        savedCount,
        scheduledVisits,
        recommendedCount,
        profileCompletion,
        new AlertsSummaryResponse(
            unreadCount,
            urgentCount,
            scheduledVisits + " upcoming visits and " + matchAlerts + " new match alerts"
        )
    );
  }

  public VisitSlotsResponse getVisitSlots(
      String authorizationHeader,
      String propertyId,
      String date
  ) {
    currentSessionService.resolveUserId(authorizationHeader);
    fetchVisitPropertySummary(propertyId);

    List<VisitSlotResponse> slots = jdbcTemplate.query("""
            SELECT slot_id, label, start_time, end_time, available
            FROM visit_slots
            WHERE listing_id = ?
              AND slot_date = CAST(? AS DATE)
            ORDER BY start_time
            """,
        (rs, rowNum) -> new VisitSlotResponse(
            rs.getString("slot_id"),
            rs.getString("label"),
            rs.getString("start_time"),
            rs.getString("end_time"),
            rs.getBoolean("available")
        ),
        propertyId,
        date
    );

    // Fallback: when there are no curated slots for this listing + date,
    // expose a default set of viewing windows so the tenant can still book.
    // The synthetic slot ids are recognized by fetchVisitSlot during the
    // actual schedule call so the booking succeeds without seed rows.
    if (slots.isEmpty()) {
      slots = buildDefaultSlots();
    }

    List<String> visitRules = jdbcTemplate.query("""
            SELECT rule_text
            FROM visit_rules
            ORDER BY sort_order
            """,
        (rs, rowNum) -> rs.getString("rule_text")
    );

    return new VisitSlotsResponse(slots, "Asia/Kolkata", visitRules);
  }

  private static final String DEFAULT_SLOT_PREFIX = "slot_default_";

  private List<VisitSlotResponse> buildDefaultSlots() {
    return List.of(
        buildDefaultSlot("1000", "1030", "10:00 AM - 10:30 AM"),
        buildDefaultSlot("1230", "1300", "12:30 PM - 1:00 PM"),
        buildDefaultSlot("1430", "1500", "2:30 PM - 3:00 PM"),
        buildDefaultSlot("1800", "1830", "6:00 PM - 6:30 PM")
    );
  }

  private VisitSlotResponse buildDefaultSlot(String startCompact, String endCompact, String label) {
    return new VisitSlotResponse(
        DEFAULT_SLOT_PREFIX + startCompact,
        label,
        formatHHmm(startCompact),
        formatHHmm(endCompact),
        true
    );
  }

  private String formatHHmm(String compact) {
    return compact.substring(0, 2) + ":" + compact.substring(2, 4);
  }

  public VisitScheduleResponse scheduleVisit(String authorizationHeader, VisitScheduleRequest request) {
    String currentUserId = currentSessionService.resolveUserId(authorizationHeader);
    VisitPropertySummaryResponse propertySummary = fetchVisitPropertySummary(request.propertyId());
    VisitSlotResponse slot = fetchVisitSlot(request.propertyId(), request.slotId(), request.preferredDate());
    long sequenceValue = jdbcTemplate.queryForObject("SELECT nextval('visit_seq')", Long.class);
    String visitId = "visit_" + sequenceValue;
    String scheduledAtLabel = request.preferredDate() + "T" + slot.startTime() + ":00+05:30";

    jdbcTemplate.update("""
            INSERT INTO visits (
              visit_id, user_id, listing_id, slot_id, slot_label,
              preferred_date, notes, status, scheduled_at
            )
            VALUES (?, ?, ?, ?, ?, CAST(? AS DATE), ?, 'SCHEDULED', ?::timestamptz)
            """,
        visitId,
        currentUserId,
        request.propertyId(),
        request.slotId(),
        slot.label(),
        request.preferredDate(),
        request.notes(),
        scheduledAtLabel
    );

    return new VisitScheduleResponse(visitId, "SCHEDULED", scheduledAtLabel, propertySummary);
  }

  public VisitsResponse getVisits(String authorizationHeader, String status, int page, int pageSize) {
    String currentUserId = currentSessionService.resolveUserId(authorizationHeader);
    int safePage = sanitizePage(page);
    int safePageSize = sanitizePageSize(pageSize);
    long totalItems = status == null || status.isBlank()
        ? jdbcTemplate.queryForObject("""
            SELECT COUNT(*)
            FROM visits
            WHERE user_id = ?
            """, Long.class, currentUserId)
        : jdbcTemplate.queryForObject("""
            SELECT COUNT(*)
            FROM visits
            WHERE user_id = ?
              AND status = ?
            """, Long.class, currentUserId, status);

    List<VisitItemResponse> items = status == null || status.isBlank()
        ? jdbcTemplate.query("""
                SELECT v.visit_id, v.status,
                       TO_CHAR(v.scheduled_at AT TIME ZONE 'Asia/Kolkata',
                               'YYYY-MM-DD"T"HH24:MI:SS"+05:30"') AS scheduled_at_label,
                       v.preferred_date, v.slot_id, v.slot_label, v.notes,
                       l.listing_id, l.title, l.locality, l.city,
                       COALESCE((
                         SELECT photo_url
                         FROM listing_photos p
                         WHERE p.listing_id = l.listing_id
                         ORDER BY sort_order
                         LIMIT 1
                       ), '') AS image_url
                FROM visits v
                JOIN listings l ON l.listing_id = v.listing_id
                WHERE v.user_id = ?
                ORDER BY v.scheduled_at DESC
                LIMIT ? OFFSET ?
                """,
            (rs, rowNum) -> new VisitItemResponse(
                rs.getString("visit_id"),
                rs.getString("status"),
                rs.getString("scheduled_at_label"),
                rs.getDate("preferred_date").toLocalDate().toString(),
                rs.getString("slot_id"),
                rs.getString("slot_label"),
                rs.getString("notes"),
                new VisitPropertySummaryResponse(
                    rs.getString("listing_id"),
                    rs.getString("title"),
                    rs.getString("locality"),
                    rs.getString("city"),
                    rs.getString("image_url")
                )
            ),
            currentUserId,
            safePageSize,
            safePage * safePageSize
        )
        : jdbcTemplate.query("""
                SELECT v.visit_id, v.status,
                       TO_CHAR(v.scheduled_at AT TIME ZONE 'Asia/Kolkata',
                               'YYYY-MM-DD"T"HH24:MI:SS"+05:30"') AS scheduled_at_label,
                       v.preferred_date, v.slot_id, v.slot_label, v.notes,
                       l.listing_id, l.title, l.locality, l.city,
                       COALESCE((
                         SELECT photo_url
                         FROM listing_photos p
                         WHERE p.listing_id = l.listing_id
                         ORDER BY sort_order
                         LIMIT 1
                       ), '') AS image_url
                FROM visits v
                JOIN listings l ON l.listing_id = v.listing_id
                WHERE v.user_id = ?
                  AND v.status = ?
                ORDER BY v.scheduled_at DESC
                LIMIT ? OFFSET ?
                """,
            (rs, rowNum) -> new VisitItemResponse(
                rs.getString("visit_id"),
                rs.getString("status"),
                rs.getString("scheduled_at_label"),
                rs.getDate("preferred_date").toLocalDate().toString(),
                rs.getString("slot_id"),
                rs.getString("slot_label"),
                rs.getString("notes"),
                new VisitPropertySummaryResponse(
                    rs.getString("listing_id"),
                    rs.getString("title"),
                    rs.getString("locality"),
                    rs.getString("city"),
                    rs.getString("image_url")
                )
            ),
            currentUserId,
            status,
            safePageSize,
            safePage * safePageSize
        );

    return new VisitsResponse(items, buildPagination(totalItems, safePage, safePageSize));
  }

  private VisitSlotResponse fetchVisitSlot(String propertyId, String slotId, String preferredDate) {
    // Synthetic default slot ids (e.g. "slot_default_1000") are not stored in
    // visit_slots — reconstruct the response from the embedded HHmm so the
    // booking can proceed.
    if (slotId != null && slotId.startsWith(DEFAULT_SLOT_PREFIX)) {
      VisitSlotResponse synthetic = matchDefaultSlot(slotId);
      if (synthetic != null) {
        return synthetic;
      }
    }

    try {
      return jdbcTemplate.queryForObject("""
              SELECT slot_id, label, start_time, end_time, available
              FROM visit_slots
              WHERE listing_id = ?
                AND slot_id = ?
                AND slot_date = CAST(? AS DATE)
              LIMIT 1
              """,
          (rs, rowNum) -> new VisitSlotResponse(
              rs.getString("slot_id"),
              rs.getString("label"),
              rs.getString("start_time"),
              rs.getString("end_time"),
              rs.getBoolean("available")
          ),
          propertyId,
          slotId,
          preferredDate
      );
    } catch (EmptyResultDataAccessException exception) {
      throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Unknown slot id " + slotId);
    }
  }

  private VisitSlotResponse matchDefaultSlot(String slotId) {
    for (VisitSlotResponse slot : buildDefaultSlots()) {
      if (slot.slotId().equals(slotId)) {
        return slot;
      }
    }
    return null;
  }

  private VisitPropertySummaryResponse fetchVisitPropertySummary(String propertyId) {
    try {
      return jdbcTemplate.queryForObject("""
              SELECT l.listing_id, l.title, l.locality, l.city,
                     COALESCE((
                       SELECT photo_url
                       FROM listing_photos p
                       WHERE p.listing_id = l.listing_id
                       ORDER BY sort_order
                       LIMIT 1
                     ), '') AS image_url
              FROM listings l
              WHERE l.listing_id = ?
              LIMIT 1
              """,
          (rs, rowNum) -> new VisitPropertySummaryResponse(
              rs.getString("listing_id"),
              rs.getString("title"),
              rs.getString("locality"),
              rs.getString("city"),
              rs.getString("image_url")
          ),
          propertyId
      );
    } catch (EmptyResultDataAccessException exception) {
      throw new ResponseStatusException(HttpStatus.NOT_FOUND,
          "Property not found for id " + propertyId);
    }
  }

  private PaginationResponse buildPagination(long totalItems, int page, int pageSize) {
    int totalPages = (int) Math.ceil((double) totalItems / pageSize);
    return new PaginationResponse(page, pageSize, totalItems, totalPages);
  }

  private int sanitizePage(int page) {
    return Math.max(page, 0);
  }

  private int sanitizePageSize(int pageSize) {
    if (pageSize <= 0) {
      return 10;
    }

    return Math.min(pageSize, 50);
  }
}
