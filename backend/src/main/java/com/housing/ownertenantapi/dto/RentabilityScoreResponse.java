package com.housing.ownertenantapi.dto;

import java.time.OffsetDateTime;
import java.util.List;

/**
 * Tenant Rentability Score — composite trust signal computed from on-platform
 * behaviour. Bands:
 *   POOR < 35 < FAIR < 60 < GOOD < 80 < EXCELLENT
 *   NEW band is reserved for users with too little history to score.
 *
 * `signals` is a flat list of contribution factors so the UI can render a
 * transparent breakdown — owners see WHY a tenant is rated X.
 */
public record RentabilityScoreResponse(
    String userId,
    int score,
    String scoreBand,
    String displayName,
    List<Signal> signals,
    OffsetDateTime computedAt,
    OffsetDateTime nextRecomputeAt
) {
  public record Signal(
      String label,        // human-readable, i18n-friendly
      int contribution,    // signed integer, e.g. +10 or -5
      String detail        // optional one-line explanation
  ) {}
}
