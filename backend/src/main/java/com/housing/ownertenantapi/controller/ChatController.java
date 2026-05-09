package com.housing.ownertenantapi.controller;

import com.housing.ownertenantapi.dto.ChatMessageRequest;
import com.housing.ownertenantapi.dto.ChatMessagesResponse;
import com.housing.ownertenantapi.dto.ChatStartRequest;
import com.housing.ownertenantapi.dto.ChatThreadResponse;
import com.housing.ownertenantapi.service.ChatService;
import com.housing.ownertenantapi.service.CurrentSessionService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import java.util.List;
import org.springframework.http.HttpHeaders;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestHeader;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

/** Tier 2 #6 — In-app Chat (polling-based). */
@RestController
@RequestMapping("/api/v1/chat")
@Tag(name = "In-app Chat", description = "Tenant ↔ owner messaging per listing (polling)")
public class ChatController {

  private final ChatService chatService;
  private final CurrentSessionService currentSessionService;

  public ChatController(ChatService chatService, CurrentSessionService currentSessionService) {
    this.chatService = chatService;
    this.currentSessionService = currentSessionService;
  }

  @PostMapping("/threads")
  @Operation(summary = "Open or reuse a chat thread (tenant only)")
  public ChatThreadResponse startThread(
      @RequestHeader(value = HttpHeaders.AUTHORIZATION, required = false) String authorizationHeader,
      @Valid @RequestBody ChatStartRequest request
  ) {
    var identity = currentSessionService.requireRole(
        authorizationHeader, "TENANT",
        "Sign in as a tenant to message owners.",
        "Only tenants can start a conversation."
    );
    return chatService.startThread(identity.userId(), request.listingId());
  }

  @GetMapping("/threads")
  @Operation(summary = "List my chat threads (works for both tenant and owner)")
  public List<ChatThreadResponse> listThreads(
      @RequestHeader(value = HttpHeaders.AUTHORIZATION, required = false) String authorizationHeader
  ) {
    var identity = currentSessionService.requireSession(
        authorizationHeader, "Sign in to view your messages."
    );
    return chatService.listThreads(identity.userId());
  }

  @GetMapping("/threads/{threadId}/messages")
  @Operation(summary = "Fetch all messages in a thread (frontend polls every ~5s)")
  public ChatMessagesResponse fetchMessages(
      @RequestHeader(value = HttpHeaders.AUTHORIZATION, required = false) String authorizationHeader,
      @PathVariable String threadId
  ) {
    var identity = currentSessionService.requireSession(
        authorizationHeader, "Sign in to view messages."
    );
    return chatService.fetchMessages(identity.userId(), threadId);
  }

  @PostMapping("/threads/{threadId}/messages")
  @Operation(summary = "Send a message in a thread")
  public ChatMessagesResponse.Message sendMessage(
      @RequestHeader(value = HttpHeaders.AUTHORIZATION, required = false) String authorizationHeader,
      @PathVariable String threadId,
      @Valid @RequestBody ChatMessageRequest request
  ) {
    var identity = currentSessionService.requireSession(
        authorizationHeader, "Sign in to send a message."
    );
    return chatService.sendMessage(identity.userId(), threadId, request.content(), request.imageUrl());
  }

  @PostMapping("/threads/{threadId}/read")
  @Operation(summary = "Mark all messages in this thread as read")
  public void markRead(
      @RequestHeader(value = HttpHeaders.AUTHORIZATION, required = false) String authorizationHeader,
      @PathVariable String threadId
  ) {
    var identity = currentSessionService.requireSession(
        authorizationHeader, "Sign in to update messages."
    );
    chatService.markThreadRead(identity.userId(), threadId);
  }
}
