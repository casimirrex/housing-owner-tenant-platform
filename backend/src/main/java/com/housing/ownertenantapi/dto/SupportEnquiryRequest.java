package com.housing.ownertenantapi.dto;

import io.swagger.v3.oas.annotations.media.Schema;
import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;

@Schema(description = "Request to submit a support enquiry from the web application")
public record SupportEnquiryRequest(
    @Schema(description = "Full name", example = "Aarav Kumar")
    @NotBlank
    String fullName,
    @Schema(description = "Email address", example = "aarav@example.com")
    @NotBlank
    @Email
    String email,
    @Schema(description = "Optional phone number", example = "+919876543210")
    String phoneNumber,
    @Schema(description = "Optional city", example = "Bengaluru")
    String city,
    @Schema(description = "Support message", example = "I need help with a visit confirmation.")
    @NotBlank
    String message
) {
}
