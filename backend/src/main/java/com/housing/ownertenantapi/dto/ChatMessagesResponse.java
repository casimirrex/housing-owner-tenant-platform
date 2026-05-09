package com.housing.ownertenantapi.dto;

import io.swagger.v3.oas.annotations.media.Schema;
import java.util.List;

@Schema(description = "Messages in a chat thread, oldest first")
public record ChatMessagesResponse(
    @Schema(description = "Messages")
    List<Message> messages
) {
  @Schema(description = "Single chat message")
  public record Message(
      @Schema(description = "Message id", example = "msg_abc123")
      String messageId,

      @Schema(description = "Sender user id", example = "user_xyz")
      String senderId,

      @Schema(description = "Sender display name", example = "Aarav Kumar")
      String senderName,

      @Schema(description = "Whether the signed-in user is the sender", example = "true")
      boolean fromMe,

      @Schema(description = "Plain-text body", example = "Hi, is this still available?")
      String content,

      @Schema(description = "ISO timestamp", example = "2026-05-08T15:00:00Z")
      String sentAt,

      @Schema(description = "Has the recipient read this message", example = "true")
      boolean read,

      @Schema(description = "Optional image attachment URL", example = "/uploads/chat/abc.jpg",
          nullable = true)
      String imageUrl
  ) {}
}
