package com.housing.ownertenantapi.dto;

import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import java.time.LocalDate;

/**
 * Owner-initiated rental-agreement creation payload.
 * Validation is intentionally permissive — owners can iterate before
 * sending for signatures.
 */
public record RentalAgreementCreateRequest(
    @NotBlank String propertyId,
    @NotBlank String tenantId,
    @NotNull @Min(1) Long monthlyRentPaise,
    @NotNull @Min(0) Long depositPaise,
    @NotNull LocalDate leaseStartDate,
    @NotNull LocalDate leaseEndDate,
    @Min(0) Integer noticePeriodDays,
    @Size(max = 4000) String additionalTerms
) {}
