package com.housing.ownertenantapi.service;

import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.housing.ownertenantapi.dto.SavedSearchAlertsResponse;
import com.housing.ownertenantapi.dto.SavedSearchAlertsResponse.Alert;
import com.housing.ownertenantapi.dto.SavedSearchRequest;
import com.housing.ownertenantapi.dto.SavedSearchResponse;
import java.time.OffsetDateTime;
import java.time.ZoneOffset;
import java.time.format.DateTimeFormatter;
import java.time.temporal.ChronoUnit;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Locale;
import java.util.Map;
import java.util.UUID;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.http.HttpStatus;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.jdbc.core.simple.JdbcClient;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

/**
 * Tier 2 #4 — Saved Searches + Alerts.
 *
 * Tenants save search criteria (city / rent range / BHK / etc.). When a new
 * listing is published, OwnerListingService calls
 * {@link #fanoutForNewListing(String)} which inserts an alert row for every
 * saved search whose criteria match the new listing.
 *
 * Alerts are surfaced in-app via the /api/v1/saved-searches/alerts endpoint.
 * No email sending in this iteration — `notification_email` field reserved
 * for a future SMTP wire-up.
 */
@Service
public class SavedSearchService {

  private static final Logger log = LoggerFactory.getLogger(SavedSearchService.class);
  private static final DateTimeFormatter ISO = DateTimeFormatter.ISO_OFFSET_DATE_TIME;
  private static final ObjectMapper OBJECT_MAPPER = new ObjectMapper();

  private final JdbcClient jdbcClient;

  public SavedSearchService(JdbcTemplate jdbcTemplate) {
    this.jdbcClient = JdbcClient.create(jdbcTemplate);
  }

  /* ── CRUD ───────────────────────────────────────────────────────────── */

  @Transactional
  public SavedSearchResponse create(String userId, SavedSearchRequest request) {
    String searchId = "ss_" + UUID.randomUUID().toString().replace("-", "").substring(0, 12);
    OffsetDateTime now = OffsetDateTime.now(ZoneOffset.UTC).truncatedTo(ChronoUnit.SECONDS);

    Map<String, Object> criteria = buildCriteriaMap(request);
    String criteriaJson;
    try {
      criteriaJson = OBJECT_MAPPER.writeValueAsString(criteria);
    } catch (JsonProcessingException e) {
      throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Invalid criteria");
    }

    jdbcClient.sql("""
            INSERT INTO saved_searches
              (search_id, user_id, name, criteria_json, notification_email, active, created_at, updated_at)
            VALUES (:searchId, :userId, :name, :criteria, :email, TRUE, :now, :now)
            """)
        .param("searchId", searchId)
        .param("userId", userId)
        .param("name", request.name())
        .param("criteria", criteriaJson)
        .param("email", request.notificationEmail())
        .param("now", now)
        .update();

    return getById(userId, searchId);
  }

  public List<SavedSearchResponse> listForUser(String userId) {
    List<SearchRow> rows = jdbcClient.sql("""
            SELECT s.search_id, s.name, s.criteria_json, s.notification_email,
                   s.active, s.created_at,
                   COALESCE((SELECT COUNT(*) FROM saved_search_alerts a
                             WHERE a.search_id = s.search_id AND a.status = 'NEW'), 0) AS unread_alerts,
                   COALESCE((SELECT COUNT(*) FROM saved_search_alerts a
                             WHERE a.search_id = s.search_id), 0) AS total_alerts
            FROM saved_searches s
            WHERE s.user_id = :userId
            ORDER BY s.created_at DESC
            """)
        .param("userId", userId)
        .query((rs, rowNum) -> new SearchRow(
            rs.getString("search_id"),
            rs.getString("name"),
            rs.getString("criteria_json"),
            rs.getString("notification_email"),
            rs.getBoolean("active"),
            ISO.format(rs.getObject("created_at", OffsetDateTime.class)),
            rs.getLong("unread_alerts"),
            rs.getLong("total_alerts")
        ))
        .list();

    List<SavedSearchResponse> out = new ArrayList<>();
    for (SearchRow r : rows) {
      out.add(toResponse(r));
    }
    return out;
  }

  private SavedSearchResponse getById(String userId, String searchId) {
    return listForUser(userId).stream()
        .filter(s -> s.searchId().equals(searchId))
        .findFirst()
        .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Saved search not found"));
  }

  @Transactional
  public void delete(String userId, String searchId) {
    int updated = jdbcClient.sql("""
            DELETE FROM saved_searches WHERE search_id = :id AND user_id = :userId
            """)
        .param("id", searchId)
        .param("userId", userId)
        .update();
    if (updated == 0) {
      throw new ResponseStatusException(HttpStatus.NOT_FOUND, "Saved search not found");
    }
  }

  /* ── Alerts inbox ───────────────────────────────────────────────────── */

  public SavedSearchAlertsResponse listAlerts(String userId) {
    List<Alert> alerts = jdbcClient.sql("""
            SELECT a.alert_id, a.search_id, s.name AS search_name,
                   a.listing_id, l.title AS listing_title, l.locality AS listing_locality,
                   l.city AS listing_city, l.rent AS listing_rent, l.bhk AS listing_bhk,
                   a.status, a.created_at
            FROM saved_search_alerts a
            JOIN saved_searches s ON s.search_id = a.search_id
            JOIN listings l ON l.listing_id = a.listing_id
            WHERE a.user_id = :userId
            ORDER BY a.created_at DESC
            LIMIT 100
            """)
        .param("userId", userId)
        .query((rs, rowNum) -> new Alert(
            rs.getString("alert_id"),
            rs.getString("search_id"),
            rs.getString("search_name"),
            rs.getString("listing_id"),
            rs.getString("listing_title"),
            rs.getString("listing_locality"),
            rs.getString("listing_city"),
            rs.getInt("listing_rent"),
            rs.getString("listing_bhk"),
            rs.getString("status"),
            ISO.format(rs.getObject("created_at", OffsetDateTime.class))
        ))
        .list();

    long unread = alerts.stream().filter(a -> "NEW".equalsIgnoreCase(a.status())).count();
    return new SavedSearchAlertsResponse(alerts, unread);
  }

  @Transactional
  public void markAlertRead(String userId, String alertId) {
    jdbcClient.sql("""
            UPDATE saved_search_alerts
            SET status = 'READ', read_at = CURRENT_TIMESTAMP
            WHERE alert_id = :id AND user_id = :userId AND status = 'NEW'
            """)
        .param("id", alertId)
        .param("userId", userId)
        .update();
  }

  @Transactional
  public void markAllRead(String userId) {
    jdbcClient.sql("""
            UPDATE saved_search_alerts
            SET status = 'READ', read_at = CURRENT_TIMESTAMP
            WHERE user_id = :userId AND status = 'NEW'
            """)
        .param("userId", userId)
        .update();
  }

  /* ── Match on publish — called from OwnerListingService ─────────────── */

  /**
   * Best-effort fanout: scan all active saved searches, evaluate against the
   * just-published listing, and insert NEW alerts for matches.
   *
   * Failure modes are caught & logged — the caller (OwnerListingService) MUST
   * NOT see exceptions from here, because matching is a side-effect; listing
   * creation is the primary action.
   */
  public void fanoutForNewListing(String listingId) {
    try {
      ListingForMatch listing = jdbcClient.sql("""
              SELECT listing_id, owner_id, city, locality, title,
                     bhk, furnishing, verified, rent
              FROM listings
              WHERE listing_id = :id AND status = 'PUBLISHED'
              """)
          .param("id", listingId)
          .query((rs, rowNum) -> new ListingForMatch(
              rs.getString("listing_id"),
              rs.getString("owner_id"),
              rs.getString("city"),
              rs.getString("locality"),
              rs.getString("title"),
              rs.getString("bhk"),
              rs.getString("furnishing"),
              rs.getBoolean("verified"),
              rs.getInt("rent")
          ))
          .optional()
          .orElse(null);

      if (listing == null) return; // not published or doesn't exist — nothing to do

      List<SearchForMatch> activeSearches = jdbcClient.sql("""
              SELECT search_id, user_id, criteria_json
              FROM saved_searches
              WHERE active = TRUE
              """)
          .query((rs, rowNum) -> new SearchForMatch(
              rs.getString("search_id"),
              rs.getString("user_id"),
              rs.getString("criteria_json")
          ))
          .list();

      int created = 0;
      for (SearchForMatch s : activeSearches) {
        // Don't notify the owner about their own listing
        if (s.userId().equals(listing.ownerId())) continue;

        Map<String, Object> criteria = parseCriteria(s.criteriaJson());
        if (matches(listing, criteria)) {
          String alertId = "al_" + UUID.randomUUID().toString().replace("-", "").substring(0, 12);
          int inserted = jdbcClient.sql("""
                  INSERT INTO saved_search_alerts (alert_id, search_id, user_id, listing_id)
                  VALUES (:alertId, :searchId, :userId, :listingId)
                  ON CONFLICT (search_id, listing_id) DO NOTHING
                  """)
              .param("alertId", alertId)
              .param("searchId", s.searchId())
              .param("userId", s.userId())
              .param("listingId", listing.listingId())
              .update();
          if (inserted > 0) created++;
        }
      }

      if (created > 0) {
        log.info("Saved-search alerts fanout: listing={} created {} alert(s) across {} active searches",
            listingId, created, activeSearches.size());
      }
    } catch (Exception e) {
      // CRITICAL: never propagate — this is a side-effect, not the primary action.
      log.error("Saved-search fanout failed for listing {}: {}", listingId, e.getMessage(), e);
    }
  }

  /* ── Internal helpers ───────────────────────────────────────────────── */

  private static boolean matches(ListingForMatch listing, Map<String, Object> criteria) {
    String city = asString(criteria.get("city"));
    if (city != null && !city.equalsIgnoreCase(listing.city())) return false;

    String query = asString(criteria.get("query"));
    if (query != null && !query.isBlank()) {
      String q = query.toLowerCase(Locale.ROOT);
      boolean inTitle = listing.title() != null && listing.title().toLowerCase(Locale.ROOT).contains(q);
      boolean inLocality = listing.locality() != null && listing.locality().toLowerCase(Locale.ROOT).contains(q);
      if (!inTitle && !inLocality) return false;
    }

    @SuppressWarnings("unchecked")
    List<String> bhkList = (List<String>) criteria.get("bhk");
    if (bhkList != null && !bhkList.isEmpty()) {
      boolean any = false;
      for (String b : bhkList) {
        if (b != null && b.equalsIgnoreCase(listing.bhk())) { any = true; break; }
      }
      if (!any) return false;
    }

    String furnishing = asString(criteria.get("furnishing"));
    if (furnishing != null && !furnishing.equalsIgnoreCase(listing.furnishing())) return false;

    Boolean verifiedRequired = asBool(criteria.get("verified"));
    if (Boolean.TRUE.equals(verifiedRequired) && !listing.verified()) return false;

    Integer rentMin = asInt(criteria.get("rentMin"));
    if (rentMin != null && listing.rent() < rentMin) return false;

    Integer rentMax = asInt(criteria.get("rentMax"));
    if (rentMax != null && listing.rent() > rentMax) return false;

    return true;
  }

  private static String asString(Object o) {
    return o == null ? null : (o instanceof String s ? s.trim() : o.toString().trim());
  }
  private static Boolean asBool(Object o) {
    if (o == null) return null;
    if (o instanceof Boolean b) return b;
    return Boolean.parseBoolean(o.toString());
  }
  private static Integer asInt(Object o) {
    if (o == null) return null;
    if (o instanceof Number n) return n.intValue();
    try { return Integer.parseInt(o.toString()); } catch (NumberFormatException e) { return null; }
  }

  private static Map<String, Object> parseCriteria(String json) {
    if (json == null || json.isBlank()) return Map.of();
    try {
      return OBJECT_MAPPER.readValue(json, new TypeReference<Map<String, Object>>() {});
    } catch (JsonProcessingException e) {
      log.warn("Could not parse saved search criteria JSON: {}", e.getMessage());
      return Map.of();
    }
  }

  private static Map<String, Object> buildCriteriaMap(SavedSearchRequest req) {
    Map<String, Object> m = new HashMap<>();
    if (req.city() != null && !req.city().isBlank()) m.put("city", req.city().trim());
    if (req.query() != null && !req.query().isBlank()) m.put("query", req.query().trim());
    if (req.bhk() != null && !req.bhk().isEmpty()) m.put("bhk", req.bhk());
    if (req.furnishing() != null && !req.furnishing().isBlank()) m.put("furnishing", req.furnishing().trim());
    if (req.verified() != null) m.put("verified", req.verified());
    if (req.rentMin() != null) m.put("rentMin", req.rentMin());
    if (req.rentMax() != null) m.put("rentMax", req.rentMax());
    return m;
  }

  private SavedSearchResponse toResponse(SearchRow r) {
    Map<String, Object> c = parseCriteria(r.criteriaJson());
    @SuppressWarnings("unchecked")
    List<String> bhkList = (List<String>) c.get("bhk");
    return new SavedSearchResponse(
        r.searchId(),
        r.name(),
        asString(c.get("city")),
        asString(c.get("query")),
        bhkList,
        asString(c.get("furnishing")),
        asBool(c.get("verified")),
        asInt(c.get("rentMin")),
        asInt(c.get("rentMax")),
        r.notificationEmail(),
        r.active(),
        r.createdAt(),
        r.unreadAlerts(),
        r.totalAlerts()
    );
  }

  private record SearchRow(
      String searchId, String name, String criteriaJson, String notificationEmail,
      boolean active, String createdAt, long unreadAlerts, long totalAlerts
  ) {}

  private record ListingForMatch(
      String listingId, String ownerId, String city, String locality, String title,
      String bhk, String furnishing, boolean verified, int rent
  ) {}

  private record SearchForMatch(String searchId, String userId, String criteriaJson) {}
}
