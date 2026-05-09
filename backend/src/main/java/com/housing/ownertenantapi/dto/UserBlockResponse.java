package com.housing.ownertenantapi.dto;

import io.swagger.v3.oas.annotations.media.Schema;

@Schema(description = "Acknowledgement of a block")
public record UserBlockResponse(
    @Schema(description = "User who issued the block", example = "user_5")
    String blockerUserId,
    @Schema(description = "User who is now blocked", example = "user_42")
    String blockedUserId,
    @Schema(description = "Reason", example = "Sent abusive messages")
    String reason,
    @Schema(description = "ISO timestamp of when the block was created", example = "2026-05-09T10:00:00Z")
    String createdAt
) {
}
