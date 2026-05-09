package com.housing.ownertenantapi.dto;

import io.swagger.v3.oas.annotations.media.Schema;
import jakarta.validation.constraints.Size;

/**
 * Send a message in a chat thread. Either content or imageUrl must be set;
 * the service rejects payloads where both are missing.
 */
@Schema(description = "Send a message in a chat thread")
public record ChatMessageRequest(
    @Size(min = 1, max = 1000, message = "Message must be between 1 and 1000 characters")
    @Schema(description = "Plain-text message body", example = "Hi, is this still available?",
        nullable = true)
    String content,

    @Size(max = 1024)
    @Schema(description = "Optional image attachment URL", example = "/uploads/chat/abc.jpg",
        nullable = true)
    String imageUrl
) {}
