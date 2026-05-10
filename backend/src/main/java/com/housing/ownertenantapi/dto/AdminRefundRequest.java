package com.housing.ownertenantapi.dto;

import io.swagger.v3.oas.annotations.media.Schema;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Positive;
import jakarta.validation.constraints.Size;

@Schema(description = "Admin issues a refund into a user's wallet")
public record AdminRefundRequest(
    @NotBlank @Schema(example = "user_42") String userId,
    @Positive @Schema(example = "499", description = "Amount in rupees, positive") int amountRupees,
    @NotBlank @Size(min = 4, max = 500) @Schema(example = "Visit cancelled — refunded lead fee") String reason,
    @Size(max = 200) @Schema(example = "lead_a1b2c3", description = "Optional reference to original payment") String referencePayment
) {
}
