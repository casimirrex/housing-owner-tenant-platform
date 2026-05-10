package com.housing.ownertenantapi.service;

import com.housing.ownertenantapi.dto.AdminRefundRequest;
import com.housing.ownertenantapi.dto.AdminRefundResponse;
import java.util.UUID;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.dao.EmptyResultDataAccessException;
import org.springframework.http.HttpStatus;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

/**
 * Phase 1 — admin-issued wallet refunds.
 *
 * Adds rupees to a user's wallet, records a wallet_transactions row of
 * type REFUND so the user sees it in their history, and writes an
 * audit_log entry attributed to the admin who initiated it. Also stores
 * the refund row separately in wallet_refunds for accounting.
 *
 * Critical: this is a wallet credit only — it does NOT push money back
 * to the user's bank or card. That requires Razorpay's refund API which
 * needs LIVE keys. For now, refunds materialize as wallet balance the
 * user can spend on the platform.
 */
@Service
public class RefundService {

  private static final Logger log = LoggerFactory.getLogger(RefundService.class);

  private final JdbcTemplate jdbcTemplate;
  private final AuditLogService auditLogService;

  public RefundService(JdbcTemplate jdbcTemplate, AuditLogService auditLogService) {
    this.jdbcTemplate = jdbcTemplate;
    this.auditLogService = auditLogService;
  }

  @Transactional
  public AdminRefundResponse issueRefund(String adminUserId, AdminRefundRequest request) {
    String targetUserId = request.userId();
    long amountPaise = (long) request.amountRupees() * 100L;

    // Ensure the recipient exists and has a wallet account.
    String walletId;
    try {
      walletId = jdbcTemplate.queryForObject(
          "SELECT wallet_id FROM wallet_accounts WHERE user_id = ?",
          String.class, targetUserId
      );
    } catch (EmptyResultDataAccessException none) {
      // Auto-create wallet for the user if missing.
      walletId = "wallet_" + UUID.randomUUID().toString().replace("-", "").substring(0, 12);
      jdbcTemplate.update(
          "INSERT INTO wallet_accounts (wallet_id, user_id, balance) VALUES (?, ?, 0)",
          walletId, targetUserId
      );
    }

    // Credit the wallet.
    jdbcTemplate.update(
        "UPDATE wallet_accounts SET balance = balance + ?, updated_at = now() WHERE wallet_id = ?",
        amountPaise, walletId
    );

    // Insert a wallet_transactions REFUND row so the user sees it in history.
    String txnId = "wtxn_refund_" + UUID.randomUUID().toString().replace("-", "").substring(0, 12);
    jdbcTemplate.update("""
            INSERT INTO wallet_transactions (
              txn_id, wallet_id, user_id, txn_type, amount, currency, status,
              provider, description, created_at, completed_at
            )
            VALUES (?, ?, ?, 'REFUND', ?, 'INR', 'COMPLETED',
                    'ADMIN', ?, now(), now())
            """,
        txnId, walletId, targetUserId, amountPaise,
        "Refund: " + request.reason()
    );

    // Insert the audit-friendly refund row.
    String refundId = "rfd_" + UUID.randomUUID().toString().replace("-", "").substring(0, 12);
    jdbcTemplate.update("""
            INSERT INTO wallet_refunds (
              refund_id, user_id, amount_paise, reason, reference_payment,
              initiated_by_admin, status
            )
            VALUES (?, ?, ?, ?, ?, ?, 'COMPLETED')
            """,
        refundId, targetUserId, amountPaise, request.reason(),
        request.referencePayment(), adminUserId
    );

    Long newBalancePaise = jdbcTemplate.queryForObject(
        "SELECT balance FROM wallet_accounts WHERE wallet_id = ?",
        Long.class, walletId
    );
    long newBalanceRupees = (newBalancePaise == null ? 0 : newBalancePaise) / 100L;

    auditLogService.record(adminUserId, "ADMIN", "WALLET_REFUND",
        "wallet", walletId,
        "user=" + targetUserId + " amount=" + request.amountRupees() +
            " reason=" + request.reason());

    log.info("admin refund: refund={} user={} amount=₹{} by admin={}",
        refundId, targetUserId, request.amountRupees(), adminUserId);

    String createdAt = jdbcTemplate.queryForObject(
        "SELECT to_char(created_at AT TIME ZONE 'UTC', 'YYYY-MM-DD\"T\"HH24:MI:SS\"Z\"') " +
            "FROM wallet_refunds WHERE refund_id = ?",
        String.class, refundId
    );

    return new AdminRefundResponse(
        refundId, targetUserId, request.amountRupees(), request.reason(),
        newBalanceRupees, createdAt
    );
  }

  public java.util.List<java.util.Map<String, Object>> listRefunds(int limit) {
    return jdbcTemplate.query(
        "SELECT r.refund_id, r.user_id, COALESCE(u.full_name,'') AS user_name, " +
            "r.amount_paise, r.reason, r.reference_payment, r.initiated_by_admin, " +
            "COALESCE(a.full_name,'') AS admin_name, " +
            "to_char(r.created_at AT TIME ZONE 'UTC', 'YYYY-MM-DD\"T\"HH24:MI:SS\"Z\"') AS created_at " +
            "FROM wallet_refunds r " +
            "LEFT JOIN users u ON u.user_id = r.user_id " +
            "LEFT JOIN users a ON a.user_id = r.initiated_by_admin " +
            "ORDER BY r.created_at DESC LIMIT ?",
        (rs, rowNum) -> {
          java.util.Map<String, Object> row = new java.util.LinkedHashMap<>();
          row.put("refundId", rs.getString("refund_id"));
          row.put("userId", rs.getString("user_id"));
          row.put("userName", rs.getString("user_name"));
          row.put("amountRupees", rs.getLong("amount_paise") / 100L);
          row.put("reason", rs.getString("reason"));
          row.put("referencePayment", rs.getString("reference_payment"));
          row.put("initiatedByAdmin", rs.getString("initiated_by_admin"));
          row.put("adminName", rs.getString("admin_name"));
          row.put("createdAt", rs.getString("created_at"));
          return row;
        },
        Math.min(Math.max(limit, 1), 200)
    );
  }
}
