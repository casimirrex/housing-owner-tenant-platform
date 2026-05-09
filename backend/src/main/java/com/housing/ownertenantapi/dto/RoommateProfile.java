package com.housing.ownertenantapi.dto;

public record RoommateProfile(
    String profileId,
    String userId,
    String fullName,
    String city,
    String preferredAreas,
    Integer budgetMin,
    Integer budgetMax,
    String moveInDate,
    String genderPreference,
    String occupation,
    boolean smoker,
    boolean drinks,
    boolean petFriendly,
    boolean vegetarian,
    boolean earlyRiser,
    String bio,
    boolean active,
    Integer matchScore
) {
}
