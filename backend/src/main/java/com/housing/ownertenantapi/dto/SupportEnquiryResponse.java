package com.housing.ownertenantapi.dto;

import io.swagger.v3.oas.annotations.media.Schema;

@Schema(description = "Response after submitting a support enquiry")
public record SupportEnquiryResponse(
    @Schema(description = "Enquiry id", example = "support_82b13e7f")
    String enquiryId,
    @Schema(description = "Current enquiry status", example = "SUBMITTED")
    String status,
    @Schema(description = "Confirmation message", example = "Support enquiry submitted successfully.")
    String message,
    @Schema(description = "Creation timestamp", example = "2026-04-09T15:25:00Z")
    String createdAt
) {
}
