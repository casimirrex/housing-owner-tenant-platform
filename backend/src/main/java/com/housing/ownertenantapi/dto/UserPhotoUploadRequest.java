package com.housing.ownertenantapi.dto;

import io.swagger.v3.oas.annotations.media.Schema;
import jakarta.validation.constraints.NotBlank;

@Schema(description = "Request to upload or attach a user profile image")
public record UserPhotoUploadRequest(
    @Schema(
        description = "Profile photo URL stored by the frontend or media service",
        example = "https://images.example.com/users/aarav-onboarding.jpg"
    )
    @NotBlank
    String photoUrl
) {
}
