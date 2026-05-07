package com.housing.ownertenantapi.controller;

import com.housing.ownertenantapi.dto.OwnerVerificationResponse;
import com.housing.ownertenantapi.service.CurrentSessionService;
import com.housing.ownertenantapi.service.OwnerVerificationService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import org.springframework.http.HttpHeaders;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestHeader;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

/** Tier 1 #2 — Verified Owner Badge. Read state + pay-to-verify endpoints. */
@RestController
@RequestMapping("/api/v1/owners/verification")
@Tag(name = "Verified Owner Badge", description = "One-time Rs 199 trust signal for owners")
public class OwnerVerificationController {

  private final OwnerVerificationService verificationService;
  private final CurrentSessionService currentSessionService;

  public OwnerVerificationController(
      OwnerVerificationService verificationService,
      CurrentSessionService currentSessionService
  ) {
    this.verificationService = verificationService;
    this.currentSessionService = currentSessionService;
  }

  @GetMapping
  @Operation(summary = "Get current verification state for the signed-in owner")
  public OwnerVerificationResponse getStatus(
      @RequestHeader(value = HttpHeaders.AUTHORIZATION, required = false) String authorizationHeader
  ) {
    var identity = currentSessionService.requireRole(
        authorizationHeader, "OWNER",
        "Sign in as an owner to view verification status.",
        "Verification status is only available for owners."
    );
    return verificationService.getStatus(identity.userId());
  }

  @PostMapping
  @Operation(summary = "Pay Rs 199 from wallet to become a Verified Owner (idempotent)")
  public OwnerVerificationResponse verify(
      @RequestHeader(value = HttpHeaders.AUTHORIZATION, required = false) String authorizationHeader
  ) {
    var identity = currentSessionService.requireRole(
        authorizationHeader, "OWNER",
        "Sign in as an owner to verify your account.",
        "Only owners can purchase the Verified Owner badge."
    );
    return verificationService.verify(identity.userId());
  }
}
