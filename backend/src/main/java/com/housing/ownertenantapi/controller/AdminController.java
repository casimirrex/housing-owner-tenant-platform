package com.housing.ownertenantapi.controller;

import com.housing.ownertenantapi.dto.AdminListingActionRequest;
import com.housing.ownertenantapi.dto.AdminListingsResponse;
import com.housing.ownertenantapi.dto.AdminReportActionRequest;
import com.housing.ownertenantapi.dto.AdminReportItem;
import com.housing.ownertenantapi.dto.AdminReportsResponse;
import com.housing.ownertenantapi.dto.AdminStatsResponse;
import com.housing.ownertenantapi.dto.AdminUsersResponse;
import com.housing.ownertenantapi.dto.AdminRefundRequest;
import com.housing.ownertenantapi.dto.AdminRefundResponse;
import com.housing.ownertenantapi.service.AdminService;
import com.housing.ownertenantapi.service.CurrentSessionService;
import com.housing.ownertenantapi.service.RefundService;
import com.housing.ownertenantapi.service.StaleListingArchiver;
import java.util.List;
import java.util.Map;
import com.housing.ownertenantapi.service.CurrentSessionService.SessionIdentity;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import org.springframework.http.HttpHeaders;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestHeader;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

/**
 * Tier 1 — Admin dashboard endpoints. Every method is gated on ADMIN role
 * via CurrentSessionService.requireRole; non-admin callers get 403.
 */
@RestController
@RequestMapping("/api/v1/admin")
@Tag(name = "Admin", description = "Admin dashboard — gated on the ADMIN role")
public class AdminController {

  private static final String SIGN_IN = "Sign in as an admin to use this endpoint.";
  private static final String NOT_ADMIN = "You must be an admin to use this endpoint.";

  private final AdminService adminService;
  private final CurrentSessionService currentSessionService;
  private final StaleListingArchiver staleListingArchiver;
  private final RefundService refundService;

  public AdminController(
      AdminService adminService,
      CurrentSessionService currentSessionService,
      StaleListingArchiver staleListingArchiver,
      RefundService refundService
  ) {
    this.adminService = adminService;
    this.currentSessionService = currentSessionService;
    this.staleListingArchiver = staleListingArchiver;
    this.refundService = refundService;
  }

  @GetMapping("/stats")
  @Operation(summary = "Platform-wide stats")
  public AdminStatsResponse getStats(
      @RequestHeader(value = HttpHeaders.AUTHORIZATION, required = false) String authorizationHeader
  ) {
    requireAdmin(authorizationHeader);
    return adminService.getStats();
  }

  @GetMapping("/users")
  @Operation(summary = "Paginated user list")
  public AdminUsersResponse listUsers(
      @RequestHeader(value = HttpHeaders.AUTHORIZATION, required = false) String authorizationHeader,
      @RequestParam(required = false) String search,
      @RequestParam(required = false) String role,
      @RequestParam(defaultValue = "0") int page,
      @RequestParam(defaultValue = "20") int pageSize
  ) {
    requireAdmin(authorizationHeader);
    return adminService.listUsers(search, role, page, pageSize);
  }

  @GetMapping("/listings")
  @Operation(summary = "Listings moderation queue")
  public AdminListingsResponse listListings(
      @RequestHeader(value = HttpHeaders.AUTHORIZATION, required = false) String authorizationHeader,
      @RequestParam(required = false) String status,
      @RequestParam(required = false) Boolean onlyFlagged,
      @RequestParam(defaultValue = "0") int page,
      @RequestParam(defaultValue = "20") int pageSize
  ) {
    requireAdmin(authorizationHeader);
    return adminService.listListings(status, onlyFlagged, page, pageSize);
  }

  @PatchMapping("/listings/{listingId}/moderate")
  @Operation(summary = "Change listing status (suspend / reinstate)")
  public ResponseEntity<Void> moderateListing(
      @RequestHeader(value = HttpHeaders.AUTHORIZATION, required = false) String authorizationHeader,
      @PathVariable String listingId,
      @Valid @RequestBody AdminListingActionRequest request
  ) {
    SessionIdentity admin = requireAdmin(authorizationHeader);
    adminService.moderateListing(listingId, request, admin.userId());
    return ResponseEntity.noContent().build();
  }

  @GetMapping("/reports")
  @Operation(summary = "Listing reports queue")
  public AdminReportsResponse listReports(
      @RequestHeader(value = HttpHeaders.AUTHORIZATION, required = false) String authorizationHeader,
      @RequestParam(required = false) String status,
      @RequestParam(defaultValue = "0") int page,
      @RequestParam(defaultValue = "20") int pageSize
  ) {
    requireAdmin(authorizationHeader);
    return adminService.listReports(status, page, pageSize);
  }

  @PatchMapping("/reports/{reportId}")
  @Operation(summary = "Resolve / dismiss / mark in-review a listing report")
  public AdminReportItem actOnReport(
      @RequestHeader(value = HttpHeaders.AUTHORIZATION, required = false) String authorizationHeader,
      @PathVariable String reportId,
      @Valid @RequestBody AdminReportActionRequest request
  ) {
    SessionIdentity admin = requireAdmin(authorizationHeader);
    return adminService.actOnReport(reportId, admin.userId(), request);
  }

  @PostMapping("/refunds")
  @Operation(summary = "Issue a wallet refund to a user (admin only)")
  public AdminRefundResponse issueRefund(
      @RequestHeader(value = HttpHeaders.AUTHORIZATION, required = false) String authorizationHeader,
      @jakarta.validation.Valid @RequestBody AdminRefundRequest request
  ) {
    SessionIdentity admin = requireAdmin(authorizationHeader);
    return refundService.issueRefund(admin.userId(), request);
  }

  @GetMapping("/refunds")
  @Operation(summary = "List recent refunds")
  public List<Map<String, Object>> listRefunds(
      @RequestHeader(value = HttpHeaders.AUTHORIZATION, required = false) String authorizationHeader,
      @RequestParam(defaultValue = "50") int limit
  ) {
    requireAdmin(authorizationHeader);
    return refundService.listRefunds(limit);
  }

  @GetMapping("/audit-log")
  @Operation(summary = "Read the platform audit trail")
  public com.housing.ownertenantapi.dto.AuditLogResponse listAuditLog(
      @RequestHeader(value = HttpHeaders.AUTHORIZATION, required = false) String authorizationHeader,
      @RequestParam(required = false) String action,
      @RequestParam(defaultValue = "0") int page,
      @RequestParam(defaultValue = "50") int pageSize
  ) {
    requireAdmin(authorizationHeader);
    return adminService.listAuditLog(action, page, pageSize);
  }

  @PostMapping("/maintenance/sweep-stale-listings")
  @Operation(summary = "Manually trigger the stale-listing auto-archive sweep")
  public Map<String, Object> sweepStaleListings(
      @RequestHeader(value = HttpHeaders.AUTHORIZATION, required = false) String authorizationHeader
  ) {
    requireAdmin(authorizationHeader);
    int affected = staleListingArchiver.sweep();
    return Map.of("archivedCount", affected);
  }

  private SessionIdentity requireAdmin(String authorizationHeader) {
    return currentSessionService.requireRole(authorizationHeader, "ADMIN", SIGN_IN, NOT_ADMIN);
  }
}
