package com.housing.ownertenantapi.service;

import com.housing.ownertenantapi.dto.NotificationItem;
import com.housing.ownertenantapi.dto.NotificationsResponse;
import java.util.ArrayList;
import java.util.Comparator;
import java.util.List;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Service;

/**
 * Tier 3 — Unified notifications.
 *
 * No new tables. We pull from existing ones (saved_search_alerts,
 * maintenance_requests, lead_requests, visits, owner_reviews,
 * listing_reports) and project them into a single {@link NotificationItem}
 * shape. The "read" semantics differ per source — for now everything is
 * marked unread and the UI uses local dismissal.
 *
 * Items are sorted by createdAt descending and capped at 100.
 */
@Service
public class NotificationsService {

  private final JdbcTemplate jdbcTemplate;
  private final CurrentSessionService currentSessionService;

  public NotificationsService(
      JdbcTemplate jdbcTemplate, CurrentSessionService currentSessionService
  ) {
    this.jdbcTemplate = jdbcTemplate;
    this.currentSessionService = currentSessionService;
  }

  public NotificationsResponse get(String authorizationHeader) {
    String userId = currentSessionService.requireUserId(authorizationHeader);
    List<NotificationItem> all = new ArrayList<>();

    // 1) Saved search alerts (tenant)
    all.addAll(jdbcTemplate.query("""
            SELECT a.alert_id,
                   to_char(a.created_at AT TIME ZONE 'UTC', 'YYYY-MM-DD"T"HH24:MI:SS"Z"') AS created_at,
                   a.status,
                   COALESCE(l.title, 'New listing') AS title,
                   COALESCE(l.locality, '') AS locality,
                   COALESCE(l.city, '') AS city,
                   l.listing_id, l.rent
            FROM saved_search_alerts a
            JOIN listings l ON l.listing_id = a.listing_id
            WHERE a.user_id = ?
            ORDER BY a.created_at DESC
            LIMIT 50
            """,
        (rs, rowNum) -> new NotificationItem(
            "ssal_" + rs.getString("alert_id"),
            "SAVED_SEARCH",
            "New match: " + rs.getString("title"),
            "₹" + rs.getInt("rent") + "/mo · " +
                rs.getString("locality") + ", " + rs.getString("city"),
            "/properties/" + rs.getString("listing_id"),
            isoTs(rs.getString("created_at")),
            !"NEW".equalsIgnoreCase(rs.getString("status")),
            "NORMAL"
        ),
        userId
    ));

    // 2) Maintenance status updates (tenant) — show when status changed
    all.addAll(jdbcTemplate.query("""
            SELECT request_id, title, status,
                   to_char(updated_at AT TIME ZONE 'UTC', 'YYYY-MM-DD"T"HH24:MI:SS"Z"') AS updated_at,
                   listing_id
            FROM maintenance_requests
            WHERE tenant_id = ?
              AND status IN ('IN_PROGRESS','RESOLVED','CLOSED')
            ORDER BY updated_at DESC
            LIMIT 30
            """,
        (rs, rowNum) -> new NotificationItem(
            "mreq_" + rs.getString("request_id"),
            "MAINTENANCE_UPDATE",
            "Maintenance " + rs.getString("status").toLowerCase().replace('_', ' ') + ": "
                + rs.getString("title"),
            "Tap to view the latest update from your owner.",
            "/account/maintenance",
            rs.getString("updated_at"),
            "RESOLVED".equals(rs.getString("status")) || "CLOSED".equals(rs.getString("status")),
            "NORMAL"
        ),
        userId
    ));

    // 3) Lead requests (owner side)
    all.addAll(jdbcTemplate.query("""
            SELECT lr.lead_id,
                   to_char(lr.created_at AT TIME ZONE 'UTC', 'YYYY-MM-DD"T"HH24:MI:SS"Z"') AS created_at,
                   lr.status,
                   COALESCE(l.title, 'A property') AS listing_title,
                   COALESCE(u.full_name, 'A tenant') AS tenant_name,
                   lr.listing_id
            FROM lead_requests lr
            LEFT JOIN listings l ON l.listing_id = lr.listing_id
            LEFT JOIN users u ON u.user_id = lr.tenant_id
            WHERE lr.owner_id = ?
            ORDER BY lr.created_at DESC
            LIMIT 30
            """,
        (rs, rowNum) -> new NotificationItem(
            "lead_" + rs.getString("lead_id"),
            "LEAD_REQUEST",
            "New lead: " + rs.getString("tenant_name"),
            "Interested in your listing \"" + rs.getString("listing_title") + "\".",
            "/owner/dashboard",
            isoTs(rs.getString("created_at")),
            !"NEW".equalsIgnoreCase(rs.getString("status")),
            "HIGH"
        ),
        userId
    ));

    // 4) Visit status changes — surface for both tenant + owner
    all.addAll(jdbcTemplate.query("""
            SELECT v.visit_id, v.status,
                   to_char(v.scheduled_at AT TIME ZONE 'UTC', 'YYYY-MM-DD"T"HH24:MI:SS"Z"') AS scheduled_at,
                   COALESCE(l.title, 'A property') AS title,
                   l.listing_id, l.owner_id, v.user_id AS tenant_id
            FROM visits v
            JOIN listings l ON l.listing_id = v.listing_id
            WHERE (v.user_id = ? OR l.owner_id = ?)
              AND v.status IN ('SCHEDULED','COMPLETED','CANCELLED')
            ORDER BY v.scheduled_at DESC
            LIMIT 30
            """,
        (rs, rowNum) -> {
          boolean isOwner = userId.equals(rs.getString("owner_id"));
          String status = rs.getString("status");
          String label = switch (status) {
            case "SCHEDULED" -> isOwner ? "Visit booked on your listing" : "Your visit is scheduled";
            case "COMPLETED" -> isOwner ? "Visit completed on your listing" : "Visit completed";
            case "CANCELLED" -> "Visit cancelled";
            default -> "Visit update";
          };
          return new NotificationItem(
              "visit_" + rs.getString("visit_id"),
              "VISIT_UPDATE",
              label + ": " + rs.getString("title"),
              "Scheduled for " + rs.getString("scheduled_at"),
              isOwner ? "/owner/dashboard" : "/account/visits",
              rs.getString("scheduled_at"),
              !"SCHEDULED".equals(status),
              "SCHEDULED".equals(status) ? "HIGH" : "NORMAL"
          );
        },
        userId, userId
    ));

    // 5) Owner reviews on me (owner side)
    all.addAll(jdbcTemplate.query("""
            SELECT review_id, reviewer_name, rating,
                   to_char(created_at AT TIME ZONE 'UTC', 'YYYY-MM-DD"T"HH24:MI:SS"Z"') AS created_at
            FROM owner_reviews
            WHERE owner_id = ?
            ORDER BY created_at DESC
            LIMIT 20
            """,
        (rs, rowNum) -> new NotificationItem(
            "ovw_" + rs.getString("review_id"),
            "OWNER_REVIEW",
            "New review from " + rs.getString("reviewer_name"),
            rs.getInt("rating") + "/5 stars — tap to read.",
            "/owner/dashboard",
            rs.getString("created_at"),
            true,
            "NORMAL"
        ),
        userId
    ));

    // 6) Listing reports — only flagged on listings the user owns
    all.addAll(jdbcTemplate.query("""
            SELECT r.report_id, r.reason, r.status,
                   COALESCE(l.title, 'A listing') AS title,
                   to_char(r.created_at AT TIME ZONE 'UTC', 'YYYY-MM-DD"T"HH24:MI:SS"Z"') AS created_at
            FROM listing_reports r
            JOIN listings l ON l.listing_id = r.listing_id
            WHERE l.owner_id = ?
            ORDER BY r.created_at DESC
            LIMIT 20
            """,
        (rs, rowNum) -> new NotificationItem(
            "rpt_" + rs.getString("report_id"),
            "LISTING_REPORT",
            "Listing flagged: " + rs.getString("title"),
            "Reason: " + rs.getString("reason").replace('_', ' '),
            "/owner/dashboard",
            rs.getString("created_at"),
            !"OPEN".equalsIgnoreCase(rs.getString("status")),
            "HIGH"
        ),
        userId
    ));

    all.sort(Comparator.comparing(NotificationItem::createdAt,
        Comparator.nullsLast(Comparator.reverseOrder())));
    if (all.size() > 100) {
      all = all.subList(0, 100);
    }
    int unread = (int) all.stream().filter(n -> !n.read()).count();

    return new NotificationsResponse(all, all.size(), unread);
  }

  /** Coerces postgres timestamp text → ISO Z. JdbcTemplate already returns the
   *  ISO form via to_char where used; this is a no-op safety helper. */
  private String isoTs(String ts) {
    if (ts == null) return null;
    if (ts.endsWith("Z") || ts.contains("+")) return ts;
    return ts.replace(" ", "T");
  }
}
