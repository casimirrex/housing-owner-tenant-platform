package com.housing.ownertenantapi.service;

import com.housing.ownertenantapi.dto.WalletDashboardResponse;
import com.housing.ownertenantapi.dto.WalletTopupCheckoutResponse;
import com.housing.ownertenantapi.dto.WalletTopupRequest;
import com.housing.ownertenantapi.dto.WalletTopupVerifyRequest;
import com.housing.ownertenantapi.dto.WalletTopupVerifyResponse;
import com.housing.ownertenantapi.dto.WalletTransactionItemResponse;
import com.stripe.Stripe;
import com.stripe.exception.StripeException;
import com.stripe.model.PaymentIntent;
import com.stripe.param.PaymentIntentCreateParams;
import java.time.OffsetDateTime;
import java.time.ZoneOffset;
import java.time.temporal.ChronoUnit;
import java.time.format.DateTimeFormatter;
import java.util.List;
import java.util.Locale;
import java.util.UUID;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpStatus;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.jdbc.core.simple.JdbcClient;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.util.StringUtils;
import org.springframework.web.server.ResponseStatusException;

/**
 * Wallet service: amounts stored in the DB are in major currency units
 * (rupees for INR), matching the convention used by payment_records.
 * Stripe always receives amounts in the smallest unit (paise for INR),
 * so every Stripe call multiplies the stored amount by 100.
 */
@Service
public class WalletService {

  private static final String DEFAULT_CURRENCY = "INR";

  private static final String PROVIDER_STRIPE  = "STRIPE";
  private static final String PROVIDER_MOCK    = "MOCK";
  private static final String STATUS_PENDING   = "PENDING";
  private static final String STATUS_COMPLETED = "COMPLETED";
  private static final String TXN_TOPUP        = "TOPUP";

  private final JdbcClient jdbcClient;
  private final CurrentSessionService currentSessionService;
  private final String stripeSecretKey;
  private final String stripePublishableKey;
  private final String configuredProviderMode;

  public WalletService(
      JdbcTemplate jdbcTemplate,
      CurrentSessionService currentSessionService,
      @Value("${app.payments.stripe.secret-key:}") String stripeSecretKey,
      @Value("${app.payments.stripe.publishable-key:}") String stripePublishableKey,
      @Value("${app.payments.provider:MOCK}") String configuredProviderMode
  ) {
    this.jdbcClient             = JdbcClient.create(jdbcTemplate);
    this.currentSessionService  = currentSessionService;
    this.stripeSecretKey        = stripeSecretKey;
    this.stripePublishableKey   = stripePublishableKey;
    this.configuredProviderMode = configuredProviderMode;
  }

  /* ─── Dashboard ─────────────────────────────────────────────────────────── */

  public WalletDashboardResponse getDashboard(String authorizationHeader) {
    CurrentSessionService.SessionIdentity identity =
        currentSessionService.requireSession(authorizationHeader, "Sign in to view your wallet.");

    String walletId  = getOrCreateWalletId(identity.userId());
    long   balance   = getBalance(walletId);
    String currency  = getWalletCurrency(walletId);
    String formatted = formatRupees(balance, currency);

    List<WalletTransactionItemResponse> transactions = getRecentTransactions(walletId, 30);
    String mode = resolveProviderMode();

    return new WalletDashboardResponse(
        walletId,
        identity.userId(),
        identity.fullName(),
        balance,
        currency,
        formatted,
        mode,
        StringUtils.hasText(stripePublishableKey),
        transactions
    );
  }

  /* ─── Checkout (create PaymentIntent) ───────────────────────────────────── */

  @Transactional
  public WalletTopupCheckoutResponse createTopupCheckout(
      String authorizationHeader,
      WalletTopupRequest request
  ) {
    CurrentSessionService.SessionIdentity identity =
        currentSessionService.requireSession(authorizationHeader, "Sign in to top up your wallet.");

    // Minimum ₹1
    if (request.amount() < 1) {
      throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Minimum top-up is ₹1.");
    }

    String walletId    = getOrCreateWalletId(identity.userId());
    String mode        = resolveProviderMode();
    String txnId       = "wtxn_" + UUID.randomUUID().toString().replace("-", "").substring(0, 16);
    String currency    = request.currency().toUpperCase(Locale.ROOT);
    String description = buildDescription(request.amount(), currency);

    if (PROVIDER_STRIPE.equals(mode)) {
      return createStripeCheckout(identity, walletId, txnId, request, currency, description);
    }

    // ── MOCK mode ──
    OffsetDateTime now = nowUtc();
    jdbcClient.sql("""
        INSERT INTO wallet_transactions
          (txn_id, wallet_id, user_id, txn_type, amount, currency,
           status, provider, provider_order_id, description, created_at)
        VALUES (:txnId, :walletId, :userId, :txnType, :amount, :currency,
                :status, :provider, :orderId, :description, :createdAt)
        """)
        .param("txnId",       txnId)
        .param("walletId",    walletId)
        .param("userId",      identity.userId())
        .param("txnType",     TXN_TOPUP)
        .param("amount",      (long) request.amount())   // stored in rupees
        .param("currency",    currency)
        .param("status",      STATUS_PENDING)
        .param("provider",    PROVIDER_MOCK)
        .param("orderId",     "mock_" + txnId)
        .param("description", description)
        .param("createdAt",   now)
        .update();

    return new WalletTopupCheckoutResponse(
        txnId,
        "mock_pi_" + txnId,
        null,          // no clientSecret for mock
        null,          // no publishableKey for mock
        request.amount(),
        currency,
        description,
        identity.fullName(),
        identity.email(),
        PROVIDER_MOCK
    );
  }

  private WalletTopupCheckoutResponse createStripeCheckout(
      CurrentSessionService.SessionIdentity identity,
      String walletId,
      String txnId,
      WalletTopupRequest request,
      String currency,
      String description
  ) {
    try {
      Stripe.apiKey = stripeSecretKey;

      // *** KEY FIX: amount in DB is in rupees; Stripe expects paise → multiply by 100 ***
      long stripeAmount = (long) request.amount() * 100L;

      PaymentIntentCreateParams params = PaymentIntentCreateParams.builder()
          .setAmount(stripeAmount)
          .setCurrency(currency.toLowerCase(Locale.ROOT))
          .setDescription(description)
          .putMetadata("walletId", walletId)
          .putMetadata("txnId",    txnId)
          .putMetadata("userId",   identity.userId())
          .addPaymentMethodType("card")
          .build();

      PaymentIntent intent = PaymentIntent.create(params);

      OffsetDateTime now = nowUtc();
      jdbcClient.sql("""
          INSERT INTO wallet_transactions
            (txn_id, wallet_id, user_id, txn_type, amount, currency,
             status, provider, provider_order_id, client_secret, description, created_at)
          VALUES (:txnId, :walletId, :userId, :txnType, :amount, :currency,
                  :status, :provider, :orderId, :clientSecret, :description, :createdAt)
          """)
          .param("txnId",        txnId)
          .param("walletId",     walletId)
          .param("userId",       identity.userId())
          .param("txnType",      TXN_TOPUP)
          .param("amount",       (long) request.amount())   // stored in rupees (not paise)
          .param("currency",     currency)
          .param("status",       STATUS_PENDING)
          .param("provider",     PROVIDER_STRIPE)
          .param("orderId",      intent.getId())
          .param("clientSecret", intent.getClientSecret())
          .param("description",  description)
          .param("createdAt",    now)
          .update();

      return new WalletTopupCheckoutResponse(
          txnId,
          intent.getId(),
          intent.getClientSecret(),
          stripePublishableKey,
          request.amount(),      // return rupees to frontend — frontend formats as ₹X
          currency,
          description,
          identity.fullName(),
          identity.email(),
          PROVIDER_STRIPE
      );

    } catch (StripeException e) {
      throw new ResponseStatusException(
          HttpStatus.BAD_GATEWAY,
          "Stripe error creating PaymentIntent: " + e.getUserMessage()
      );
    }
  }

  /* ─── Verify (credit balance) ───────────────────────────────────────────── */

  @Transactional
  public WalletTopupVerifyResponse verifyTopup(
      String authorizationHeader,
      WalletTopupVerifyRequest request
  ) {
    CurrentSessionService.SessionIdentity identity =
        currentSessionService.requireSession(authorizationHeader, "Sign in to verify your top-up.");

    WalletTxnRecord txn = jdbcClient.sql("""
        SELECT txn_id, wallet_id, user_id, amount, currency, status, provider, provider_order_id
        FROM wallet_transactions
        WHERE txn_id = :txnId
        """)
        .param("txnId", request.txnId())
        .query((rs, rowNum) -> new WalletTxnRecord(
            rs.getString("txn_id"),
            rs.getString("wallet_id"),
            rs.getString("user_id"),
            rs.getLong("amount"),
            rs.getString("currency"),
            rs.getString("status"),
            rs.getString("provider"),
            rs.getString("provider_order_id")
        ))
        .optional()
        .orElseThrow(() -> new ResponseStatusException(
            HttpStatus.NOT_FOUND, "Wallet transaction not found."));

    if (!txn.userId().equals(identity.userId())) {
      throw new ResponseStatusException(HttpStatus.FORBIDDEN, "Access denied to this transaction.");
    }

    // Already credited — idempotent
    if (STATUS_COMPLETED.equals(txn.status())) {
      long balance = getBalance(txn.walletId());
      return new WalletTopupVerifyResponse(
          true, balance, txn.currency(), (int) txn.amount(),
          "This top-up was already applied to your wallet.", formatTimestamp(nowUtc())
      );
    }

    // Verify Stripe PaymentIntent
    if (PROVIDER_STRIPE.equals(txn.provider())) {
      verifyStripePaymentIntent(request.paymentIntentId());
    }

    // Mark transaction COMPLETED and credit balance (in rupees)
    OffsetDateTime now = nowUtc();
    jdbcClient.sql("""
        UPDATE wallet_transactions
        SET status = :status, provider_payment_id = :piId, completed_at = :completedAt
        WHERE txn_id = :txnId
        """)
        .param("status",      STATUS_COMPLETED)
        .param("piId",        request.paymentIntentId())
        .param("completedAt", now)
        .param("txnId",       request.txnId())
        .update();

    jdbcClient.sql("""
        UPDATE wallet_accounts
        SET balance = balance + :amount, updated_at = :now
        WHERE wallet_id = :walletId
        """)
        .param("amount",   txn.amount())    // rupees
        .param("now",      now)
        .param("walletId", txn.walletId())
        .update();

    long newBalance = getBalance(txn.walletId());

    return new WalletTopupVerifyResponse(
        true,
        newBalance,
        txn.currency(),
        (int) txn.amount(),
        "Wallet topped up successfully. ₹" + txn.amount() + " added.",
        formatTimestamp(now)
    );
  }

  /* ─── Helpers ───────────────────────────────────────────────────────────── */

  private String getOrCreateWalletId(String userId) {
    return jdbcClient.sql(
            "SELECT wallet_id FROM wallet_accounts WHERE user_id = :userId")
        .param("userId", userId)
        .query(String.class)
        .optional()
        .orElseGet(() -> {
          String wid = "wallet_" + UUID.randomUUID().toString().replace("-", "").substring(0, 16);
          OffsetDateTime now = nowUtc();
          jdbcClient.sql("""
              INSERT INTO wallet_accounts
                (wallet_id, user_id, balance, currency, created_at, updated_at)
              VALUES (:wid, :userId, 0, :currency, :now, :now)
              """)
              .param("wid",      wid)
              .param("userId",   userId)
              .param("currency", DEFAULT_CURRENCY)
              .param("now",      now)
              .update();
          return wid;
        });
  }

  private long getBalance(String walletId) {
    return jdbcClient.sql(
            "SELECT balance FROM wallet_accounts WHERE wallet_id = :wid")
        .param("wid", walletId)
        .query(Long.class)
        .optional()
        .orElse(0L);
  }

  private String getWalletCurrency(String walletId) {
    return jdbcClient.sql(
            "SELECT currency FROM wallet_accounts WHERE wallet_id = :wid")
        .param("wid", walletId)
        .query(String.class)
        .optional()
        .orElse(DEFAULT_CURRENCY);
  }

  private List<WalletTransactionItemResponse> getRecentTransactions(String walletId, int limit) {
    return jdbcClient.sql("""
        SELECT txn_id, txn_type, amount, currency, status, description,
               created_at, completed_at
        FROM wallet_transactions
        WHERE wallet_id = :walletId
        ORDER BY created_at DESC
        LIMIT :limit
        """)
        .param("walletId", walletId)
        .param("limit",    limit)
        .query((rs, rowNum) -> new WalletTransactionItemResponse(
            rs.getString("txn_id"),
            rs.getString("txn_type"),
            rs.getLong("amount"),
            rs.getString("currency"),
            rs.getString("status"),
            rs.getString("description"),
            rs.getString("created_at"),
            rs.getString("completed_at")
        ))
        .list();
  }

  private String resolveProviderMode() {
    if (PROVIDER_STRIPE.equalsIgnoreCase(configuredProviderMode)
        && StringUtils.hasText(stripeSecretKey)
        && StringUtils.hasText(stripePublishableKey)) {
      return PROVIDER_STRIPE;
    }
    return PROVIDER_MOCK;
  }

  private void verifyStripePaymentIntent(String paymentIntentId) {
    try {
      Stripe.apiKey = stripeSecretKey;
      PaymentIntent intent = PaymentIntent.retrieve(paymentIntentId);
      String status = intent.getStatus();
      if (!"succeeded".equalsIgnoreCase(status) && !"requires_capture".equalsIgnoreCase(status)) {
        throw new ResponseStatusException(
            HttpStatus.PAYMENT_REQUIRED,
            "Stripe payment not yet succeeded. Current status: " + status
        );
      }
    } catch (StripeException e) {
      throw new ResponseStatusException(
          HttpStatus.BAD_GATEWAY, "Stripe verification failed: " + e.getUserMessage()
      );
    }
  }

  /**
   * Build a human-readable description. Amount is in major units (rupees).
   */
  private static String buildDescription(int amountRupees, String currency) {
    return "Wallet top-up — " + formatRupees((long) amountRupees, currency);
  }

  /**
   * Format an amount stored in major currency units (rupees) as a readable string.
   * No division by 100 — DB stores rupees, not paise.
   */
  private static String formatRupees(long amountMajor, String currency) {
    return switch (currency.toUpperCase(Locale.ROOT)) {
      case "INR" -> "₹" + String.format("%,d", amountMajor);
      case "GBP" -> "£" + String.format("%,.2f", (double) amountMajor);
      default    -> "$" + String.format("%,.2f", (double) amountMajor);
    };
  }

  private static OffsetDateTime nowUtc() {
    return OffsetDateTime.now(ZoneOffset.UTC).truncatedTo(ChronoUnit.SECONDS);
  }

  private static String formatTimestamp(OffsetDateTime timestamp) {
    return timestamp == null ? null : timestamp.truncatedTo(ChronoUnit.SECONDS)
        .format(DateTimeFormatter.ISO_OFFSET_DATE_TIME);
  }

  /* ─── Inner records ─────────────────────────────────────────────────────── */

  private record WalletTxnRecord(
      String txnId,
      String walletId,
      String userId,
      long   amount,
      String currency,
      String status,
      String provider,
      String providerOrderId
  ) {}
}
