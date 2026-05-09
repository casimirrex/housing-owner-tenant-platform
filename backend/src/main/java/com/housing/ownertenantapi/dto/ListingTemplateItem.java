package com.housing.ownertenantapi.dto;

public record ListingTemplateItem(
    String templateId,
    String ownerId,
    String name,
    String payloadJson,
    String createdAt
) {
}
