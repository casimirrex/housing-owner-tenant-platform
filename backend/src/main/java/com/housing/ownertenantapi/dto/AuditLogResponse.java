package com.housing.ownertenantapi.dto;

import java.util.List;

public record AuditLogResponse(
    List<AuditLogItem> items,
    long totalCount,
    int page,
    int pageSize
) {
}
