package com.housing.ownertenantapi.dto;

import io.swagger.v3.oas.annotations.media.Schema;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;

@Schema(description = "Owner-side request to create a payment record for a specific tenant")
public record OwnerCreatePaymentRecordRequest(

    @NotBlank(message = "tenantEmail is required")
    @Schema(description = "Email address of the tenant to assign the payment to", example = "tenant@example.com")
    String tenantEmail,

    @NotBlank(message = "listingId is required")
    @Schema(description = "Listing ID that this payment relates to", example = "owner_listing_1")
    String listingId,

    @NotNull(message = "amount is required")
    @Min(value = 1, message = "Amount must be at least ₹1")
    @Schema(description = "Amount in INR (rupees, not paise)", example = "28000")
    Integer amount,

    @NotBlank(message = "paymentKind is required")
    @Schema(
        description = "Type of payment",
        example = "MONTHLY_RENT",
        allowableValues = { "MONTHLY_RENT", "SECURITY_DEPOSIT", "BOOKING_TOKEN", "MAINTENANCE" }
    )
    String paymentKind,

    @NotBlank(message = "paymentLabel is required")
    @Schema(description = "Human-readable label for the payment", example = "May 2026 rent")
    String paymentLabel,

    @Schema(description = "Due date in YYYY-MM-DD format", example = "2026-05-01")
    String dueDate,

    @Schema(description = "Optional description", example = "Monthly rent for 2BHK in Indiranagar")
    String description
) {}
