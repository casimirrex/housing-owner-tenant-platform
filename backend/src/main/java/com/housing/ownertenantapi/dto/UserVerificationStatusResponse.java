package com.housing.ownertenantapi.dto;

import io.swagger.v3.oas.annotations.media.Schema;

@Schema(description = "Verification and onboarding readiness state for the logged-in user")
public record UserVerificationStatusResponse(
    @Schema(description = "User id", example = "user_1a2b3c4d")
    String userId,
    @Schema(description = "Current profile status", example = "VERIFIED")
    String profileStatus,
    @Schema(description = "Whether the email is verified", example = "true")
    boolean emailVerified,
    @Schema(description = "Whether the phone number is verified", example = "true")
    boolean phoneVerified,
    @Schema(description = "KYC verification state", example = "NOT_STARTED")
    String kycStatus,
    @Schema(description = "When KYC becomes mandatory in the tenant journey", example = "BEFORE_AGREEMENT")
    String kycRequiredStage,
    @Schema(description = "User-facing KYC guidance", example = "e-KYC is not needed to browse homes. Complete it before agreement signing.")
    String kycGuidance,
    @Schema(description = "Profile completion percentage", example = "82")
    int profileCompletion,
    @Schema(description = "Whether a profile image has been uploaded", example = "true")
    boolean photoUploaded,
    @Schema(description = "Last profile update timestamp", example = "2026-04-09T15:35:45Z")
    String lastUpdatedAt
) {
}
