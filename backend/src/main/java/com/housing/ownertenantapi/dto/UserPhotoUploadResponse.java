package com.housing.ownertenantapi.dto;

import io.swagger.v3.oas.annotations.media.Schema;

@Schema(description = "Response after attaching a profile image to the logged-in user")
public record UserPhotoUploadResponse(
    @Schema(description = "Whether the photo was stored successfully", example = "true")
    boolean uploaded,
    @Schema(
        description = "Stored profile image URL",
        example = "https://images.example.com/users/aarav-onboarding.jpg"
    )
    String photoUrl,
    @Schema(description = "Updated user profile")
    UserProfileResponse user
) {
}
