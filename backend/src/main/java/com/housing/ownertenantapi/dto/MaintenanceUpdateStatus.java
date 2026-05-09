package com.housing.ownertenantapi.dto;

import io.swagger.v3.oas.annotations.media.Schema;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;

@Schema(description = "Owner updates the status of a maintenance request")
public record MaintenanceUpdateStatus(
    @Schema(allowableValues = {"OPEN","IN_PROGRESS","RESOLVED","CLOSED","CANCELLED"})
    @NotBlank
    @Pattern(regexp = "OPEN|IN_PROGRESS|RESOLVED|CLOSED|CANCELLED")
    String status,
    @Size(max = 2000) String ownerNote
) {
}
