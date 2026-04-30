package com.housing.ownertenantapi.dto;

import io.swagger.v3.oas.annotations.media.Schema;

@Schema(description = "Response after removing a property from shortlist")
public record PropertyRemoveSaveResponse(
    @Schema(description = "Whether the property was removed", example = "true")
    boolean removed,
    @Schema(description = "When the property was removed", example = "2026-04-09T05:40:00Z")
    String removedAt
) {
}
