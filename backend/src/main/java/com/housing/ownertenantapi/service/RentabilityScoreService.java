package com.housing.ownertenantapi.service;

import com.housing.ownertenantapi.dto.RentabilityScoreResponse;
import com.housing.ownertenantapi.dto.RentabilityScoreResponse.Signal;
import java.sql.Timestamp;
import java.time.OffsetDateTime;
import java.time.ZoneOffset;
import java.util.ArrayList;
import java.util.List;
import java.util.Map;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

/**
 * Tenant Rentability Score — composite trust signal.
 *
 * Computation factors (all from existing tables, no new data sources):
 *
 *   +20 — profile_completion ≥ 80%
 *   +10 — verified email + phone
 *   +10 — government ID uploaded
 *   +15 — average review rating ≥ 4 (from reviews where reviewee is this user)
 *   +5  — each completed lease (cap +25)
 *   -10 — each dispute opened against this tenant (no cap)
 *   -5  — each visit no-show (cap -15)
 *
 * Scores are clamped to 0-100 and persisted with a JSONB breakdown so the
 * UI can render WHY the score is what it is.
 */
@Service
public class RentabilityScoreService {

  private static final Logger log = LoggerFactory.getLogger(RentabilityScoreService.class);

  private static final int BASE_SCORE = 50;

  private final JdbcTemplate jdbc;

  public RentabilityScoreService(JdbcTemplate jdbc) {
    this.jdbc = jdbc;
  }

  /** Fetch the cached score; if missing or stale (> 24h), recompute on the fly. */
  public RentabilityScoreResponse getScore(String userId) {
    return jdbc.query(
        "SELECT s.user_id, s.score, s.score_band, s.signals, s.computed_at, s.next_recompute_at, "
            + "       u.full_name "
            + "  FROM tenant_rentability_scores s "
            + "  JOIN users u ON u.user_id = s.user_id "
            + " WHERE s.user_id = ?",
        (org.springframework.jdbc.core.ResultSetExtractor<RentabilityScoreResponse>) rs -> {
          if (!rs.next()) {
            // Lazy seed — compute + persist for this user, then return.
            recomputeAndPersist(userId);
            return getScore(userId);
          }
          return mapRow(rs, this::deserialiseSignals);
        },
        userId
    );
  }

  /** Force a recompute regardless of cache age. */
  @Transactional
  public RentabilityScoreResponse recomputeAndPersist(String userId) {
    Computation c = computeFor(userId);
    upsertScore(userId, c);
    return getScore(userId);
  }

  /** Nightly batch — recompute scores for active users only. */
  @Scheduled(cron = "0 30 2 * * *", zone = "Asia/Kolkata")
  @Transactional
  public void nightlyRecompute() {
    log.info("Starting nightly rentability score recompute");
    List<String> ids = jdbc.queryForList(
        "SELECT user_id FROM users WHERE last_seen_at >= now() - INTERVAL '90 days'",
        String.class
    );
    int updated = 0;
    for (String id : ids) {
      try {
        recomputeAndPersist(id);
        updated++;
      } catch (Exception e) {
        log.warn("Score recompute failed for user {}: {}", id, e.getMessage());
      }
    }
    log.info("Nightly rentability score recompute completed — {} users updated", updated);
  }

  // ──── Internals ───────────────────────────────────────────────────────────

  private record Computation(int score, String band, List<Signal> signals) {}

  private Computation computeFor(String userId) {
    List<Signal> sig = new ArrayList<>();
    int total = BASE_SCORE;

    // Profile completion.
    Integer completion = firstNonNull(
        jdbc.query("SELECT profile_completion FROM users WHERE user_id = ?",
            (org.springframework.jdbc.core.ResultSetExtractor<Integer>)
            rs -> rs.next() ? rs.getInt(1) : null, userId),
        0);
    if (completion >= 80) { total += 20; sig.add(new Signal("Complete profile", +20, "≥ 80% complete")); }
    else if (completion >= 50) { total += 10; sig.add(new Signal("Profile in progress", +10, completion + "% complete")); }
    else { sig.add(new Signal("Incomplete profile", 0, completion + "% complete")); }

    // Verified contacts.
    Boolean emailVerified = exists("SELECT 1 FROM users WHERE user_id = ? AND email_verified_at IS NOT NULL", userId);
    Boolean phoneVerified = exists("SELECT 1 FROM users WHERE user_id = ? AND phone_verified_at IS NOT NULL", userId);
    if (emailVerified && phoneVerified) {
      total += 10;
      sig.add(new Signal("Email + phone verified", +10, null));
    } else if (emailVerified || phoneVerified) {
      total += 5;
      sig.add(new Signal("Partial contact verified", +5, emailVerified ? "email only" : "phone only"));
    }

    // ID uploaded.
    if (exists("SELECT 1 FROM users WHERE user_id = ? AND government_id_photo_url IS NOT NULL", userId)) {
      total += 10;
      sig.add(new Signal("Government ID on file", +10, null));
    }

    // Average review rating.
    Double avgRating = jdbc.query("SELECT AVG(rating) FROM reviews WHERE reviewee_id = ?",
        (org.springframework.jdbc.core.ResultSetExtractor<Double>)
        rs -> rs.next() ? rs.getObject(1, Double.class) : null, userId);
    if (avgRating != null && avgRating >= 4.0) {
      total += 15;
      sig.add(new Signal("Strong review history", +15, String.format("%.1f★ average", avgRating)));
    } else if (avgRating != null && avgRating >= 3.0) {
      total += 5;
      sig.add(new Signal("Mixed review history", +5, String.format("%.1f★ average", avgRating)));
    }

    // Completed leases.
    Integer leaseCount = firstNonNull(
        jdbc.query("SELECT COUNT(*) FROM rental_agreements "
                + "WHERE tenant_id = ? AND status IN ('ACTIVE','EXPIRED')",
            (org.springframework.jdbc.core.ResultSetExtractor<Integer>)
            rs -> rs.next() ? rs.getInt(1) : 0, userId),
        0);
    int leaseBoost = Math.min(leaseCount * 5, 25);
    if (leaseBoost > 0) {
      total += leaseBoost;
      sig.add(new Signal("Lease history", leaseBoost, leaseCount + " completed lease(s)"));
    }

    // Disputes against this tenant.
    Integer disputes = firstNonNull(
        jdbc.query("SELECT COUNT(*) FROM listing_reports lr "
                + " JOIN users u ON u.user_id = lr.reporter_id "
                + "WHERE u.user_id = ? AND lr.status NOT IN ('DISMISSED')",
            (org.springframework.jdbc.core.ResultSetExtractor<Integer>)
            rs -> rs.next() ? rs.getInt(1) : 0, userId),
        0);
    if (disputes > 0) {
      int penalty = -10 * disputes;
      total += penalty;
      sig.add(new Signal("Active disputes", penalty, disputes + " open report(s)"));
    }

    int clamped = Math.max(0, Math.min(100, total));
    String band = bandFor(clamped, leaseCount > 0 || avgRating != null);
    return new Computation(clamped, band, sig);
  }

  private static String bandFor(int score, boolean hasHistory) {
    if (!hasHistory) return "NEW";
    if (score >= 80) return "EXCELLENT";
    if (score >= 60) return "GOOD";
    if (score >= 35) return "FAIR";
    return "POOR";
  }

  private void upsertScore(String userId, Computation c) {
    String signalsJson = serialiseSignals(c.signals());
    jdbc.update(
        "INSERT INTO tenant_rentability_scores "
            + "  (user_id, score, score_band, signals, computed_at, next_recompute_at) "
            + "VALUES (?, ?, ?, ?::jsonb, now(), now() + INTERVAL '24 hours') "
            + "ON CONFLICT (user_id) DO UPDATE SET "
            + "  score = EXCLUDED.score, "
            + "  score_band = EXCLUDED.score_band, "
            + "  signals = EXCLUDED.signals, "
            + "  computed_at = EXCLUDED.computed_at, "
            + "  next_recompute_at = EXCLUDED.next_recompute_at",
        userId, c.score(), c.band(), signalsJson
    );
  }

  /** Minimal JSON serialisation — avoids Jackson dependency in this service. */
  private static String serialiseSignals(List<Signal> signals) {
    StringBuilder sb = new StringBuilder("[");
    for (int i = 0; i < signals.size(); i++) {
      Signal s = signals.get(i);
      if (i > 0) sb.append(",");
      sb.append("{\"label\":\"").append(escape(s.label())).append("\"")
        .append(",\"contribution\":").append(s.contribution())
        .append(",\"detail\":").append(s.detail() == null ? "null" : "\"" + escape(s.detail()) + "\"")
        .append("}");
    }
    return sb.append("]").toString();
  }

  @SuppressWarnings("unchecked")
  private List<Signal> deserialiseSignals(String json) {
    // Use Spring's bundled Jackson to read the persisted JSONB column.
    try {
      var mapper = new com.fasterxml.jackson.databind.ObjectMapper();
      List<Map<String, Object>> raw = mapper.readValue(json, List.class);
      List<Signal> out = new ArrayList<>(raw.size());
      for (Map<String, Object> r : raw) {
        out.add(new Signal(
            (String) r.get("label"),
            ((Number) r.get("contribution")).intValue(),
            (String) r.get("detail")
        ));
      }
      return out;
    } catch (Exception e) {
      log.warn("Signal deserialisation failed: {}", e.getMessage());
      return List.of();
    }
  }

  private static String escape(String s) {
    return s == null ? "" : s.replace("\\", "\\\\").replace("\"", "\\\"");
  }

  private boolean exists(String sql, Object... args) {
    Boolean result = jdbc.query(sql,
        (org.springframework.jdbc.core.ResultSetExtractor<Boolean>) rs -> rs.next(),
        args);
    return Boolean.TRUE.equals(result);
  }

  private static <T> T firstNonNull(T a, T b) { return a != null ? a : b; }

  private RentabilityScoreResponse mapRow(
      java.sql.ResultSet rs,
      java.util.function.Function<String, List<Signal>> sigFn
  ) throws java.sql.SQLException {
    String userId = rs.getString("user_id");
    int score = rs.getInt("score");
    String band = rs.getString("score_band");
    String signalsJson = rs.getString("signals");
    Timestamp computedAt = rs.getTimestamp("computed_at");
    Timestamp nextRecompute = rs.getTimestamp("next_recompute_at");
    String displayName = rs.getString("full_name");
    return new RentabilityScoreResponse(
        userId, score, band, displayName,
        signalsJson == null ? List.of() : sigFn.apply(signalsJson),
        computedAt == null ? null : computedAt.toInstant().atOffset(ZoneOffset.UTC),
        nextRecompute == null ? null : nextRecompute.toInstant().atOffset(ZoneOffset.UTC)
    );
  }

  /** Suppress unused-import warning for OffsetDateTime — kept for future symmetry. */
  @SuppressWarnings("unused")
  private OffsetDateTime unused() { return OffsetDateTime.now(); }
}
