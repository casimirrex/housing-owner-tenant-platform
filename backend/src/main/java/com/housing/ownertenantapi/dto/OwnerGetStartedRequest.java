package com.housing.ownertenantapi.dto;

import io.swagger.v3.oas.annotations.media.Schema;
import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotEmpty;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import java.util.List;

@Schema(description = "Request to create a new owner account and first property draft")
public record OwnerGetStartedRequest(
    @Schema(description = "Owner full name", example = "Priya Sharma")
    @NotBlank
    String fullName,
    @Schema(description = "Owner email address", example = "priya.sharma@example.com")
    @NotBlank
    @Email
    String email,
    @Schema(description = "Owner phone number with country code", example = "+919876543210")
    @NotBlank
    String phoneNumber,
    @Schema(description = "Password for future owner sign-in", example = "OwnerPassword@123")
    @NotBlank
    @Size(min = 8)
    String password,
    @Schema(description = "Listing title", example = "Bright 2BHK near Whitefield")
    @NotBlank
    String title,
    @Schema(description = "Property type", example = "Apartment")
    @NotBlank
    String propertyType,
    @Schema(description = "City", example = "Bengaluru")
    @NotBlank
    String city,
    @Schema(description = "Locality", example = "Whitefield")
    @NotBlank
    String locality,
    @Schema(description = "Monthly rent", example = "32000")
    @NotNull
    Integer rent,
    @Schema(description = "Security deposit", example = "96000")
    @NotNull
    Integer deposit,
    @Schema(description = "BHK configuration", example = "2BHK")
    @NotBlank
    String bhk,
    @Schema(description = "Furnishing status", example = "Semi Furnished")
    @NotBlank
    String furnishing,
    @Schema(description = "Amenities")
    @NotEmpty
    List<String> amenities,
    @Schema(description = "Photo URLs")
    @NotEmpty
    List<String> photos,
    @Schema(description = "Latitude", example = "12.9716")
    Double lat,
    @Schema(description = "Longitude", example = "77.5946")
    Double lng
) {
}
