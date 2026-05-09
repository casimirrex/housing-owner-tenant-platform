package com.housing.ownertenantapi.dto;

import java.util.List;

public record AdminReportsResponse(
    List<AdminReportItem> items,
    long totalCount,
    int page,
    int pageSize
) {
}
