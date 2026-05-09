package com.housing.ownertenantapi.dto;

import io.swagger.v3.oas.annotations.media.Schema;
import jakarta.validation.constraints.NotEmpty;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;
import java.util.List;

@Schema(description = "Bulk update on owner-owned listings")
public record OwnerListingsBulkActionRequest(
    @Schema(description = "Action to apply",
        allowableValues = {"PUBLISH", "PAUSE", "ARCHIVE"})
    @Pattern(regexp = "PUBLISH|PAUSE|ARCHIVE")
    @NotNull
    String action,

    @Schema(description = "Listing ids to act on (max 50)")
    @NotEmpty
    @Size(max = 50)
    List<String> listingIds
) {
}
