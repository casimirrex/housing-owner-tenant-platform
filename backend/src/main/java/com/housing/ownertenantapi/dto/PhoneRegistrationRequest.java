package com.housing.ownertenantapi.dto;

import io.swagger.v3.oas.annotations.media.Schema;
import jakarta.validation.constraints.NotBlank;

@Schema(description = "Request to start registration with phone")
public record PhoneRegistrationRequest(
    @Schema(description = "User full name", example = "Aarav Kumar")
    @NotBlank
    String fullName,
    @Schema(description = "Country code", example = "+91")
    @NotBlank
    String countryCode,
    @Schema(description = "Phone number", example = "9876543210")
    @NotBlank
    String phoneNumber,
    @Schema(description = "Requested account role. Defaults to TENANT.", example = "OWNER")
    String role
) {
}
