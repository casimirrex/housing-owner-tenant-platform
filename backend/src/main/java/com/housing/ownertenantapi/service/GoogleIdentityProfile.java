package com.housing.ownertenantapi.service;

public record GoogleIdentityProfile(
    String subject,
    String email,
    boolean emailVerified,
    String fullName,
    String pictureUrl
) {
}
