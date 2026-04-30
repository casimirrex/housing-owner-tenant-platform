package com.housing.ownertenantapi.dto;

import io.swagger.v3.oas.annotations.media.Schema;

@Schema(description = "Search summary metadata")
public record SearchSummaryResponse(
    @Schema(description = "Summary label", example = "3 homes found near metro in Bengaluru")
    String summary,
    @Schema(description = "City used for the search", example = "Bengaluru")
    String city,
    @Schema(description = "Sort applied", example = "relevance")
    String sortBy,
    @Schema(description = "Number of matched results", example = "3")
    long resultCount
) {
}
