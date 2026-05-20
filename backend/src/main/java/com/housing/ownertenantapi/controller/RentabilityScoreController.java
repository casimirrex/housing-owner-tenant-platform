package com.housing.ownertenantapi.controller;

import com.housing.ownertenantapi.dto.RentabilityScoreResponse;
import com.housing.ownertenantapi.service.CurrentSessionService;
import com.housing.ownertenantapi.service.CurrentSessionService.SessionIdentity;
import com.housing.ownertenantapi.service.RentabilityScoreService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestHeader;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.server.ResponseStatusException;

/**
 * Tenant Rentability Score endpoints. Visibility rules:
 *   - Tenant can read OWN score
 *   - Admin can read any user's score and force a recompute
 */
@RestController
@RequestMapping("/api/v1/rentability-scores")
@Tag(name = "Rentability score", description = "Tenant trust signal — 0-100")
public class RentabilityScoreController {

  private final RentabilityScoreService scoreService;
  private final CurrentSessionService currentSession;

  public RentabilityScoreController(
      RentabilityScoreService scoreService,
      CurrentSessionService currentSession
  ) {
    this.scoreService = scoreService;
    this.currentSession = currentSession;
  }

  @GetMapping("/{userId}")
  @Operation(summary = "Read a user's rentability score")
  public ResponseEntity<RentabilityScoreResponse> getScore(
      @RequestHeader(value = HttpHeaders.AUTHORIZATION, required = false) String authHeader,
      @PathVariable String userId
  ) {
    SessionIdentity me = currentSession.requireSession(authHeader,
        "Sign in to view rentability scores.");
    boolean isSelf = me.userId().equals(userId);
    boolean isAdmin = "ADMIN".equalsIgnoreCase(me.role());
    if (!isSelf && !isAdmin) {
      throw new ResponseStatusException(HttpStatus.FORBIDDEN,
          "You can only view your own rentability score.");
    }
    return ResponseEntity.ok(scoreService.getScore(userId));
  }

  @PostMapping("/{userId}/recompute")
  @Operation(summary = "Force a recompute of the user's score (admin only)")
  public ResponseEntity<RentabilityScoreResponse> recompute(
      @RequestHeader(value = HttpHeaders.AUTHORIZATION, required = false) String authHeader,
      @PathVariable String userId
  ) {
    currentSession.requireRole(authHeader, "ADMIN",
        "Sign in as an admin.",
        "Only admins may force a score recompute.");
    return ResponseEntity.ok(scoreService.recomputeAndPersist(userId));
  }
}
