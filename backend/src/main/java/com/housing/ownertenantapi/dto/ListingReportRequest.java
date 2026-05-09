package com.housing.ownertenantapi.dto;

import io.swagger.v3.oas.annotations.media.Schema;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;

@Schema(description = "Report a listing for moderation")
public record ListingReportRequest(
    @Schema(
        description = "Reason code",
        example = "FAKE_LISTING",
        allowableValues = {
            "FAKE_LISTING", "WRONG_INFORMATION", "SPAM", "SCAM_OR_FRAUD",
            "OFFENSIVE_CONTENT", "ALREADY_RENTED", "DUPLICATE", "OTHER"
        }
    )
    @NotBlank
    @Pattern(regexp = "FAKE_LISTING|WRONG_INFORMATION|SPAM|SCAM_OR_FRAUD|OFFENSIVE_CONTENT|ALREADY_RENTED|DUPLICATE|OTHER")
    String reason,

    @Schema(description = "Optional free-text details", example = "Phone number doesn't connect")
    @Size(max = 2000)
    String details
) {
}
