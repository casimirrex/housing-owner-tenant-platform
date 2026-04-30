package com.housing.ownertenantapi.dto;

import io.swagger.v3.oas.annotations.media.Schema;

@Schema(description = "Response after updating a user preference profile")
public record UserPreferenceUpdateResponse(
    @Schema(description = "Whether the preference profile was updated", example = "true")
    boolean updated,
    @Schema(description = "Updated preference profile id", example = "pref_2eac91f4")
    String preferenceProfileId
) {
}
