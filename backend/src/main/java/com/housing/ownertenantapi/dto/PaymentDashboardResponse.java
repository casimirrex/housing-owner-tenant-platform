package com.housing.ownertenantapi.dto;

import io.swagger.v3.oas.annotations.media.Schema;
import java.util.List;

@Schema(description = "Role-aware payments dashboard payload")
public record PaymentDashboardResponse(
    @Schema(description = "Current actor id", example = "user_1a2b3c4d")
    String userId,
    @Schema(description = "Current actor role", example = "TENANT")
    String role,
    @Schema(description = "Current actor name", example = "Aarav Kumar")
    String actorName,
    @Schema(description = "Gateway summary")
    PaymentGatewaySummaryResponse gateway,
    @Schema(description = "Tenant overview when the signed-in user is a tenant")
    TenantPaymentOverviewResponse tenantOverview,
    @Schema(description = "Owner overview when the signed-in user is an owner")
    OwnerPaymentOverviewResponse ownerOverview,
    @Schema(description = "Recent payment history")
    List<PaymentHistoryItemResponse> history
) {
}
