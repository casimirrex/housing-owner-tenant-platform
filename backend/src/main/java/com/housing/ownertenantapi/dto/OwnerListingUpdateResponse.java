package com.housing.ownertenantapi.dto;

import io.swagger.v3.oas.annotations.media.Schema;

@Schema(description = "Response after updating an owner listing")
public record OwnerListingUpdateResponse(
    @Schema(description = "Whether the listing was updated", example = "true")
    boolean updated,
    @Schema(description = "Updated listing")
    OwnerListingItemResponse listing
) {
}
