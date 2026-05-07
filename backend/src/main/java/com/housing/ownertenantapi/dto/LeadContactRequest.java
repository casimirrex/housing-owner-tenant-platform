package com.housing.ownertenantapi.dto;

import io.swagger.v3.oas.annotations.media.Schema;
import jakarta.validation.constraints.Size;

@Schema(description = "Tenant request to express interest in a listing")
public record LeadContactRequest(
    @Size(max = 1000, message = "Message must be 1000 characters or fewer")
    @Schema(description = "Optional note from the tenant to the owner",
        example = "Hi, looking to move in by 1st June. Pet friendly?")
    String message
) {}
