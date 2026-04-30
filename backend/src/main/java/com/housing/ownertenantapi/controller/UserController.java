package com.housing.ownertenantapi.controller;

import com.housing.ownertenantapi.dto.UserPreferenceProfileResponse;
import com.housing.ownertenantapi.dto.UserPreferenceUpdateRequest;
import com.housing.ownertenantapi.dto.UserPreferenceUpdateResponse;
import com.housing.ownertenantapi.dto.UserPhotoUploadRequest;
import com.housing.ownertenantapi.dto.UserPhotoUploadResponse;
import com.housing.ownertenantapi.dto.UserAccountDeactivationResponse;
import com.housing.ownertenantapi.dto.UserPasswordUpdateRequest;
import com.housing.ownertenantapi.dto.UserPasswordUpdateResponse;
import com.housing.ownertenantapi.dto.UserProfileResponse;
import com.housing.ownertenantapi.dto.UserProfileUpdateRequest;
import com.housing.ownertenantapi.dto.UserProfileUpdateResponse;
import com.housing.ownertenantapi.dto.UserVerificationStatusResponse;
import com.housing.ownertenantapi.service.UserProfileService;
import org.springframework.web.bind.annotation.DeleteMapping;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestHeader;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/v1/users")
@Tag(
    name = "Users",
    description = "User profile and preference APIs for the logged-in tenant"
)
public class UserController {

  private final UserProfileService userProfileService;

  public UserController(UserProfileService userProfileService) {
    this.userProfileService = userProfileService;
  }

  @GetMapping("/me")
  @Operation(
      summary = "Get logged-in user profile",
      description = "Returns the logged-in user profile summary"
  )
  public UserProfileResponse getCurrentUser(
      @RequestHeader(name = "Authorization", required = false) String authorizationHeader
  ) {
    return userProfileService.getCurrentUser(authorizationHeader);
  }

  @PutMapping("/me")
  @Operation(
      summary = "Update profile",
      description = "Updates the logged-in user profile details"
  )
  public UserProfileUpdateResponse updateCurrentUser(
      @RequestHeader(name = "Authorization", required = false) String authorizationHeader,
      @Valid @RequestBody UserProfileUpdateRequest request
  ) {
    return userProfileService.updateCurrentUser(authorizationHeader, request);
  }

  @GetMapping("/me/preferences")
  @Operation(
      summary = "Get search and recommendation preferences",
      description = "Returns saved search, commute, lifestyle, and tenant preferences"
  )
  public UserPreferenceProfileResponse getPreferences(
      @RequestHeader(name = "Authorization", required = false) String authorizationHeader
  ) {
    return userProfileService.getPreferences(authorizationHeader);
  }

  @PutMapping("/me/preferences")
  @Operation(
      summary = "Save preferences",
      description = "Updates the search and recommendation preference profile"
  )
  public UserPreferenceUpdateResponse updatePreferences(
      @RequestHeader(name = "Authorization", required = false) String authorizationHeader,
      @Valid @RequestBody UserPreferenceUpdateRequest request
  ) {
    return userProfileService.updatePreferences(authorizationHeader, request);
  }

  @GetMapping("/me/verification-status")
  @Operation(
      summary = "Check verification state",
      description = "Returns verification, KYC readiness, and profile image completion state"
  )
  public UserVerificationStatusResponse getVerificationStatus(
      @RequestHeader(name = "Authorization", required = false) String authorizationHeader
  ) {
    return userProfileService.getVerificationStatus(authorizationHeader);
  }

  @PostMapping("/me/photo")
  @Operation(
      summary = "Upload profile image",
      description = "Stores or updates the logged-in user profile image reference"
  )
  public UserPhotoUploadResponse uploadPhoto(
      @RequestHeader(name = "Authorization", required = false) String authorizationHeader,
      @Valid @RequestBody UserPhotoUploadRequest request
  ) {
    return userProfileService.uploadPhoto(authorizationHeader, request);
  }

  @PutMapping("/me/password")
  @Operation(
      summary = "Set or update app password",
      description = "Stores a password for the logged-in user so they can later sign in with email or phone and password"
  )
  public UserPasswordUpdateResponse updatePassword(
      @RequestHeader(name = "Authorization", required = false) String authorizationHeader,
      @Valid @RequestBody UserPasswordUpdateRequest request
  ) {
    return userProfileService.updatePassword(authorizationHeader, request);
  }

  @DeleteMapping("/me")
  @Operation(
      summary = "Deactivate or delete account",
      description = "Deactivates the logged-in user account and marks the profile inactive"
  )
  public UserAccountDeactivationResponse deactivateCurrentUser(
      @RequestHeader(name = "Authorization", required = false) String authorizationHeader
  ) {
    return userProfileService.deactivateCurrentUser(authorizationHeader);
  }
}
