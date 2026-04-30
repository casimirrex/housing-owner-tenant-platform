package com.housing.ownertenantapi.controller;

import com.housing.ownertenantapi.dto.MatchesResponse;
import com.housing.ownertenantapi.dto.TenantDashboardResponse;
import com.housing.ownertenantapi.dto.VisitScheduleRequest;
import com.housing.ownertenantapi.dto.VisitScheduleResponse;
import com.housing.ownertenantapi.dto.VisitSlotsResponse;
import com.housing.ownertenantapi.dto.VisitsResponse;
import com.housing.ownertenantapi.service.TenantJourneyService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.Parameter;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import org.springframework.http.HttpHeaders;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestHeader;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/v1")
@Tag(
    name = "Tenant Journey",
    description = "Matches, tenant dashboard, visit slots, and visit scheduling APIs"
)
public class TenantJourneyController {

  private final TenantJourneyService tenantJourneyService;

  public TenantJourneyController(TenantJourneyService tenantJourneyService) {
    this.tenantJourneyService = tenantJourneyService;
  }

  @GetMapping("/matches")
  @Operation(
      summary = "Get personalized matches",
      description = "Returns personalized property matches with scores and reasons"
  )
  public MatchesResponse getMatches(
      @RequestHeader(value = HttpHeaders.AUTHORIZATION, required = false) String authorizationHeader,
      @Parameter(description = "Page number", example = "0")
      @RequestParam(defaultValue = "0") int page,
      @Parameter(description = "Page size", example = "10")
      @RequestParam(defaultValue = "10") int pageSize,
      @Parameter(description = "Selected city", example = "Bengaluru")
      @RequestParam(required = false) String city
  ) {
    return tenantJourneyService.getMatches(authorizationHeader, page, pageSize, city);
  }

  @GetMapping("/dashboard/tenant")
  @Operation(
      summary = "Get tenant dashboard summary",
      description = "Returns summary counts and alert metadata for the tenant dashboard"
  )
  public TenantDashboardResponse getTenantDashboard(
      @RequestHeader(value = HttpHeaders.AUTHORIZATION, required = false) String authorizationHeader
  ) {
    return tenantJourneyService.getTenantDashboard(authorizationHeader);
  }

  @GetMapping("/visits/slots")
  @Operation(
      summary = "Get available visit slots",
      description = "Returns available time slots and rules for scheduling a property visit"
  )
  public VisitSlotsResponse getVisitSlots(
      @RequestHeader(value = HttpHeaders.AUTHORIZATION, required = false) String authorizationHeader,
      @Parameter(description = "Property id", example = "listing_001")
      @RequestParam String propertyId,
      @Parameter(description = "Preferred visit date", example = "2026-04-12")
      @RequestParam String date
  ) {
    return tenantJourneyService.getVisitSlots(authorizationHeader, propertyId, date);
  }

  @PostMapping("/visits")
  @Operation(
      summary = "Schedule visit",
      description = "Schedules a tenant visit for a selected property and slot"
  )
  public VisitScheduleResponse scheduleVisit(
      @RequestHeader(value = HttpHeaders.AUTHORIZATION, required = false) String authorizationHeader,
      @Valid @RequestBody VisitScheduleRequest request
  ) {
    return tenantJourneyService.scheduleVisit(authorizationHeader, request);
  }

  @GetMapping("/visits")
  @Operation(
      summary = "Get tenant visits",
      description = "Returns scheduled or completed tenant visits with pagination"
  )
  public VisitsResponse getVisits(
      @RequestHeader(value = HttpHeaders.AUTHORIZATION, required = false) String authorizationHeader,
      @Parameter(description = "Visit status", example = "SCHEDULED")
      @RequestParam(required = false) String status,
      @Parameter(description = "Page number", example = "0")
      @RequestParam(defaultValue = "0") int page,
      @Parameter(description = "Page size", example = "10")
      @RequestParam(defaultValue = "10") int pageSize
  ) {
    return tenantJourneyService.getVisits(authorizationHeader, status, page, pageSize);
  }
}
