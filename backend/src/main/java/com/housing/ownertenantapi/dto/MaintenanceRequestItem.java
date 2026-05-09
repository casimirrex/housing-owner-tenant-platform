package com.housing.ownertenantapi.dto;

import io.swagger.v3.oas.annotations.media.Schema;

@Schema(description = "Maintenance request row")
public record MaintenanceRequestItem(
    String requestId,
    String listingId,
    String listingTitle,
    String tenantId,
    String tenantName,
    String ownerId,
    String ownerName,
    String category,
    String priority,
    String title,
    String description,
    String status,
    String createdAt,
    String updatedAt,
    String resolvedAt,
    String ownerNote
) {
}
