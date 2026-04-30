package com.housing.ownertenantapi.dto;

import io.swagger.v3.oas.annotations.media.Schema;
import java.util.List;

@Schema(description = "Search and recommendation preferences for the logged-in user")
public record UserPreferenceProfileResponse(
    @Schema(description = "Preference profile id", example = "pref_2eac91f4")
    String preferenceProfileId,
    @Schema(description = "Minimum budget", example = "15000")
    int budgetMin,
    @Schema(description = "Maximum budget", example = "35000")
    int budgetMax,
    @Schema(description = "Preferred BHK configuration", example = "1BHK,2BHK")
    String bhkPreference,
    @Schema(description = "Preferred furnishing configuration", example = "Semi Furnished, Fully Furnished")
    String furnishingPreference,
    @Schema(description = "Preferred localities", example = "[\"Koramangala\", \"HSR Layout\"]")
    List<String> preferredLocalities,
    @Schema(description = "Commute destination or anchor location", example = "Manyata Tech Park")
    String commuteLocation,
    @Schema(description = "Preferred move-in date", example = "2026-04-25")
    String moveInDate,
    @Schema(description = "Lifestyle tags", example = "[\"near-metro\", \"family-friendly\"]")
    List<String> lifestyleTags,
    @Schema(description = "Whether pet-friendly homes are preferred", example = "true")
    boolean petFriendly,
    @Schema(description = "Preferred tenant type", example = "WORKING_PROFESSIONAL")
    String tenantType
) {
}
