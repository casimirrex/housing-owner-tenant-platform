package com.housing.ownertenantapi.service;

import com.housing.ownertenantapi.dto.ListingPromotionResponse;
import java.time.OffsetDateTime;
import java.time.ZoneOffset;
import java.time.format.DateTimeFormatter;
import java.time.temporal.ChronoUnit;
import java.util.Map;
import java.util.UUID;
import org.springframework.http.HttpStatus;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.jdbc.core.simple.JdbcClient;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

/**
 * Featured Listings — owners pay from their wallet to promote a listing to
 * the top of search results for a fixed duration.
 *
 * Flow:
 *   1. Validate listing belongs to the calling owner.
 *   2. Validate listing is PUBLISHED (can't promote a draft).
 *   3. Pick price + duration from the requested tier.
 *   4. Deduct amount from wallet (atomic — fails if insufficient balance).
 *   5. Extend listings.featured_until: max(now, current featured_until) + duration.
 *   6. Record a wallet_transactions row for the deduction (audit trail).
 *
 * Re-promoting an already-featured listing EXTENDS the period rather than
 * replacing it — owners never lose paid-for time.
 */
@Service
public class ListingPromotionService {

  /** Pricing tiers — rupees, INR. Adjust here only; nothing is hardcoded elsewhere. */
  private static final Map<Integer, Long> PRICING_INR = Map.of(
      7,  99L,
      30, 299L
  );

  private static final String CURRENCY = "INR";
  private static final String STATUS_PUBLISHED = "PUBLISHED";
  private static final String WALLET_TXN_LISTING_PROMOTION = "LISTING_PROMOTION";
  private static final String WALLET_PROVIDER_INTERNAL = "INTERNAL";
  private static final String STATUS_COMPLETED = "COMPLETED";
  private static final DateTimeFormatter ISO_FORMATTER = DateTimeFormatter.ISO_OFFSET_DATE_TIME;

  private final JdbcClient jdbcClient;

  public ListingPromotionService(JdbcTemplate jdbcTemplate) {
    this.jdbcClient = JdbcClient.create(jdbcTemplate);
  }

  @Transactional
  public ListingPromotionResponse promoteListing(String ownerId, String listingId, int durationDays) {
    Long price = PRICING_INR.get(durationDays);
    if (price == null) {
      throw new ResponseStatusException(
          HttpStatus.BAD_REQUEST,
          "Unsupported promotion duration: " + durationDays + ". Allowed: " + PRICING_INR.keySet()
      );
    }

    // 1. Validate listing exists, is owned by the caller, and is PUBLISHED.
    ListingSnapshot snapshot = jdbcClient.sql("""
            SELECT listing_id, owner_id, status, featured_until
            FROM listings
            WHERE listing_id = :listingId
            """)
        .param("listingId", listingId)
        .query((rs, rowNum) -> new ListingSnapshot(
            rs.getString("listing_id"),
            rs.getString("owner_id"),
            rs.getString("status"),
            rs.getObject("featured_until", OffsetDateTime.class)
        ))
        .optional()
        .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Listing not found."));

    if (!ownerId.equals(snapshot.ownerId())) {
      throw new ResponseStatusException(HttpStatus.FORBIDDEN, "You can only promote your own listings.");
    }
    if (!STATUS_PUBLISHED.equalsIgnoreCase(snapshot.status())) {
      throw new ResponseStatusException(
          HttpStatus.BAD_REQUEST,
          "Only PUBLISHED listings can be promoted. Publish this listing first."
      );
    }

    OffsetDateTime now = OffsetDateTime.now(ZoneOffset.UTC).truncatedTo(ChronoUnit.SECONDS);

    // 2. Get wallet + verify balance.
    WalletInfo wallet = getOrCreateWallet(ownerId, now);
    if (wallet.balance() < price) {
      long shortfall = price - wallet.balance();
      throw new ResponseStatusException(
          HttpStatus.PAYMENT_REQUIRED,
          "Add Rs " + shortfall + " more to your wallet to promote this listing for "
              + durationDays + " days (cost: Rs " + price + ")."
      );
    }

    // 3. Deduct from wallet.
    long updatedBalance = deductWalletBalance(wallet.walletId(), price, now);

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
        .param("txnType", WALLET_TXN_LISTING_PROMOTION)
        .param("amount", price)
        .param("currency", CURRENCY)
        .param("status", STATUS_COMPLETED)
        .param("provider", WALLET_PROVIDER_INTERNAL)
        .param("orderId", listingId)
        .param("paymentId", listingId)
        .param("description", "Featured listing promotion: " + durationDays + " days for " + listingId)
        .param("createdAt", now)
        .param("completedAt", now)
        .update();

    // 4. Compute new featured_until — extend from current value if it's still
    //    in the future, otherwise start from now. Owners never lose paid time.
    OffsetDateTime startFrom = (snapshot.featuredUntil() != null && snapshot.featuredUntil().isAfter(now))
        ? snapshot.featuredUntil()
        : now;
    OffsetDateTime newFeaturedUntil = startFrom.plusDays(durationDays);

    jdbcClient.sql("""
            UPDATE listings
            SET featured_until = :featuredUntil
            WHERE listing_id = :listingId
            """)
        .param("featuredUntil", newFeaturedUntil)
        .param("listingId", listingId)
        .update();

    return new ListingPromotionResponse(
        listingId,
        ISO_FORMATTER.format(newFeaturedUntil),
        durationDays,
        price,
        CURRENCY,
        updatedBalance,
        "Listing promoted for " + durationDays + " days. It will appear at the top of search results."
    );
  }

  /* ─── Wallet helpers (mirrors TenantPremiumService pattern) ─────────── */

  private WalletInfo getOrCreateWallet(String userId, OffsetDateTime now) {
    // Try to read first.
    var existing = jdbcClient.sql("""
            SELECT wallet_id, balance FROM wallet_accounts WHERE user_id = :userId
            """)
        .param("userId", userId)
        .query((rs, rowNum) -> new WalletInfo(rs.getString("wallet_id"), rs.getLong("balance")))
        .optional();

    if (existing.isPresent()) {
      return existing.get();
    }

    // Create one.
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

    // Re-read to get whatever wallet_id won the upsert.
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

  /* ─── Internal records ────────────────────────────────────────────── */

  private record ListingSnapshot(
      String listingId,
      String ownerId,
      String status,
      OffsetDateTime featuredUntil
  ) {}

  private record WalletInfo(String walletId, long balance) {}
}
