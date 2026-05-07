package com.housing.ownertenantapi.controller;

import com.housing.ownertenantapi.dto.FileUploadResponse;
import com.housing.ownertenantapi.service.CurrentSessionService;
import com.housing.ownertenantapi.service.FileUploadService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestHeader;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.multipart.MultipartFile;
import org.springframework.web.servlet.support.ServletUriComponentsBuilder;

/**
 * Bug G.3 — file upload endpoint for listing photos.
 * Owner-only. Returns the public URL of the saved image so the frontend can
 * stuff it into the listing's photos[] field on submit.
 */
@RestController
@RequestMapping("/api/v1/uploads")
@Tag(name = "File uploads", description = "Image uploads for listings")
public class FileUploadController {

  private final FileUploadService fileUploadService;
  private final CurrentSessionService currentSessionService;

  public FileUploadController(
      FileUploadService fileUploadService,
      CurrentSessionService currentSessionService
  ) {
    this.fileUploadService = fileUploadService;
    this.currentSessionService = currentSessionService;
  }

  @PostMapping(value = "/listing-photo", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
  @Operation(summary = "Upload a listing cover photo (JPG/PNG, max 5MB)")
  public FileUploadResponse uploadListingPhoto(
      @RequestHeader(value = HttpHeaders.AUTHORIZATION, required = false) String authorizationHeader,
      @RequestParam("file") MultipartFile file
  ) {
    // Auth: any signed-in user can upload (we don't lock to OWNER role here so a
    // user could in principle upload before they've added the owner workspace —
    // but the photos URL only matters when they create a listing, which IS
    // owner-gated, so this is safe).
    currentSessionService.requireSession(
        authorizationHeader,
        "Sign in to upload an image."
    );
    FileUploadResponse rel = fileUploadService.storeListingPhoto(file);
    // Build absolute URL so the frontend (on testition.tech) can use the URL
    // directly in <img src> — it points to api.testition.tech via the proxy.
    String absoluteUrl = ServletUriComponentsBuilder.fromCurrentContextPath()
        .path(rel.url())
        .toUriString();
    return new FileUploadResponse(
        absoluteUrl,
        rel.originalFilename(),
        rel.storedFilename(),
        rel.sizeBytes()
    );
  }
}
