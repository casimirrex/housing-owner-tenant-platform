package com.housing.ownertenantapi.dto;

import io.swagger.v3.oas.annotations.media.Schema;

@Schema(description = "Confirmation of a newly created payment record")
public record OwnerCreatePaymentRecordResponse(
    @Schema(description = "Generated payment record ID") String paymentId,
    @Schema(description = "Tenant user ID") String tenantUserId,
    @Schema(description = "Tenant full name") String tenantName,
    @Schema(description = "Listing ID") String listingId,
    @Schema(description = "Amount in rupees") int amount,
    @Schema(description = "Currency") String currency,
    @Schema(description = "Payment kind") String paymentKind,
    @Schema(description = "Status, always DUE on creation") String status,
    @Schema(description = "Due date") String dueDate,
    @Schema(description = "Human-readable confirmation message") String message
) {}
