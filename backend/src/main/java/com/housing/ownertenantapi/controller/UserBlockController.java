package com.housing.ownertenantapi.controller;

import com.housing.ownertenantapi.dto.UserBlockListResponse;
import com.housing.ownertenantapi.dto.UserBlockRequest;
import com.housing.ownertenantapi.dto.UserBlockResponse;
import com.housing.ownertenantapi.service.UserBlockService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.Parameter;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import org.springframework.http.HttpHeaders;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestHeader;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/v1/users/blocks")
@Tag(name = "User Blocks", description = "Trust & safety: block and unblock users")
public class UserBlockController {

  private final UserBlockService userBlockService;

  public UserBlockController(UserBlockService userBlockService) {
    this.userBlockService = userBlockService;
  }

  @GetMapping
  @Operation(summary = "List users blocked by the current user")
  public UserBlockListResponse list(
      @RequestHeader(value = HttpHeaders.AUTHORIZATION, required = false) String authorizationHeader
  ) {
    return userBlockService.list(authorizationHeader);
  }

  @PostMapping
  @Operation(summary = "Block a user")
  public UserBlockResponse block(
      @RequestHeader(value = HttpHeaders.AUTHORIZATION, required = false) String authorizationHeader,
      @Valid @RequestBody UserBlockRequest request
  ) {
    return userBlockService.block(authorizationHeader, request);
  }

  @DeleteMapping("/{blockedUserId}")
  @Operation(summary = "Unblock a user")
  public ResponseEntity<Void> unblock(
      @Parameter(description = "User id to unblock", example = "user_42")
      @PathVariable String blockedUserId,
      @RequestHeader(value = HttpHeaders.AUTHORIZATION, required = false) String authorizationHeader
  ) {
    userBlockService.unblock(authorizationHeader, blockedUserId);
    return ResponseEntity.noContent().build();
  }
}
