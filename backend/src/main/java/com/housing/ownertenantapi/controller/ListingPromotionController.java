package com.housing.ownertenantapi.controller;

import com.housing.ownertenantapi.dto.ListingPromotionRequest;
import com.housing.ownertenantapi.dto.ListingPromotionResponse;
import com.housing.ownertenantapi.service.CurrentSessionService;
import com.housing.ownertenantapi.service.ListingPromotionService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import org.springframework.http.HttpHeaders;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestHeader;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

/**
 * Featured Listings — promotion endpoint. Owner pays from wallet to push a
 * listing to the top of search results for a configurable duration tier.
 */
@RestController
@RequestMapping("/api/v1/owners/listings")
@Tag(name = "Featured Listings", description = "Pay-to-promote listings to the top of search")
public class ListingPromotionController {

  private final ListingPromotionService listingPromotionService;
  private final CurrentSessionService currentSessionService;

  public ListingPromotionController(
      ListingPromotionService listingPromotionService,
      CurrentSessionService currentSessionService
  ) {
    this.listingPromotionService = listingPromotionService;
    this.currentSessionService = currentSessionService;
  }

  @PostMapping("/{listingId}/promote")
  @Operation(
      summary = "Promote a listing for N days",
      description = "Deducts the tier price from the owner's wallet and sets featured_until."
  )
  public ListingPromotionResponse promoteListing(
      @RequestHeader(value = HttpHeaders.AUTHORIZATION, required = false) String authorizationHeader,
      @PathVariable String listingId,
      @Valid @RequestBody ListingPromotionRequest request
  ) {
    CurrentSessionService.SessionIdentity identity = currentSessionService.requireRole(
        authorizationHeader,
        "OWNER",
        "Sign in as an owner to promote listings.",
        "Only owners can promote listings."
    );
    return listingPromotionService.promoteListing(
        identity.userId(),
        listingId,
        request.durationDays()
    );
  }
}
