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

@RestController
@RequestMapping("/api/v1/subscriptions/tenant-premium")
@Tag(
    name = "Tenant Premium",
    description = "Premium tenant plan status and activation APIs"
)
public class TenantPremiumController {

  private final TenantPremiumService tenantPremiumService;

  public TenantPremiumController(TenantPremiumService tenantPremiumService) {
    this.tenantPremiumService = tenantPremiumService;
  }

  @GetMapping
  @Operation(
      summary = "Get tenant premium status",
      description = "Returns the current tenant premium plan details, wallet readiness, and active entitlement status."
  )
  public TenantPremiumAccessResponse getCurrentAccess(
      @RequestHeader(value = HttpHeaders.AUTHORIZATION, required = false) String authorizationHeader
  ) {
    return tenantPremiumService.getCurrentAccess(authorizationHeader);
  }

  @PostMapping("/activate")
  @Operation(
      summary = "Activate tenant premium from wallet balance",
      description = "Deducts the configured premium fee from the signed-in tenant wallet and activates premium access."
  )
  public TenantPremiumActivationResponse activatePremium(
      @RequestHeader(value = HttpHeaders.AUTHORIZATION, required = false) String authorizationHeader
  ) {
    return tenantPremiumService.activatePremium(authorizationHeader);
  }
}
