package com.housing.ownertenantapi.controller;

import com.housing.ownertenantapi.dto.OwnerReviewsResponse;
import com.housing.ownertenantapi.dto.ReviewEligibilityResponse;
import com.housing.ownertenantapi.dto.ReviewSubmitRequest;
import com.housing.ownertenantapi.dto.ReviewSubmittedResponse;
import com.housing.ownertenantapi.service.OwnerReviewService;
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
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/v1/owners")
@Tag(name = "Owner Reviews", description = "Tenant reviews of an owner")
public class OwnerReviewController {

  private final OwnerReviewService ownerReviewService;

  public OwnerReviewController(OwnerReviewService ownerReviewService) {
    this.ownerReviewService = ownerReviewService;
  }

  @GetMapping("/{ownerId}/reviews")
  @Operation(summary = "List reviews for an owner")
  public OwnerReviewsResponse list(
      @PathVariable String ownerId,
      @RequestParam(defaultValue = "10") int limit
  ) {
    return ownerReviewService.list(ownerId, limit);
  }

  @GetMapping("/{ownerId}/reviews/eligibility")
  @Operation(summary = "Whether the current user can leave an owner review")
  public ReviewEligibilityResponse eligibility(
      @PathVariable String ownerId,
      @RequestHeader(value = HttpHeaders.AUTHORIZATION, required = false) String authorizationHeader
  ) {
    return ownerReviewService.getEligibility(authorizationHeader, ownerId);
  }

  @PostMapping("/{ownerId}/reviews")
  @Operation(summary = "Submit a verified-stay review of an owner")
  public ReviewSubmittedResponse submit(
      @PathVariable String ownerId,
      @RequestHeader(value = HttpHeaders.AUTHORIZATION, required = false) String authorizationHeader,
      @Valid @RequestBody ReviewSubmitRequest request
  ) {
    return ownerReviewService.submit(authorizationHeader, ownerId, request);
  }
}
