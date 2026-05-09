package com.housing.ownertenantapi.dto;

import io.swagger.v3.oas.annotations.media.Schema;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;

@Schema(description = "Create or update the current user's roommate profile")
public record RoommateProfileRequest(
    @NotBlank @Size(max = 80) String city,
    @Size(max = 500) String preferredAreas,
    @Min(0) Integer budgetMin,
    @Min(0) Integer budgetMax,
    @Schema(example = "2026-06-01") String moveInDate,
    @Pattern(regexp = "ANY|MALE|FEMALE|NON_BINARY") String genderPreference,
    @Size(max = 80) String occupation,
    boolean smoker,
    boolean drinks,
    boolean petFriendly,
    boolean vegetarian,
    boolean earlyRiser,
    @Size(max = 1500) String bio
) {
}
