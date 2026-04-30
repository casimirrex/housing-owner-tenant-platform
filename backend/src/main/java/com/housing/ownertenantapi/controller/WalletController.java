package com.housing.ownertenantapi.controller;

import com.housing.ownertenantapi.dto.WalletDashboardResponse;
import com.housing.ownertenantapi.dto.WalletTopupCheckoutResponse;
import com.housing.ownertenantapi.dto.WalletTopupRequest;
import com.housing.ownertenantapi.dto.WalletTopupVerifyRequest;
import com.housing.ownertenantapi.dto.WalletTopupVerifyResponse;
import com.housing.ownertenantapi.service.WalletService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import org.springframework.http.HttpHeaders;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestHeader;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/v1/wallet")
@Tag(
    name = "Wallet",
    description = "User wallet: balance, top-up via Stripe, and transaction history"
)
public class WalletController {

  private final WalletService walletService;

  public WalletController(WalletService walletService) {
    this.walletService = walletService;
  }

  @GetMapping
  @Operation(
      summary = "Get wallet dashboard",
      description = "Returns the wallet balance, currency, and recent transactions for the signed-in user"
  )
  public WalletDashboardResponse getDashboard(
      @RequestHeader(value = HttpHeaders.AUTHORIZATION, required = false) String authorizationHeader
  ) {
    return walletService.getDashboard(authorizationHeader);
  }

  @PostMapping("/topup/checkout")
  @Operation(
      summary = "Create wallet top-up checkout",
      description = "Creates a Stripe PaymentIntent (or sandbox order) so the frontend can collect card details"
  )
  public WalletTopupCheckoutResponse createTopupCheckout(
      @RequestHeader(value = HttpHeaders.AUTHORIZATION, required = false) String authorizationHeader,
      @Valid @RequestBody WalletTopupRequest request
  ) {
    return walletService.createTopupCheckout(authorizationHeader, request);
  }

  @PostMapping("/topup/verify")
  @Operation(
      summary = "Verify and credit wallet top-up",
      description = "Verifies the Stripe PaymentIntent and credits the wallet balance on success"
  )
  public WalletTopupVerifyResponse verifyTopup(
      @RequestHeader(value = HttpHeaders.AUTHORIZATION, required = false) String authorizationHeader,
      @Valid @RequestBody WalletTopupVerifyRequest request
  ) {
    return walletService.verifyTopup(authorizationHeader, request);
  }
}
