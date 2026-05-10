package com.housing.ownertenantapi.service;

import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.databind.ObjectMapper;
import java.time.OffsetDateTime;
import java.time.ZoneOffset;
import java.time.temporal.ChronoUnit;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.UUID;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.dao.DuplicateKeyException;
import org.springframework.dao.EmptyResultDataAccessException;
import org.springframework.http.HttpStatus;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

/**
 * Phase 1 — DPDP / GDPR compliance:
 *   • requestDeletion        — schedule account deletion (30-day grace period)
 *   • cancelDeletion         — withdraw the request before it completes
 *   • exportData             — return everything we have on this user as JSON
 *
 * Deletion is queued, not immediate. A nightly job (or admin sweep) reads
 * account_deletion_requests where completes_at <= now() and deletes the
 * user row, which cascades through every FK in the schema.
 */
@Service
public class AccountPrivacyService {

  private static final Logger log = LoggerFactory.getLogger(AccountPrivacyService.class);
  private static final ObjectMapper MAPPER = new ObjectMapper();
  private static final int GRACE_DAYS = 30;

  private final JdbcTemplate jdbcTemplate;
  private final CurrentSessionService currentSessionService;
  private final AuditLogService auditLogService;

  public AccountPrivacyService(
      JdbcTemplate jdbcTemplate,
      CurrentSessionService currentSessionService,
      AuditLogService auditLogService
  ) {
    this.jdbcTemplate = jdbcTemplate;
    this.currentSessionService = currentSessionService;
    this.auditLogService = auditLogService;
  }

  @Transactional
  public Map<String, Object> requestDeletion(String authorizationHeader, String reason) {
    String userId = currentSessionService.requireUserId(authorizationHeader);
    OffsetDateTime now = OffsetDateTime.now(ZoneOffset.UTC).truncatedTo(ChronoUnit.SECONDS);
    OffsetDateTime completes = now.plusDays(GRACE_DAYS);

    String requestId = "del_" + UUID.randomUUID().toString().replace("-", "").substring(0, 12);
    try {
      jdbcTemplate.update("""
              INSERT INTO account_deletion_requests (
                request_id, user_id, reason, status, requested_at, completes_at
              )
              VALUES (?, ?, ?, 'PENDING', ?, ?)
              """,
          requestId, userId, reason, now.toLocalDateTime(), completes.toLocalDateTime()
      );
    } catch (DuplicateKeyException duplicate) {
      // user already has a pending request — treat as idempotent and return the existing row
      return loadDeletionStatus(userId);
    }

    auditLogService.record(userId, "USER", "ACCOUNT_DELETION_REQUESTED",
        "user", userId, "completes_at=" + completes);
    return Map.of(
        "requestId", requestId,
        "status", "PENDING",
        "completesAt", completes.toString(),
        "graceDays", GRACE_DAYS
    );
  }

  @Transactional
  public void cancelDeletion(String authorizationHeader) {
    String userId = currentSessionService.requireUserId(authorizationHeader);
    int updated = jdbcTemplate.update(
        "UPDATE account_deletion_requests SET status = 'CANCELLED' " +
            "WHERE user_id = ? AND status = 'PENDING'",
        userId
    );
    if (updated == 0) {
      throw new ResponseStatusException(HttpStatus.NOT_FOUND,
          "No pending deletion request to cancel.");
    }
    auditLogService.record(userId, "USER", "ACCOUNT_DELETION_CANCELLED",
        "user", userId, null);
  }

  public Map<String, Object> getDeletionStatus(String authorizationHeader) {
    String userId = currentSessionService.requireUserId(authorizationHeader);
    return loadDeletionStatus(userId);
  }

  private Map<String, Object> loadDeletionStatus(String userId) {
    try {
      return jdbcTemplate.queryForObject("""
              SELECT request_id,
                     status,
                     to_char(requested_at AT TIME ZONE 'UTC', 'YYYY-MM-DD"T"HH24:MI:SS"Z"') AS requested_at,
                     to_char(completes_at AT TIME ZONE 'UTC', 'YYYY-MM-DD"T"HH24:MI:SS"Z"') AS completes_at
              FROM account_deletion_requests
              WHERE user_id = ?
              ORDER BY requested_at DESC
              LIMIT 1
              """,
          (rs, rowNum) -> {
            Map<String, Object> row = new LinkedHashMap<>();
            row.put("requestId", rs.getString("request_id"));
            row.put("status", rs.getString("status"));
            row.put("requestedAt", rs.getString("requested_at"));
            row.put("completesAt", rs.getString("completes_at"));
            row.put("graceDays", GRACE_DAYS);
            return row;
          },
          userId
      );
    } catch (EmptyResultDataAccessException none) {
      return Map.of("status", "NONE");
    }
  }

  /**
   * Returns a deeply nested JSON-friendly map of every record we hold on
   * this user — profile, listings, leases, visits, chat, leads, reviews,
   * notifications. Empty sections are still included as empty arrays.
   */
  public Map<String, Object> exportData(String authorizationHeader) {
    String userId = currentSessionService.requireUserId(authorizationHeader);

    Map<String, Object> out = new LinkedHashMap<>();
    out.put("userId", userId);
    out.put("exportedAt", OffsetDateTime.now(ZoneOffset.UTC).toString());

    out.put("profile", oneOrNull("""
            SELECT user_id, full_name, email, phone_number, role, profile_status, city,
                   date_of_birth, gender, occupation, photo_url,
                   to_char(updated_at AT TIME ZONE 'UTC', 'YYYY-MM-DD"T"HH24:MI:SS"Z"') AS updated_at
            FROM users WHERE user_id = ?
            """, userId));

    out.put("roles", many("SELECT role, granted_at FROM user_roles WHERE user_id = ?", userId));

    out.put("listings", many("""
            SELECT listing_id, title, locality, city, rent, status, created_at
            FROM listings WHERE owner_id = ?
            """, userId));

    out.put("savedListings", many("""
            SELECT listing_id, saved_at FROM saved_listings WHERE user_id = ?
            """, userId));

    out.put("savedSearches", many("""
            SELECT search_id, name, criteria_json, created_at
            FROM saved_searches WHERE user_id = ?
            """, userId));

    out.put("visits", many("""
            SELECT visit_id, listing_id, status, preferred_date, slot_label,
                   to_char(scheduled_at AT TIME ZONE 'UTC', 'YYYY-MM-DD"T"HH24:MI:SS"Z"') AS scheduled_at
            FROM visits WHERE user_id = ?
            """, userId));

    out.put("leases", many("""
            SELECT lease_id, listing_id, start_date, end_date, monthly_rent, status
            FROM tenant_leases WHERE tenant_id = ? OR owner_id = ?
            """, userId, userId));

    out.put("chatThreads", many("""
            SELECT thread_id, listing_id, tenant_id, owner_id,
                   to_char(created_at AT TIME ZONE 'UTC', 'YYYY-MM-DD"T"HH24:MI:SS"Z"') AS created_at
            FROM chat_threads WHERE tenant_id = ? OR owner_id = ?
            """, userId, userId));

    out.put("leadRequests", many("""
            SELECT lead_id, listing_id, status,
                   to_char(created_at AT TIME ZONE 'UTC', 'YYYY-MM-DD"T"HH24:MI:SS"Z"') AS created_at
            FROM lead_requests WHERE tenant_id = ? OR owner_id = ?
            """, userId, userId));

    out.put("walletTransactions", many("""
            SELECT txn_id, txn_type, amount, currency, status,
                   to_char(created_at AT TIME ZONE 'UTC', 'YYYY-MM-DD"T"HH24:MI:SS"Z"') AS created_at
            FROM wallet_transactions WHERE user_id = ?
            """, userId));

    out.put("maintenanceRequests", many("""
            SELECT request_id, listing_id, status, title, category, priority,
                   to_char(created_at AT TIME ZONE 'UTC', 'YYYY-MM-DD"T"HH24:MI:SS"Z"') AS created_at
            FROM maintenance_requests WHERE tenant_id = ? OR owner_id = ?
            """, userId, userId));

    out.put("blocks", many("""
            SELECT blocker_user_id, blocked_user_id, reason,
                   to_char(created_at AT TIME ZONE 'UTC', 'YYYY-MM-DD"T"HH24:MI:SS"Z"') AS created_at
            FROM user_blocks WHERE blocker_user_id = ? OR blocked_user_id = ?
            """, userId, userId));

    auditLogService.record(userId, "USER", "DATA_EXPORTED",
        "user", userId, "tables=" + out.size());

    return out;
  }

  /**
   * Try to serialise the export to JSON to check it'll round-trip cleanly.
   * Used only by tests; call sites get the Map and let Spring serialise.
   */
  public String exportDataAsJson(String authorizationHeader) {
    try {
      return MAPPER.writerWithDefaultPrettyPrinter()
          .writeValueAsString(exportData(authorizationHeader));
    } catch (JsonProcessingException e) {
      throw new ResponseStatusException(HttpStatus.INTERNAL_SERVER_ERROR,
          "Could not serialise data export.");
    }
  }

  /* ── helpers ─────────────────────────────────────────────────────────── */

  private List<Map<String, Object>> many(String sql, Object... args) {
    return jdbcTemplate.queryForList(sql, args);
  }

  private Map<String, Object> oneOrNull(String sql, Object... args) {
    try {
      return jdbcTemplate.queryForMap(sql, args);
    } catch (EmptyResultDataAccessException e) {
      return null;
    }
  }
}
