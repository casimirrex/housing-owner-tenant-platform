package com.housing.ownertenantapi.controller;

import com.housing.ownertenantapi.dto.LeaseCreate;
import com.housing.ownertenantapi.dto.LeaseItem;
import com.housing.ownertenantapi.dto.LeaseListResponse;
import com.housing.ownertenantapi.service.LeaseService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import java.util.Map;
import org.springframework.http.HttpHeaders;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestHeader;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/v1/leases")
@Tag(name = "Leases", description = "Tenant lease tracker — record agreements + expiry reminders")
public class LeaseController {

  private final LeaseService leaseService;

  public LeaseController(LeaseService leaseService) {
    this.leaseService = leaseService;
  }

  @PostMapping
  @Operation(summary = "Tenant records a new lease")
  public LeaseItem create(
      @RequestHeader(value = HttpHeaders.AUTHORIZATION, required = false) String authorizationHeader,
      @Valid @RequestBody LeaseCreate request
  ) {
    return leaseService.create(authorizationHeader, request);
  }

  @GetMapping("/me")
  @Operation(summary = "List my (tenant) leases")
  public LeaseListResponse listMine(
      @RequestHeader(value = HttpHeaders.AUTHORIZATION, required = false) String authorizationHeader
  ) {
    return leaseService.listForTenant(authorizationHeader);
  }

  @GetMapping("/owner")
  @Operation(summary = "List leases on listings I own")
  public LeaseListResponse listForOwner(
      @RequestHeader(value = HttpHeaders.AUTHORIZATION, required = false) String authorizationHeader
  ) {
    return leaseService.listForOwner(authorizationHeader);
  }

  @PatchMapping("/{leaseId}/status")
  @Operation(summary = "Tenant changes their own lease status")
  public LeaseItem updateStatus(
      @RequestHeader(value = HttpHeaders.AUTHORIZATION, required = false) String authorizationHeader,
      @PathVariable String leaseId,
      @RequestBody Map<String, String> body
  ) {
    return leaseService.updateStatus(authorizationHeader, leaseId, body.get("status"));
  }
}
