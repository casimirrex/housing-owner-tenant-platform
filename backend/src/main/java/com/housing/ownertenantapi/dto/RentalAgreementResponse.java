package com.housing.ownertenantapi.dto;

import java.time.LocalDate;
import java.time.OffsetDateTime;

public record RentalAgreementResponse(
    String agreementId,
    String propertyId,
    String propertyTitle,
    String propertyLocality,
    String propertyCity,
    String ownerId,
    String ownerName,
    String tenantId,
    String tenantName,
    long monthlyRentPaise,
    long depositPaise,
    LocalDate leaseStartDate,
    LocalDate leaseEndDate,
    int noticePeriodDays,
    String status,
    OffsetDateTime ownerAcceptedAt,
    OffsetDateTime tenantAcceptedAt,
    String additionalTerms,
    OffsetDateTime createdAt,
    OffsetDateTime updatedAt,
    /** HTML-rendered body for browser display + native print-to-PDF. */
    String htmlBody
) {}
