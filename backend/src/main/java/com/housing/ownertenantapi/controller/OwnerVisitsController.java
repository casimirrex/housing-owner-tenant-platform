package com.housing.ownertenantapi.controller;

import com.housing.ownertenantapi.dto.OwnerVisitsResponse;
import com.housing.ownertenantapi.service.CurrentSessionService;
import com.housing.ownertenantapi.service.OwnerVisitsService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import org.springframework.http.HttpHeaders;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestHeader;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

/**
 * Owner-side visits inbox (Tier 2 #5 — Visit Booking).
 * Mirrors OwnerLeadsController: lists visits booked by tenants on the owner's
 * listings so the owner can prepare for or follow up with each appointment.
 */
@RestController
@RequestMapping("/api/v1/owners/visits")
@Tag(name = "Owner visits", description = "Visits booked on the owner's listings")
public class OwnerVisitsController {

  private final OwnerVisitsService ownerVisitsService;
  private final CurrentSessionService currentSessionService;

  public OwnerVisitsController(
      OwnerVisitsService ownerVisitsService,
      CurrentSessionService currentSessionService
  ) {
    this.ownerVisitsService = ownerVisitsService;
    this.currentSessionService = currentSessionService;
  }

  @GetMapping
  @Operation(summary = "List visits booked on the signed-in owner's listings")
  public OwnerVisitsResponse getMyVisits(
      @RequestHeader(value = HttpHeaders.AUTHORIZATION, required = false) String authorizationHeader
  ) {
    var identity = currentSessionService.requireRole(
        authorizationHeader, "OWNER",
        "Sign in as an owner to view visits.",
        "Only owners can view visits."
    );
    return ownerVisitsService.getVisitsForOwner(identity.userId());
  }
}
