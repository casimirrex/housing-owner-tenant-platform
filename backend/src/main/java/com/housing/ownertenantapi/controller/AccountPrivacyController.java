package com.housing.ownertenantapi.controller;

import com.housing.ownertenantapi.service.AccountPrivacyService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import java.util.Map;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestHeader;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

/**
 * Phase 1 — DPDP / GDPR endpoints.
 *
 *   POST  /api/v1/account/deletion          — request deletion (30-day grace)
 *   GET   /api/v1/account/deletion          — current request state
 *   DELETE /api/v1/account/deletion         — cancel a pending request
 *   GET   /api/v1/account/data-export       — download all my data as JSON
 */
@RestController
@RequestMapping("/api/v1/account")
@Tag(name = "Account Privacy", description = "DPDP / GDPR account-deletion + data-export endpoints")
public class AccountPrivacyController {

  private final AccountPrivacyService service;

  public AccountPrivacyController(AccountPrivacyService service) {
    this.service = service;
  }

  @PostMapping("/deletion")
  @Operation(summary = "Schedule deletion of my account (30-day grace window)")
  public Map<String, Object> requestDeletion(
      @RequestHeader(value = HttpHeaders.AUTHORIZATION, required = false) String authorizationHeader,
      @RequestBody(required = false) Map<String, String> body
  ) {
    String reason = body == null ? null : body.get("reason");
    return service.requestDeletion(authorizationHeader, reason);
  }

  @GetMapping("/deletion")
  @Operation(summary = "Status of my deletion request")
  public Map<String, Object> getDeletion(
      @RequestHeader(value = HttpHeaders.AUTHORIZATION, required = false) String authorizationHeader
  ) {
    return service.getDeletionStatus(authorizationHeader);
  }

  @DeleteMapping("/deletion")
  @Operation(summary = "Withdraw my pending deletion request")
  public ResponseEntity<Void> cancelDeletion(
      @RequestHeader(value = HttpHeaders.AUTHORIZATION, required = false) String authorizationHeader
  ) {
    service.cancelDeletion(authorizationHeader);
    return ResponseEntity.noContent().build();
  }

  @GetMapping(value = "/data-export", produces = MediaType.APPLICATION_JSON_VALUE)
  @Operation(summary = "Download every record we hold on me, as JSON")
  public ResponseEntity<Map<String, Object>> exportData(
      @RequestHeader(value = HttpHeaders.AUTHORIZATION, required = false) String authorizationHeader
  ) {
    Map<String, Object> data = service.exportData(authorizationHeader);
    return ResponseEntity.ok()
        .header(HttpHeaders.CONTENT_DISPOSITION,
            "attachment; filename=\"my-testition-data.json\"")
        .body(data);
  }
}
