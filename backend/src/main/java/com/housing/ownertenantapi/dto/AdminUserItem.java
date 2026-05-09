package com.housing.ownertenantapi.dto;

import io.swagger.v3.oas.annotations.media.Schema;

@Schema(description = "User row in admin user list")
public record AdminUserItem(
    @Schema(example = "user_42")          String userId,
    @Schema(example = "Priya Sharma")     String fullName,
    @Schema(example = "priya@example.com") String email,
    @Schema(example = "+91-9000000000")   String phoneNumber,
    @Schema(example = "TENANT")           String role,
    @Schema(example = "Bengaluru")        String city,
    @Schema(example = "ACTIVE")           String profileStatus,
    @Schema(example = "true")             boolean verifiedOwner,
    @Schema(example = "false")            boolean blocked,
    @Schema(example = "2026-04-12T08:00:00Z") String updatedAt
) {
}
