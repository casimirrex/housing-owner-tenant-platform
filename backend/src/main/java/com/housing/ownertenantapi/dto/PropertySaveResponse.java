package com.housing.ownertenantapi.dto;

import io.swagger.v3.oas.annotations.media.Schema;

@Schema(description = "Response after saving or shortlisting a property")
public record PropertySaveResponse(
    @Schema(description = "Whether the property is saved", example = "true")
    boolean saved,
    @Schema(description = "When the property was saved", example = "2026-04-09T05:30:00Z")
    String savedAt
) {
}
