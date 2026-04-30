package com.housing.ownertenantapi.controller;

import com.housing.ownertenantapi.dto.HomeResponse;
import com.housing.ownertenantapi.dto.ListingCollectionResponse;
import com.housing.ownertenantapi.dto.RecommendationResponse;
import com.housing.ownertenantapi.service.HomeDiscoveryService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.Parameter;
import io.swagger.v3.oas.annotations.tags.Tag;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/v1")
@Tag(
    name = "Discovery",
    description = "Home, recommendation, and listing discovery APIs"
)
public class HomeDiscoveryController {

  private final HomeDiscoveryService homeDiscoveryService;

  public HomeDiscoveryController(HomeDiscoveryService homeDiscoveryService) {
    this.homeDiscoveryService = homeDiscoveryService;
  }

  @GetMapping("/home")
  @Operation(
      summary = "Get composite home screen payload",
      description = "Returns the home screen hero search config and curated listing rails"
  )
  public HomeResponse getHome(
      @Parameter(description = "Selected city", example = "Bengaluru")
      @RequestParam(required = false) String city,
      @Parameter(description = "Latitude for geo-aware discovery", example = "12.9716")
      @RequestParam(required = false) Double lat,
      @Parameter(description = "Longitude for geo-aware discovery", example = "77.5946")
      @RequestParam(required = false) Double lng
  ) {
    return homeDiscoveryService.getHome(city, lat, lng);
  }

  @GetMapping("/recommendations")
  @Operation(
      summary = "Get personalized or rules-based recommendations",
      description = "Returns recommended listings with scoring and pagination metadata"
  )
  public RecommendationResponse getRecommendations(
      @Parameter(description = "User id for personalization", example = "user_1a2b3c4d")
      @RequestParam(required = false) String userId,
      @Parameter(description = "Selected city", example = "Bengaluru")
      @RequestParam(required = false) String city,
      @Parameter(description = "Latitude for geo-aware discovery", example = "12.9716")
      @RequestParam(required = false) Double lat,
      @Parameter(description = "Longitude for geo-aware discovery", example = "77.5946")
      @RequestParam(required = false) Double lng,
      @Parameter(description = "Page number", example = "0")
      @RequestParam(defaultValue = "0") int page,
      @Parameter(description = "Page size", example = "10")
      @RequestParam(defaultValue = "10") int pageSize
  ) {
    return homeDiscoveryService.getRecommendations(userId, city, lat, lng, page, pageSize);
  }

  @GetMapping("/listings/trending")
  @Operation(
      summary = "Get trending listings",
      description = "Returns paginated trending listings for a discovery context"
  )
  public ListingCollectionResponse getTrendingListings(
      @Parameter(description = "Selected city", example = "Bengaluru")
      @RequestParam(required = false) String city,
      @Parameter(description = "Latitude for geo-aware discovery", example = "12.9716")
      @RequestParam(required = false) Double lat,
      @Parameter(description = "Longitude for geo-aware discovery", example = "77.5946")
      @RequestParam(required = false) Double lng,
      @Parameter(description = "Page number", example = "0")
      @RequestParam(defaultValue = "0") int page,
      @Parameter(description = "Page size", example = "10")
      @RequestParam(defaultValue = "10") int pageSize
  ) {
    return homeDiscoveryService.getTrendingListings(city, lat, lng, page, pageSize);
  }

  @GetMapping("/listings/new")
  @Operation(
      summary = "Get newly added listings",
      description = "Returns paginated newly added listings"
  )
  public ListingCollectionResponse getNewListings(
      @Parameter(description = "Selected city", example = "Bengaluru")
      @RequestParam(required = false) String city,
      @Parameter(description = "Page number", example = "0")
      @RequestParam(defaultValue = "0") int page,
      @Parameter(description = "Page size", example = "10")
      @RequestParam(defaultValue = "10") int pageSize
  ) {
    return homeDiscoveryService.getNewListings(city, page, pageSize);
  }
}
