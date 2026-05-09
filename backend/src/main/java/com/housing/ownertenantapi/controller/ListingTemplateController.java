package com.housing.ownertenantapi.controller;

import com.housing.ownertenantapi.dto.ListingTemplateCreate;
import com.housing.ownertenantapi.dto.ListingTemplateItem;
import com.housing.ownertenantapi.dto.ListingTemplateListResponse;
import com.housing.ownertenantapi.service.ListingTemplateService;
import io.swagger.v3.oas.annotations.Operation;
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
@RequestMapping("/api/v1/owners/listing-templates")
@Tag(name = "Listing Templates", description = "Owner-saved listing drafts for re-use")
public class ListingTemplateController {

  private final ListingTemplateService templateService;

  public ListingTemplateController(ListingTemplateService templateService) {
    this.templateService = templateService;
  }

  @GetMapping
  @Operation(summary = "List my listing templates")
  public ListingTemplateListResponse list(
      @RequestHeader(value = HttpHeaders.AUTHORIZATION, required = false) String authorizationHeader
  ) {
    return templateService.list(authorizationHeader);
  }

  @PostMapping
  @Operation(summary = "Save a listing draft as a template")
  public ListingTemplateItem create(
      @RequestHeader(value = HttpHeaders.AUTHORIZATION, required = false) String authorizationHeader,
      @Valid @RequestBody ListingTemplateCreate request
  ) {
    return templateService.create(authorizationHeader, request);
  }

  @DeleteMapping("/{templateId}")
  @Operation(summary = "Delete one of my templates")
  public ResponseEntity<Void> delete(
      @RequestHeader(value = HttpHeaders.AUTHORIZATION, required = false) String authorizationHeader,
      @PathVariable String templateId
  ) {
    templateService.delete(authorizationHeader, templateId);
    return ResponseEntity.noContent().build();
  }
}
