package com.housing.ownertenantapi.dto;

import io.swagger.v3.oas.annotations.media.Schema;

@Schema(description = "Response for auth flows that continue with another user step")
public record AuthFlowResponse(
    @Schema(description = "Unique auth flow identifier", example = "flow_7d1e9b28")
    String flowId,
    @Schema(description = "Current flow status", example = "PENDING_OTP_VERIFICATION")
    String status,
    @Schema(description = "Recommended next client action", example = "VERIFY_OTP")
    String nextStep,
    @Schema(description = "User-facing status message", example = "OTP sent to the provided phone number.")
    String message,
    @Schema(description = "Delivery or identity channel", example = "PHONE")
    String channel,
    @Schema(description = "Masked destination shown to the user", example = "+91******4321")
    String maskedDestination,
    @Schema(description = "Implementation phase", example = "1")
    int phase
) {
}
