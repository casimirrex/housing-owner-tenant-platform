package com.housing.ownertenantapi.service;

import com.housing.ownertenantapi.dto.RoommateMatchesResponse;
import com.housing.ownertenantapi.dto.RoommateProfile;
import com.housing.ownertenantapi.dto.RoommateProfileRequest;
import java.sql.ResultSet;
import java.sql.SQLException;
import java.util.List;
import java.util.UUID;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.dao.EmptyResultDataAccessException;
import org.springframework.http.HttpStatus;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.jdbc.core.RowMapper;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

/**
 * Tier 2 — Roommate matching.
 *
 * Each user creates one roommate profile (lifestyle + budget + city).
 * findMatches() returns other active profiles in the same city, scored by
 * compatibility:
 *   • +25 lifestyle agreements (smoker, drinks, vegetarian, pet, early riser)
 *   • +20 budget overlap
 *   • +10 gender preference match
 * Profiles are sorted descending by score.
 */
@Service
public class RoommateService {

  private static final Logger log = LoggerFactory.getLogger(RoommateService.class);

  private final JdbcTemplate jdbcTemplate;
  private final CurrentSessionService currentSessionService;

  public RoommateService(JdbcTemplate jdbcTemplate, CurrentSessionService currentSessionService) {
    this.jdbcTemplate = jdbcTemplate;
    this.currentSessionService = currentSessionService;
  }

  @Transactional
  public RoommateProfile upsertProfile(String authorizationHeader, RoommateProfileRequest request) {
    String userId = currentSessionService.requireUserId(authorizationHeader);

    int rowsAffected = jdbcTemplate.update("""
            UPDATE roommate_profiles
            SET city = ?, preferred_areas = ?,
                budget_min = ?, budget_max = ?,
                move_in_date = CASE WHEN ? = '' THEN NULL ELSE CAST(? AS DATE) END,
                gender_preference = ?, occupation = ?,
                smoker = ?, drinks = ?, pet_friendly = ?, vegetarian = ?, early_riser = ?,
                bio = ?, active = TRUE, updated_at = now()
            WHERE user_id = ?
            """,
        request.city(), request.preferredAreas(),
        request.budgetMin(), request.budgetMax(),
        nullableDate(request.moveInDate()), nullableDate(request.moveInDate()),
        request.genderPreference() == null ? "ANY" : request.genderPreference(),
        request.occupation(),
        request.smoker(), request.drinks(), request.petFriendly(),
        request.vegetarian(), request.earlyRiser(),
        request.bio(),
        userId
    );

    if (rowsAffected == 0) {
      String profileId = "rmp_" + UUID.randomUUID().toString().replace("-", "").substring(0, 12);
      jdbcTemplate.update("""
              INSERT INTO roommate_profiles (
                profile_id, user_id, city, preferred_areas, budget_min, budget_max,
                move_in_date, gender_preference, occupation,
                smoker, drinks, pet_friendly, vegetarian, early_riser, bio, active
              )
              VALUES (?, ?, ?, ?, ?, ?,
                      CASE WHEN ? = '' THEN NULL ELSE CAST(? AS DATE) END,
                      ?, ?, ?, ?, ?, ?, ?, ?, TRUE)
              """,
          profileId, userId, request.city(), request.preferredAreas(),
          request.budgetMin(), request.budgetMax(),
          nullableDate(request.moveInDate()), nullableDate(request.moveInDate()),
          request.genderPreference() == null ? "ANY" : request.genderPreference(),
          request.occupation(),
          request.smoker(), request.drinks(), request.petFriendly(),
          request.vegetarian(), request.earlyRiser(),
          request.bio()
      );
      log.info("roommate profile created: id={} user={}", profileId, userId);
    } else {
      log.info("roommate profile updated: user={}", userId);
    }

    return getMyProfile(authorizationHeader);
  }

  public RoommateProfile getMyProfile(String authorizationHeader) {
    String userId = currentSessionService.requireUserId(authorizationHeader);
    try {
      return jdbcTemplate.queryForObject(
          baseSelect() + " WHERE r.user_id = ? LIMIT 1",
          new RoommateProfileMapper(0),
          userId
      );
    } catch (EmptyResultDataAccessException none) {
      throw new ResponseStatusException(HttpStatus.NOT_FOUND, "No roommate profile yet.");
    }
  }

  public RoommateMatchesResponse findMatches(String authorizationHeader, int limit) {
    int safeLimit = Math.min(Math.max(limit, 1), 50);
    String userId = currentSessionService.requireUserId(authorizationHeader);

    RoommateProfile me;
    try {
      me = getMyProfile(authorizationHeader);
    } catch (ResponseStatusException notFound) {
      // No profile yet — show 0 matches with a hint to create one.
      return new RoommateMatchesResponse(List.of(), 0);
    }

    List<RoommateProfile> candidates = jdbcTemplate.query(
        baseSelect() + " WHERE r.user_id <> ? AND r.active = TRUE AND lower(r.city) = lower(?) ",
        new RoommateProfileMapper(0),
        userId, me.city()
    );

    List<RoommateProfile> scored = candidates.stream()
        .map(other -> other.profileId() == null ? other : withScore(me, other))
        .sorted((a, b) -> Integer.compare(
            b.matchScore() == null ? 0 : b.matchScore(),
            a.matchScore() == null ? 0 : a.matchScore()))
        .limit(safeLimit)
        .toList();

    return new RoommateMatchesResponse(scored, scored.size());
  }

  /* ── helpers ─────────────────────────────────────────────────────────── */

  private RoommateProfile withScore(RoommateProfile me, RoommateProfile other) {
    int score = 0;

    // Lifestyle agreement: +5 per matching boolean (max 25)
    if (me.smoker() == other.smoker()) score += 5;
    if (me.drinks() == other.drinks()) score += 5;
    if (me.vegetarian() == other.vegetarian()) score += 5;
    if (me.petFriendly() == other.petFriendly()) score += 5;
    if (me.earlyRiser() == other.earlyRiser()) score += 5;

    // Budget overlap (+20 if their range overlaps mine, else 0)
    if (me.budgetMin() != null && me.budgetMax() != null
        && other.budgetMin() != null && other.budgetMax() != null) {
      int overlapLow = Math.max(me.budgetMin(), other.budgetMin());
      int overlapHigh = Math.min(me.budgetMax(), other.budgetMax());
      if (overlapHigh >= overlapLow) score += 20;
    }

    // Gender preference: +10 when either accepts ANY or both match
    if ("ANY".equals(me.genderPreference()) || "ANY".equals(other.genderPreference())
        || (me.genderPreference() != null && me.genderPreference().equals(other.genderPreference()))) {
      score += 10;
    }

    return new RoommateProfile(
        other.profileId(), other.userId(), other.fullName(),
        other.city(), other.preferredAreas(),
        other.budgetMin(), other.budgetMax(),
        other.moveInDate(), other.genderPreference(), other.occupation(),
        other.smoker(), other.drinks(), other.petFriendly(),
        other.vegetarian(), other.earlyRiser(),
        other.bio(), other.active(), score
    );
  }

  private String nullableDate(String value) {
    return value == null ? "" : value;
  }

  private static String baseSelect() {
    return """
        SELECT r.profile_id, r.user_id,
               COALESCE(u.full_name, '') AS full_name,
               r.city, r.preferred_areas, r.budget_min, r.budget_max,
               CASE WHEN r.move_in_date IS NULL THEN NULL
                    ELSE to_char(r.move_in_date, 'YYYY-MM-DD') END AS move_in_date,
               r.gender_preference, r.occupation,
               r.smoker, r.drinks, r.pet_friendly, r.vegetarian, r.early_riser,
               r.bio, r.active
        FROM roommate_profiles r
        LEFT JOIN users u ON u.user_id = r.user_id
        """;
  }

  private static final class RoommateProfileMapper implements RowMapper<RoommateProfile> {
    private final Integer score;
    RoommateProfileMapper(Integer score) { this.score = score; }

    @Override
    public RoommateProfile mapRow(ResultSet rs, int rowNum) throws SQLException {
      Integer budgetMin = (Integer) rs.getObject("budget_min");
      Integer budgetMax = (Integer) rs.getObject("budget_max");
      return new RoommateProfile(
          rs.getString("profile_id"),
          rs.getString("user_id"),
          rs.getString("full_name"),
          rs.getString("city"),
          rs.getString("preferred_areas"),
          budgetMin, budgetMax,
          rs.getString("move_in_date"),
          rs.getString("gender_preference"),
          rs.getString("occupation"),
          rs.getBoolean("smoker"),
          rs.getBoolean("drinks"),
          rs.getBoolean("pet_friendly"),
          rs.getBoolean("vegetarian"),
          rs.getBoolean("early_riser"),
          rs.getString("bio"),
          rs.getBoolean("active"),
          score
      );
    }
  }
}
