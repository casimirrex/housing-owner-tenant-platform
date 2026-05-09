package com.housing.ownertenantapi.service;

import com.housing.ownertenantapi.dto.OwnerReviewItem;
import com.housing.ownertenantapi.dto.OwnerReviewsResponse;
import com.housing.ownertenantapi.dto.ReviewEligibilityResponse;
import com.housing.ownertenantapi.dto.ReviewSubmitRequest;
import com.housing.ownertenantapi.dto.ReviewSubmittedResponse;
import java.util.List;
import java.util.UUID;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.dao.EmptyResultDataAccessException;
import org.springframework.http.HttpStatus;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

/**
 * Tier 1 — Tenant rates owner.
 *
 * Mirrors PropertyReviewService but for the *owner* side: a tenant can leave
 * a review of a specific owner after a COMPLETED visit on any of that owner's
 * listings. Each visit yields at most one owner review.
 */
@Service
public class OwnerReviewService {

  private static final Logger log = LoggerFactory.getLogger(OwnerReviewService.class);

  private final JdbcTemplate jdbcTemplate;
  private final CurrentSessionService currentSessionService;

  public OwnerReviewService(
      JdbcTemplate jdbcTemplate,
      CurrentSessionService currentSessionService
  ) {
    this.jdbcTemplate = jdbcTemplate;
    this.currentSessionService = currentSessionService;
  }

  public OwnerReviewsResponse list(String ownerId, int limit) {
    int safeLimit = Math.min(Math.max(limit, 1), 50);

    Integer count = jdbcTemplate.queryForObject(
        "SELECT COUNT(*) FROM owner_reviews WHERE owner_id = ?",
        Integer.class, ownerId
    );
    Double avg = jdbcTemplate.queryForObject(
        "SELECT COALESCE(AVG(rating)::numeric, 0)::float8 FROM owner_reviews WHERE owner_id = ?",
        Double.class, ownerId
    );
    List<OwnerReviewItem> items = jdbcTemplate.query("""
            SELECT review_id, owner_id, reviewer_name, rating, headline, comment,
                   to_char(created_at AT TIME ZONE 'UTC', 'YYYY-MM-DD"T"HH24:MI:SS"Z"') AS created_at
            FROM owner_reviews
            WHERE owner_id = ?
            ORDER BY created_at DESC
            LIMIT ?
            """,
        (rs, rowNum) -> new OwnerReviewItem(
            rs.getString("review_id"),
            rs.getString("owner_id"),
            rs.getString("reviewer_name"),
            rs.getInt("rating"),
            rs.getString("headline"),
            rs.getString("comment"),
            rs.getString("created_at")
        ),
        ownerId, safeLimit
    );

    double rounded = avg == null ? 0.0 : Math.round(avg * 10.0) / 10.0;
    return new OwnerReviewsResponse(ownerId, rounded, count == null ? 0 : count, items);
  }

  public ReviewEligibilityResponse getEligibility(String authorizationHeader, String ownerId) {
    String userId;
    try {
      userId = currentSessionService.resolveUserId(authorizationHeader);
    } catch (ResponseStatusException unauthenticated) {
      return new ReviewEligibilityResponse(false, "NOT_AUTHENTICATED",
          "Sign in to leave a review.");
    }
    if (userId.equals(ownerId)) {
      return new ReviewEligibilityResponse(false, "ALREADY_REVIEWED",
          "You can't review yourself.");
    }
    if (findUnreviewedCompletedVisitForOwner(userId, ownerId) == null) {
      Integer completed = jdbcTemplate.queryForObject("""
              SELECT COUNT(*) FROM visits v
              JOIN listings l ON l.listing_id = v.listing_id
              WHERE v.user_id = ? AND l.owner_id = ? AND v.status = 'COMPLETED'
              """,
          Integer.class, userId, ownerId
      );
      if (completed == null || completed == 0) {
        return new ReviewEligibilityResponse(false, "VISIT_NOT_COMPLETED",
            "Schedule and complete a visit before reviewing this owner.");
      }
      return new ReviewEligibilityResponse(false, "ALREADY_REVIEWED",
          "You've already reviewed this owner for your completed visit.");
    }
    return new ReviewEligibilityResponse(true, "OK", "Share your visit experience.");
  }

  @Transactional
  public ReviewSubmittedResponse submit(
      String authorizationHeader,
      String ownerId,
      ReviewSubmitRequest request
  ) {
    String userId = currentSessionService.resolveUserId(authorizationHeader);
    if (userId.equals(ownerId)) {
      throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "You can't review yourself.");
    }
    String visitId = findUnreviewedCompletedVisitForOwner(userId, ownerId);
    if (visitId == null) {
      throw new ResponseStatusException(HttpStatus.FORBIDDEN,
          "Only users with a completed visit on this owner's listing can review.");
    }
    String reviewerName = jdbcTemplate.queryForObject(
        "SELECT COALESCE(NULLIF(full_name, ''), 'Verified guest') FROM users WHERE user_id = ?",
        String.class, userId
    );
    String reviewId = "ovw_" + UUID.randomUUID().toString().replace("-", "").substring(0, 12);
    jdbcTemplate.update("""
            INSERT INTO owner_reviews (review_id, owner_id, reviewer_id, reviewer_name,
                                       rating, headline, comment, visit_id)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?)
            """,
        reviewId, ownerId, userId, reviewerName,
        request.rating(), request.headline(), request.comment(), visitId
    );
    log.info("owner review created: review={} owner={} reviewer={} visit={}",
        reviewId, ownerId, userId, visitId);
    return new ReviewSubmittedResponse(reviewId, ownerId, visitId, request.rating(), true);
  }

  private String findUnreviewedCompletedVisitForOwner(String userId, String ownerId) {
    try {
      return jdbcTemplate.queryForObject("""
              SELECT v.visit_id
              FROM visits v
              JOIN listings l ON l.listing_id = v.listing_id
              WHERE v.user_id = ?
                AND l.owner_id = ?
                AND v.status = 'COMPLETED'
                AND NOT EXISTS (
                  SELECT 1 FROM owner_reviews r WHERE r.visit_id = v.visit_id
                )
              ORDER BY v.scheduled_at ASC
              LIMIT 1
              """,
          String.class, userId, ownerId
      );
    } catch (EmptyResultDataAccessException none) {
      return null;
    }
  }
}
