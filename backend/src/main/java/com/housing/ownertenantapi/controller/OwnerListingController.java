package com.housing.ownertenantapi.controller;

import com.housing.ownertenantapi.dto.OwnerListingCreateRequest;
import com.housing.ownertenantapi.dto.OwnerListingCreateResponse;
import com.housing.ownertenantapi.dto.OwnerListingUpdateRequest;
import com.housing.ownertenantapi.dto.OwnerListingUpdateResponse;
import com.housing.ownertenantapi.dto.OwnerListingsResponse;
import com.housing.ownertenantapi.service.OwnerListingService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.Parameter;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import org.springframework.http.HttpHeaders;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestHeader;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/v1/owners/listings")
@Tag(
    name = "Owner Listings",
    description = "Owner-side listing creation, listing management, and update APIs"
)
public class OwnerListingController {

  private final OwnerListingService ownerListingService;

  public OwnerListingController(OwnerListingService ownerListingService) {
    this.ownerListingService = ownerListingService;
  }

  @PostMapping
  @Operation(
      summary = "Create basic owner listing",
      description = "Creates a new owner listing with basic property, pricing, amenity, and geo details"
  )
  public OwnerListingCreateResponse createListing(
      @RequestHeader(value = HttpHeaders.AUTHORIZATION, required = false) String authorizationHeader,
      @Valid @RequestBody OwnerListingCreateRequest request
  ) {
    return ownerListingService.createListing(authorizationHeader, request);
  }

  @GetMapping
  @Operation(
      summary = "Get owner listings",
      description = "Returns paginated owner listings filtered by status"
  )
  public OwnerListingsResponse getListings(
      @RequestHeader(value = HttpHeaders.AUTHORIZATION, required = false) String authorizationHeader,
      @Parameter(description = "Listing status", example = "DRAFT")
      @RequestParam(required = false) String status,
      @Parameter(description = "Page number", example = "0")
      @RequestParam(defaultValue = "0") int page,
      @Parameter(description = "Page size", example = "10")
      @RequestParam(defaultValue = "10") int pageSize
  ) {
    return ownerListingService.getListings(authorizationHeader, status, page, pageSize);
  }

  @PutMapping("/{listingId}")
  @Operation(
      summary = "Edit basic owner listing",
      description = "Updates editable owner listing attributes such as title, pricing, amenities, availability, and photos"
  )
  public OwnerListingUpdateResponse updateListing(
      @RequestHeader(value = HttpHeaders.AUTHORIZATION, required = false) String authorizationHeader,
      @Parameter(description = "Listing id", example = "owner_listing_2001")
      @PathVariable String listingId,
      @Valid @RequestBody OwnerListingUpdateRequest request
  ) {
    return ownerListingService.updateListing(authorizationHeader, listingId, request);
  }
}
