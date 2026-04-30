package com.housing.ownertenantapi.service;

import java.time.OffsetDateTime;
import java.util.List;
import org.springframework.dao.DuplicateKeyException;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.jdbc.core.simple.JdbcClient;
import org.springframework.stereotype.Service;

/**
 * P3 — Persisted webhook event store.
 *
 * Every inbound Stripe / Razorpay webhook is written here BEFORE the handler
 * touches business state. This gives:
 *   • Replay protection via the provider's event_id (PK).
 *   • Crash-safe reprocessing — a background sweeper can pick up RECEIVED /
 *     FAILED rows older than N seconds and retry with exponential backoff.
 *   • Audit trail for settlement reconciliation.
 */
@Service
public class PaymentWebhookEventStore {

  public enum Status { RECEIVED, PROCESSED, FAILED, DLQ }

  private final JdbcClient jdbcClient;

  public PaymentWebhookEventStore(JdbcTemplate jdbcTemplate) {
    this.jdbcClient = JdbcClient.create(jdbcTemplate);
  }

  /**
   * Record the raw event. Returns {@code true} on first receipt, {@code false}
   * if the event_id was already stored (= replay from provider; safe to
   * acknowledge without reprocessing).
   */
  public boolean record(String eventId, String provider, String eventType,
                        String rawPayload, String signature) {
    try {
      jdbcClient.sql(
              "INSERT INTO payment_webhook_events"
            + " (event_id, provider, event_type, payload_json, signature, status)"
            + " VALUES (:id, :p, :t, :pl, :s, 'RECEIVED')")
          .param("id", eventId)
          .param("p", provider)
          .param("t", eventType)
          .param("pl", rawPayload)
          .param("s", signature)
          .update();
      return true;
    } catch (DuplicateKeyException dup) {
      return false;
    }
  }

  public void markProcessed(String eventId) {
    jdbcClient.sql(
            "UPDATE payment_webhook_events"
          + "   SET status = 'PROCESSED', processed_at = NOW()"
          + " WHERE event_id = :id")
        .param("id", eventId)
        .update();
  }

  public void markFailed(String eventId, String error) {
    jdbcClient.sql(
            "UPDATE payment_webhook_events"
          + "   SET status = CASE WHEN attempts >= 5 THEN 'DLQ' ELSE 'FAILED' END,"
          + "       attempts = attempts + 1,"
          + "       last_error = :err"
          + " WHERE event_id = :id")
        .param("id", eventId)
        .param("err", truncate(error))
        .update();
  }

  /** Used by the retry sweeper. */
  public List<PendingEvent> fetchRetryBatch(int limit) {
    return jdbcClient.sql(
            "SELECT event_id, provider, event_type, payload_json, attempts"
          + "  FROM payment_webhook_events"
          + " WHERE status IN ('RECEIVED','FAILED')"
          + "   AND received_at < NOW() - INTERVAL '30 seconds'"
          + " ORDER BY received_at"
          + " LIMIT :n")
        .param("n", limit)
        .query((rs, rn) -> new PendingEvent(
            rs.getString("event_id"),
            rs.getString("provider"),
            rs.getString("event_type"),
            rs.getString("payload_json"),
            rs.getInt("attempts")))
        .list();
  }

  private static String truncate(String s) {
    if (s == null) return null;
    return s.length() > 1000 ? s.substring(0, 1000) : s;
  }

  public record PendingEvent(String eventId, String provider, String eventType,
                             String payloadJson, int attempts) {}
}
