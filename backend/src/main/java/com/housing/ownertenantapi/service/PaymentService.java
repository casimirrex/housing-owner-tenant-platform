package com.housing.ownertenantapi.service;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.housing.ownertenantapi.dto.OwnerPaymentOverviewResponse;
import com.housing.ownertenantapi.dto.PaymentCheckoutRequest;
import com.housing.ownertenantapi.dto.PaymentCheckoutResponse;
import com.housing.ownertenantapi.dto.PaymentDashboardResponse;
import com.housing.ownertenantapi.dto.PaymentGatewaySummaryResponse;
import com.housing.ownertenantapi.dto.PaymentHistoryItemResponse;
import com.housing.ownertenantapi.dto.PaymentVerificationRequest;
import com.housing.ownertenantapi.dto.PaymentVerificationResponse;
import com.housing.ownertenantapi.dto.TenantPaymentItemResponse;
import com.housing.ownertenantapi.dto.TenantPaymentOverviewResponse;
import com.stripe.Stripe;
import com.stripe.exception.SignatureVerificationException;
import com.stripe.exception.StripeException;
import com.stripe.model.Event;
import com.stripe.model.PaymentIntent;
import com.stripe.net.Webhook;
import com.stripe.param.PaymentIntentCreateParams;
import java.io.IOException;
import java.net.URI;
import java.net.http.HttpClient;
import java.net.http.HttpRequest;
import java.net.http.HttpResponse;
import java.nio.charset.StandardCharsets;
import java.security.GeneralSecurityException;
import java.time.Instant;
import java.time.OffsetDateTime;
import java.time.ZoneOffset;
import java.time.temporal.ChronoUnit;
import java.util.Base64;
import java.util.HexFormat;
import java.util.List;
import java.util.Map;
import javax.crypto.Mac;
import javax.crypto.spec.SecretKeySpec;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpStatus;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.jdbc.core.simple.JdbcClient;
import org.springframework.stereotype.Service;
import org.springframework.util.StringUtils;
import org.springframework.web.server.ResponseStatusException;

@Service
public class PaymentService {

  private static final String TENANT_ROLE = "TENANT";
  private static final String OWNER_ROLE = "OWNER";

  private final JdbcClient jdbcClient;
  private final CurrentSessionService currentSessionService;
  private final ObjectMapper objectMapper;
  private final HttpClient httpClient;
  private final String configuredProviderMode;
  private final String razorpayKeyId;
  private final String razorpayKeySecret;
  private final String razorpayBaseUrl;
  private final String stripeSecretKey;
  private final String stripePublishableKey;
  private final String stripeWebhookSecret;

  public PaymentService(
      JdbcTemplate jdbcTemplate,
      CurrentSessionService currentSessionService,
      ObjectMapper objectMapper,
      @Value("${app.payments.provider:MOCK}") String configuredProviderMode,
      @Value("${app.payments.razorpay.key-id:}") String razorpayKeyId,
      @Value("${app.payments.razorpay.key-secret:}") String razorpayKeySecret,
      @Value("${app.payments.razorpay.base-url:https://api.razorpay.com/v1}") String razorpayBaseUrl,
      @Value("${app.payments.stripe.secret-key:}") String stripeSecretKey,
      @Value("${app.payments.stripe.publishable-key:}") String stripePublishableKey,
      @Value("${app.payments.stripe.webhook-secret:}") String stripeWebhookSecret
  ) {
    this.jdbcClient = JdbcClient.create(jdbcTemplate);
    this.currentSessionService = currentSessionService;
    this.objectMapper = objectMapper;
    this.httpClient = HttpClient.newHttpClient();
    this.configuredProviderMode = configuredProviderMode;
    this.razorpayKeyId = razorpayKeyId;
    this.razorpayKeySecret = razorpayKeySecret;
    this.razorpayBaseUrl = razorpayBaseUrl.replaceAll("/$", "");
    this.stripeSecretKey = stripeSecretKey;
    this.stripePublishableKey = stripePublishableKey;
    this.stripeWebhookSecret = stripeWebhookSecret;
  }

  public PaymentDashboardResponse getDashboard(String authorizationHeader) {
    CurrentSessionService.SessionIdentity sessionIdentity = currentSessionService.requireSession(
        authorizationHeader,
        "Sign in first before viewing payments."
    );
    String providerMode = resolveProviderMode();

    return new PaymentDashboardResponse(
        sessionIdentity.userId(),
        sessionIdentity.role(),
        sessionIdentity.fullName(),
        buildGatewaySummary(providerMode),
        OWNER_ROLE.equalsIgnoreCase(sessionIdentity.role())
            ? null
            : buildTenantOverview(sessionIdentity.userId()),
        OWNER_ROLE.equalsIgnoreCase(sessionIdentity.role())
            ? buildOwnerOverview(sessionIdentity.userId())
            : null,
        loadHistory(sessionIdentity.userId(), sessionIdentity.role())
    );
  }

  public PaymentCheckoutResponse createCheckout(
      String authorizationHeader,
      PaymentCheckoutRequest request
  ) {
    CurrentSessionService.SessionIdentity sessionIdentity = currentSessionService.requireRole(
        authorizationHeader,
        TENANT_ROLE,
        "Sign in first before starting a payment.",
        "Only tenant accounts can start property payments."
    );
    PaymentRecord paymentRecord = requireTenantPayment(request.paymentId(), sessionIdentity.userId());
    if ("CAPTURED".equalsIgnoreCase(paymentRecord.status())) {
      throw new ResponseStatusException(
          HttpStatus.BAD_REQUEST,
          "This payment is already completed."
      );
    }

    String providerMode = resolveProviderMode();
    OffsetDateTime updatedAt = OffsetDateTime.now(ZoneOffset.UTC).truncatedTo(ChronoUnit.SECONDS);

    String orderId;
    String clientSecret = null;
    String checkoutStatus = "PENDING";

    if ("STRIPE".equalsIgnoreCase(providerMode)) {
      StripeCheckoutSession stripeCheckout = prepareStripeCheckout(paymentRecord, sessionIdentity.email());
      PaymentIntent intent = stripeCheckout.paymentIntent();
      orderId = intent.getId();
      clientSecret = stripeCheckout.alreadyCaptured() ? null : intent.getClientSecret();
      checkoutStatus = stripeCheckout.alreadyCaptured() ? "CAPTURED" : "PENDING";
    } else if ("RAZORPAY".equalsIgnoreCase(providerMode)) {
      orderId = createRazorpayOrder(paymentRecord);
    } else {
      orderId = "mock_order_" + paymentRecord.paymentId();
    }

    if (!"CAPTURED".equalsIgnoreCase(checkoutStatus)) {
      jdbcClient.sql("""
              UPDATE payment_records
              SET provider = :provider,
                  provider_order_id = :providerOrderId,
                  status = 'PENDING',
                  updated_at = :updatedAt
              WHERE payment_id = :paymentId
              """)
          .param("provider", providerMode)
          .param("providerOrderId", orderId)
          .param("updatedAt", updatedAt)
          .param("paymentId", paymentRecord.paymentId())
          .update();
    }

    String providerLabel = switch (providerMode.toUpperCase()) {
      case "STRIPE" -> "Stripe";
      case "RAZORPAY" -> "Razorpay sandbox";
      default -> "Local sandbox";
    };
    String keyId = switch (providerMode.toUpperCase()) {
      case "STRIPE" -> stripePublishableKey;
      case "RAZORPAY" -> razorpayKeyId;
      default -> null;
    };

    return new PaymentCheckoutResponse(
        paymentRecord.paymentId(),
        providerMode,
        providerLabel,
        orderId,
        keyId,
        clientSecret,
        "Rent and Beyond",
        paymentRecord.paymentLabel(),
        sessionIdentity.fullName(),
        sessionIdentity.email(),
        sessionIdentity.phoneNumber(),
        paymentRecord.amount(),
        paymentRecord.currency(),
        checkoutStatus
    );
  }

  public PaymentVerificationResponse verifyPayment(
      String authorizationHeader,
      PaymentVerificationRequest request
  ) {
    CurrentSessionService.SessionIdentity sessionIdentity = currentSessionService.requireRole(
        authorizationHeader,
        TENANT_ROLE,
        "Sign in first before confirming a payment.",
        "Only tenant accounts can confirm property payments."
    );
    PaymentRecord paymentRecord = requireTenantPayment(request.paymentId(), sessionIdentity.userId());
    if ("CAPTURED".equalsIgnoreCase(paymentRecord.status())) {
      return new PaymentVerificationResponse(
          true,
          paymentRecord.status(),
          "This payment was already completed.",
          formatTimestamp(paymentRecord.paidAt())
      );
    }

    String providerMode = StringUtils.hasText(paymentRecord.provider())
        ? paymentRecord.provider()
        : resolveProviderMode();
    String providerOrderId = StringUtils.hasText(request.providerOrderId())
        ? request.providerOrderId()
        : paymentRecord.providerOrderId();
    String providerPaymentId = StringUtils.hasText(request.providerPaymentId())
        ? request.providerPaymentId()
        : "mock_pay_" + paymentRecord.paymentId();

    if ("STRIPE".equalsIgnoreCase(providerMode)) {
      // For Stripe: verify the PaymentIntent status via API
      if (!StringUtils.hasText(providerPaymentId) && !StringUtils.hasText(providerOrderId)) {
        throw new ResponseStatusException(
            HttpStatus.BAD_REQUEST,
            "Stripe verification requires the PaymentIntent id."
        );
      }
      String intentId = StringUtils.hasText(providerPaymentId) ? providerPaymentId : providerOrderId;
      PaymentIntent intent = verifyStripePaymentIntent(intentId);
      providerOrderId = intent.getId();
      providerPaymentId = extractStripeProviderPaymentId(intent);
    } else if ("RAZORPAY".equalsIgnoreCase(providerMode)) {
      if (!StringUtils.hasText(providerOrderId) || !StringUtils.hasText(providerPaymentId)
          || !StringUtils.hasText(request.providerSignature())) {
        throw new ResponseStatusException(
            HttpStatus.BAD_REQUEST,
            "Razorpay verification requires the order id, payment id, and signature."
        );
      }

      verifyRazorpaySignature(providerOrderId, providerPaymentId, request.providerSignature());
    }

    OffsetDateTime paidAt = OffsetDateTime.now(ZoneOffset.UTC).truncatedTo(ChronoUnit.SECONDS);
    markPaymentCaptured(
        paymentRecord.paymentId(),
        providerMode,
        providerOrderId,
        providerPaymentId,
        request.providerSignature(),
        paidAt
    );

    return new PaymentVerificationResponse(
        true,
        "CAPTURED",
        "Payment verified successfully.",
        paidAt.toString()
    );
  }

  public String handleStripeWebhook(String stripeSignature, String payload) {
    if (!StringUtils.hasText(stripeWebhookSecret)) {
      throw new ResponseStatusException(
          HttpStatus.NOT_IMPLEMENTED,
          "Stripe webhooks are not configured yet for this environment."
      );
    }
    if (!StringUtils.hasText(stripeSignature)) {
      throw new ResponseStatusException(
          HttpStatus.BAD_REQUEST,
          "Missing Stripe-Signature header."
      );
    }

    Event event;
    try {
      event = Webhook.constructEvent(payload, stripeSignature, stripeWebhookSecret);
    } catch (SignatureVerificationException exception) {
      throw new ResponseStatusException(
          HttpStatus.BAD_REQUEST,
          "Stripe webhook signature verification failed."
      );
    }

    JsonNode objectNode;
    try {
      objectNode = objectMapper.readTree(payload).path("data").path("object");
    } catch (IOException exception) {
      throw new ResponseStatusException(
          HttpStatus.BAD_REQUEST,
          "Stripe webhook payload could not be parsed."
      );
    }

    switch (event.getType()) {
      case "payment_intent.succeeded" -> reconcileStripeSuccess(objectNode);
      case "payment_intent.payment_failed" -> reconcileStripeFailure(objectNode);
      default -> {
        return event.getType();
      }
    }

    return event.getType();
  }

  private TenantPaymentOverviewResponse buildTenantOverview(String userId) {
    Integer pendingCount = jdbcClient.sql("""
            SELECT COUNT(*)
            FROM payment_records
            WHERE tenant_user_id = :userId
              AND status IN ('DUE', 'PENDING')
            """)
        .param("userId", userId)
        .query(Integer.class)
        .single();
    Integer pendingAmount = jdbcClient.sql("""
            SELECT COALESCE(SUM(amount), 0)
            FROM payment_records
            WHERE tenant_user_id = :userId
              AND status IN ('DUE', 'PENDING')
            """)
        .param("userId", userId)
        .query(Integer.class)
        .single();
    Integer capturedAmount = jdbcClient.sql("""
            SELECT COALESCE(SUM(amount), 0)
            FROM payment_records
            WHERE tenant_user_id = :userId
              AND status = 'CAPTURED'
            """)
        .param("userId", userId)
        .query(Integer.class)
        .single();

    List<TenantPaymentItemResponse> upcomingDues = jdbcClient.sql("""
            SELECT p.payment_id, p.listing_id, l.title, l.locality, l.city, p.payment_label,
                   p.payment_kind, p.status, p.amount, p.currency,
                   TO_CHAR(p.due_date, 'YYYY-MM-DD') AS due_date,
                   COALESCE(l.owner_name, owner.full_name) AS owner_name
            FROM payment_records p
            JOIN listings l ON l.listing_id = p.listing_id
            JOIN users owner ON owner.user_id = p.owner_user_id
            WHERE p.tenant_user_id = :userId
              AND p.status IN ('DUE', 'PENDING')
            ORDER BY p.due_date NULLS LAST, p.created_at DESC
            LIMIT 6
            """)
        .param("userId", userId)
        .query((rs, rowNum) -> new TenantPaymentItemResponse(
            rs.getString("payment_id"),
            rs.getString("listing_id"),
            rs.getString("title"),
            rs.getString("locality"),
            rs.getString("city"),
            rs.getString("payment_label"),
            rs.getString("payment_kind"),
            rs.getString("status"),
            rs.getInt("amount"),
            rs.getString("currency"),
            rs.getString("due_date"),
            rs.getString("owner_name")
        ))
        .list();

    return new TenantPaymentOverviewResponse(pendingCount, pendingAmount, capturedAmount, upcomingDues);
  }

  private OwnerPaymentOverviewResponse buildOwnerOverview(String userId) {
    Integer collectedThisMonth = jdbcClient.sql("""
            SELECT COALESCE(SUM(amount), 0)
            FROM payment_records
            WHERE owner_user_id = :userId
              AND status = 'CAPTURED'
              AND DATE_TRUNC('month', paid_at) = DATE_TRUNC('month', CURRENT_TIMESTAMP)
            """)
        .param("userId", userId)
        .query(Integer.class)
        .single();
    Integer pendingAmount = jdbcClient.sql("""
            SELECT COALESCE(SUM(amount), 0)
            FROM payment_records
            WHERE owner_user_id = :userId
              AND status IN ('DUE', 'PENDING')
            """)
        .param("userId", userId)
        .query(Integer.class)
        .single();
    Integer collectedCount = jdbcClient.sql("""
            SELECT COUNT(*)
            FROM payment_records
            WHERE owner_user_id = :userId
              AND status = 'CAPTURED'
            """)
        .param("userId", userId)
        .query(Integer.class)
        .single();
    Integer listingsCovered = jdbcClient.sql("""
            SELECT COUNT(DISTINCT listing_id)
            FROM payment_records
            WHERE owner_user_id = :userId
            """)
        .param("userId", userId)
        .query(Integer.class)
        .single();

    return new OwnerPaymentOverviewResponse(
        collectedThisMonth,
        pendingAmount,
        collectedCount,
        listingsCovered
    );
  }

  private List<PaymentHistoryItemResponse> loadHistory(String userId, String role) {
    String userColumn = OWNER_ROLE.equalsIgnoreCase(role) ? "owner_user_id" : "tenant_user_id";
    String counterpartyColumn = OWNER_ROLE.equalsIgnoreCase(role)
        ? "tenant.full_name"
        : "COALESCE(listings.owner_name, owner.full_name)";

    return jdbcClient.sql("""
            SELECT p.payment_id, p.listing_id, listings.title, %s AS counterparty_name,
                   p.payment_label, p.payment_kind, p.provider, p.status, p.amount, p.currency,
                   TO_CHAR(p.due_date, 'YYYY-MM-DD') AS due_date,
                   TO_CHAR(p.paid_at, 'YYYY-MM-DD"T"HH24:MI:SS"Z"') AS paid_at
            FROM payment_records p
            JOIN listings ON listings.listing_id = p.listing_id
            JOIN users tenant ON tenant.user_id = p.tenant_user_id
            JOIN users owner ON owner.user_id = p.owner_user_id
            WHERE p.%s = :userId
            ORDER BY COALESCE(p.paid_at, p.updated_at) DESC
            LIMIT 12
            """.formatted(counterpartyColumn, userColumn))
        .param("userId", userId)
        .query((rs, rowNum) -> new PaymentHistoryItemResponse(
            rs.getString("payment_id"),
            rs.getString("listing_id"),
            rs.getString("title"),
            rs.getString("counterparty_name"),
            rs.getString("payment_label"),
            rs.getString("payment_kind"),
            rs.getString("provider"),
            rs.getString("status"),
            rs.getInt("amount"),
            rs.getString("currency"),
            rs.getString("due_date"),
            rs.getString("paid_at")
        ))
        .list();
  }

  private PaymentRecord requireTenantPayment(String paymentId, String tenantUserId) {
    return jdbcClient.sql("""
            SELECT p.payment_id, p.tenant_user_id, p.owner_user_id, p.listing_id, p.payment_kind,
                   p.payment_label, p.provider, p.provider_order_id, p.provider_payment_id,
                   p.provider_signature, p.receipt, p.amount, p.currency, p.status,
                   TO_CHAR(p.due_date, 'YYYY-MM-DD') AS due_date, p.description,
                   listings.title, owner.full_name AS owner_name,
                   p.created_at, p.updated_at, p.paid_at
            FROM payment_records p
            JOIN listings ON listings.listing_id = p.listing_id
            JOIN users owner ON owner.user_id = p.owner_user_id
            WHERE p.payment_id = :paymentId
              AND p.tenant_user_id = :tenantUserId
            LIMIT 1
            """)
        .param("paymentId", paymentId)
        .param("tenantUserId", tenantUserId)
        .query((rs, rowNum) -> new PaymentRecord(
            rs.getString("payment_id"),
            rs.getString("tenant_user_id"),
            rs.getString("owner_user_id"),
            rs.getString("listing_id"),
            rs.getString("payment_kind"),
            rs.getString("payment_label"),
            rs.getString("provider"),
            rs.getString("provider_order_id"),
            rs.getString("provider_payment_id"),
            rs.getString("provider_signature"),
            rs.getString("receipt"),
            rs.getInt("amount"),
            rs.getString("currency"),
            rs.getString("status"),
            rs.getString("due_date"),
            rs.getString("description"),
            rs.getString("title"),
            rs.getString("owner_name"),
            rs.getObject("created_at", OffsetDateTime.class),
            rs.getObject("updated_at", OffsetDateTime.class),
            rs.getObject("paid_at", OffsetDateTime.class)
        ))
        .optional()
        .orElseThrow(() -> new ResponseStatusException(
            HttpStatus.NOT_FOUND,
            "Payment record not found for " + paymentId
        ));
  }

  private PaymentGatewaySummaryResponse buildGatewaySummary(String providerMode) {
    return switch (providerMode.toUpperCase()) {
      case "STRIPE" -> new PaymentGatewaySummaryResponse(
          providerMode,
          "Stripe",
          StringUtils.hasText(stripePublishableKey),
          null,  // Stripe uses Stripe.js loaded via npm — no external script URL needed
          StringUtils.hasText(stripeWebhookSecret)
              ? "Stripe payment gateway is active. Card details are captured securely via Stripe Elements, and backend webhook reconciliation is enabled."
              : "Stripe payment gateway is active. Card details are captured securely via Stripe Elements. Add STRIPE_WEBHOOK_SECRET to enable backend webhook reconciliation."
      );
      case "RAZORPAY" -> new PaymentGatewaySummaryResponse(
          providerMode,
          "Razorpay sandbox",
          StringUtils.hasText(razorpayKeyId),
          "https://checkout.razorpay.com/v1/checkout.js",
          "Razorpay test checkout is enabled for this environment."
      );
      default -> new PaymentGatewaySummaryResponse(
          providerMode,
        "Local sandbox",
        false,
        null,
          "Local sandbox payments are enabled. Set PAYMENT_PROVIDER=STRIPE and add STRIPE_SECRET_KEY / STRIPE_PUBLISHABLE_KEY to enable Stripe checkout."
      );
    };
  }

  private String resolveProviderMode() {
    if ("STRIPE".equalsIgnoreCase(configuredProviderMode)
        && StringUtils.hasText(stripeSecretKey)
        && StringUtils.hasText(stripePublishableKey)) {
      return "STRIPE";
    }
    if ("RAZORPAY".equalsIgnoreCase(configuredProviderMode)
        && StringUtils.hasText(razorpayKeyId)
        && StringUtils.hasText(razorpayKeySecret)) {
      return "RAZORPAY";
    }
    return "MOCK";
  }

  // ── Stripe helpers ────────────────────────────────────────────────────────

  private StripeCheckoutSession prepareStripeCheckout(PaymentRecord paymentRecord, String customerEmail) {
    PaymentIntent reusableIntent = retrieveReusableStripePaymentIntent(paymentRecord);
    if (reusableIntent != null) {
      String status = reusableIntent.getStatus();
      if ("succeeded".equalsIgnoreCase(status) || "requires_capture".equalsIgnoreCase(status)) {
        markPaymentCaptured(
            paymentRecord.paymentId(),
            "STRIPE",
            reusableIntent.getId(),
            extractStripeProviderPaymentId(reusableIntent),
            null,
            extractStripeTimestamp(reusableIntent.getCreated())
        );
        return new StripeCheckoutSession(reusableIntent, true);
      }
      return new StripeCheckoutSession(reusableIntent, false);
    }

    return new StripeCheckoutSession(createStripePaymentIntent(paymentRecord, customerEmail), false);
  }

  private PaymentIntent createStripePaymentIntent(PaymentRecord paymentRecord, String customerEmail) {
    Stripe.apiKey = stripeSecretKey;
    try {
      PaymentIntentCreateParams params = PaymentIntentCreateParams.builder()
          .setAmount((long) paymentRecord.amount() * 100L)  // Stripe expects smallest unit
          .setCurrency(paymentRecord.currency().toLowerCase())
          .setDescription(paymentRecord.paymentLabel())
          .setReceiptEmail(StringUtils.hasText(customerEmail) ? customerEmail : null)
          .putMetadata("payment_id", paymentRecord.paymentId())
          .putMetadata("listing_id", paymentRecord.listingId())
          .putMetadata("payment_kind", paymentRecord.paymentKind())
          .addPaymentMethodType("card")
          .build();
      return PaymentIntent.create(params);
    } catch (StripeException ex) {
      throw new ResponseStatusException(
          HttpStatus.BAD_GATEWAY,
          "Stripe PaymentIntent creation failed: " + ex.getMessage()
      );
    }
  }

  private PaymentIntent verifyStripePaymentIntent(String paymentIntentId) {
    Stripe.apiKey = stripeSecretKey;
    try {
      PaymentIntent intent = PaymentIntent.retrieve(paymentIntentId);
      String status = intent.getStatus();
      if (!"succeeded".equalsIgnoreCase(status) && !"requires_capture".equalsIgnoreCase(status)) {
        throw new ResponseStatusException(
            HttpStatus.BAD_REQUEST,
            "Stripe payment has not been completed. Current status: " + status
        );
      }
      return intent;
    } catch (StripeException ex) {
      throw new ResponseStatusException(
          HttpStatus.BAD_GATEWAY,
          "Stripe payment verification failed: " + ex.getMessage()
      );
    }
  }

  private PaymentIntent retrieveReusableStripePaymentIntent(PaymentRecord paymentRecord) {
    if (!"STRIPE".equalsIgnoreCase(paymentRecord.provider())
        || !StringUtils.hasText(paymentRecord.providerOrderId())) {
      return null;
    }

    Stripe.apiKey = stripeSecretKey;
    try {
      PaymentIntent existingIntent = PaymentIntent.retrieve(paymentRecord.providerOrderId());
      String mappedPaymentId = existingIntent.getMetadata() == null
          ? null
          : existingIntent.getMetadata().get("payment_id");
      if (StringUtils.hasText(mappedPaymentId)
          && !paymentRecord.paymentId().equalsIgnoreCase(mappedPaymentId)) {
        return null;
      }

      String status = existingIntent.getStatus();
      if (List.of(
          "requires_payment_method",
          "requires_confirmation",
          "requires_action",
          "processing",
          "succeeded",
          "requires_capture"
      ).contains(status)) {
        return existingIntent;
      }
      return null;
    } catch (StripeException ex) {
      if (ex.getStatusCode() != null && ex.getStatusCode() == 404) {
        return null;
      }
      throw new ResponseStatusException(
          HttpStatus.BAD_GATEWAY,
          "Stripe checkout could not retrieve the existing PaymentIntent."
      );
    }
  }

  private void reconcileStripeSuccess(JsonNode paymentIntentNode) {
    PaymentRecord paymentRecord = findPaymentForStripeIntent(paymentIntentNode);
    if (paymentRecord == null) {
      return;
    }

    String paymentIntentId = paymentIntentNode.path("id").asText();
    String providerPaymentId = extractStripeProviderPaymentId(paymentIntentNode);
    markPaymentCaptured(
        paymentRecord.paymentId(),
        "STRIPE",
        paymentIntentId,
        StringUtils.hasText(providerPaymentId) ? providerPaymentId : paymentIntentId,
        null,
        extractStripeTimestamp(paymentIntentNode.path("created").asLong(0))
    );
  }

  private void reconcileStripeFailure(JsonNode paymentIntentNode) {
    PaymentRecord paymentRecord = findPaymentForStripeIntent(paymentIntentNode);
    if (paymentRecord == null) {
      return;
    }

    String paymentIntentId = paymentIntentNode.path("id").asText();
    String failureMessage = paymentIntentNode.path("last_payment_error").path("message").asText("");
    jdbcClient.sql("""
            UPDATE payment_records
            SET provider = 'STRIPE',
                provider_order_id = :providerOrderId,
                status = 'DUE',
                notes = :notes,
                updated_at = :updatedAt
            WHERE payment_id = :paymentId
            """)
        .param("providerOrderId", paymentIntentId)
        .param("notes", StringUtils.hasText(failureMessage)
            ? "Stripe payment attempt failed: " + failureMessage
            : "Stripe payment attempt failed before completion.")
        .param("updatedAt", OffsetDateTime.now(ZoneOffset.UTC).truncatedTo(ChronoUnit.SECONDS))
        .param("paymentId", paymentRecord.paymentId())
        .update();
  }

  private PaymentRecord findPaymentForStripeIntent(JsonNode paymentIntentNode) {
    String paymentId = paymentIntentNode.path("metadata").path("payment_id").asText();
    String paymentIntentId = paymentIntentNode.path("id").asText();

    String sql;
    if (StringUtils.hasText(paymentId)) {
      sql = """
              SELECT p.payment_id, p.tenant_user_id, p.owner_user_id, p.listing_id, p.payment_kind,
                     p.payment_label, p.provider, p.provider_order_id, p.provider_payment_id,
                     p.provider_signature, p.receipt, p.amount, p.currency, p.status,
                     TO_CHAR(p.due_date, 'YYYY-MM-DD') AS due_date, p.description,
                     listings.title, owner.full_name AS owner_name,
                     p.created_at, p.updated_at, p.paid_at
              FROM payment_records p
              JOIN listings ON listings.listing_id = p.listing_id
              JOIN users owner ON owner.user_id = p.owner_user_id
              WHERE p.payment_id = :paymentId
              LIMIT 1
              """;
    } else {
      sql = """
              SELECT p.payment_id, p.tenant_user_id, p.owner_user_id, p.listing_id, p.payment_kind,
                     p.payment_label, p.provider, p.provider_order_id, p.provider_payment_id,
                     p.provider_signature, p.receipt, p.amount, p.currency, p.status,
                     TO_CHAR(p.due_date, 'YYYY-MM-DD') AS due_date, p.description,
                     listings.title, owner.full_name AS owner_name,
                     p.created_at, p.updated_at, p.paid_at
              FROM payment_records p
              JOIN listings ON listings.listing_id = p.listing_id
              JOIN users owner ON owner.user_id = p.owner_user_id
              WHERE p.provider_order_id = :paymentIntentId
              LIMIT 1
              """;
    }

    var query = jdbcClient.sql(sql);
    if (StringUtils.hasText(paymentId)) {
      query = query.param("paymentId", paymentId);
    } else {
      query = query.param("paymentIntentId", paymentIntentId);
    }
    return query
        .query((rs, rowNum) -> new PaymentRecord(
            rs.getString("payment_id"),
            rs.getString("tenant_user_id"),
            rs.getString("owner_user_id"),
            rs.getString("listing_id"),
            rs.getString("payment_kind"),
            rs.getString("payment_label"),
            rs.getString("provider"),
            rs.getString("provider_order_id"),
            rs.getString("provider_payment_id"),
            rs.getString("provider_signature"),
            rs.getString("receipt"),
            rs.getInt("amount"),
            rs.getString("currency"),
            rs.getString("status"),
            rs.getString("due_date"),
            rs.getString("description"),
            rs.getString("title"),
            rs.getString("owner_name"),
            rs.getObject("created_at", OffsetDateTime.class),
            rs.getObject("updated_at", OffsetDateTime.class),
            rs.getObject("paid_at", OffsetDateTime.class)
        ))
        .optional()
        .orElse(null);
  }

  private void markPaymentCaptured(
      String paymentId,
      String providerMode,
      String providerOrderId,
      String providerPaymentId,
      String providerSignature,
      OffsetDateTime paidAt
  ) {
    OffsetDateTime effectivePaidAt = paidAt == null
        ? OffsetDateTime.now(ZoneOffset.UTC).truncatedTo(ChronoUnit.SECONDS)
        : paidAt.truncatedTo(ChronoUnit.SECONDS);

    jdbcClient.sql("""
            UPDATE payment_records
            SET provider = :provider,
                provider_order_id = :providerOrderId,
                provider_payment_id = :providerPaymentId,
                provider_signature = :providerSignature,
                status = 'CAPTURED',
                paid_at = :paidAt,
                updated_at = :paidAt
            WHERE payment_id = :paymentId
            """)
        .param("provider", providerMode)
        .param("providerOrderId", providerOrderId)
        .param("providerPaymentId", providerPaymentId)
        .param("providerSignature", providerSignature)
        .param("paidAt", effectivePaidAt)
        .param("paymentId", paymentId)
        .update();
  }

  private OffsetDateTime extractStripeTimestamp(Long createdEpochSeconds) {
    if (createdEpochSeconds == null || createdEpochSeconds <= 0) {
      return OffsetDateTime.now(ZoneOffset.UTC).truncatedTo(ChronoUnit.SECONDS);
    }
    return OffsetDateTime.ofInstant(
        Instant.ofEpochSecond(createdEpochSeconds),
        ZoneOffset.UTC
    ).truncatedTo(ChronoUnit.SECONDS);
  }

  private String extractStripeProviderPaymentId(PaymentIntent paymentIntent) {
    return StringUtils.hasText(paymentIntent.getLatestCharge())
        ? paymentIntent.getLatestCharge()
        : paymentIntent.getId();
  }

  private String extractStripeProviderPaymentId(JsonNode paymentIntentNode) {
    String latestCharge = paymentIntentNode.path("latest_charge").asText();
    return StringUtils.hasText(latestCharge)
        ? latestCharge
        : paymentIntentNode.path("id").asText();
  }

  // ── Razorpay helpers ──────────────────────────────────────────────────────

  private String createRazorpayOrder(PaymentRecord paymentRecord) {
    Map<String, Object> payload = Map.of(
        "amount", paymentRecord.amount() * 100,
        "currency", paymentRecord.currency(),
        "receipt", paymentRecord.receipt(),
        "notes", Map.of(
            "payment_id", paymentRecord.paymentId(),
            "listing_id", paymentRecord.listingId(),
            "payment_kind", paymentRecord.paymentKind()
        )
    );

    try {
      HttpRequest request = HttpRequest.newBuilder(URI.create(razorpayBaseUrl + "/orders"))
          .header("Content-Type", "application/json")
          .header("Authorization", buildBasicAuthHeader())
          .POST(HttpRequest.BodyPublishers.ofString(objectMapper.writeValueAsString(payload)))
          .build();

      HttpResponse<String> response = httpClient.send(request, HttpResponse.BodyHandlers.ofString());
      if (response.statusCode() >= 400) {
        throw new ResponseStatusException(
            HttpStatus.BAD_GATEWAY,
            "Razorpay order creation failed with status " + response.statusCode() + "."
        );
      }

      JsonNode body = objectMapper.readTree(response.body());
      String orderId = body.path("id").asText();
      if (!StringUtils.hasText(orderId)) {
        throw new ResponseStatusException(
            HttpStatus.BAD_GATEWAY,
            "Razorpay did not return an order id."
        );
      }

      return orderId;
    } catch (IOException | InterruptedException exception) {
      if (exception instanceof InterruptedException) {
        Thread.currentThread().interrupt();
      }
      throw new ResponseStatusException(
          HttpStatus.BAD_GATEWAY,
          "Razorpay order creation could not be completed right now."
      );
    }
  }

  private String buildBasicAuthHeader() {
    String credentials = razorpayKeyId + ":" + razorpayKeySecret;
    return "Basic " + Base64.getEncoder().encodeToString(credentials.getBytes(StandardCharsets.UTF_8));
  }

  private void verifyRazorpaySignature(
      String providerOrderId,
      String providerPaymentId,
      String providerSignature
  ) {
    try {
      Mac mac = Mac.getInstance("HmacSHA256");
      mac.init(new SecretKeySpec(razorpayKeySecret.getBytes(StandardCharsets.UTF_8), "HmacSHA256"));
      byte[] digest = mac.doFinal(
          (providerOrderId + "|" + providerPaymentId).getBytes(StandardCharsets.UTF_8)
      );
      String expectedSignature = HexFormat.of().formatHex(digest);
      if (!expectedSignature.equals(providerSignature)) {
        throw new ResponseStatusException(
            HttpStatus.BAD_REQUEST,
            "The payment signature could not be verified."
        );
      }
    } catch (GeneralSecurityException exception) {
      throw new ResponseStatusException(
          HttpStatus.INTERNAL_SERVER_ERROR,
          "Payment signature verification is unavailable."
      );
    }
  }

  private String formatTimestamp(OffsetDateTime timestamp) {
    return timestamp == null ? null : timestamp.truncatedTo(ChronoUnit.SECONDS).toString();
  }

  private record PaymentRecord(
      String paymentId,
      String tenantUserId,
      String ownerUserId,
      String listingId,
      String paymentKind,
      String paymentLabel,
      String provider,
      String providerOrderId,
      String providerPaymentId,
      String providerSignature,
      String receipt,
      int amount,
      String currency,
      String status,
      String dueDate,
      String description,
      String listingTitle,
      String ownerName,
      OffsetDateTime createdAt,
      OffsetDateTime updatedAt,
      OffsetDateTime paidAt
  ) {
  }

  private record StripeCheckoutSession(
      PaymentIntent paymentIntent,
      boolean alreadyCaptured
  ) {
  }
}
