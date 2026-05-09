package com.housing.ownertenantapi.dto;

import io.swagger.v3.oas.annotations.media.Schema;
import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

@Schema(description = "Submit a review for a property (verified-stay only)")
public record ReviewSubmitRequest(
    @Schema(description = "Rating, 1-5", example = "4")
    @Min(1) @Max(5)
    int rating,

    @Schema(description = "Short headline", example = "Great location, responsive owner")
    @NotBlank
    @Size(min = 4, max = 120)
    String headline,

    @Schema(description = "Full review body", example = "We stayed for a viewing — owner was on time…")
    @NotBlank
    @Size(min = 12, max = 4000)
    String comment
) {
}
