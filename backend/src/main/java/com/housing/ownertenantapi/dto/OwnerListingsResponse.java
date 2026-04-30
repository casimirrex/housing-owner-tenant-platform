package com.housing.ownertenantapi.dto;

import io.swagger.v3.oas.annotations.media.Schema;
import java.util.List;

@Schema(description = "Owner listing collection response")
public record OwnerListingsResponse(
    @Schema(description = "Owner listings")
    List<OwnerListingItemResponse> items,
    @Schema(description = "Pagination metadata")
    PaginationResponse pagination
) {
}
