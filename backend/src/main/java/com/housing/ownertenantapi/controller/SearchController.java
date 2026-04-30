package com.housing.ownertenantapi.controller;

import com.housing.ownertenantapi.dto.FilterMetadataResponse;
import com.housing.ownertenantapi.dto.LocationAutocompleteResponse;
import com.housing.ownertenantapi.dto.NearbyResponse;
import com.housing.ownertenantapi.dto.SearchMapRequest;
import com.housing.ownertenantapi.dto.SearchMapResponse;
import com.housing.ownertenantapi.dto.SearchResponse;
import com.housing.ownertenantapi.service.SearchService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.Parameter;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/v1")
@Tag(
    name = "Search",
    description = "Search, map, filter metadata, and location helper APIs"
)
public class SearchController {

  private final SearchService searchService;

  public SearchController(SearchService searchService) {
    this.searchService = searchService;
  }

  @GetMapping("/search")
  @Operation(
      summary = "Standard listing search",
      description = "Searches listings using query text and standard filters"
  )
  public SearchResponse search(
      @RequestParam(required = false) String query,
      @RequestParam(required = false) String city,
      @RequestParam(required = false) Integer budgetMin,
      @RequestParam(required = false) Integer budgetMax,
      @RequestParam(required = false) String bhk,
      @RequestParam(required = false) String furnishing,
      @RequestParam(required = false) String tenantType,
      @RequestParam(required = false) Boolean petFriendly,
      @RequestParam(required = false) Boolean verified,
      @RequestParam(defaultValue = "0") int page,
      @RequestParam(defaultValue = "10") int pageSize,
      @RequestParam(defaultValue = "relevance") String sortBy
  ) {
    return searchService.search(
        query, city, budgetMin, budgetMax, bhk, furnishing, tenantType, petFriendly,
        verified, page, pageSize, sortBy
    );
  }

  @PostMapping("/search/map")
  @Operation(
      summary = "Map-based search with viewport",
      description = "Searches listings inside a supplied map viewport with optional filters"
  )
  public SearchMapResponse searchMap(@Valid @RequestBody SearchMapRequest request) {
    return searchService.searchMap(request);
  }

  @GetMapping("/filters/metadata")
  @Operation(
      summary = "Get filter values and configuration",
      description = "Returns search filter values used by the listing results UI"
  )
  public FilterMetadataResponse getFilterMetadata(
      @Parameter(description = "Selected city", example = "Bengaluru")
      @RequestParam(required = false) String city
  ) {
    return searchService.getFilterMetadata(city);
  }

  @GetMapping("/locations/autocomplete")
  @Operation(
      summary = "Get area, landmark, or office suggestions",
      description = "Returns location suggestions for search autocomplete"
  )
  public LocationAutocompleteResponse autocompleteLocations(
      @Parameter(description = "Search text", example = "Indi")
      @RequestParam String q,
      @Parameter(description = "Selected city", example = "Bengaluru")
      @RequestParam(required = false) String city,
      @Parameter(description = "Latitude for context ranking", example = "12.9716")
      @RequestParam(required = false) Double lat,
      @Parameter(description = "Longitude for context ranking", example = "77.5946")
      @RequestParam(required = false) Double lng
  ) {
    return searchService.autocomplete(q, city, lat, lng);
  }

  @GetMapping("/locations/nearby")
  @Operation(
      summary = "Get near-me search seed listings",
      description = "Returns listings near a center point and radius"
  )
  public NearbyResponse getNearby(
      @Parameter(description = "Latitude", example = "12.9716")
      @RequestParam(required = false) Double lat,
      @Parameter(description = "Longitude", example = "77.5946")
      @RequestParam(required = false) Double lng,
      @Parameter(description = "Radius in kilometers", example = "5")
      @RequestParam(required = false) Double radiusKm
  ) {
    return searchService.getNearby(lat, lng, radiusKm);
  }
}
