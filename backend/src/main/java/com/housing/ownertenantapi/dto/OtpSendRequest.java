package com.housing.ownertenantapi.dto;

import io.swagger.v3.oas.annotations.media.Schema;
import jakarta.validation.constraints.NotBlank;

@Schema(description = "Request to send an OTP to a destination")
public record OtpSendRequest(
    @Schema(description = "Destination channel", example = "PHONE")
    @NotBlank
    String channel,
    @Schema(description = "Phone number or email that will receive the OTP", example = "+919876543210")
    @NotBlank
    String destination,
    @Schema(description = "Flow purpose for the OTP", example = "LOGIN")
    @NotBlank
    String purpose
) {
}
