package com.housing.ownertenantapi.dto;

import io.swagger.v3.oas.annotations.media.Schema;

@Schema(description = "Location suggestion for autocomplete")
public record LocationSuggestionResponse(
    @Schema(description = "Suggestion label", example = "Indiranagar Metro")
    String label,
    @Schema(description = "Suggestion type", example = "LANDMARK")
    String type,
    @Schema(description = "City name", example = "Bengaluru")
    String city,
    @Schema(description = "Latitude", example = "12.9784")
    double lat,
    @Schema(description = "Longitude", example = "77.6408")
    double lng
) {
}
