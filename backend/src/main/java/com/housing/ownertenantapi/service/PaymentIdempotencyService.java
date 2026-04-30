package com.housing.ownertenantapi.service;

import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.security.NoSuchAlgorithmException;
import java.time.Duration;
import java.util.HexFormat;
import java.util.Optional;
import org.springframework.dao.DuplicateKeyException;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.jdbc.core.simple.JdbcClient;
import org.springframework.stereotype.Service;

/**
 * P3 — Payment idempotency store.
 *
 * Contract: every POST on a money-moving endpoint MUST send an
 * {@code Idempotency-Key} header. The first call for a given (key, user)
 * pair persists the response; any retry returns the stored response verbatim
 * — so a flaky network or a Stripe / Razorpay re-submit cannot double-charge.
 *
 * Mirrors Stripe's own idempotency semantics (24 h retention, rejects key
 * reuse with a different request body).
 */
@Service
public class PaymentIdempotencyService {

  /** How long a key is honoured. 24h matches Stripe's window. */
  public static final Duration RETENTION = Duration.ofHours(24);

  private final JdbcClient jdbcClient;

  public PaymentIdempotencyService(JdbcTemplate jdbcTemplate) {
    this.jdbcClient = JdbcClient.create(jdbcTemplate);
  }

  /** Look up a previously-stored response for this key / user. */
  public Optional<StoredResponse> find(String idemKey, String userId) {
    return jdbcClient.sql(
            "SELECT endpoint, request_hash, response_status, response_json"
          + "  FROM payment_idempotency"
          + " WHERE idem_key = :k AND user_id = :u"
          + "   AND created_at > NOW() - INTERVAL '24 hours'")
        .param("k", idemKey)
        .param("u", userId)
        .query((rs, rn) -> new StoredResponse(
            rs.getString("endpoint"),
            rs.getString("request_hash"),
            rs.getInt("response_status"),
            rs.getString("response_json")))
        .optional();
  }

  /**
   * Atomically persist a successful first-call response. Returns {@code true}
   * on insert, {@code false} if another request already claimed the key (the
   * caller should then re-read with {@link #find}).
   */
  public boolean store(
      String idemKey, String userId, String endpoint,
      String requestHash, int responseStatus, String responseJson) {
    try {
      jdbcClient.sql(
              "INSERT INTO payment_idempotency "
            + " (idem_key, user_id, endpoint, request_hash, response_status, response_json) "
            + "VALUES (:k, :u, :e, :h, :s, :j)")
          .param("k", idemKey)
          .param("u", userId)
          .param("e", endpoint)
          .param("h", requestHash)
          .param("s", responseStatus)
          .param("j", responseJson)
          .update();
      return true;
    } catch (DuplicateKeyException dup) {
      return false;
    }
  }

  /** SHA-256 hex digest of the raw request body — used to reject key reuse. */
  public static String hashBody(String body) {
    try {
      MessageDigest md = MessageDigest.getInstance("SHA-256");
      return HexFormat.of().formatHex(md.digest(body.getBytes(StandardCharsets.UTF_8)));
    } catch (NoSuchAlgorithmException e) {
      throw new IllegalStateException("SHA-256 unavailable", e);
    }
  }

  public record StoredResponse(String endpoint, String requestHash,
                               int responseStatus, String responseJson) {}
}
