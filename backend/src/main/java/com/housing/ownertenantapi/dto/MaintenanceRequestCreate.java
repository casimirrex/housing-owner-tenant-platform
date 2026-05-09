package com.housing.ownertenantapi.dto;

import io.swagger.v3.oas.annotations.media.Schema;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;

@Schema(description = "Tenant raises a maintenance request on a listing")
public record MaintenanceRequestCreate(
    @Schema(example = "listing_001") @NotBlank String listingId,
    @Schema(example = "PLUMBING", allowableValues = {
        "PLUMBING","ELECTRICAL","APPLIANCE","PAINTING","PEST_CONTROL",
        "CLEANING","CARPENTRY","OTHER"
    })
    @NotBlank
    @Pattern(regexp = "PLUMBING|ELECTRICAL|APPLIANCE|PAINTING|PEST_CONTROL|CLEANING|CARPENTRY|OTHER")
    String category,
    @Schema(example = "NORMAL", allowableValues = {"LOW","NORMAL","HIGH","URGENT"})
    @Pattern(regexp = "LOW|NORMAL|HIGH|URGENT")
    String priority,
    @NotBlank @Size(min = 4, max = 120) String title,
    @NotBlank @Size(min = 10, max = 4000) String description
) {
}
