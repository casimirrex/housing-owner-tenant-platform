package com.housing.ownertenantapi.dto;

import io.swagger.v3.oas.annotations.media.Schema;

@Schema(description = "Logged-in user profile")
public record UserProfileResponse(
    @Schema(description = "User id", example = "user_1a2b3c4d")
    String userId,
    @Schema(description = "Full name", example = "Aarav Kumar")
    String fullName,
    @Schema(description = "Email address", example = "aarav@example.com")
    String email,
    @Schema(description = "Phone number", example = "+919876543210")
    String phoneNumber,
    @Schema(description = "User role", example = "TENANT")
    String role,
    @Schema(description = "Profile completion or verification status", example = "VERIFIED")
    String profileStatus,
    @Schema(description = "Primary city", example = "Bengaluru")
    String city,
    @Schema(description = "Date of birth", example = "1995-08-14")
    String dateOfBirth,
    @Schema(description = "Gender", example = "Male")
    String gender,
    @Schema(description = "Occupation", example = "Software Engineer")
    String occupation,
    @Schema(description = "Emergency contact name", example = "Meera Kumar")
    String emergencyContactName,
    @Schema(description = "Emergency contact phone number", example = "+919912345678")
    String emergencyContactPhone,
    @Schema(description = "Employment type", example = "SALARIED")
    String employmentType,
    @Schema(description = "Employer or company name", example = "Infosys")
    String employerName,
    @Schema(description = "Monthly income range", example = "Rs. 90,000-1,20,000")
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
    @Schema(description = "UPI ID", example = "aarav@upi")
    String upiId,
    @Schema(description = "Profile photo URL", example = "https://images.example.com/users/aarav.jpg")
    String photoUrl,
    @Schema(description = "Profile completion percentage", example = "82")
    int profileCompletion,
    @Schema(description = "Whether the tenant currently has active premium access", example = "true")
    boolean premiumTenant,
    @Schema(description = "Active premium plan code when present", example = "TENANT_PREMIUM_ANNUAL")
    String premiumPlanCode,
    @Schema(description = "Premium access expiry timestamp when present", example = "2027-04-01T08:00:00Z")
    String premiumExpiresAt,
    @Schema(description = "Whether the account already has an app password", example = "true")
    boolean hasPassword
) {
}
