package com.housing.ownertenantapi.dto;

import io.swagger.v3.oas.annotations.media.Schema;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

@Schema(description = "Block another user")
public record UserBlockRequest(
    @Schema(description = "User id to block", example = "user_42")
    @NotBlank
    String userId,

    @Schema(description = "Optional free-text reason", example = "Sent abusive messages")
    @Size(max = 500)
    String reason
) {
}
