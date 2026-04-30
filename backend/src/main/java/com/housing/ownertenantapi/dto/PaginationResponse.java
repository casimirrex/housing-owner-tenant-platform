package com.housing.ownertenantapi.dto;

import io.swagger.v3.oas.annotations.media.Schema;

@Schema(description = "Pagination metadata")
public record PaginationResponse(
    @Schema(description = "Current page number", example = "0")
    int page,
    @Schema(description = "Requested page size", example = "10")
    int pageSize,
    @Schema(description = "Total items across all pages", example = "18")
    long totalItems,
    @Schema(description = "Total available pages", example = "2")
    int totalPages
) {
}
