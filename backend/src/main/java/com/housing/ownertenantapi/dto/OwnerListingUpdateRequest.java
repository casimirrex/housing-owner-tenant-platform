package com.housing.ownertenantapi.dto;

import io.swagger.v3.oas.annotations.media.Schema;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotEmpty;
import jakarta.validation.constraints.NotNull;
import java.util.List;

@Schema(description = "Request to update an owner listing")
public record OwnerListingUpdateRequest(
    @NotBlank
    @Schema(description = "Listing title", example = "Bright 2BHK near Electronic City Phase 1")
    String title,
    @NotNull
    @Schema(description = "Monthly rent", example = "30000")
    Integer rent,
    @NotNull
    @Schema(description = "Security deposit", example = "90000")
    Integer deposit,
    @NotEmpty
    @Schema(description = "Amenities")
    List<String> amenities,
    @NotBlank
    @Schema(description = "Availability date", example = "2026-04-25")
    String availabilityDate,
    @NotEmpty
    @Schema(description = "Photo URLs")
    List<String> photos
) {
}
