package com.housing.ownertenantapi.controller;

import com.housing.ownertenantapi.dto.TenantPremiumAccessResponse;
import com.housing.ownertenantapi.dto.TenantPremiumActivationResponse;
import com.housing.ownertenantapi.service.TenantPremiumService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import org.springframework.http.HttpHeaders;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestHeader;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

/**
 * Owner Premium subscription endpoints. Owners must hold an active OWNER_PREMIUM
 * subscription to publish property listings (gated in OwnerListingService).
 * The plan price is Rs. 1,000/year and is settled from the owner's wallet.
 */
@RestController
@RequestMapping("/api/v1/subscriptions/owner-premium")
@Tag(
    name = "Owner Premium",
    description = "Owner subscription required to publish property listings."
)
public class OwnerPremiumController {

  private final TenantPremiumService premiumService;

  public OwnerPremiumController(TenantPremiumService premiumService) {
    this.premiumService = premiumService;
  }

  @GetMapping
  @Operation(
      summary = "Get owner premium status",
      description = "Returns the owner premium plan, wallet readiness, and active entitlement status."
  )
  public TenantPremiumAccessResponse getCurrentAccess(
      @RequestHeader(value = HttpHeaders.AUTHORIZATION, required = false) String authorizationHeader
  ) {
    return premiumService.getOwnerCurrentAccess(authorizationHeader);
  }

  @PostMapping("/activate")
  @Operation(
      summary = "Activate owner premium from wallet balance",
      description = "Deducts the Rs. 1,000 owner premium fee from the signed-in owner's wallet and activates premium so they can publish listings."
  )
  public TenantPremiumActivationResponse activatePremium(
      @RequestHeader(value = HttpHeaders.AUTHORIZATION, required = false) String authorizationHeader
  ) {
    return premiumService.activateOwnerPremium(authorizationHeader);
  }
}
