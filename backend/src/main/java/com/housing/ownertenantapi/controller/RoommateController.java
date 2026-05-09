package com.housing.ownertenantapi.controller;

import com.housing.ownertenantapi.dto.RoommateMatchesResponse;
import com.housing.ownertenantapi.dto.RoommateProfile;
import com.housing.ownertenantapi.dto.RoommateProfileRequest;
import com.housing.ownertenantapi.service.RoommateService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import org.springframework.http.HttpHeaders;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestHeader;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/v1/roommates")
@Tag(name = "Roommates", description = "Roommate profile + match search")
public class RoommateController {

  private final RoommateService roommateService;

  public RoommateController(RoommateService roommateService) {
    this.roommateService = roommateService;
  }

  @GetMapping("/profile/me")
  @Operation(summary = "Get my roommate profile")
  public RoommateProfile myProfile(
      @RequestHeader(value = HttpHeaders.AUTHORIZATION, required = false) String authorizationHeader
  ) {
    return roommateService.getMyProfile(authorizationHeader);
  }

  @PutMapping("/profile/me")
  @Operation(summary = "Create or update my roommate profile")
  public RoommateProfile upsertProfile(
      @RequestHeader(value = HttpHeaders.AUTHORIZATION, required = false) String authorizationHeader,
      @Valid @RequestBody RoommateProfileRequest request
  ) {
    return roommateService.upsertProfile(authorizationHeader, request);
  }

  @GetMapping("/matches")
  @Operation(summary = "Find compatible roommates in my city, sorted by match score")
  public RoommateMatchesResponse matches(
      @RequestHeader(value = HttpHeaders.AUTHORIZATION, required = false) String authorizationHeader,
      @RequestParam(defaultValue = "20") int limit
  ) {
    return roommateService.findMatches(authorizationHeader, limit);
  }
}
