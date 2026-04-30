package com.housing.ownertenantapi.dto;

import io.swagger.v3.oas.annotations.media.Schema;

@Schema(description = "A product page definition sourced from the PRD or SOW")
public record ProductPageCatalogItem(
    @Schema(description = "Page name", example = "Login page")
    String page,
    @Schema(description = "Primary purpose of the page", example = "Phone/email/social login")
    String purpose,
    @Schema(description = "Requirement source", example = "PRD")
    String source
) {
}
