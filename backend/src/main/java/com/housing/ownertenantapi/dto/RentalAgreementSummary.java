package com.housing.ownertenantapi.dto;

import java.time.LocalDate;
import java.time.OffsetDateTime;
import java.util.List;

/** Lightweight row for the My Agreements list. */
public record RentalAgreementSummary(
    String agreementId,
    String propertyId,
    String propertyTitle,
    String counterpartyName,   // tenant's name if owner is viewer, vice versa
    String counterpartyRole,   // "TENANT" or "OWNER"
    long monthlyRentPaise,
    LocalDate leaseStartDate,
    LocalDate leaseEndDate,
    String status,
    OffsetDateTime createdAt
) {
  public record Listing(List<RentalAgreementSummary> items) {}
}
