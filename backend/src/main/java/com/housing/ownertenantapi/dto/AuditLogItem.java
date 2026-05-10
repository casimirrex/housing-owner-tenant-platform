package com.housing.ownertenantapi.dto;

import io.swagger.v3.oas.annotations.media.Schema;

@Schema(description = "Single audit-log row")
public record AuditLogItem(
    String auditId,
    String actorUserId,
    String actorName,
    String actorRole,
    String action,
    String entityType,
    String entityId,
    String payload,
    String createdAt
) {
}
