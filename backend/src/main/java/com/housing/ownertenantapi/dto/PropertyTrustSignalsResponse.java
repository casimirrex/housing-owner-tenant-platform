package com.housing.ownertenantapi.dto;

import io.swagger.v3.oas.annotations.media.Schema;
import java.util.List;

@Schema(description = "Trust and verification signals for a property")
public record PropertyTrustSignalsResponse(
    @Schema(description = "Whether the property is platform verified", example = "true")
    boolean verified,
    @Schema(description = "Verification badge label", example = "Verified by Housing Platform")
    String verificationLabel,
    @Schema(description = "Owner response rate percentage", example = "96")
    int ownerResponseRate,
    @Schema(description = "Readable owner response time label", example = "Replies in about 10 mins")
    String ownerResponseTimeLabel,
    @Schema(description = "Average rating", example = "4.7")
    double averageRating,
    @Schema(description = "Number of ratings", example = "28")
    int ratingCount,
    @Schema(description = "Last metadata refresh label", example = "Updated today")
    String lastUpdatedLabel,
    @Schema(description = "AI-assisted property trust score")
    PropertyInsightScoreResponse propertyTrustScore,
    @Schema(description = "AI-assisted neighbourhood safety score")
    PropertyInsightScoreResponse neighbourhoodSafetyScore,
    @Schema(description = "AI-assisted price fairness score")
    PropertyInsightScoreResponse priceFairnessScore,
    @Schema(description = "Additional trust badges")
    List<String> badges
) {
}
