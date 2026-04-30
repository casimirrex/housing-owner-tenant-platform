package com.housing.ownertenantapi.dto;

import io.swagger.v3.oas.annotations.media.Schema;

@Schema(description = "CTA availability flags for the property detail page")
public record PropertyCtaFlagsResponse(
    @Schema(description = "Whether users can schedule a visit", example = "true")
    boolean canScheduleVisit,
    @Schema(description = "Whether users can call the owner", example = "true")
    boolean canCallOwner,
    @Schema(description = "Whether users can chat with the owner", example = "true")
    boolean canChatOwner,
    @Schema(description = "Whether the property can be saved", example = "true")
    boolean canSave,
    @Schema(description = "Whether the user can start e-KYC from here", example = "true")
    boolean canStartKyc,
    @Schema(description = "When KYC becomes mandatory in the journey", example = "BEFORE_AGREEMENT")
    String kycRequiredStage,
    @Schema(description = "KYC guidance shown near property actions", example = "You can browse and shortlist first. Complete e-KYC before agreement signing.")
    String kycGuidance
) {
}
