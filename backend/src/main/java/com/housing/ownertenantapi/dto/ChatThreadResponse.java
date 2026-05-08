package com.housing.ownertenantapi.dto;

import io.swagger.v3.oas.annotations.media.Schema;

@Schema(description = "A single chat thread row in the user's inbox")
public record ChatThreadResponse(
    @Schema(description = "Thread id", example = "th_abc123")
    String threadId,

    @Schema(description = "Listing the conversation is about", example = "owner_listing_2007")
    String listingId,

    @Schema(description = "Listing title", example = "Bright 2BHK in Indiranagar")
    String listingTitle,

    @Schema(description = "Listing locality", example = "Indiranagar")
    String listingLocality,

    @Schema(description = "Listing city", example = "Bengaluru")
    String listingCity,

    @Schema(description = "Other party's user id (the one you're talking to)", example = "user_xyz")
    String counterpartyId,

    @Schema(description = "Other party's display name", example = "Aarav Kumar")
    String counterpartyName,

    @Schema(description = "Your role in this thread", example = "TENANT",
        allowableValues = {"TENANT", "OWNER"})
    String myRole,

    @Schema(description = "Last message text (truncated)", example = "Yes, available from Jun 1")
    String lastMessagePreview,

    @Schema(description = "ISO timestamp of last message", example = "2026-05-08T15:00:00Z")
    String lastMessageAt,

    @Schema(description = "Number of messages I haven't read yet", example = "2")
    long unreadCount
) {}
