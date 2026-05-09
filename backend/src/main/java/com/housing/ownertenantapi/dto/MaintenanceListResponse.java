package com.housing.ownertenantapi.dto;

import java.util.List;

public record MaintenanceListResponse(
    List<MaintenanceRequestItem> items,
    long totalCount,
    int page,
    int pageSize
) {
}
