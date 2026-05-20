package com.housing.ownertenantapi.controller;

import com.housing.ownertenantapi.dto.NotificationsResponse;
import com.housing.ownertenantapi.service.NotificationsService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import org.springframework.http.HttpHeaders;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestHeader;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/v1/notifications")
@Tag(name = "Notifications", description = "Aggregated alerts, leads, visits, maintenance updates")
public class NotificationsController {

  private final NotificationsService notificationsService;

  public NotificationsController(NotificationsService notificationsService) {
    this.notificationsService = notificationsService;
  }

  @GetMapping
  @Operation(summary = "Unified feed of notifications for the current user")
  public NotificationsResponse list(
      @RequestHeader(value = HttpHeaders.AUTHORIZATION, required = false) String authorizationHeader
  ) {
    return notificationsService.get(authorizationHeader);
  }
}
