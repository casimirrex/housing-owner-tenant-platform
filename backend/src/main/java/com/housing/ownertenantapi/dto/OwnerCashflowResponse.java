package com.housing.ownertenantapi.dto;

import io.swagger.v3.oas.annotations.media.Schema;
import java.util.List;

@Schema(description = "Owner-wide expected cash-flow built from active leases + listing rents")
public record OwnerCashflowResponse(
    @Schema(example = "82000") long monthlyExpectedRupees,
    @Schema(example = "984000") long annualExpectedRupees,
    @Schema(example = "984000") long lifetimeBookedRupees,
    @Schema(example = "3") int activeLeaseCount,
    @Schema(example = "5") int publishedListingCount,
    List<MonthlyBucket> upcomingMonths,
    List<ListingContribution> byListing
) {
  @Schema(description = "Per-month projected income for the next 12 months")
  public record MonthlyBucket(
      @Schema(example = "2026-06") String month,
      @Schema(example = "82000") long expectedRupees
  ) {}

  @Schema(description = "Per-listing rent contribution")
  public record ListingContribution(
      String listingId,
      String title,
      String locality,
      @Schema(example = "32000") long monthlyRent,
      @Schema(example = "PUBLISHED") String status,
      @Schema(example = "true") boolean leasedNow
  ) {}
}
