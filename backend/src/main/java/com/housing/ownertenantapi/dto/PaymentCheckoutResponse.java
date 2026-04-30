package com.housing.ownertenantapi.dto;

import io.swagger.v3.oas.annotations.media.Schema;

@Schema(description = "Checkout configuration returned to the frontend")
public record PaymentCheckoutResponse(
    @Schema(description = "Internal payment id", example = "payment_3001")
    String paymentId,
    @Schema(description = "Gateway mode: MOCK | RAZORPAY | STRIPE", example = "STRIPE")
    String providerMode,
    @Schema(description = "Gateway label", example = "Stripe")
    String providerLabel,
    @Schema(description = "External order / PaymentIntent id", example = "pi_3PnXwT2eZvKYlo2C1TXDmjkV")
    String orderId,
    @Schema(description = "Public publishable key (Razorpay key_id or Stripe publishable key)", example = "pk_test_...")
    String keyId,
    @Schema(description = "Stripe client secret for frontend confirmation (Stripe mode only)", example = "pi_3P..._secret_...")
    String clientSecret,
    @Schema(description = "Merchant name", example = "Rent and Beyond")
    String merchantName,
    @Schema(description = "Checkout description", example = "April 2026 rent")
    String description,
    @Schema(description = "Customer name", example = "Aarav Kumar")
    String customerName,
    @Schema(description = "Customer email", example = "aarav@example.com")
    String customerEmail,
    @Schema(description = "Customer phone", example = "+919876543210")
    String customerContact,
    @Schema(description = "Amount in smallest currency unit (paise for INR, cents for USD)", example = "32000")
    int amount,
    @Schema(description = "ISO currency code", example = "INR")
    String currency,
    @Schema(description = "Current payment status", example = "PENDING")
    String status
) {
}
