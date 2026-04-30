package com.housing.ownertenantapi.dto;

import io.swagger.v3.oas.annotations.media.Schema;
import java.util.List;

@Schema(description = "Map-based search response")
public record SearchMapResponse(
    @Schema(description = "Map pins for listings in the viewport")
    List<SearchMapPinResponse> pins,
    @Schema(description = "Total count of listings in the viewport", example = "4")
    long count,
    @Schema(description = "Viewport clusters")
    List<SearchMapClusterResponse> clusters
) {
}
