package com.housing.ownertenantapi.dto;

import io.swagger.v3.oas.annotations.media.Schema;
import java.util.List;

@Schema(description = "Paginated list of users for admin")
public record AdminUsersResponse(
    List<AdminUserItem> items,
    @Schema(example = "1532") long totalCount,
    @Schema(example = "0")    int page,
    @Schema(example = "20")   int pageSize
) {
}
