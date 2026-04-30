package com.housing.ownertenantapi.dto;

import io.swagger.v3.oas.annotations.media.Schema;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;

@Schema(description = "Request to initiate a wallet top-up via Stripe")
public record WalletTopupRequest(

    @NotNull(message = "amount is required")
    @Min(value = 1, message = "Minimum top-up is ₹1")
    @Schema(
        description = "Amount in MAJOR currency units — rupees for INR (e.g. 500 = ₹500). " +
                      "The backend converts to paise before sending to Stripe.",
        example = "500"
    )
    Integer amount,

    @NotBlank(message = "currency is required")
    @Schema(description = "ISO 4217 currency code", example = "INR")
    String currency
) {
}
