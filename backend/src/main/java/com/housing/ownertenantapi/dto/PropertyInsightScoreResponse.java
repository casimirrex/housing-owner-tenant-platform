package com.housing.ownertenantapi.dto;

import io.swagger.v3.oas.annotations.media.Schema;

@Schema(description = "An AI-assisted score shown on the property detail page")
public record PropertyInsightScoreResponse(
    @Schema(description = "Score title", example = "Property Trust Score")
    String title,
    @Schema(description = "Score value out of 100", example = "95")
    int score,
    @Schema(description = "Short explanation of how the score is derived", example = "Built from verification, owner responsiveness, review quality, and listing freshness.")
    String summary,
    @Schema(description = "When the score is first calculated or refreshed", example = "Calculated at listing publish and refreshed after verification or review changes.")
    String calculationStage
) {
}
