package com.housing.ownertenantapi.dto;

import io.swagger.v3.oas.annotations.media.Schema;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import java.util.List;

@Schema(description = "Request to update user search and recommendation preferences")
public record UserPreferenceUpdateRequest(
    @Schema(description = "Minimum budget", example = "18000")
    @Min(0)
    int budgetMin,
    @Schema(description = "Maximum budget", example = "42000")
    @Min(0)
    int budgetMax,
    @Schema(description = "Preferred BHK configuration", example = "2BHK")
    @NotBlank
    String bhkPreference,
    @Schema(description = "Preferred furnishing configuration", example = "Semi Furnished")
    String furnishingPreference,
    @Schema(description = "Commute destination or anchor location", example = "Whitefield")
    @NotBlank
    String commuteLocation,
    @Schema(description = "Preferred move-in date", example = "2026-04-25")
    String moveInDate,
    @Schema(description = "Whether pet-friendly homes are preferred", example = "true")
    @NotNull
    Boolean petFriendly,
    @Schema(description = "Preferred tenant type", example = "FAMILY")
    @NotBlank
    String tenantType,
    @Schema(description = "Lifestyle tags", example = "[\"gated-community\", \"near-metro\"]")
    @NotNull
    List<String> lifestyleTags
) {
}
