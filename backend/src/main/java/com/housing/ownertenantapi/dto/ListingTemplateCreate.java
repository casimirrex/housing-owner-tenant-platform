package com.housing.ownertenantapi.dto;

import io.swagger.v3.oas.annotations.media.Schema;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

@Schema(description = "Save a listing draft as a reusable template")
public record ListingTemplateCreate(
    @NotBlank @Size(min = 2, max = 80) String name,
    /** Free-form JSON of listing fields the owner wants to reuse. */
    @NotBlank @Size(max = 50_000) String payloadJson
) {
}
