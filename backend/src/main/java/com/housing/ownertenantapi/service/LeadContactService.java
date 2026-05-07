package com.housing.ownertenantapi.service;

import com.housing.ownertenantapi.dto.LeadContactResponse;
import com.housing.ownertenantapi.dto.OwnerLeadsResponse;
import com.housing.ownertenantapi.dto.OwnerLeadsResponse.Lead;
import java.time.OffsetDateTime;
import java.time.ZoneOffset;
import java.time.format.DateTimeFormatter;
import java.time.temporal.ChronoUnit;
import java.util.List;
import java.util.UUID;
import org.springframework.http.HttpStatus;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.jdbc.core.simple.JdbcClient;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

/**
 * Tier 1 #3 — Pay-to-Contact / Express Interest leads.
 *
 * Tenant pays Rs 49 from their wallet to send a lead to the owner of a
 * specific listing. Owner sees these leads in the dashboard ("Recent Leads"
 * panel) and contacts the tenant directly.
 *
 * Anti-spam: blocks a tenant from sending more than one lead per listing
 * within the last 24h. They can still re-express later (real intent).
 */
@Service
public class LeadContactService {

  /** Per-lead fee in rupees. */
  public static final long LEAD_PRICE_INR = 49L;

  private static final String CURRENCY = "INR";
  private static final String WALLET_TXN_LEAD = "LEAD_CONTACT";
  private static final String WALLET_PROVIDER_INTERNAL = "INTERNAL";
  private static final String STATUS_COMPLETED = "COMPLETED";
  private static final String LEAD_STATUS_NEW = "NEW";
  private static final DateTimeFormatter ISO_FORMATTER = DateTimeFormatter.ISO_OFFSET_DATE_TIME;

  private final JdbcClient jdbcClient;

  public LeadContactService(JdbcTemplate jdbcTemplate) {
    this.jdbcClient = JdbcClient.create(jdbcTemplate);
  }

  @Transactional
  public LeadContactResponse expressInterest(String tenantId, String listingId, String message) {
    // 1. Validate listing exists + is PUBLISHED + grab owner.
    var listing = jdbcClient.sql("""
            SELECT listing_id, owner_id, status, title
            FROM listings WHERE listing_id = :listingId
            """)
        .param("listingId", listingId)
        .query((rs, rowNum) -> new ListingSnapshot(
            rs.getString("listing_id"),
            rs.getString("owner_id"),
            rs.getString("status"),
            rs.getString("title")
        ))
        .optional()
        .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Listing not found."));

    if (!"PUBLISHED".equalsIgnoreCase(listing.status())) {
      throw new ResponseStatusException(HttpStatus.BAD_REQUEST,
          "This listing is not currently available for contact.");
    }
    if (tenantId.equals(listing.ownerId())) {
      throw new ResponseStatusException(HttpStatus.BAD_REQUEST,
          "You can't express interest in your own listing.");
    }

    // 2. Anti-spam: reject if same tenant already sent a lead for this listing in last 24h.
    boolean recentDuplicate = Boolean.TRUE.equals(jdbcClient.sql("""
            SELECT EXISTS (
              SELECT 1 FROM lead_requests
              WHERE tenant_id = :tenantId
                AND listing_id = :listingId
                AND created_at > CURRENT_TIMESTAMP - INTERVAL '24 hours'
            )
            """)
        .param("tenantId", tenantId)
        .param("listingId", listingId)
        .query(Boolean.class)
        .single());
    if (recentDuplicate) {
      throw new ResponseStatusException(HttpStatus.CONFLICT,
          "You already expressed interest in this listing in the last 24 hours. Wait for the owner to respond.");
    }

    OffsetDateTime now = OffsetDateTime.now(ZoneOffset.UTC).truncatedTo(ChronoUnit.SECONDS);

    // 3. Wallet deduct.
    WalletInfo wallet = getOrCreateWallet(tenantId, now);
    if (wallet.balance() < LEAD_PRICE_INR) {
      long shortfall = LEAD_PRICE_INR - wallet.balance();
      throw new ResponseStatusException(
          HttpStatus.PAYMENT_REQUIRED,
          "Add Rs " + shortfall + " more to your wallet to send a lead (Rs " + LEAD_PRICE_INR + ")."
      );
    }
    long updatedBalance = deductWalletBalance(wallet.walletId(), LEAD_PRICE_INR, now);

    // 4. Insert lead + wallet txn.
    String leadId = "lead_" + UUID.randomUUID().toString().replace("-", "").substring(0, 12);
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
        .param("userId", tenantId)
        .param("txnType", WALLET_TXN_LEAD)
        .param("amount", LEAD_PRICE_INR)
        .param("currency", CURRENCY)
        .param("status", STATUS_COMPLETED)
        .param("provider", WALLET_PROVIDER_INTERNAL)
        .param("orderId", leadId)
        .param("paymentId", leadId)
        .param("description", "Express Interest fee for " + listing.title())
        .param("createdAt", now)
        .param("completedAt", now)
        .update();

    jdbcClient.sql("""
            INSERT INTO lead_requests
              (lead_id, tenant_id, listing_id, owner_id, message, amount_paid, currency, status,
               payment_reference, created_at, updated_at)
            VALUES
              (:leadId, :tenantId, :listingId, :ownerId, :message, :amount, :currency, :status,
               :paymentRef, :now, :now)
            """)
        .param("leadId", leadId)
        .param("tenantId", tenantId)
        .param("listingId", listingId)
        .param("ownerId", listing.ownerId())
        .param("message", message)
        .param("amount", LEAD_PRICE_INR)
        .param("currency", CURRENCY)
        .param("status", LEAD_STATUS_NEW)
        .param("paymentRef", walletTxnId)
        .param("now", now)
        .update();

    return new LeadContactResponse(
        leadId,
        listingId,
        LEAD_PRICE_INR,
        CURRENCY,
        updatedBalance,
        ISO_FORMATTER.format(now),
        "Interest sent. The owner will see your contact details in their dashboard and reach out."
    );
  }

  /** Owner-side: list recent leads for the signed-in owner. */
  public OwnerLeadsResponse getLeadsForOwner(String ownerId) {
    List<Lead> leads = jdbcClient.sql("""
            SELECT lr.lead_id, lr.listing_id, l.title AS listing_title,
                   lr.tenant_id, u.full_name AS tenant_name,
                   u.email AS tenant_email, u.phone_number AS tenant_phone,
                   lr.message, lr.status, lr.amount_paid, lr.created_at
            FROM lead_requests lr
            JOIN listings l ON l.listing_id = lr.listing_id
            JOIN users u ON u.user_id = lr.tenant_id
            WHERE lr.owner_id = :ownerId
            ORDER BY lr.created_at DESC
            LIMIT 50
            """)
        .param("ownerId", ownerId)
        .query((rs, rowNum) -> new Lead(
            rs.getString("lead_id"),
            rs.getString("listing_id"),
            rs.getString("listing_title"),
            rs.getString("tenant_id"),
            rs.getString("tenant_name"),
            rs.getString("tenant_email"),
            rs.getString("tenant_phone"),
            rs.getString("message"),
            rs.getString("status"),
            rs.getLong("amount_paid"),
            ISO_FORMATTER.format(rs.getObject("created_at", OffsetDateTime.class))
        ))
        .list();

    long newCount = leads.stream().filter(l -> "NEW".equalsIgnoreCase(l.status())).count();
    return new OwnerLeadsResponse(leads, newCount);
  }

  /* ─── Wallet helpers ────────────────────────────────────────────────── */

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

  private record ListingSnapshot(String listingId, String ownerId, String status, String title) {}
  private record WalletInfo(String walletId, long balance) {}
}
