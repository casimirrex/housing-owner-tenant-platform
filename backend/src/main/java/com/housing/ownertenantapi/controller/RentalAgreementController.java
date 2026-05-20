package com.housing.ownertenantapi.controller;

import com.housing.ownertenantapi.dto.RentalAgreementCreateRequest;
import com.housing.ownertenantapi.dto.RentalAgreementResponse;
import com.housing.ownertenantapi.dto.RentalAgreementSummary;
import com.housing.ownertenantapi.service.CurrentSessionService;
import com.housing.ownertenantapi.service.CurrentSessionService.SessionIdentity;
import com.housing.ownertenantapi.service.RentalAgreementService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import java.util.List;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestHeader;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.server.ResponseStatusException;

@RestController
@RequestMapping("/api/v1/rental-agreements")
@Tag(name = "Rental agreement", description = "Digital lease lifecycle")
public class RentalAgreementController {

  private final RentalAgreementService service;
  private final CurrentSessionService currentSession;

  public RentalAgreementController(
      RentalAgreementService service,
      CurrentSessionService currentSession
  ) {
    this.service = service;
    this.currentSession = currentSession;
  }

  @PostMapping
  @Operation(summary = "Create a draft rental agreement (owner only)")
  public ResponseEntity<RentalAgreementResponse> create(
      @RequestHeader(value = HttpHeaders.AUTHORIZATION, required = false) String authHeader,
      @Valid @RequestBody RentalAgreementCreateRequest req
  ) {
    SessionIdentity me = currentSession.requireSession(authHeader, "Sign in.");
    String role = me.role();
    if (!"OWNER".equalsIgnoreCase(role) && !"ADMIN".equalsIgnoreCase(role)) {
      throw new ResponseStatusException(HttpStatus.FORBIDDEN,
          "Only owners can draft rental agreements.");
    }
    return ResponseEntity.status(HttpStatus.CREATED).body(service.create(me.userId(), req));
  }

  @GetMapping("/{agreementId}")
  @Operation(summary = "Read a single agreement")
  public ResponseEntity<RentalAgreementResponse> get(
      @RequestHeader(value = HttpHeaders.AUTHORIZATION, required = false) String authHeader,
      @PathVariable String agreementId
  ) {
    SessionIdentity me = currentSession.requireSession(authHeader, "Sign in.");
    return ResponseEntity.ok(service.loadById(agreementId, me.userId()));
  }

  @GetMapping
  @Operation(summary = "List my rental agreements (auto-filtered by role)")
  public ResponseEntity<List<RentalAgreementSummary>> mine(
      @RequestHeader(value = HttpHeaders.AUTHORIZATION, required = false) String authHeader,
      @RequestParam(required = false, defaultValue = "TENANT") String role
  ) {
    SessionIdentity me = currentSession.requireSession(authHeader, "Sign in.");
    String normalised = "OWNER".equalsIgnoreCase(role) ? "OWNER" : "TENANT";
    return ResponseEntity.ok(service.listForUser(me.userId(), normalised));
  }

  @PostMapping("/{agreementId}/send")
  @Operation(summary = "Send draft for signatures (owner action)")
  public ResponseEntity<RentalAgreementResponse> send(
      @RequestHeader(value = HttpHeaders.AUTHORIZATION, required = false) String authHeader,
      @PathVariable String agreementId
  ) {
    SessionIdentity me = currentSession.requireSession(authHeader, "Sign in.");
    return ResponseEntity.ok(service.send(agreementId, me.userId()));
  }

  @PostMapping("/{agreementId}/accept")
  @Operation(summary = "Accept the agreement (owner or tenant)")
  public ResponseEntity<RentalAgreementResponse> accept(
      @RequestHeader(value = HttpHeaders.AUTHORIZATION, required = false) String authHeader,
      @PathVariable String agreementId
  ) {
    SessionIdentity me = currentSession.requireSession(authHeader, "Sign in.");
    return ResponseEntity.ok(service.accept(agreementId, me.userId()));
  }

  @PostMapping("/{agreementId}/terminate")
  @Operation(summary = "Terminate an active agreement")
  public ResponseEntity<RentalAgreementResponse> terminate(
      @RequestHeader(value = HttpHeaders.AUTHORIZATION, required = false) String authHeader,
      @PathVariable String agreementId
  ) {
    SessionIdentity me = currentSession.requireSession(authHeader, "Sign in.");
    return ResponseEntity.ok(service.terminate(agreementId, me.userId()));
  }
}
