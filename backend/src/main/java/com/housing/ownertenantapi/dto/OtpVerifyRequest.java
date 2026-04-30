package com.housing.ownertenantapi.dto;

import io.swagger.v3.oas.annotations.media.Schema;
import jakarta.validation.constraints.NotBlank;

@Schema(description = "Request to verify an OTP")
public record OtpVerifyRequest(
    @Schema(description = "Existing auth flow id", example = "flow_7d1e9b28")
    @NotBlank
    String flowId,
    @Schema(description = "Phone number or email used for the OTP", example = "+919876543210")
    @NotBlank
    String destination,
    @Schema(description = "The OTP entered by the user", example = "123456")
    @NotBlank
    String otpCode
) {
}
