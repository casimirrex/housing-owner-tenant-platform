package com.housing.ownertenantapi.service;

import com.housing.ownertenantapi.dto.PropertyViewerAccessResponse;
import com.housing.ownertenantapi.dto.TenantPremiumAccessResponse;
import com.housing.ownertenantapi.dto.TenantPremiumActivationResponse;
import java.time.OffsetDateTime;
import java.time.ZoneOffset;
import java.time.format.DateTimeFormatter;
import java.time.temporal.ChronoUnit;
import java.util.Locale;
import java.util.Optional;
import java.util.UUID;
import org.springframework.http.HttpStatus;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.jdbc.core.simple.JdbcClient;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

@Service
public class TenantPremiumService {

  public static final String PLAN_CODE_TENANT_PREMIUM_ANNUAL = "TENANT_PREMIUM_ANNUAL";
  public static final String PLAN_CODE_OWNER_PREMIUM_ANNUAL = "OWNER_PREMIUM_ANNUAL";

  private static final String ROLE_TENANT = "TENANT";
  private static final String ROLE_OWNER = "OWNER";
  private static final String STATUS_ACTIVE = "ACTIVE";
  private static final String STATUS_COMPLETED = "COMPLETED";
  private static final String ACTIVATED_VIA_WALLET = "WALLET";
  private static final String WALLET_PROVIDER_INTERNAL = "INTERNAL";
  private static final String WALLET_TXN_PREMIUM_SUBSCRIPTION = "PREMIUM_SUBSCRIPTION";

  private final JdbcClient jdbcClient;
  private final CurrentSessionService currentSessionService;

  public TenantPremiumService(
      JdbcTemplate jdbcTemplate,
      CurrentSessionService currentSessionService
  ) {
    this.jdbcClient = JdbcClient.create(jdbcTemplate);
    this.currentSessionService = currentSessionService;
  }

  public PropertyViewerAccessResponse resolvePropertyViewerAccess(
      Optional<CurrentSessionService.SessionIdentity> sessionIdentity
  ) {
    PlanRecord plan = requireActivePlan();
    if (sessionIdentity.isEmpty()) {
      return new PropertyViewerAccessResponse(
          "TEASER",
          "GUEST",
          true,
          false,
          false,
          "Sign in as a tenant to unlock the full listing",
          "Guests can browse the property preview. Upgrade to Tenant Premium after sign-in to see the exact address, full walkthrough, gallery, trust scores, and owner details.",
          plan.planCode(),
          plan.planName(),
          plan.priceAmount(),
          plan.currency(),
          plan.periodLabel()
      );
    }

    CurrentSessionService.SessionIdentity identity = sessionIdentity.get();
    if (ROLE_OWNER.equalsIgnoreCase(identity.role())) {
      return new PropertyViewerAccessResponse(
          "FULL",
          ROLE_OWNER,
          false,
          true,
          true,
          "Owner view keeps the complete listing visible",
          "Owners can review the full property presentation and owner-facing trust fields without a renter subscription.",
          null,
          null,
          null,
          null,
          null
      );
    }

    boolean premiumActive = hasActivePremium(identity.userId(), nowUtc());
    if (premiumActive) {
      return new PropertyViewerAccessResponse(
          "FULL",
          ROLE_TENANT,
          true,
          true,
          false,
          "Tenant Premium is active",
          "You can see the full property profile, owner details, exact address, gallery, and advanced trust signals.",
          plan.planCode(),
          plan.planName(),
          plan.priceAmount(),
          plan.currency(),
          plan.periodLabel()
      );
    }

    return new PropertyViewerAccessResponse(
        "TEASER",
        ROLE_TENANT,
        true,
        false,
        false,
        "Upgrade to Tenant Premium to unlock this listing",
        "Standard tenants can browse a preview. Premium unlocks the full property narrative, owner panel, exact address, trust scorecards, and visit-ready details.",
        plan.planCode(),
        plan.planName(),
        plan.priceAmount(),
        plan.currency(),
        plan.periodLabel()
    );
  }

  public TenantPremiumAccessResponse getCurrentAccess(String authorizationHeader) {
    CurrentSessionService.SessionIdentity identity = currentSessionService.requireRole(
        authorizationHeader,
        ROLE_TENANT,
        "Sign in as a tenant to manage premium access.",
        "Premium tenant access is only available for tenant accounts."
    );

    PlanRecord plan = requireActivePlan();
    OffsetDateTime now = nowUtc();
    Optional<SubscriptionRecord> activeSubscription = findActiveSubscription(identity.userId(), now);
    long walletBalance = getOrCreateWalletBalance(identity.userId());
    boolean premiumActive = activeSubscription.isPresent();
    long shortfallAmount = Math.max(0L, plan.priceAmount() - walletBalance);
    boolean canActivate = !premiumActive && shortfallAmount == 0L;

    String message = premiumActive
        ? "Premium access is already active for your tenant account."
        : canActivate
            ? "Your wallet balance is ready. You can activate premium immediately."
            : "Top up your wallet to activate premium and unlock the full property detail experience.";

    return new TenantPremiumAccessResponse(
        plan.planCode(),
        plan.planName(),
        plan.description(),
        plan.priceAmount(),
        plan.currency(),
        plan.billingPeriod(),
        plan.validityDays(),
        premiumActive,
        activeSubscription.map(SubscriptionRecord::status).orElse("INACTIVE"),
        activeSubscription.map(subscription -> formatTimestamp(subscription.startedAt())).orElse(null),
        activeSubscription.map(subscription -> formatTimestamp(subscription.expiresAt())).orElse(null),
        walletBalance,
        formatInr(walletBalance, plan.currency()),
        canActivate,
        shortfallAmount,
        message
    );
  }

  @Transactional
  public TenantPremiumActivationResponse activatePremium(String authorizationHeader) {
    CurrentSessionService.SessionIdentity identity = currentSessionService.requireRole(
        authorizationHeader,
        ROLE_TENANT,
        "Sign in as a tenant to activate premium access.",
        "Premium tenant access is only available for tenant accounts."
    );

    PlanRecord plan = requireActivePlan();
    OffsetDateTime now = nowUtc();
    Optional<SubscriptionRecord> activeSubscription = findActiveSubscription(identity.userId(), now);
    if (activeSubscription.isPresent()) {
      long walletBalance = getOrCreateWalletBalance(identity.userId());
      SubscriptionRecord subscription = activeSubscription.get();
      return new TenantPremiumActivationResponse(
          true,
          subscription.subscriptionId(),
          subscription.planCode(),
          subscription.status(),
          formatTimestamp(subscription.startedAt()),
          formatTimestamp(subscription.expiresAt()),
          walletBalance,
          "Premium access is already active for this tenant account."
      );
    }

    String walletId = getOrCreateWalletId(identity.userId());
    long walletBalance = getWalletBalance(walletId);
    if (walletBalance < plan.priceAmount()) {
      long shortfall = plan.priceAmount() - walletBalance;
      throw new ResponseStatusException(
          HttpStatus.PAYMENT_REQUIRED,
          "Add " + formatInr(shortfall, plan.currency()) + " more to your wallet before activating premium."
      );
    }

    String walletTxnId = "wtxn_" + UUID.randomUUID().toString().replace("-", "").substring(0, 16);
    String subscriptionId = "sub_" + UUID.randomUUID().toString().replace("-", "").substring(0, 16);
    OffsetDateTime expiresAt = now.plusDays(plan.validityDays());

    jdbcClient.sql("""
        INSERT INTO wallet_transactions
          (txn_id, wallet_id, user_id, txn_type, amount, currency, status, provider,
           provider_order_id, provider_payment_id, client_secret, description, created_at, completed_at)
        VALUES
          (:txnId, :walletId, :userId, :txnType, :amount, :currency, :status, :provider,
           :orderId, :paymentId, NULL, :description, :createdAt, :completedAt)
        """)
        .param("txnId", walletTxnId)
        .param("walletId", walletId)
        .param("userId", identity.userId())
        .param("txnType", WALLET_TXN_PREMIUM_SUBSCRIPTION)
        .param("amount", plan.priceAmount())
        .param("currency", plan.currency())
        .param("status", STATUS_COMPLETED)
        .param("provider", WALLET_PROVIDER_INTERNAL)
        .param("orderId", subscriptionId)
        .param("paymentId", subscriptionId)
        .param("description", "Tenant Premium annual activation")
        .param("createdAt", now)
        .param("completedAt", now)
        .update();

    jdbcClient.sql("""
        UPDATE wallet_accounts
        SET balance = balance - :amount,
            updated_at = :updatedAt
        WHERE wallet_id = :walletId
        """)
        .param("amount", plan.priceAmount())
        .param("updatedAt", now)
        .param("walletId", walletId)
        .update();

    jdbcClient.sql("""
        INSERT INTO user_subscriptions
          (subscription_id, user_id, plan_code, status, started_at, expires_at,
           activated_via, amount_paid, currency, payment_reference, created_at, updated_at)
        VALUES
          (:subscriptionId, :userId, :planCode, :status, :startedAt, :expiresAt,
           :activatedVia, :amountPaid, :currency, :paymentReference, :createdAt, :updatedAt)
        """)
        .param("subscriptionId", subscriptionId)
        .param("userId", identity.userId())
        .param("planCode", plan.planCode())
        .param("status", STATUS_ACTIVE)
        .param("startedAt", now)
        .param("expiresAt", expiresAt)
        .param("activatedVia", ACTIVATED_VIA_WALLET)
        .param("amountPaid", plan.priceAmount())
        .param("currency", plan.currency())
        .param("paymentReference", walletTxnId)
        .param("createdAt", now)
        .param("updatedAt", now)
        .update();

    long updatedBalance = getWalletBalance(walletId);
    return new TenantPremiumActivationResponse(
        true,
        subscriptionId,
        plan.planCode(),
        STATUS_ACTIVE,
        formatTimestamp(now),
        formatTimestamp(expiresAt),
        updatedBalance,
        "Tenant Premium is now active. Full property details are unlocked for the next " + plan.validityDays() + " days."
    );
  }

  public boolean hasActivePremium(String userId, OffsetDateTime now) {
    return findActiveSubscription(userId, now).isPresent();
  }

  /** Owner-side premium check used by OwnerListingService to gate listing creation. */
  public boolean hasActiveOwnerPremium(String userId) {
    return findActiveSubscriptionForPlan(userId, PLAN_CODE_OWNER_PREMIUM_ANNUAL, nowUtc()).isPresent();
  }

  /**
   * Throws HTTP 402 Payment Required if the owner has no active OWNER_PREMIUM
   * subscription. Called from OwnerListingService before INSERT.
   */
  public void requireOwnerPremium(String ownerUserId) {
    if (!hasActiveOwnerPremium(ownerUserId)) {
      throw new ResponseStatusException(
          HttpStatus.PAYMENT_REQUIRED,
          "Owner Premium subscription required to publish listings. Activate Owner Premium for Rs. 1,000/year from your wallet."
      );
    }
  }

  private Optional<SubscriptionRecord> findActiveSubscription(String userId, OffsetDateTime now) {
    return findActiveSubscriptionForPlan(userId, PLAN_CODE_TENANT_PREMIUM_ANNUAL, now);
  }

  private Optional<SubscriptionRecord> findActiveSubscriptionForPlan(
      String userId, String planCode, OffsetDateTime now) {
    return jdbcClient.sql("""
        SELECT subscription_id, plan_code, status, started_at, expires_at
        FROM user_subscriptions
        WHERE user_id = :userId
          AND plan_code = :planCode
          AND status = :status
          AND expires_at > :now
        ORDER BY expires_at DESC
        LIMIT 1
        """)
        .param("userId", userId)
        .param("planCode", planCode)
        .param("status", STATUS_ACTIVE)
        .param("now", now)
        .query((rs, rowNum) -> new SubscriptionRecord(
            rs.getString("subscription_id"),
            rs.getString("plan_code"),
            rs.getString("status"),
            rs.getObject("started_at", OffsetDateTime.class),
            rs.getObject("expires_at", OffsetDateTime.class)
        ))
        .optional();
  }

  private PlanRecord requireActivePlan() {
    return requireActivePlanFor(PLAN_CODE_TENANT_PREMIUM_ANNUAL, ROLE_TENANT, "tenant");
  }

  private PlanRecord requireActivePlanFor(String planCode, String role, String label) {
    return jdbcClient.sql("""
        SELECT plan_code, plan_name, description, billing_period, price_amount, currency, validity_days
        FROM subscription_plans
        WHERE plan_code = :planCode
          AND role = :role
          AND active = TRUE
        """)
        .param("planCode", planCode)
        .param("role", role)
        .query((rs, rowNum) -> new PlanRecord(
            rs.getString("plan_code"),
            rs.getString("plan_name"),
            rs.getString("description"),
            rs.getString("billing_period"),
            rs.getLong("price_amount"),
            rs.getString("currency"),
            rs.getInt("validity_days")
        ))
        .optional()
        .orElseThrow(() -> new ResponseStatusException(
            HttpStatus.INTERNAL_SERVER_ERROR,
            "The " + label + " premium plan is not configured yet."
        ));
  }

  /** Owner-side: returns plan price + wallet balance + activation eligibility. */
  public TenantPremiumAccessResponse getOwnerCurrentAccess(String authorizationHeader) {
    CurrentSessionService.SessionIdentity identity = currentSessionService.requireRole(
        authorizationHeader,
        ROLE_OWNER,
        "Sign in as an owner to manage owner premium access.",
        "Owner premium access is only available for owner accounts."
    );

    PlanRecord plan = requireActivePlanFor(PLAN_CODE_OWNER_PREMIUM_ANNUAL, ROLE_OWNER, "owner");
    OffsetDateTime now = nowUtc();
    Optional<SubscriptionRecord> activeSubscription =
        findActiveSubscriptionForPlan(identity.userId(), PLAN_CODE_OWNER_PREMIUM_ANNUAL, now);
    long walletBalance = getOrCreateWalletBalance(identity.userId());
    boolean premiumActive = activeSubscription.isPresent();
    long shortfallAmount = Math.max(0L, plan.priceAmount() - walletBalance);
    boolean canActivate = !premiumActive && shortfallAmount == 0L;

    String message = premiumActive
        ? "Owner Premium is active. You can publish listings."
        : canActivate
            ? "Your wallet balance is ready. You can activate Owner Premium immediately."
            : "Top up your wallet to activate Owner Premium and start publishing listings.";

    return new TenantPremiumAccessResponse(
        plan.planCode(),
        plan.planName(),
        plan.description(),
        plan.priceAmount(),
        plan.currency(),
        plan.billingPeriod(),
        plan.validityDays(),
        premiumActive,
        activeSubscription.map(SubscriptionRecord::status).orElse("INACTIVE"),
        activeSubscription.map(subscription -> formatTimestamp(subscription.startedAt())).orElse(null),
        activeSubscription.map(subscription -> formatTimestamp(subscription.expiresAt())).orElse(null),
        walletBalance,
        formatInr(walletBalance, plan.currency()),
        canActivate,
        shortfallAmount,
        message
    );
  }

  /** Owner-side: deduct plan price from wallet and create subscription. */
  @Transactional
  public TenantPremiumActivationResponse activateOwnerPremium(String authorizationHeader) {
    CurrentSessionService.SessionIdentity identity = currentSessionService.requireRole(
        authorizationHeader,
        ROLE_OWNER,
        "Sign in as an owner to activate owner premium access.",
        "Owner premium access is only available for owner accounts."
    );

    PlanRecord plan = requireActivePlanFor(PLAN_CODE_OWNER_PREMIUM_ANNUAL, ROLE_OWNER, "owner");
    OffsetDateTime now = nowUtc();
    Optional<SubscriptionRecord> activeSubscription =
        findActiveSubscriptionForPlan(identity.userId(), PLAN_CODE_OWNER_PREMIUM_ANNUAL, now);
    if (activeSubscription.isPresent()) {
      long walletBalance = getOrCreateWalletBalance(identity.userId());
      SubscriptionRecord subscription = activeSubscription.get();
      return new TenantPremiumActivationResponse(
          true,
          subscription.subscriptionId(),
          subscription.planCode(),
          subscription.status(),
          formatTimestamp(subscription.startedAt()),
          formatTimestamp(subscription.expiresAt()),
          walletBalance,
          "Owner Premium is already active for this account."
      );
    }

    String walletId = getOrCreateWalletId(identity.userId());
    long walletBalance = getWalletBalance(walletId);
    if (walletBalance < plan.priceAmount()) {
      long shortfall = plan.priceAmount() - walletBalance;
      throw new ResponseStatusException(
          HttpStatus.PAYMENT_REQUIRED,
          "Add " + formatInr(shortfall, plan.currency()) + " more to your wallet before activating Owner Premium."
      );
    }

    String walletTxnId = "wtxn_" + UUID.randomUUID().toString().replace("-", "").substring(0, 16);
    String subscriptionId = "sub_" + UUID.randomUUID().toString().replace("-", "").substring(0, 16);
    OffsetDateTime expiresAt = now.plusDays(plan.validityDays());

    jdbcClient.sql("""
        INSERT INTO wallet_transactions
          (txn_id, wallet_id, user_id, txn_type, amount, currency, status, provider,
           provider_order_id, provider_payment_id, client_secret, description, created_at, completed_at)
        VALUES
          (:txnId, :walletId, :userId, :txnType, :amount, :currency, :status, :provider,
           :orderId, :paymentId, NULL, :description, :createdAt, :completedAt)
        """)
        .param("txnId", walletTxnId)
        .param("walletId", walletId)
        .param("userId", identity.userId())
        .param("txnType", WALLET_TXN_PREMIUM_SUBSCRIPTION)
        .param("amount", plan.priceAmount())
        .param("currency", plan.currency())
        .param("status", STATUS_COMPLETED)
        .param("provider", WALLET_PROVIDER_INTERNAL)
        .param("orderId", subscriptionId)
        .param("paymentId", subscriptionId)
        .param("description", "Owner Premium annual activation")
        .param("createdAt", now)
        .param("completedAt", now)
        .update();

    jdbcClient.sql("""
        UPDATE wallet_accounts
        SET balance = balance - :amount,
            updated_at = :updatedAt
        WHERE wallet_id = :walletId
        """)
        .param("amount", plan.priceAmount())
        .param("updatedAt", now)
        .param("walletId", walletId)
        .update();

    jdbcClient.sql("""
        INSERT INTO user_subscriptions
          (subscription_id, user_id, plan_code, status, started_at, expires_at,
           activated_via, amount_paid, currency, payment_reference, created_at, updated_at)
        VALUES
          (:subscriptionId, :userId, :planCode, :status, :startedAt, :expiresAt,
           :activatedVia, :amountPaid, :currency, :paymentReference, :createdAt, :updatedAt)
        """)
        .param("subscriptionId", subscriptionId)
        .param("userId", identity.userId())
        .param("planCode", plan.planCode())
        .param("status", STATUS_ACTIVE)
        .param("startedAt", now)
        .param("expiresAt", expiresAt)
        .param("activatedVia", ACTIVATED_VIA_WALLET)
        .param("amountPaid", plan.priceAmount())
        .param("currency", plan.currency())
        .param("paymentReference", walletTxnId)
        .param("createdAt", now)
        .param("updatedAt", now)
        .update();

    long updatedBalance = getWalletBalance(walletId);
    return new TenantPremiumActivationResponse(
        true,
        subscriptionId,
        plan.planCode(),
        STATUS_ACTIVE,
        formatTimestamp(now),
        formatTimestamp(expiresAt),
        updatedBalance,
        "Owner Premium is now active. You can publish listings for the next " + plan.validityDays() + " days."
    );
  }

  private long getOrCreateWalletBalance(String userId) {
    String walletId = getOrCreateWalletId(userId);
    return getWalletBalance(walletId);
  }

  private String getOrCreateWalletId(String userId) {
    return jdbcClient.sql("""
        SELECT wallet_id
        FROM wallet_accounts
        WHERE user_id = :userId
        """)
        .param("userId", userId)
        .query(String.class)
        .optional()
        .orElseGet(() -> {
          String walletId = "wallet_" + UUID.randomUUID().toString().replace("-", "").substring(0, 16);
          OffsetDateTime now = nowUtc();
          jdbcClient.sql("""
              INSERT INTO wallet_accounts
                (wallet_id, user_id, balance, currency, created_at, updated_at)
              VALUES
                (:walletId, :userId, 0, 'INR', :createdAt, :updatedAt)
              """)
              .param("walletId", walletId)
              .param("userId", userId)
              .param("createdAt", now)
              .param("updatedAt", now)
              .update();
          return walletId;
        });
  }

  private long getWalletBalance(String walletId) {
    return jdbcClient.sql("""
        SELECT balance
        FROM wallet_accounts
        WHERE wallet_id = :walletId
        """)
        .param("walletId", walletId)
        .query(Long.class)
        .optional()
        .orElse(0L);
  }

  private static OffsetDateTime nowUtc() {
    return OffsetDateTime.now(ZoneOffset.UTC).truncatedTo(ChronoUnit.SECONDS);
  }

  private static String formatTimestamp(OffsetDateTime timestamp) {
    return timestamp == null
        ? null
        : timestamp.truncatedTo(ChronoUnit.SECONDS).format(DateTimeFormatter.ISO_OFFSET_DATE_TIME);
  }

  private static String formatInr(long amount, String currency) {
    if ("INR".equalsIgnoreCase(currency)) {
      return "Rs. " + String.format("%,d", amount);
    }
    return currency.toUpperCase(Locale.ROOT) + " " + String.format("%,d", amount);
  }

  private record PlanRecord(
      String planCode,
      String planName,
      String description,
      String billingPeriod,
      long priceAmount,
      String currency,
      int validityDays
  ) {
    String periodLabel() {
      return switch (billingPeriod) {
        case "ANNUAL" -> "per year";
        case "MONTHLY" -> "per month";
        default -> "per plan";
      };
    }
  }

  private record SubscriptionRecord(
      String subscriptionId,
      String planCode,
      String status,
      OffsetDateTime startedAt,
      OffsetDateTime expiresAt
  ) {
  }
}
