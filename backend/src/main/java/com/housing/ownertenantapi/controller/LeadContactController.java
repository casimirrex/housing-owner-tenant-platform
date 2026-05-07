package com.housing.ownertenantapi.controller;

import com.housing.ownertenantapi.dto.LeadContactRequest;
import com.housing.ownertenantapi.dto.LeadContactResponse;
import com.housing.ownertenantapi.dto.OwnerLeadsResponse;
import com.housing.ownertenantapi.service.CurrentSessionService;
import com.housing.ownertenantapi.service.LeadContactService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import org.springframework.http.HttpHeaders;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestHeader;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

/**
 * Tier 1 #3 — Pay-to-Contact / Express Interest leads.
 * Tenant-side endpoint: POST /api/v1/properties/{listingId}/contact
 * Owner-side endpoint:  GET  /api/v1/owners/leads
 */
@RestController
@Tag(name = "Lead contact", description = "Tenant-paid Express Interest + Owner inbox")
public class LeadContactController {

  private final LeadContactService leadContactService;
  private final CurrentSessionService currentSessionService;

  public LeadContactController(
      LeadContactService leadContactService,
      CurrentSessionService currentSessionService
  ) {
    this.leadContactService = leadContactService;
    this.currentSessionService = currentSessionService;
  }

  /** Tenant pays Rs 49 to express interest on a specific listing. */
  @PostMapping("/api/v1/properties/{listingId}/contact")
  @Operation(summary = "Express interest in a listing (Rs 49 from tenant wallet)")
  public LeadContactResponse expressInterest(
      @RequestHeader(value = HttpHeaders.AUTHORIZATION, required = false) String authorizationHeader,
      @PathVariable String listingId,
      @Valid @RequestBody(required = false) LeadContactRequest request
  ) {
    var identity = currentSessionService.requireRole(
        authorizationHeader, "TENANT",
        "Sign in as a tenant to express interest.",
        "Only tenants can express interest in listings."
    );
    String message = (request != null) ? request.message() : null;
    return leadContactService.expressInterest(identity.userId(), listingId, message);
  }

  /** Owner inbox of recent leads (newest first, capped at 50). */
  @GetMapping("/api/v1/owners/leads")
  @Operation(summary = "List recent leads received on the signed-in owner's listings")
  public OwnerLeadsResponse getMyLeads(
      @RequestHeader(value = HttpHeaders.AUTHORIZATION, required = false) String authorizationHeader
  ) {
    var identity = currentSessionService.requireRole(
        authorizationHeader, "OWNER",
        "Sign in as an owner to view leads.",
        "Only owners can view leads."
    );
    return leadContactService.getLeadsForOwner(identity.userId());
  }
}
