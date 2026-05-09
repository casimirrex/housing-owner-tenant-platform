package com.housing.ownertenantapi.dto;

import io.swagger.v3.oas.annotations.media.Schema;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Pattern;

@Schema(description = "Admin moderation action on a listing")
public record AdminListingActionRequest(
    @Schema(description = "New status",
        allowableValues = {"PUBLISHED", "DRAFT", "PAUSED", "ARCHIVED", "SUSPENDED"})
    @NotBlank
    @Pattern(regexp = "PUBLISHED|DRAFT|PAUSED|ARCHIVED|SUSPENDED")
    String status
) {
}
