package com.housing.ownertenantapi.dto;

import io.swagger.v3.oas.annotations.media.Schema;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import java.util.List;

/**
 * Body for creating a saved search. All criteria fields are optional —
 * an unspecified field means "no filter on that dimension".
 */
@Schema(description = "Create a saved search. Tenant gets in-app alerts when matching listings publish.")
public record SavedSearchRequest(
    @NotBlank
    @Size(max = 100)
    @Schema(description = "Friendly name for this search", example = "Indiranagar 2BHK under 35k")
    String name,

    @Schema(description = "City filter (matches listing.city case-insensitively)", example = "Bengaluru")
    String city,

    @Schema(description = "Free-text query (matches title or locality)", example = "Indiranagar")
    String query,

    @Schema(description = "BHK options to match. Empty = any.", example = "[\"2BHK\",\"3BHK\"]")
    List<String> bhk,

    @Schema(description = "Furnishing filter. Null = any.", example = "Semi Furnished")
    String furnishing,

    @Schema(description = "Whether to require verified listings", example = "false")
    Boolean verified,

    @Schema(description = "Minimum monthly rent (rupees)", example = "20000")
    Integer rentMin,

    @Schema(description = "Maximum monthly rent (rupees)", example = "35000")
    Integer rentMax,

    @Schema(description = "Email for future alert delivery (in-app for now)",
        example = "tenant@example.com")
    String notificationEmail
) {}
