package com.housing.ownertenantapi.dto;

public record AdminRefundResponse(
    String refundId,
    String userId,
    int amountRupees,
    String reason,
    long newWalletBalanceRupees,
    String createdAt
) {
}
