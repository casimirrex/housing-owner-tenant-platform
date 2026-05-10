package com.housing.ownertenantapi.dto;

import io.swagger.v3.oas.annotations.media.Schema;
import java.util.List;

@Schema(description = "Aggregated notification feed for the current user")
public record NotificationsResponse(
    List<NotificationItem> items,
    @Schema(example = "12") int totalCount,
    @Schema(example = "3") int unreadCount
) {
}
