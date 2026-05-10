package com.housing.ownertenantapi.dto;

public record LeaseItem(
    String leaseId,
    String tenantId,
    String tenantName,
    String listingId,
    String listingTitle,
    String ownerId,
    String ownerName,
    String startDate,
    String endDate,
    int monthlyRent,
    int securityDeposit,
    String documentUrl,
    String status,
    String notes,
    int daysUntilEnd,
    String createdAt
) {
}
