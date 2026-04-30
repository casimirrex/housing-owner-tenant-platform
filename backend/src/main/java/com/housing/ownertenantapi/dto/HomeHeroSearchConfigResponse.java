package com.housing.ownertenantapi.dto;

import io.swagger.v3.oas.annotations.media.Schema;

@Schema(description = "Home screen search configuration")
public record HomeHeroSearchConfigResponse(
    @Schema(description = "Selected city", example = "Bengaluru")
    String city,
    @Schema(description = "Latitude used for the discovery context", example = "12.9716")
    double lat,
    @Schema(description = "Longitude used for the discovery context", example = "77.5946")
    double lng,
    @Schema(description = "Search placeholder", example = "Search by locality, landmark, metro, or owner")
    String searchPlaceholder,
    @Schema(description = "Whether map support is enabled", example = "true")
    boolean mapEnabled,
    @Schema(description = "Whether smart suggestions are enabled", example = "true")
    boolean smartSuggestionsEnabled
) {
}
