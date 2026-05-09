package com.housing.ownertenantapi.controller;

import com.housing.ownertenantapi.dto.MaintenanceListResponse;
import com.housing.ownertenantapi.dto.MaintenanceRequestCreate;
import com.housing.ownertenantapi.dto.MaintenanceRequestItem;
import com.housing.ownertenantapi.dto.MaintenanceUpdateStatus;
import com.housing.ownertenantapi.service.MaintenanceService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import org.springframework.http.HttpHeaders;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestHeader;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/v1/maintenance")
@Tag(name = "Maintenance", description = "Tenant raises maintenance requests, owners resolve them")
public class MaintenanceController {

  private final MaintenanceService maintenanceService;

  public MaintenanceController(MaintenanceService maintenanceService) {
    this.maintenanceService = maintenanceService;
  }

  @PostMapping("/requests")
  @Operation(summary = "Tenant creates a maintenance request")
  public MaintenanceRequestItem create(
      @RequestHeader(value = HttpHeaders.AUTHORIZATION, required = false) String authorizationHeader,
      @Valid @RequestBody MaintenanceRequestCreate request
  ) {
    return maintenanceService.create(authorizationHeader, request);
  }

  @GetMapping("/requests/tenant")
  @Operation(summary = "List requests raised by the current tenant")
  public MaintenanceListResponse listForTenant(
      @RequestHeader(value = HttpHeaders.AUTHORIZATION, required = false) String authorizationHeader,
      @RequestParam(required = false) String status,
      @RequestParam(defaultValue = "0") int page,
      @RequestParam(defaultValue = "20") int pageSize
  ) {
    return maintenanceService.listForTenant(authorizationHeader, status, page, pageSize);
  }

  @GetMapping("/requests/owner")
  @Operation(summary = "List requests on listings owned by the current owner")
  public MaintenanceListResponse listForOwner(
      @RequestHeader(value = HttpHeaders.AUTHORIZATION, required = false) String authorizationHeader,
      @RequestParam(required = false) String status,
      @RequestParam(defaultValue = "0") int page,
      @RequestParam(defaultValue = "20") int pageSize
  ) {
    return maintenanceService.listForOwner(authorizationHeader, status, page, pageSize);
  }

  @PatchMapping("/requests/{requestId}/status")
  @Operation(summary = "Owner moves a request through the status lifecycle")
  public MaintenanceRequestItem updateStatus(
      @RequestHeader(value = HttpHeaders.AUTHORIZATION, required = false) String authorizationHeader,
      @PathVariable String requestId,
      @Valid @RequestBody MaintenanceUpdateStatus update
  ) {
    return maintenanceService.updateStatus(authorizationHeader, requestId, update);
  }

  @DeleteMapping("/requests/{requestId}")
  @Operation(summary = "Tenant cancels their own request")
  public ResponseEntity<Void> cancel(
      @RequestHeader(value = HttpHeaders.AUTHORIZATION, required = false) String authorizationHeader,
      @PathVariable String requestId
  ) {
    maintenanceService.cancel(authorizationHeader, requestId);
    return ResponseEntity.noContent().build();
  }
}
