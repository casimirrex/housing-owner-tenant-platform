package com.housing.ownertenantapi.controller;

import com.housing.ownertenantapi.dto.OwnerCreatePaymentRecordRequest;
import com.housing.ownertenantapi.dto.OwnerCreatePaymentRecordResponse;
import com.housing.ownertenantapi.service.OwnerListingService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import org.springframework.http.HttpHeaders;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestHeader;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/v1/owners/payment-records")
@Tag(
    name = "Owner Payments",
    description = "Owner-side API to create payment records for tenants"
)
public class OwnerPaymentController {

  private final OwnerListingService ownerListingService;

  public OwnerPaymentController(OwnerListingService ownerListingService) {
    this.ownerListingService = ownerListingService;
  }

  @PostMapping
  @Operation(
      summary = "Create a payment record for a tenant",
      description = "Owner assigns a payment record (rent, deposit, booking token) to a tenant. " +
                    "The tenant must already have a registered account. " +
                    "Once created, the record appears immediately on the tenant's payments page."
  )
  public OwnerCreatePaymentRecordResponse createPaymentRecord(
      @RequestHeader(value = HttpHeaders.AUTHORIZATION, required = false) String authorizationHeader,
      @Valid @RequestBody OwnerCreatePaymentRecordRequest request
  ) {
    return ownerListingService.createPaymentRecord(authorizationHeader, request);
  }
}
