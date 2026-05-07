package com.housing.ownertenantapi.controller;

import com.housing.ownertenantapi.dto.SavedSearchAlertsResponse;
import com.housing.ownertenantapi.dto.SavedSearchRequest;
import com.housing.ownertenantapi.dto.SavedSearchResponse;
import com.housing.ownertenantapi.service.CurrentSessionService;
import com.housing.ownertenantapi.service.SavedSearchService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import java.util.List;
import org.springframework.http.HttpHeaders;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestHeader;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

/** Tier 2 #4 — Saved Searches + Alerts (in-app). */
@RestController
@RequestMapping("/api/v1/saved-searches")
@Tag(name = "Saved Searches", description = "Save criteria + receive alerts when matching listings publish")
public class SavedSearchController {

  private final SavedSearchService savedSearchService;
  private final CurrentSessionService currentSessionService;

  public SavedSearchController(
      SavedSearchService savedSearchService,
      CurrentSessionService currentSessionService
  ) {
    this.savedSearchService = savedSearchService;
    this.currentSessionService = currentSessionService;
  }

  @PostMapping
  @Operation(summary = "Save a search and start receiving alerts on new listings that match")
  public SavedSearchResponse create(
      @RequestHeader(value = HttpHeaders.AUTHORIZATION, required = false) String authorizationHeader,
      @Valid @RequestBody SavedSearchRequest request
  ) {
    var identity = currentSessionService.requireSession(authorizationHeader, "Sign in to save a search.");
    return savedSearchService.create(identity.userId(), request);
  }

  @GetMapping
  @Operation(summary = "List the signed-in user's saved searches")
  public List<SavedSearchResponse> list(
      @RequestHeader(value = HttpHeaders.AUTHORIZATION, required = false) String authorizationHeader
  ) {
    var identity = currentSessionService.requireSession(authorizationHeader, "Sign in to see saved searches.");
    return savedSearchService.listForUser(identity.userId());
  }

  @DeleteMapping("/{searchId}")
  @Operation(summary = "Delete a saved search (and its alerts)")
  public void delete(
      @RequestHeader(value = HttpHeaders.AUTHORIZATION, required = false) String authorizationHeader,
      @PathVariable String searchId
  ) {
    var identity = currentSessionService.requireSession(authorizationHeader, "Sign in to delete a saved search.");
    savedSearchService.delete(identity.userId(), searchId);
  }

  @GetMapping("/alerts")
  @Operation(summary = "List recent alerts for the signed-in user")
  public SavedSearchAlertsResponse listAlerts(
      @RequestHeader(value = HttpHeaders.AUTHORIZATION, required = false) String authorizationHeader
  ) {
    var identity = currentSessionService.requireSession(authorizationHeader, "Sign in to see alerts.");
    return savedSearchService.listAlerts(identity.userId());
  }

  @PatchMapping("/alerts/{alertId}/read")
  @Operation(summary = "Mark a single alert as read")
  public void markAlertRead(
      @RequestHeader(value = HttpHeaders.AUTHORIZATION, required = false) String authorizationHeader,
      @PathVariable String alertId
  ) {
    var identity = currentSessionService.requireSession(authorizationHeader, "Sign in to update alerts.");
    savedSearchService.markAlertRead(identity.userId(), alertId);
  }

  @PostMapping("/alerts/read-all")
  @Operation(summary = "Mark all NEW alerts as read")
  public void markAllRead(
      @RequestHeader(value = HttpHeaders.AUTHORIZATION, required = false) String authorizationHeader
  ) {
    var identity = currentSessionService.requireSession(authorizationHeader, "Sign in to update alerts.");
    savedSearchService.markAllRead(identity.userId());
  }
}
