package com.housing.ownertenantapi.service;

import com.housing.ownertenantapi.dto.OwnerVerificationResponse;
import java.time.OffsetDateTime;
import java.time.ZoneOffset;
import java.time.format.DateTimeFormatter;
import java.time.temporal.ChronoUnit;
import java.util.UUID;
import org.springframework.http.HttpStatus;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.jdbc.core.simple.JdbcClient;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

/**
 * Tier 1 #2 — Verified Owner Badge.
 *
 * One-time payment of Rs 199 from the owner's wallet sets a permanent
 * `verified_owner` flag on the users row + records an audit transaction.
 * After this, every listing the owner publishes shows a "✓ Verified Owner"
 * badge to tenants.
 *
 * Idempotent against double-clicks: if the owner is already verified we
 * short-circuit and return their current state without re-charging.
 */
@Service
public class OwnerVerificationService {

  /** One-time fee in rupees. Adjust here only. */
  public static final long VERIFICATION_PRICE_INR = 199L;

  private static final String CURRENCY = "INR";
  private static final String WALLET_TXN_OWNER_VERIFICATION = "OWNER_VERIFICATION";
  private static final String WALLET_PROVIDER_INTERNAL = "INTERNAL";
  private static final String STATUS_COMPLETED = "COMPLETED";
  private static final DateTimeFormatter ISO_FORMATTER = DateTimeFormatter.ISO_OFFSET_DATE_TIME;

  private final JdbcClient jdbcClient;

  public OwnerVerificationService(JdbcTemplate jdbcTemplate) {
    this.jdbcClient = JdbcClient.create(jdbcTemplate);
  }

  /** Read-only — what's the current verification state for this owner? */
  public OwnerVerificationResponse getStatus(String ownerId) {
    var row = jdbcClient.sql("""
            SELECT u.verified_owner, u.verified_owner_at,
                   COALESCE(w.balance, 0) AS balance
            FROM users u
            LEFT JOIN wallet_accounts w ON w.user_id = u.user_id
            WHERE u.user_id = :ownerId
            """)
        .param("ownerId", ownerId)
        .query((rs, rowNum) -> new OwnerVerificationStateRow(
            rs.getBoolean("verified_owner"),
            rs.getObject("verified_owner_at", OffsetDateTime.class),
            rs.getLong("balance")
        ))
        .optional()
        .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Owner not found."));

    return new OwnerVerificationResponse(
        row.verified(),
        row.verifiedAt() != null ? ISO_FORMATTER.format(row.verifiedAt()) : null,
        row.verified() ? VERIFICATION_PRICE_INR : 0L,
        CURRENCY,
        row.balance(),
        row.verified()
            ? "You are a Verified Owner. The badge appears on all your listings."
            : "Pay Rs " + VERIFICATION_PRICE_INR + " to become a Verified Owner — a permanent trust signal on your listings."
    );
  }

  /** Idempotent: double-click on Verify won't double-charge. */
  @Transactional
  public OwnerVerificationResponse verify(String ownerId) {
    OffsetDateTime now = OffsetDateTime.now(ZoneOffset.UTC).truncatedTo(ChronoUnit.SECONDS);

    // Short-circuit if already verified.
    var current = getStatus(ownerId);
    if (current.verified()) {
      return current;
    }

    // Wallet check + deduct.
    WalletInfo wallet = getOrCreateWallet(ownerId, now);
    if (wallet.balance() < VERIFICATION_PRICE_INR) {
      long shortfall = VERIFICATION_PRICE_INR - wallet.balance();
      throw new ResponseStatusException(
          HttpStatus.PAYMENT_REQUIRED,
          "Add Rs " + shortfall + " more to your wallet to get verified (Rs " + VERIFICATION_PRICE_INR + ")."
      );
    }
    long updatedBalance = deductWalletBalance(wallet.walletId(), VERIFICATION_PRICE_INR, now);

    String walletTxnId = "wtxn_" + UUID.randomUUID().toString().replace("-", "").substring(0, 16);
    jdbcClient.sql("""
            INSERT INTO wallet_transactions
              (txn_id, wallet_id, user_id, txn_type, amount, currency, status, provider,
               provider_order_id, provider_payment_id, client_secret, description, created_at, completed_at)
            VALUES
              (:txnId, :walletId, :userId, :txnType, :amount, :currency, :status, :provider,
               :orderId, :paymentId, NULL, :description, :createdAt, :completedAt)
            """)
        .param("txnId", walletTxnId)
        .param("walletId", wallet.walletId())
        .param("userId", ownerId)
        .param("txnType", WALLET_TXN_OWNER_VERIFICATION)
        .param("amount", VERIFICATION_PRICE_INR)
        .param("currency", CURRENCY)
        .param("status", STATUS_COMPLETED)
        .param("provider", WALLET_PROVIDER_INTERNAL)
        .param("orderId", ownerId)
        .param("paymentId", ownerId)
        .param("description", "Verified Owner badge (one-time)")
        .param("createdAt", now)
        .param("completedAt", now)
        .update();

    // Flip the flag.
    jdbcClient.sql("""
            UPDATE users
            SET verified_owner = TRUE,
                verified_owner_at = :now,
                updated_at = :now
            WHERE user_id = :ownerId
            """)
        .param("now", now)
        .param("ownerId", ownerId)
        .update();

    return new OwnerVerificationResponse(
        true,
        ISO_FORMATTER.format(now),
        VERIFICATION_PRICE_INR,
        CURRENCY,
        updatedBalance,
        "Congratulations — you are now a Verified Owner. The badge will appear on every listing you publish."
    );
  }

  /* ─── Wallet helpers (mirror of pattern from other services) ────────── */

  private WalletInfo getOrCreateWallet(String userId, OffsetDateTime now) {
    var existing = jdbcClient.sql("""
            SELECT wallet_id, balance FROM wallet_accounts WHERE user_id = :userId
            """)
        .param("userId", userId)
        .query((rs, rowNum) -> new WalletInfo(rs.getString("wallet_id"), rs.getLong("balance")))
        .optional();
    if (existing.isPresent()) return existing.get();

    String walletId = "wallet_" + UUID.randomUUID().toString().replace("-", "").substring(0, 16);
    jdbcClient.sql("""
            INSERT INTO wallet_accounts (wallet_id, user_id, balance, currency, created_at, updated_at)
            VALUES (:walletId, :userId, 0, :currency, :now, :now)
            ON CONFLICT (user_id) DO UPDATE SET currency = wallet_accounts.currency
            """)
        .param("walletId", walletId)
        .param("userId", userId)
        .param("currency", CURRENCY)
        .param("now", now)
        .update();

    return jdbcClient.sql("""
            SELECT wallet_id, balance FROM wallet_accounts WHERE user_id = :userId
            """)
        .param("userId", userId)
        .query((rs, rowNum) -> new WalletInfo(rs.getString("wallet_id"), rs.getLong("balance")))
        .single();
  }

  private long deductWalletBalance(String walletId, long amount, OffsetDateTime now) {
    return jdbcClient.sql("""
            UPDATE wallet_accounts
            SET balance = balance - :amount, updated_at = :now
            WHERE wallet_id = :walletId AND balance >= :amount
            RETURNING balance
            """)
        .param("walletId", walletId)
        .param("amount", amount)
        .param("now", now)
        .query(Long.class)
        .optional()
        .orElseThrow(() -> new ResponseStatusException(
            HttpStatus.PAYMENT_REQUIRED,
            "Wallet balance changed during the request. Please retry."
        ));
  }

  private record OwnerVerificationStateRow(
      boolean verified,
      OffsetDateTime verifiedAt,
      long balance
  ) {}

  private record WalletInfo(String walletId, long balance) {}
}
