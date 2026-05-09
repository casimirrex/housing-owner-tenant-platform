package com.housing.ownertenantapi.dto;

import io.swagger.v3.oas.annotations.media.Schema;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;

@Schema(description = "Admin action on a listing report")
public record AdminReportActionRequest(
    @Schema(allowableValues = {"IN_REVIEW", "RESOLVED", "DISMISSED"})
    @NotBlank
    @Pattern(regexp = "IN_REVIEW|RESOLVED|DISMISSED")
    String status,

    @Schema(description = "Note attached to the resolution")
    @Size(max = 2000)
    String resolutionNote
) {
}
