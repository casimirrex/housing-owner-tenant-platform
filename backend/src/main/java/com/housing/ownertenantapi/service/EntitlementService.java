package com.housing.ownertenantapi.service;

import com.housing.ownertenantapi.dto.EntitlementResult;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.jdbc.core.simple.JdbcClient;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

/**
 * Free-trial entitlement gate. Single chokepoint for "is this user allowed to do X?"
 * Premium users are derived from user_subscriptions; free-tier limits live in
 * feature_entitlements; consumption is recorded in feature_usage_events.
 *
 * Add new gated features by extending the {@link Feature} enum and seeding rows
 * into feature_entitlements — no code changes elsewhere.
 */
@Service
public class EntitlementService {

  /** Catalogue of gated features. Binds feature key → role at compile time. */
  public enum Feature {
    OWNER_LISTING_POST("OWNER_LISTING_POST", "OWNER"),
    TENANT_PROPERTY_VIEW("TENANT_PROPERTY_VIEW", "TENANT");

    public final String key;
    public final String role;

    Feature(String key, String role) {
      this.key = key;
      this.role = role;
    }
  }

  private static final String TIER_FREE = "FREE";
  private static final String TIER_PREMIUM = "PREMIUM";
  private static final String STATUS_PREMIUM = "PREMIUM";
  private static final String STATUS_FREE_REMAINING = "FREE_REMAINING";
  private static final String STATUS_FREE_EXHAUSTED = "FREE_EXHAUSTED";

  private final JdbcClient jdbcClient;

  public EntitlementService(JdbcTemplate jdbcTemplate) {
    this.jdbcClient = JdbcClient.create(jdbcTemplate);
  }

  /**
   * Read-only status — no consumption. Use for badge/UI display.
   * Premium users always come back allowed with limit=null.
   */
  public EntitlementResult getStatus(String userId, Feature feature) {
    boolean isPremium = isPremium(userId, feature.role);
    Integer freeLimit = freeLimit(feature.key);
    int used = currentUsage(userId, feature.key);

    if (isPremium) {
      return new EntitlementResult(true, TIER_PREMIUM, used, null, STATUS_PREMIUM,
          "Premium tier — unlimited access.");
    }
    if (freeLimit == null) {
      return new EntitlementResult(true, TIER_FREE, used, null, STATUS_FREE_REMAINING,
          "No free-tier limit configured.");
    }
    if (used >= freeLimit) {
      return new EntitlementResult(false, TIER_FREE, used, freeLimit, STATUS_FREE_EXHAUSTED,
          "Free trial used up. Upgrade to continue.");
    }
    int remaining = freeLimit - used;
    return new EntitlementResult(true, TIER_FREE, used, freeLimit, STATUS_FREE_REMAINING,
        String.format("Free trial: %d of %d remaining.", remaining, freeLimit));
  }

  /**
   * Idempotent check + record. For TENANT_PROPERTY_VIEW: same propertyId twice
   * does not double-count. For OWNER_LISTING_POST: pass the new listing_id as
   * resourceId after a successful insert (within the same transaction).
   *
   * Returns allowed=false with status=FREE_EXHAUSTED when the user is out of
   * free uses; the caller should map to HTTP 402 + upgrade flow.
   */
  @Transactional
  public EntitlementResult tryConsume(String userId, Feature feature, String resourceId) {
    boolean isPremium = isPremium(userId, feature.role);
    if (isPremium) {
      // Audit-record premium use too (idempotent), so analytics covers all tiers
      recordEvent(userId, feature.key, resourceId);
      return new EntitlementResult(true, TIER_PREMIUM, 0, null, STATUS_PREMIUM,
          "Premium tier — granted.");
    }

    // Idempotency: same resource consumed already → allow without burning a slot
    if (alreadyConsumed(userId, feature.key, resourceId)) {
      int used = currentUsage(userId, feature.key);
      Integer limit = freeLimit(feature.key);
      String status = (limit != null && used >= limit) ? STATUS_FREE_EXHAUSTED : STATUS_FREE_REMAINING;
      return new EntitlementResult(true, TIER_FREE, used, limit, status,
          "Already accessed this resource on the free tier.");
    }

    int used = currentUsage(userId, feature.key);
    Integer limit = freeLimit(feature.key);
    if (limit != null && used >= limit) {
      return new EntitlementResult(false, TIER_FREE, used, limit, STATUS_FREE_EXHAUSTED,
          "Free trial used up. Upgrade to continue.");
    }

    recordEvent(userId, feature.key, resourceId);
    int newUsed = used + 1;
    String status = (limit != null && newUsed >= limit) ? STATUS_FREE_EXHAUSTED : STATUS_FREE_REMAINING;
    String msg = (limit == null)
        ? "Granted."
        : String.format("Free trial: %d of %d used.", newUsed, limit);
    return new EntitlementResult(true, TIER_FREE, newUsed, limit, status, msg);
  }

  /* ────────────────────────────────────────────────────────────────────── */
  /* Internal helpers — package-private for testability                     */
  /* ────────────────────────────────────────────────────────────────────── */

  boolean isPremium(String userId, String role) {
    Boolean result = jdbcClient.sql("""
        SELECT EXISTS (
          SELECT 1 FROM user_subscriptions us
          JOIN subscription_plans sp ON sp.plan_code = us.plan_code
          WHERE us.user_id    = :userId
            AND us.status     = 'ACTIVE'
            AND us.expires_at > CURRENT_TIMESTAMP
            AND sp.role       = :role
        )
        """)
        .param("userId", userId)
        .param("role", role)
        .query(Boolean.class)
        .single();
    return Boolean.TRUE.equals(result);
  }

  Integer freeLimit(String featureKey) {
    return jdbcClient.sql("""
        SELECT free_limit FROM feature_entitlements
        WHERE feature_key = :featureKey AND plan_tier = 'FREE'
        """)
        .param("featureKey", featureKey)
        .query(Integer.class)
        .optional()
        .orElse(null);
  }

  int currentUsage(String userId, String featureKey) {
    Long count = jdbcClient.sql("""
        SELECT COUNT(*) FROM feature_usage_events
        WHERE user_id = :userId AND feature_key = :featureKey
        """)
        .param("userId", userId)
        .param("featureKey", featureKey)
        .query(Long.class)
        .single();
    return count == null ? 0 : count.intValue();
  }

  boolean alreadyConsumed(String userId, String featureKey, String resourceId) {
    Boolean result = jdbcClient.sql("""
        SELECT EXISTS (
          SELECT 1 FROM feature_usage_events
          WHERE user_id     = :userId
            AND feature_key = :featureKey
            AND resource_id = :resourceId
        )
        """)
        .param("userId", userId)
        .param("featureKey", featureKey)
        .param("resourceId", resourceId)
        .query(Boolean.class)
        .single();
    return Boolean.TRUE.equals(result);
  }

  void recordEvent(String userId, String featureKey, String resourceId) {
    jdbcClient.sql("""
        INSERT INTO feature_usage_events (user_id, feature_key, resource_id)
        VALUES (:userId, :featureKey, :resourceId)
        ON CONFLICT (user_id, feature_key, resource_id) DO NOTHING
        """)
        .param("userId", userId)
        .param("featureKey", featureKey)
        .param("resourceId", resourceId)
        .update();
  }
}
