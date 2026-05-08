package com.housing.ownertenantapi.dto;

import io.swagger.v3.oas.annotations.media.Schema;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

@Schema(description = "Send a message in a chat thread")
public record ChatMessageRequest(
    @NotBlank
    @Size(min = 1, max = 1000, message = "Message must be between 1 and 1000 characters")
    @Schema(description = "Plain-text message body", example = "Hi, is this still available?")
    String content
) {}
