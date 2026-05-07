package com.housing.ownertenantapi.dto;

import io.swagger.v3.oas.annotations.media.Schema;

@Schema(description = "Result of promoting a listing")
public record ListingPromotionResponse(
    @Schema(description = "Listing id that was promoted", example = "owner_listing_2007")
    String listingId,

    @Schema(description = "ISO timestamp until which the listing is featured",
        example = "2026-05-14T10:30:00Z")
    String featuredUntil,

    @Schema(description = "Duration in days that was added", example = "7")
    int durationDays,

    @Schema(description = "Amount deducted from wallet (rupees)", example = "99")
    long amountPaid,

    @Schema(description = "Currency", example = "INR")
    String currency,

    @Schema(description = "Updated wallet balance after deduction", example = "401")
    long walletBalance,

    @Schema(description = "Confirmation message")
    String message
) {}
