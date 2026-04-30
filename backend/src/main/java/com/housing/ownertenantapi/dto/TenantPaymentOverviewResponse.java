package com.housing.ownertenantapi.dto;

import io.swagger.v3.oas.annotations.media.Schema;
import java.util.List;

@Schema(description = "Tenant-facing payment summary")
public record TenantPaymentOverviewResponse(
    @Schema(description = "How many payment items are still payable", example = "2")
    int pendingCount,
    @Schema(description = "Total payable amount", example = "37000")
    int pendingAmount,
    @Schema(description = "Amount already collected historically", example = "125000")
    int capturedAmount,
    @Schema(description = "Upcoming dues in the current journey")
    List<TenantPaymentItemResponse> upcomingDues
) {
}
