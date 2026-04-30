package com.housing.ownertenantapi.dto;

import io.swagger.v3.oas.annotations.media.Schema;

@Schema(description = "Geo coordinate pair")
public record CenterPointResponse(
    @Schema(description = "Latitude", example = "12.9716")
    double lat,
    @Schema(description = "Longitude", example = "77.5946")
    double lng
) {
}
