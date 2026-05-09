package com.housing.ownertenantapi.dto;

import io.swagger.v3.oas.annotations.media.Schema;
import java.util.List;

@Schema(description = "Paginated listings for admin moderation queue")
public record AdminListingsResponse(
    List<AdminListingItem> items,
    long totalCount,
    int page,
    int pageSize
) {
}
