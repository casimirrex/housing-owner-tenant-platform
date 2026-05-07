package com.housing.ownertenantapi.dto;

import io.swagger.v3.oas.annotations.media.Schema;

@Schema(description = "Result of an image upload — frontend stores the URL in the listing's photos array")
public record FileUploadResponse(
    @Schema(description = "Public URL the uploaded image is served from",
        example = "/uploads/8a3f2c1d.jpg")
    String url,

    @Schema(description = "Original filename the user picked", example = "front.jpg")
    String originalFilename,

    @Schema(description = "Stored filesystem filename (UUID-based)", example = "8a3f2c1d.jpg")
    String storedFilename,

    @Schema(description = "File size in bytes", example = "184320")
    long sizeBytes
) {}
