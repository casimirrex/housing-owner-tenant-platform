package com.housing.ownertenantapi.controller;

import com.housing.ownertenantapi.dto.PropertyDetailResponse;
import com.housing.ownertenantapi.dto.PropertyFaqResponse;
import com.housing.ownertenantapi.dto.PropertyRemoveSaveResponse;
import com.housing.ownertenantapi.dto.PropertyReviewsResponse;
import com.housing.ownertenantapi.dto.PropertySaveResponse;
import com.housing.ownertenantapi.service.PropertyDetailService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.Parameter;
import io.swagger.v3.oas.annotations.tags.Tag;
import org.springframework.http.HttpHeaders;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestHeader;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/v1/properties")
@Tag(
    name = "Properties",
    description = "Property detail, reviews, FAQ, and shortlist APIs"
)
public class PropertyController {

  private final PropertyDetailService propertyDetailService;

  public PropertyController(PropertyDetailService propertyDetailService) {
    this.propertyDetailService = propertyDetailService;
  }

  @GetMapping("/{propertyId}")
  @Operation(
      summary = "Get main property detail page payload",
      description = "Returns the main property detail page sections including pricing, specs, trust, and owner information"
  )
  public PropertyDetailResponse getProperty(
      @Parameter(description = "Property id", example = "listing_001")
      @PathVariable String propertyId,
      @RequestHeader(value = HttpHeaders.AUTHORIZATION, required = false) String authorizationHeader
  ) {
    return propertyDetailService.getPropertyDetail(propertyId, authorizationHeader);
  }

  @GetMapping("/{propertyId}/reviews")
  @Operation(
      summary = "Get property or tenant reviews",
      description = "Returns paginated reviews and rating summary for a property"
  )
  public PropertyReviewsResponse getPropertyReviews(
      @Parameter(description = "Property id", example = "listing_001")
      @PathVariable String propertyId,
      @Parameter(description = "Page number", example = "0")
      @RequestParam(defaultValue = "0") int page,
      @Parameter(description = "Page size", example = "10")
      @RequestParam(defaultValue = "10") int pageSize
  ) {
    return propertyDetailService.getReviews(propertyId, page, pageSize);
  }

  @GetMapping("/{propertyId}/faq")
  @Operation(
      summary = "Get property FAQ block",
      description = "Returns frequently asked questions for a property detail page"
  )
  public PropertyFaqResponse getPropertyFaq(
      @Parameter(description = "Property id", example = "listing_001")
      @PathVariable String propertyId
  ) {
    return propertyDetailService.getFaq(propertyId);
  }

  @PostMapping("/{propertyId}/save")
  @Operation(
      summary = "Save or shortlist property",
      description = "Marks a property as saved for the logged-in user"
  )
  public PropertySaveResponse saveProperty(
      @Parameter(description = "Property id", example = "listing_001")
      @PathVariable String propertyId
  ) {
    return propertyDetailService.saveProperty(propertyId);
  }

  @DeleteMapping("/{propertyId}/save")
  @Operation(
      summary = "Remove property from shortlist",
      description = "Removes a property from the logged-in user's saved shortlist"
  )
  public PropertyRemoveSaveResponse removeSavedProperty(
      @Parameter(description = "Property id", example = "listing_001")
      @PathVariable String propertyId
  ) {
    return propertyDetailService.removeSavedProperty(propertyId);
  }
}
