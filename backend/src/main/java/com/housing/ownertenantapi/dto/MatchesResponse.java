package com.housing.ownertenantapi.dto;

import io.swagger.v3.oas.annotations.media.Schema;
import java.util.List;

@Schema(description = "Personalized matches response")
public record MatchesResponse(
    @Schema(description = "Matched listings")
    List<MatchItemResponse> items,
    @Schema(description = "Pagination metadata")
    PaginationResponse pagination
) {
}
