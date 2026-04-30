package com.housing.ownertenantapi.dto;

import io.swagger.v3.oas.annotations.media.Schema;
import jakarta.validation.constraints.NotBlank;

@Schema(description = "Request to create a payment checkout order")
public record PaymentCheckoutRequest(
    @NotBlank
    @Schema(description = "Internal payment id", example = "payment_3001")
    String paymentId
) {
}
