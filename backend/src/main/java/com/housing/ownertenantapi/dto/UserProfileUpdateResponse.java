package com.housing.ownertenantapi.dto;

import io.swagger.v3.oas.annotations.media.Schema;

@Schema(description = "Response after updating the logged-in user profile")
public record UserProfileUpdateResponse(
    @Schema(description = "Whether the profile update was applied", example = "true")
    boolean updated,
    @Schema(description = "Updated user profile")
    UserProfileResponse user
) {
}
