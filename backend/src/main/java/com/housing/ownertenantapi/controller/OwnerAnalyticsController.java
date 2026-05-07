package com.housing.ownertenantapi.controller;

import com.housing.ownertenantapi.dto.OwnerAnalyticsResponse;
import com.housing.ownertenantapi.service.CurrentSessionService;
import com.housing.ownertenantapi.service.OwnerAnalyticsService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import org.springframework.http.HttpHeaders;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestHeader;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

/**
 * Owner Analytics — read-only endpoint that powers the dashboard analytics
 * section. Returns the signed-in owner's per-listing + portfolio metrics.
 * Tenants and guests get 403 (analytics are owner-private).
 */
@RestController
@RequestMapping("/api/v1/owners/analytics")
@Tag(name = "Owner analytics", description = "Views + saves + 7-day trend for the owner's listings")
public class OwnerAnalyticsController {

  private final OwnerAnalyticsService ownerAnalyticsService;
  private final CurrentSessionService currentSessionService;

  public OwnerAnalyticsController(
      OwnerAnalyticsService ownerAnalyticsService,
      CurrentSessionService currentSessionService
  ) {
    this.ownerAnalyticsService = ownerAnalyticsService;
    this.currentSessionService = currentSessionService;
  }

  @GetMapping
  @Operation(summary = "Get analytics for the signed-in owner's portfolio")
  public OwnerAnalyticsResponse getAnalytics(
      @RequestHeader(value = HttpHeaders.AUTHORIZATION, required = false) String authorizationHeader
  ) {
    CurrentSessionService.SessionIdentity identity = currentSessionService.requireRole(
        authorizationHeader,
        "OWNER",
        "Sign in as an owner to view analytics.",
        "Analytics are only available for owner accounts."
    );
    return ownerAnalyticsService.getAnalytics(identity.userId());
  }
}
