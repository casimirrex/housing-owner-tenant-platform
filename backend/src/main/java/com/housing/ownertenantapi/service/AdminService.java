package com.housing.ownertenantapi.service;

import com.housing.ownertenantapi.dto.AdminListingActionRequest;
import com.housing.ownertenantapi.dto.AdminListingItem;
import com.housing.ownertenantapi.dto.AdminListingsResponse;
import com.housing.ownertenantapi.dto.AdminReportActionRequest;
import com.housing.ownertenantapi.dto.AdminReportItem;
import com.housing.ownertenantapi.dto.AdminReportsResponse;
import com.housing.ownertenantapi.dto.AdminStatsResponse;
import com.housing.ownertenantapi.dto.AdminUserItem;
import com.housing.ownertenantapi.dto.AdminUsersResponse;
import com.housing.ownertenantapi.dto.AuditLogItem;
import com.housing.ownertenantapi.dto.AuditLogResponse;
import java.util.List;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.http.HttpStatus;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

/**
 * Tier 1 — Admin dashboard.
 *
 * All endpoints are gated at the controller via CurrentSessionService.requireRole("ADMIN").
 * The service itself does not re-check the role; it is reachable only via the
 * controller path.
 */
@Service
public class AdminService {

  private static final Logger log = LoggerFactory.getLogger(AdminService.class);

  private final JdbcTemplate jdbcTemplate;
  private final AuditLogService auditLogService;

  public AdminService(JdbcTemplate jdbcTemplate, AuditLogService auditLogService) {
    this.jdbcTemplate = jdbcTemplate;
    this.auditLogService = auditLogService;
  }

  public AdminStatsResponse getStats() {
    long totalUsers = countOrZero("SELECT COUNT(*) FROM users");
    long totalOwners = countOrZero("SELECT COUNT(DISTINCT user_id) FROM user_roles WHERE role = 'OWNER'");
    long totalTenants = countOrZero("SELECT COUNT(DISTINCT user_id) FROM user_roles WHERE role = 'TENANT'");
    long totalListings = countOrZero("SELECT COUNT(*) FROM listings");
    long publishedListings = countOrZero("SELECT COUNT(*) FROM listings WHERE status = 'PUBLISHED'");
    long flaggedListings = countOrZero("SELECT COUNT(*) FROM listings WHERE fraud_score > 0");
    long openReports = countOrZero("SELECT COUNT(*) FROM listing_reports WHERE status = 'OPEN'");
    long recentVisits = countOrZero(
        "SELECT COUNT(*) FROM visits WHERE scheduled_at >= now() - INTERVAL '7 days'"
    );
    long recentChats = countOrZero(
        "SELECT COUNT(*) FROM chat_threads WHERE created_at >= now() - INTERVAL '7 days'"
    );

    return new AdminStatsResponse(
        totalUsers, totalOwners, totalTenants, totalListings, publishedListings,
        flaggedListings, openReports, recentVisits, recentChats
    );
  }

  public AdminUsersResponse listUsers(String search, String role, int page, int pageSize) {
    int safePage = Math.max(page, 0);
    int safePageSize = Math.min(Math.max(pageSize, 1), 100);
    String like = (search == null || search.isBlank()) ? null : "%" + search.toLowerCase() + "%";

    long totalCount;
    List<AdminUserItem> items;

    if (like != null && role != null && !role.isBlank()) {
      totalCount = countOrZero(
          "SELECT COUNT(*) FROM users WHERE role = ? AND (LOWER(full_name) LIKE ? OR LOWER(email) LIKE ?)",
          role, like, like
      );
      items = queryUsers(
          " WHERE role = ? AND (LOWER(full_name) LIKE ? OR LOWER(email) LIKE ?) " +
              "ORDER BY updated_at DESC LIMIT ? OFFSET ?",
          role, like, like, safePageSize, safePage * safePageSize
      );
    } else if (like != null) {
      totalCount = countOrZero(
          "SELECT COUNT(*) FROM users WHERE LOWER(full_name) LIKE ? OR LOWER(email) LIKE ?",
          like, like
      );
      items = queryUsers(
          " WHERE LOWER(full_name) LIKE ? OR LOWER(email) LIKE ? " +
              "ORDER BY updated_at DESC LIMIT ? OFFSET ?",
          like, like, safePageSize, safePage * safePageSize
      );
    } else if (role != null && !role.isBlank()) {
      totalCount = countOrZero("SELECT COUNT(*) FROM users WHERE role = ?", role);
      items = queryUsers(
          " WHERE role = ? ORDER BY updated_at DESC LIMIT ? OFFSET ?",
          role, safePageSize, safePage * safePageSize
      );
    } else {
      totalCount = countOrZero("SELECT COUNT(*) FROM users");
      items = queryUsers(
          " ORDER BY updated_at DESC LIMIT ? OFFSET ?",
          safePageSize, safePage * safePageSize
      );
    }

    return new AdminUsersResponse(items, totalCount, safePage, safePageSize);
  }

  public AdminListingsResponse listListings(String status, Boolean onlyFlagged, int page, int pageSize) {
    int safePage = Math.max(page, 0);
    int safePageSize = Math.min(Math.max(pageSize, 1), 100);

    StringBuilder where = new StringBuilder(" WHERE 1=1 ");
    java.util.List<Object> args = new java.util.ArrayList<>();
    if (status != null && !status.isBlank()) {
      where.append(" AND l.status = ? ");
      args.add(status);
    }
    if (Boolean.TRUE.equals(onlyFlagged)) {
      where.append(" AND (l.fraud_score > 0 OR EXISTS (" +
          "SELECT 1 FROM listing_reports r WHERE r.listing_id = l.listing_id AND r.status = 'OPEN'" +
          ")) ");
    }

    String countSql = "SELECT COUNT(*) FROM listings l" + where;
    long totalCount = jdbcTemplate.queryForObject(countSql, Long.class, args.toArray());

    String listSql = """
        SELECT l.listing_id, l.title, l.locality, l.city, l.owner_id, l.status,
               l.rent, l.verified, l.fraud_score,
               (l.featured_until IS NOT NULL AND l.featured_until > now()) AS featured,
               COALESCE(u.full_name, '') AS owner_name,
               to_char(l.updated_at AT TIME ZONE 'UTC', 'YYYY-MM-DD"T"HH24:MI:SS"Z"') AS updated_at,
               COALESCE((SELECT COUNT(*) FROM listing_reports r
                         WHERE r.listing_id = l.listing_id AND r.status = 'OPEN'), 0) AS open_reports
        FROM listings l
        LEFT JOIN users u ON u.user_id = l.owner_id
        """ + where + " ORDER BY l.updated_at DESC LIMIT ? OFFSET ? ";
    java.util.List<Object> listArgs = new java.util.ArrayList<>(args);
    listArgs.add(safePageSize);
    listArgs.add(safePage * safePageSize);

    List<AdminListingItem> items = jdbcTemplate.query(listSql,
        (rs, rowNum) -> new AdminListingItem(
            rs.getString("listing_id"),
            rs.getString("title"),
            rs.getString("locality"),
            rs.getString("city"),
            rs.getString("owner_id"),
            rs.getString("owner_name"),
            rs.getString("status"),
            rs.getInt("rent"),
            rs.getBoolean("verified"),
            rs.getBoolean("featured"),
            rs.getInt("fraud_score"),
            rs.getInt("open_reports"),
            rs.getString("updated_at")
        ),
        listArgs.toArray()
    );

    return new AdminListingsResponse(items, totalCount, safePage, safePageSize);
  }

  public AdminReportsResponse listReports(String status, int page, int pageSize) {
    int safePage = Math.max(page, 0);
    int safePageSize = Math.min(Math.max(pageSize, 1), 100);

    long totalCount;
    List<AdminReportItem> items;

    if (status != null && !status.isBlank()) {
      totalCount = countOrZero("SELECT COUNT(*) FROM listing_reports WHERE status = ?", status);
      items = queryReports(" WHERE r.status = ? ORDER BY r.created_at DESC LIMIT ? OFFSET ?",
          status, safePageSize, safePage * safePageSize);
    } else {
      totalCount = countOrZero("SELECT COUNT(*) FROM listing_reports");
      items = queryReports(" ORDER BY r.created_at DESC LIMIT ? OFFSET ?",
          safePageSize, safePage * safePageSize);
    }

    return new AdminReportsResponse(items, totalCount, safePage, safePageSize);
  }

  @Transactional
  public AdminReportItem actOnReport(
      String reportId,
      String adminUserId,
      AdminReportActionRequest request
  ) {
    int updated = jdbcTemplate.update("""
            UPDATE listing_reports
            SET status = ?,
                reviewed_at = CASE WHEN ? IN ('RESOLVED','DISMISSED') THEN now() ELSE reviewed_at END,
                reviewer_user_id = ?,
                resolution_note = ?
            WHERE report_id = ?
            """,
        request.status(),
        request.status(),
        adminUserId,
        request.resolutionNote(),
        reportId
    );
    if (updated == 0) {
      throw new ResponseStatusException(HttpStatus.NOT_FOUND, "Report not found: " + reportId);
    }
    log.info("admin action on report {} → {} by {}", reportId, request.status(), adminUserId);
    auditLogService.record(adminUserId, "ADMIN", "REPORT_" + request.status(),
        "listing_report", reportId,
        request.resolutionNote() == null ? null : "note=" + request.resolutionNote());
    return queryReports(" WHERE r.report_id = ?", reportId).stream()
        .findFirst()
        .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND,
            "Report not found after update: " + reportId));
  }

  @Transactional
  public void moderateListing(String listingId, AdminListingActionRequest request, String adminUserId) {
    int updated = jdbcTemplate.update(
        "UPDATE listings SET status = ?, updated_at = now() WHERE listing_id = ?",
        request.status(),
        listingId
    );
    if (updated == 0) {
      throw new ResponseStatusException(HttpStatus.NOT_FOUND, "Listing not found: " + listingId);
    }
    log.info("admin moderated listing {} → {} by {}", listingId, request.status(), adminUserId);
    auditLogService.record(adminUserId, "ADMIN", "LISTING_STATUS_" + request.status(),
        "listing", listingId, null);
  }

  public AuditLogResponse listAuditLog(String action, int page, int pageSize) {
    int safePage = Math.max(page, 0);
    int safePageSize = Math.min(Math.max(pageSize, 1), 200);

    long totalCount;
    java.util.List<AuditLogItem> items;
    if (action != null && !action.isBlank()) {
      totalCount = countOrZero("SELECT COUNT(*) FROM audit_log WHERE action = ?", action);
      items = queryAudit(" WHERE a.action = ? ORDER BY a.created_at DESC LIMIT ? OFFSET ?",
          action, safePageSize, safePage * safePageSize);
    } else {
      totalCount = countOrZero("SELECT COUNT(*) FROM audit_log");
      items = queryAudit(" ORDER BY a.created_at DESC LIMIT ? OFFSET ?",
          safePageSize, safePage * safePageSize);
    }
    return new AuditLogResponse(items, totalCount, safePage, safePageSize);
  }

  private java.util.List<AuditLogItem> queryAudit(String whereOrder, Object... args) {
    return jdbcTemplate.query(
        "SELECT a.audit_id, a.actor_user_id, COALESCE(u.full_name, '') AS actor_name, " +
            "a.actor_role, a.action, a.entity_type, a.entity_id, a.payload, " +
            "to_char(a.created_at AT TIME ZONE 'UTC', 'YYYY-MM-DD\"T\"HH24:MI:SS\"Z\"') AS created_at " +
            "FROM audit_log a " +
            "LEFT JOIN users u ON u.user_id = a.actor_user_id " +
            whereOrder,
        (rs, rowNum) -> new AuditLogItem(
            rs.getString("audit_id"),
            rs.getString("actor_user_id"),
            rs.getString("actor_name"),
            rs.getString("actor_role"),
            rs.getString("action"),
            rs.getString("entity_type"),
            rs.getString("entity_id"),
            rs.getString("payload"),
            rs.getString("created_at")
        ),
        args
    );
  }

  /* ── helpers ─────────────────────────────────────────────────────────── */

  private long countOrZero(String sql, Object... args) {
    Long result = jdbcTemplate.queryForObject(sql, Long.class, args);
    return result == null ? 0L : result;
  }

  private List<AdminUserItem> queryUsers(String whereOrder, Object... args) {
    return jdbcTemplate.query(
        "SELECT user_id, full_name, email, COALESCE(phone_number, '') AS phone_number, role, " +
            "city, profile_status, verified_owner, " +
            "EXISTS(SELECT 1 FROM user_blocks b WHERE b.blocked_user_id = users.user_id) AS blocked, " +
            "to_char(updated_at AT TIME ZONE 'UTC', 'YYYY-MM-DD\"T\"HH24:MI:SS\"Z\"') AS updated_at " +
            "FROM users" + whereOrder,
        (rs, rowNum) -> new AdminUserItem(
            rs.getString("user_id"),
            rs.getString("full_name"),
            rs.getString("email"),
            rs.getString("phone_number"),
            rs.getString("role"),
            rs.getString("city"),
            rs.getString("profile_status"),
            rs.getBoolean("verified_owner"),
            rs.getBoolean("blocked"),
            rs.getString("updated_at")
        ),
        args
    );
  }

  private List<AdminReportItem> queryReports(String whereOrder, Object... args) {
    return jdbcTemplate.query(
        "SELECT r.report_id, r.listing_id, l.title AS listing_title, " +
            "r.reporter_user_id, COALESCE(u.full_name, '') AS reporter_name, " +
            "r.reason, r.details, r.status, " +
            "to_char(r.created_at  AT TIME ZONE 'UTC', 'YYYY-MM-DD\"T\"HH24:MI:SS\"Z\"') AS created_at, " +
            "to_char(r.reviewed_at AT TIME ZONE 'UTC', 'YYYY-MM-DD\"T\"HH24:MI:SS\"Z\"') AS reviewed_at, " +
            "r.resolution_note " +
            "FROM listing_reports r " +
            "LEFT JOIN listings l ON l.listing_id = r.listing_id " +
            "LEFT JOIN users u ON u.user_id = r.reporter_user_id " +
            whereOrder,
        (rs, rowNum) -> new AdminReportItem(
            rs.getString("report_id"),
            rs.getString("listing_id"),
            rs.getString("listing_title"),
            rs.getString("reporter_user_id"),
            rs.getString("reporter_name"),
            rs.getString("reason"),
            rs.getString("details"),
            rs.getString("status"),
            rs.getString("created_at"),
            rs.getString("reviewed_at"),
            rs.getString("resolution_note")
        ),
        args
    );
  }
}
