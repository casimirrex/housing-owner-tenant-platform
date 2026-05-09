package com.housing.ownertenantapi.dto;

import io.swagger.v3.oas.annotations.media.Schema;
import java.util.List;

@Schema(description = "Response for nearby listing search")
public record NearbyResponse(
    @Schema(description = "Listings near the center point, sorted ascending by distance")
    List<NearbyListingResponse> items,
    @Schema(description = "Center point used for the search")
    CenterPointResponse centerPoint,
    @Schema(description = "Radius in kilometers", example = "5.0")
    double radiusKm
) {
}
