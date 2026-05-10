package com.housing.ownertenantapi.dto;

import java.util.List;

public record LeaseListResponse(
    List<LeaseItem> items,
    int totalCount,
    int expiringSoonCount
) {
}
