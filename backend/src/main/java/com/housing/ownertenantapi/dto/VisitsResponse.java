package com.housing.ownertenantapi.dto;

import io.swagger.v3.oas.annotations.media.Schema;
import java.util.List;

@Schema(description = "Tenant visit history response")
public record VisitsResponse(
    @Schema(description = "Visit items")
    List<VisitItemResponse> items,
    @Schema(description = "Pagination metadata")
    PaginationResponse pagination
) {
}
