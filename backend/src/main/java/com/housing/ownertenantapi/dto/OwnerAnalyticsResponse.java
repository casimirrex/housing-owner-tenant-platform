package com.housing.ownertenantapi.dto;

import io.swagger.v3.oas.annotations.media.Schema;
import java.util.List;

@Schema(description = "Owner analytics — view + save metrics for the signed-in owner's portfolio")
public record OwnerAnalyticsResponse(
    @Schema(description = "Aggregate metrics across all of the owner's listings")
    Totals totals,

    @Schema(description = "Per-listing breakdown")
    List<ListingMetrics> perListing
) {
  @Schema(description = "Roll-up across the owner's portfolio")
  public record Totals(
      @Schema(description = "Cumulative tenant property-detail views, all time", example = "42")
      long totalViews,

      @Schema(description = "Cumulative saves on the owner's listings, all time", example = "8")
      long totalSaves,

      @Schema(description = "Number of listings owned (any status)", example = "5")
      long totalListings,

      @Schema(description = "Number of currently published listings", example = "3")
      long publishedListings,

      @Schema(description = "Property views in the last 7 days across all listings", example = "18")
      long viewsLast7Days
  ) {}

  @Schema(description = "Metrics for a single listing")
  public record ListingMetrics(
      @Schema(description = "Listing id", example = "owner_listing_2007")
      String listingId,

      @Schema(description = "Listing title", example = "Bright 2BHK in Indiranagar")
      String title,

      @Schema(description = "City", example = "Bengaluru")
      String city,

      @Schema(description = "Locality", example = "Indiranagar")
      String locality,

      @Schema(description = "Listing status", example = "PUBLISHED")
      String status,

      @Schema(description = "Monthly rent (rupees)", example = "25000")
      int rent,

      @Schema(description = "Total tenant property-detail views, all time", example = "12")
      long views,

      @Schema(description = "Total tenants who saved this listing", example = "3")
      long saves,

      @Schema(description = "Views in the last 7 days", example = "5")
      long viewsLast7Days
  ) {}
}
