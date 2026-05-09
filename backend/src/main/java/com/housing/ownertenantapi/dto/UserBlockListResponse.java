package com.housing.ownertenantapi.dto;

import io.swagger.v3.oas.annotations.media.Schema;
import java.util.List;

@Schema(description = "List of users blocked by the current user")
public record UserBlockListResponse(
    @Schema(description = "Block entries")
    List<UserBlockResponse> items,
    @Schema(description = "Total number of blocks", example = "2")
    int totalCount
) {
}
