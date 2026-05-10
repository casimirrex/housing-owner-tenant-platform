package com.housing.ownertenantapi.dto;

import io.swagger.v3.oas.annotations.media.Schema;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Positive;
import jakarta.validation.constraints.PositiveOrZero;
import jakarta.validation.constraints.Size;

@Schema(description = "Tenant records the active lease they signed off-platform")
public record LeaseCreate(
    @NotBlank String listingId,
    @NotBlank @Schema(example = "2026-06-01") String startDate,
    @NotBlank @Schema(example = "2027-05-31") String endDate,
    @Positive int monthlyRent,
    @PositiveOrZero int securityDeposit,
    @Size(max = 1024) String documentUrl,
    @Size(max = 2000) String notes
) {
}
