package com.housing.ownertenantapi.service;

import com.housing.ownertenantapi.dto.MaintenanceListResponse;
import com.housing.ownertenantapi.dto.MaintenanceRequestCreate;
import com.housing.ownertenantapi.dto.MaintenanceRequestItem;
import com.housing.ownertenantapi.dto.MaintenanceUpdateStatus;
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
 * Tier 2 — Maintenance request workflow.
 *
 * Tenants raise tickets on a listing they have a connection to (saved /
 * visited / leased). Owners see them in their inbox and move through the
 * status lifecycle OPEN → IN_PROGRESS → RESOLVED → CLOSED.
 *
 * Authorization model:
 *   - Create: any authenticated tenant who can see the listing.
 *   - List (tenant): only the tenant's own requests.
 *   - List (owner): only requests on listings the owner owns.
 *   - Status update: only the owner of the listing.
 *   - Cancel: only the tenant who created the request.
 */
@Service
public class MaintenanceService {

  private static final Logger log = LoggerFactory.getLogger(MaintenanceService.class);

  private final JdbcTemplate jdbcTemplate;
  private final CurrentSessionService currentSessionService;

  public MaintenanceService(JdbcTemplate jdbcTemplate, CurrentSessionService currentSessionService) {
    this.jdbcTemplate = jdbcTemplate;
    this.currentSessionService = currentSessionService;
  }

  @Transactional
  public MaintenanceRequestItem create(String authorizationHeader, MaintenanceRequestCreate request) {
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
    if (ownerId == null || ownerId.equals(tenantId)) {
      throw new ResponseStatusException(HttpStatus.BAD_REQUEST,
          "Owners cannot raise maintenance requests on their own listing.");
    }

    String requestId = "mreq_" + UUID.randomUUID().toString().replace("-", "").substring(0, 12);
    String priority = request.priority() == null ? "NORMAL" : request.priority();

    jdbcTemplate.update("""
            INSERT INTO maintenance_requests (
              request_id, listing_id, tenant_id, owner_id,
              category, priority, title, description, status
            )
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, 'OPEN')
            """,
        requestId, request.listingId(), tenantId, ownerId,
        request.category(), priority, request.title(), request.description()
    );
    log.info("maintenance request created: id={} listing={} tenant={} owner={}",
        requestId, request.listingId(), tenantId, ownerId);

    return fetchOne(requestId);
  }

  public MaintenanceListResponse listForTenant(
      String authorizationHeader, String status, int page, int pageSize
  ) {
    String tenantId = currentSessionService.requireUserId(authorizationHeader);
    return listFiltered("tenant_id", tenantId, status, page, pageSize);
  }

  public MaintenanceListResponse listForOwner(
      String authorizationHeader, String status, int page, int pageSize
  ) {
    String ownerId = currentSessionService.requireUserId(authorizationHeader);
    return listFiltered("owner_id", ownerId, status, page, pageSize);
  }

  @Transactional
  public MaintenanceRequestItem updateStatus(
      String authorizationHeader, String requestId, MaintenanceUpdateStatus update
  ) {
    String ownerId = currentSessionService.requireUserId(authorizationHeader);
    int rows = jdbcTemplate.update("""
            UPDATE maintenance_requests
            SET status = ?,
                owner_note = COALESCE(?, owner_note),
                updated_at = now(),
                resolved_at = CASE WHEN ? IN ('RESOLVED','CLOSED','CANCELLED')
                                   THEN COALESCE(resolved_at, now())
                                   ELSE NULL END
            WHERE request_id = ? AND owner_id = ?
            """,
        update.status(), update.ownerNote(), update.status(), requestId, ownerId
    );
    if (rows == 0) {
      throw new ResponseStatusException(HttpStatus.NOT_FOUND,
          "Maintenance request not found or you are not its owner.");
    }
    log.info("maintenance status update: id={} → {} by owner={}",
        requestId, update.status(), ownerId);
    return fetchOne(requestId);
  }

  @Transactional
  public void cancel(String authorizationHeader, String requestId) {
    String tenantId = currentSessionService.requireUserId(authorizationHeader);
    int rows = jdbcTemplate.update("""
            UPDATE maintenance_requests
            SET status = 'CANCELLED', updated_at = now(), resolved_at = now()
            WHERE request_id = ? AND tenant_id = ? AND status IN ('OPEN','IN_PROGRESS')
            """,
        requestId, tenantId
    );
    if (rows == 0) {
      throw new ResponseStatusException(HttpStatus.NOT_FOUND,
          "Cannot cancel: not your request, or it is already resolved/closed.");
    }
  }

  /* ── helpers ─────────────────────────────────────────────────────────── */

  private MaintenanceListResponse listFiltered(
      String column, String userId, String status, int page, int pageSize
  ) {
    int safePage = Math.max(page, 0);
    int safePageSize = Math.min(Math.max(pageSize, 1), 100);

    long total;
    List<MaintenanceRequestItem> items;
    if (status != null && !status.isBlank()) {
      total = jdbcTemplate.queryForObject(
          "SELECT COUNT(*) FROM maintenance_requests WHERE " + column + " = ? AND status = ?",
          Long.class, userId, status
      );
      items = queryItems(
          "WHERE m." + column + " = ? AND m.status = ? ORDER BY m.created_at DESC LIMIT ? OFFSET ?",
          userId, status, safePageSize, safePage * safePageSize
      );
    } else {
      total = jdbcTemplate.queryForObject(
          "SELECT COUNT(*) FROM maintenance_requests WHERE " + column + " = ?",
          Long.class, userId
      );
      items = queryItems(
          "WHERE m." + column + " = ? ORDER BY m.created_at DESC LIMIT ? OFFSET ?",
          userId, safePageSize, safePage * safePageSize
      );
    }
    return new MaintenanceListResponse(items, total, safePage, safePageSize);
  }

  private List<MaintenanceRequestItem> queryItems(String whereOrder, Object... args) {
    return jdbcTemplate.query("""
            SELECT m.request_id, m.listing_id, COALESCE(l.title, '') AS listing_title,
                   m.tenant_id, COALESCE(t.full_name, '') AS tenant_name,
                   m.owner_id, COALESCE(o.full_name, '') AS owner_name,
                   m.category, m.priority, m.title, m.description, m.status,
                   to_char(m.created_at  AT TIME ZONE 'UTC', 'YYYY-MM-DD"T"HH24:MI:SS"Z"') AS created_at,
                   to_char(m.updated_at  AT TIME ZONE 'UTC', 'YYYY-MM-DD"T"HH24:MI:SS"Z"') AS updated_at,
                   to_char(m.resolved_at AT TIME ZONE 'UTC', 'YYYY-MM-DD"T"HH24:MI:SS"Z"') AS resolved_at,
                   m.owner_note
            FROM maintenance_requests m
            LEFT JOIN listings l ON l.listing_id = m.listing_id
            LEFT JOIN users t ON t.user_id = m.tenant_id
            LEFT JOIN users o ON o.user_id = m.owner_id
            """ + " " + whereOrder,
        (rs, rowNum) -> new MaintenanceRequestItem(
            rs.getString("request_id"),
            rs.getString("listing_id"),
            rs.getString("listing_title"),
            rs.getString("tenant_id"),
            rs.getString("tenant_name"),
            rs.getString("owner_id"),
            rs.getString("owner_name"),
            rs.getString("category"),
            rs.getString("priority"),
            rs.getString("title"),
            rs.getString("description"),
            rs.getString("status"),
            rs.getString("created_at"),
            rs.getString("updated_at"),
            rs.getString("resolved_at"),
            rs.getString("owner_note")
        ),
        args
    );
  }

  private MaintenanceRequestItem fetchOne(String requestId) {
    List<MaintenanceRequestItem> items = queryItems("WHERE m.request_id = ?", requestId);
    if (items.isEmpty()) {
      throw new ResponseStatusException(HttpStatus.NOT_FOUND,
          "Maintenance request not found: " + requestId);
    }
    return items.get(0);
  }
}
