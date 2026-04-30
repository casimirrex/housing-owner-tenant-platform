package com.housing.ownertenantapi.dto;

import io.swagger.v3.oas.annotations.media.Schema;
import jakarta.validation.Valid;
import jakarta.validation.constraints.NotNull;

@Schema(description = "Viewport-based map search request")
public record SearchMapRequest(
    @Schema(description = "North-east latitude", example = "13.0450")
    @NotNull
    Double northEastLat,
    @Schema(description = "North-east longitude", example = "77.7000")
    @NotNull
    Double northEastLng,
    @Schema(description = "South-west latitude", example = "12.9000")
    @NotNull
    Double southWestLat,
    @Schema(description = "South-west longitude", example = "77.5000")
    @NotNull
    Double southWestLng,
    @Schema(description = "Search filters")
    @Valid
    SearchMapFiltersRequest filters
) {
}
