package com.housing.ownertenantapi.controller;

import com.housing.ownertenantapi.dto.OwnerGetStartedRequest;
import com.housing.ownertenantapi.dto.OwnerGetStartedResponse;
import com.housing.ownertenantapi.service.OwnerAccessService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/v1/owners")
@Tag(
    name = "Owner Access",
    description = "Owner account creation and property onboarding APIs"
)
public class OwnerAccessController {

  private final OwnerAccessService ownerAccessService;

  public OwnerAccessController(OwnerAccessService ownerAccessService) {
    this.ownerAccessService = ownerAccessService;
  }

  @PostMapping("/get-started")
  @Operation(
      summary = "Create owner account and first listing draft",
      description = "Creates a new owner account, signs the owner in, and seeds the first property draft in one request"
  )
  public OwnerGetStartedResponse getStarted(@Valid @RequestBody OwnerGetStartedRequest request) {
    return ownerAccessService.getStarted(request);
  }
}
