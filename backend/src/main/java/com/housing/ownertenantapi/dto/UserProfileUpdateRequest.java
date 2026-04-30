package com.housing.ownertenantapi.dto;

import io.swagger.v3.oas.annotations.media.Schema;
import jakarta.validation.constraints.NotBlank;

@Schema(description = "Request to update the logged-in user profile")
public record UserProfileUpdateRequest(
    @Schema(description = "Full name", example = "Aarav Kumar")
    @NotBlank
    String fullName,
    @Schema(description = "Gender", example = "Male")
    @NotBlank
    String gender,
    @Schema(description = "Primary city", example = "Pune")
    @NotBlank
    String city,
    @Schema(description = "Date of birth", example = "1995-08-14")
    String dateOfBirth,
    @Schema(description = "Occupation", example = "Product Designer")
    @NotBlank
    String occupation,
    @Schema(description = "Emergency contact name", example = "Anita Kumar")
    @NotBlank
    String emergencyContactName,
    @Schema(description = "Emergency contact phone number", example = "+919912345678")
    @NotBlank
    String emergencyContactPhone,
    @Schema(description = "Employment type", example = "SALARIED")
    String employmentType,
    @Schema(description = "Employer or company name", example = "TCS")
    String employerName,
    @Schema(description = "Monthly income range", example = "Rs. 60,000-90,000")
    String monthlyIncomeRange,
    @Schema(description = "Previous landlord reference name", example = "Sanjay Menon")
    String previousLandlordName,
    @Schema(description = "Previous landlord reference phone number", example = "+919800112233")
    String previousLandlordPhone,
    @Schema(description = "Aadhaar last 4 digits", example = "4821")
    String aadhaarLast4,
    @Schema(description = "PAN card number", example = "ABCDE1234F")
    String panCardNumber,
    @Schema(description = "Government ID type", example = "Driving Licence")
    String governmentIdType,
    @Schema(description = "Government ID photo URL", example = "https://images.example.com/users/id-front.jpg")
    String governmentIdPhotoUrl,
    @Schema(description = "UPI ID", example = "arjun@upi")
    String upiId,
    @Schema(description = "Profile photo URL", example = "https://images.example.com/users/aarav-updated.jpg")
    @NotBlank
    String photoUrl
) {
}
