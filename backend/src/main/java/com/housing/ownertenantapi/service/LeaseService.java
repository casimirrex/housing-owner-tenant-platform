package com.housing.ownertenantapi.service;

import com.housing.ownertenantapi.dto.LeaseCreate;
import com.housing.ownertenantapi.dto.LeaseItem;
import com.housing.ownertenantapi.dto.LeaseListResponse;
import java.time.LocalDate;
import java.util.List;
import java.util.UUID;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.dao.EmptyResultDataAccessException;
import org.springframework.http.HttpStatus;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

/**
 * Tier 3 — Tenant lease tracker.
 *
 * Tenants record an active lease they signed off-platform (rent agreement
 * upload, term dates, monthly rent, security deposit). The system surfaces
 * expiry warnings via /api/v1/notifications and the dashboard.
 *
 * Endpoints:
 *   POST /api/v1/leases                 — tenant creates a lease record
 *   GET  /api/v1/leases/me              — tenant lists their leases
 *   GET  /api/v1/leases/owner           — owner lists leases on their listings
 *   PATCH /api/v1/leases/{id}/status    — tenant marks ENDED / TERMINATED
 */
@Service
public class LeaseService {

  private static final Logger log = LoggerFactory.getLogger(LeaseService.class);

  private final JdbcTemplate jdbcTemplate;
  private final CurrentSessionService currentSessionService;

  public LeaseService(JdbcTemplate jdbcTemplate, CurrentSessionService currentSessionService) {
    this.jdbcTemplate = jdbcTemplate;
    this.currentSessionService = currentSessionService;
  }

  @Transactional
  public LeaseItem create(String authorizationHeader, LeaseCreate request) {
    String tenantId = currentSessionService.requireUserId(authorizationHeader);

    String ownerId;
    try {
      ownerId = jdbcTemplate.queryForObject(
          "SELECT owner_id FROM listings WHERE listing_id = ?",
          String.class, request.listingId()
      );
    } catch (EmptyResultDataAccessException none) {
      throw new ResponseStatusException(HttpStatus.NOT_FOUND,
          "Listing not found: " + request.listingId());
    }
    if (ownerId == null) {
      throw new ResponseStatusException(HttpStatus.NOT_FOUND, "Listing has no owner");
    }
    if (ownerId.equals(tenantId)) {
      throw new ResponseStatusException(HttpStatus.BAD_REQUEST,
          "Owners cannot record a lease on their own listing.");
    }

    String leaseId = "lease_" + UUID.randomUUID().toString().replace("-", "").substring(0, 12);
    jdbcTemplate.update("""
            INSERT INTO tenant_leases (
              lease_id, tenant_id, listing_id, owner_id, start_date, end_date,
              monthly_rent, security_deposit, document_url, notes, status
            )
            VALUES (?, ?, ?, ?, CAST(? AS DATE), CAST(? AS DATE), ?, ?, ?, ?, 'ACTIVE')
            """,
        leaseId, tenantId, request.listingId(), ownerId,
        request.startDate(), request.endDate(),
        request.monthlyRent(), request.securityDeposit(),
        request.documentUrl(), request.notes()
    );
    log.info("lease created: id={} tenant={} listing={}", leaseId, tenantId, request.listingId());
    return fetchOne(leaseId);
  }

  public LeaseListResponse listForTenant(String authorizationHeader) {
    String tenantId = currentSessionService.requireUserId(authorizationHeader);
    return list("WHERE l.tenant_id = ?", tenantId);
  }

  public LeaseListResponse listForOwner(String authorizationHeader) {
    String ownerId = currentSessionService.requireUserId(authorizationHeader);
    return list("WHERE l.owner_id = ?", ownerId);
  }

  @Transactional
  public LeaseItem updateStatus(String authorizationHeader, String leaseId, String status) {
    String tenantId = currentSessionService.requireUserId(authorizationHeader);
    if (!"ENDED".equals(status) && !"TERMINATED".equals(status) && !"ACTIVE".equals(status)) {
      throw new ResponseStatusException(HttpStatus.BAD_REQUEST,
          "Status must be ACTIVE / ENDED / TERMINATED.");
    }
    int rows = jdbcTemplate.update(
        "UPDATE tenant_leases SET status = ?, updated_at = now() " +
            "WHERE lease_id = ? AND tenant_id = ?",
        status, leaseId, tenantId
    );
    if (rows == 0) {
      throw new ResponseStatusException(HttpStatus.NOT_FOUND,
          "Lease not found or you are not the tenant.");
    }
    return fetchOne(leaseId);
  }

  /* ── helpers ─────────────────────────────────────────────────────────── */

  private LeaseListResponse list(String where, Object... args) {
    List<LeaseItem> items = jdbcTemplate.query(
        baseSelect() + where + " ORDER BY l.end_date ASC",
        this::mapLease,
        args
    );
    LocalDate today = LocalDate.now();
    int expiringSoon = (int) items.stream()
        .filter(it -> "ACTIVE".equals(it.status()))
        .filter(it -> it.daysUntilEnd() >= 0 && it.daysUntilEnd() <= 60)
        .count();
    return new LeaseListResponse(items, items.size(), expiringSoon);
  }

  private LeaseItem fetchOne(String leaseId) {
    try {
      return jdbcTemplate.queryForObject(
          baseSelect() + "WHERE l.lease_id = ?",
          this::mapLease,
          leaseId
      );
    } catch (EmptyResultDataAccessException none) {
      throw new ResponseStatusException(HttpStatus.NOT_FOUND, "Lease not found");
    }
  }

  private LeaseItem mapLease(java.sql.ResultSet rs, int rowNum) throws java.sql.SQLException {
    LocalDate end = rs.getDate("end_date").toLocalDate();
    long days = LocalDate.now().until(end).getDays();
    return new LeaseItem(
        rs.getString("lease_id"),
        rs.getString("tenant_id"),
        rs.getString("tenant_name"),
        rs.getString("listing_id"),
        rs.getString("listing_title"),
        rs.getString("owner_id"),
        rs.getString("owner_name"),
        rs.getDate("start_date").toLocalDate().toString(),
        end.toString(),
        rs.getInt("monthly_rent"),
        rs.getInt("security_deposit"),
        rs.getString("document_url"),
        rs.getString("status"),
        rs.getString("notes"),
        (int) days,
        rs.getString("created_at")
    );
  }

  private String baseSelect() {
    return """
        SELECT l.lease_id, l.tenant_id, l.listing_id, l.owner_id,
               l.start_date, l.end_date, l.monthly_rent, l.security_deposit,
               l.document_url, l.status, l.notes,
               COALESCE(li.title, '') AS listing_title,
               COALESCE(t.full_name, '') AS tenant_name,
               COALESCE(o.full_name, '') AS owner_name,
               to_char(l.created_at AT TIME ZONE 'UTC', 'YYYY-MM-DD"T"HH24:MI:SS"Z"') AS created_at
        FROM tenant_leases l
        LEFT JOIN listings li ON li.listing_id = l.listing_id
        LEFT JOIN users t ON t.user_id = l.tenant_id
        LEFT JOIN users o ON o.user_id = l.owner_id
        """;
  }
}
