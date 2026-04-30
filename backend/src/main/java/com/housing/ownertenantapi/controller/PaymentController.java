package com.housing.ownertenantapi.controller;

import com.housing.ownertenantapi.dto.PaymentCheckoutRequest;
import com.housing.ownertenantapi.dto.PaymentCheckoutResponse;
import com.housing.ownertenantapi.dto.PaymentDashboardResponse;
import com.housing.ownertenantapi.dto.PaymentVerificationRequest;
import com.housing.ownertenantapi.dto.PaymentVerificationResponse;
import com.housing.ownertenantapi.service.PaymentService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import java.util.Map;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestHeader;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/v1/payments")
@Tag(
    name = "Payments",
    description = "Tenant payment checkout, verification, and owner-side collection summaries"
)
public class PaymentController {

  private final PaymentService paymentService;

  public PaymentController(PaymentService paymentService) {
    this.paymentService = paymentService;
  }

  @GetMapping("/dashboard")
  @Operation(
      summary = "Get payments dashboard",
      description = "Returns tenant dues or owner collections depending on the signed-in account"
  )
  public PaymentDashboardResponse getDashboard(
      @RequestHeader(value = HttpHeaders.AUTHORIZATION, required = false) String authorizationHeader
  ) {
    return paymentService.getDashboard(authorizationHeader);
  }

  @PostMapping("/checkout")
  @Operation(
      summary = "Create payment checkout order",
      description = "Creates a Stripe PaymentIntent, Razorpay order, or sandbox checkout for a tenant payment item"
  )
  public PaymentCheckoutResponse createCheckout(
      @RequestHeader(value = HttpHeaders.AUTHORIZATION, required = false) String authorizationHeader,
      @Valid @RequestBody PaymentCheckoutRequest request
  ) {
    return paymentService.createCheckout(authorizationHeader, request);
  }

  @PostMapping("/verify")
  @Operation(
      summary = "Verify payment completion",
      description = "Verifies the provider response and marks the payment as captured"
  )
  public PaymentVerificationResponse verifyPayment(
      @RequestHeader(value = HttpHeaders.AUTHORIZATION, required = false) String authorizationHeader,
      @Valid @RequestBody PaymentVerificationRequest request
  ) {
    return paymentService.verifyPayment(authorizationHeader, request);
  }

  @PostMapping(value = "/webhooks/stripe", consumes = MediaType.APPLICATION_JSON_VALUE)
  @Operation(
      summary = "Receive Stripe webhook events",
      description = "Verifies Stripe webhook signatures and reconciles payment intent events into the local payment records"
  )
  public Map<String, Object> handleStripeWebhook(
      @RequestHeader(value = "Stripe-Signature", required = false) String stripeSignature,
      @RequestBody String payload
  ) {
    String eventType = paymentService.handleStripeWebhook(stripeSignature, payload);
    return Map.of(
        "received", true,
        "eventType", eventType
    );
  }
}
