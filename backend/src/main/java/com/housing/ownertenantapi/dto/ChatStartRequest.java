package com.housing.ownertenantapi.dto;

import io.swagger.v3.oas.annotations.media.Schema;
import jakarta.validation.constraints.NotBlank;

@Schema(description = "Open or reuse a chat thread for a listing (tenant initiates)")
public record ChatStartRequest(
    @NotBlank
    @Schema(description = "Listing id to start the conversation about", example = "owner_listing_2007")
    String listingId
) {}
