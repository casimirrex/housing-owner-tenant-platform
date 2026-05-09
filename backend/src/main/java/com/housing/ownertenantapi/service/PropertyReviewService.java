package com.housing.ownertenantapi.service;

import com.housing.ownertenantapi.dto.ReviewEligibilityResponse;
import com.housing.ownertenantapi.dto.ReviewSubmitRequest;
import com.housing.ownertenantapi.dto.ReviewSubmittedResponse;
import java.time.LocalDate;
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
 * Tier 0 trust & safety — verified-stay review gating.
 *
 * Rules enforced server-side:
 *   1. The reviewer must be authenticated.
 *   2. The reviewer must have at least one visits row for the listing where
 *      status = 'COMPLETED'. We pick the earliest such visit and link it on
 *      the review row.
 *   3. The same visit cannot be reviewed twice.
 *
 * The current PropertyReviewService writes to property_reviews; that table
 * gained a `visit_id` column in migration 2026-05-09_trust_and_safety.sql.
 * Reviews submitted via this path always carry a visit_id so the UI can
 * stamp them as "Verified stay".
 */
@Service
public class PropertyReviewService {

  private static final Logger log = LoggerFactory.getLogger(PropertyReviewService.class);

  private final JdbcTemplate jdbcTemplate;
  private final CurrentSessionService currentSessionService;

  public PropertyReviewService(
      JdbcTemplate jdbcTemplate,
      CurrentSessionService currentSessionService
  ) {
    this.jdbcTemplate = jdbcTemplate;
    this.currentSessionService = currentSessionService;
  }

  public ReviewEligibilityResponse getEligibility(String authorizationHeader, String listingId) {
    String userId;
    try {
      userId = currentSessionService.resolveUserId(authorizationHeader);
    } catch (ResponseStatusException unauthenticated) {
      return new ReviewEligibilityResponse(false, "NOT_AUTHENTICATED",
          "Sign in to leave a review.");
    }

    Integer visitsTotal = jdbcTemplate.queryForObject(
        "SELECT COUNT(*) FROM visits WHERE user_id = ? AND listing_id = ?",
        Integer.class,
        userId,
        listingId
    );
    if (visitsTotal == null || visitsTotal == 0) {
      return new ReviewEligibilityResponse(false, "NEEDS_VISIT",
          "Schedule a visit before leaving a review.");
    }

    Integer completedVisits = jdbcTemplate.queryForObject(
        "SELECT COUNT(*) FROM visits WHERE user_id = ? AND listing_id = ? AND status = 'COMPLETED'",
        Integer.class,
        userId,
        listingId
    );
    if (completedVisits == null || completedVisits == 0) {
      return new ReviewEligibilityResponse(false, "VISIT_NOT_COMPLETED",
          "We'll unlock the review form once your visit is marked completed.");
    }

    String unreviewedVisitId = findUnreviewedCompletedVisit(userId, listingId);
    if (unreviewedVisitId == null) {
      return new ReviewEligibilityResponse(false, "ALREADY_REVIEWED",
          "You've already reviewed this listing.");
    }

    return new ReviewEligibilityResponse(true, "OK",
        "Share what you experienced — only verified stays can leave a review.");
  }

  @Transactional
  public ReviewSubmittedResponse submit(
      String authorizationHeader,
      String listingId,
      ReviewSubmitRequest request
  ) {
    String userId = currentSessionService.resolveUserId(authorizationHeader);

    String visitId = findUnreviewedCompletedVisit(userId, listingId);
    if (visitId == null) {
      // Distinguish the two failure modes for a friendlier 4xx.
      Integer completedVisits = jdbcTemplate.queryForObject(
          "SELECT COUNT(*) FROM visits WHERE user_id = ? AND listing_id = ? AND status = 'COMPLETED'",
          Integer.class,
          userId,
          listingId
      );
      if (completedVisits == null || completedVisits == 0) {
        throw new ResponseStatusException(HttpStatus.FORBIDDEN,
            "Only users with a completed visit can review this listing.");
      }
      throw new ResponseStatusException(HttpStatus.CONFLICT,
          "You've already reviewed this listing.");
    }

    String reviewerName = jdbcTemplate.queryForObject(
        "SELECT COALESCE(NULLIF(full_name, ''), 'Verified guest') FROM users WHERE user_id = ?",
        String.class,
        userId
    );

    String reviewId = "rev_" + UUID.randomUUID().toString().replace("-", "").substring(0, 12);

    jdbcTemplate.update("""
            INSERT INTO property_reviews (
              review_id, listing_id, reviewer_name, rating, headline, comment,
              reviewer_type, created_at, visit_id
            )
            VALUES (?, ?, ?, ?, ?, ?, 'TENANT', ?, ?)
            """,
        reviewId,
        listingId,
        reviewerName,
        request.rating(),
        request.headline(),
        request.comment(),
        LocalDate.now(),
        visitId
    );

    log.info("review submitted: review={} listing={} user={} visit={} rating={}",
        reviewId, listingId, userId, visitId, request.rating());

    return new ReviewSubmittedResponse(reviewId, listingId, visitId, request.rating(), true);
  }

  /**
   * Returns the visit_id of the earliest COMPLETED visit by this user for this
   * listing that has not yet been linked to a review, or null when none exist.
   */
  private String findUnreviewedCompletedVisit(String userId, String listingId) {
    try {
      return jdbcTemplate.queryForObject("""
              SELECT v.visit_id
              FROM visits v
              WHERE v.user_id = ?
                AND v.listing_id = ?
                AND v.status = 'COMPLETED'
                AND NOT EXISTS (
                  SELECT 1 FROM property_reviews r
                  WHERE r.visit_id = v.visit_id
                )
              ORDER BY v.scheduled_at ASC
              LIMIT 1
              """,
          String.class,
          userId,
          listingId
      );
    } catch (EmptyResultDataAccessException none) {
      return null;
    }
  }
}
