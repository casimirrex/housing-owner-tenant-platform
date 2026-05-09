package com.housing.ownertenantapi.service;

import com.housing.ownertenantapi.dto.UserBlockListResponse;
import com.housing.ownertenantapi.dto.UserBlockRequest;
import com.housing.ownertenantapi.dto.UserBlockResponse;
import java.time.OffsetDateTime;
import java.time.ZoneOffset;
import java.time.format.DateTimeFormatter;
import java.time.temporal.ChronoUnit;
import java.util.List;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.dao.DuplicateKeyException;
import org.springframework.http.HttpStatus;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

/**
 * Tier 0 trust & safety — user blocks.
 *
 * A block is a directional relationship: blocker → blocked. The blocker stops
 * seeing chats and listings from the blocked user. Existing chat threads
 * remain in the database; the chat list query filters them out at read time.
 */
@Service
public class UserBlockService {

  private static final Logger log = LoggerFactory.getLogger(UserBlockService.class);
  private static final DateTimeFormatter ISO = DateTimeFormatter.ISO_OFFSET_DATE_TIME;

  private final JdbcTemplate jdbcTemplate;
  private final CurrentSessionService currentSessionService;

  public UserBlockService(
      JdbcTemplate jdbcTemplate,
      CurrentSessionService currentSessionService
  ) {
    this.jdbcTemplate = jdbcTemplate;
    this.currentSessionService = currentSessionService;
  }

  @Transactional
  public UserBlockResponse block(String authorizationHeader, UserBlockRequest request) {
    String blockerUserId = currentSessionService.resolveUserId(authorizationHeader);
    String blockedUserId = request.userId();

    if (blockerUserId.equals(blockedUserId)) {
      throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "You cannot block yourself.");
    }

    Integer exists = jdbcTemplate.queryForObject(
        "SELECT COUNT(*) FROM users WHERE user_id = ?",
        Integer.class,
        blockedUserId
    );
    if (exists == null || exists == 0) {
      throw new ResponseStatusException(HttpStatus.NOT_FOUND, "User not found: " + blockedUserId);
    }

    OffsetDateTime now = OffsetDateTime.now(ZoneOffset.UTC).truncatedTo(ChronoUnit.SECONDS);

    try {
      jdbcTemplate.update("""
              INSERT INTO user_blocks (blocker_user_id, blocked_user_id, reason, created_at)
              VALUES (?, ?, ?, ?::timestamptz)
              """,
          blockerUserId,
          blockedUserId,
          request.reason(),
          now.format(ISO)
      );
      log.info("user block created: blocker={} blocked={}", blockerUserId, blockedUserId);
    } catch (DuplicateKeyException duplicate) {
      // Already blocked — no-op, return the existing row.
      log.debug("block already exists: blocker={} blocked={}", blockerUserId, blockedUserId);
    }

    return jdbcTemplate.queryForObject("""
            SELECT blocker_user_id, blocked_user_id, reason,
                   to_char(created_at AT TIME ZONE 'UTC', 'YYYY-MM-DD"T"HH24:MI:SS"Z"') AS created_at
            FROM user_blocks
            WHERE blocker_user_id = ? AND blocked_user_id = ?
            """,
        (rs, rowNum) -> new UserBlockResponse(
            rs.getString("blocker_user_id"),
            rs.getString("blocked_user_id"),
            rs.getString("reason"),
            rs.getString("created_at")
        ),
        blockerUserId,
        blockedUserId
    );
  }

  @Transactional
  public void unblock(String authorizationHeader, String blockedUserId) {
    String blockerUserId = currentSessionService.resolveUserId(authorizationHeader);
    int deleted = jdbcTemplate.update(
        "DELETE FROM user_blocks WHERE blocker_user_id = ? AND blocked_user_id = ?",
        blockerUserId,
        blockedUserId
    );
    if (deleted == 0) {
      throw new ResponseStatusException(HttpStatus.NOT_FOUND,
          "No block exists for that user.");
    }
    log.info("user block removed: blocker={} blocked={}", blockerUserId, blockedUserId);
  }

  public UserBlockListResponse list(String authorizationHeader) {
    String blockerUserId = currentSessionService.resolveUserId(authorizationHeader);
    List<UserBlockResponse> items = jdbcTemplate.query("""
            SELECT blocker_user_id, blocked_user_id, reason,
                   to_char(created_at AT TIME ZONE 'UTC', 'YYYY-MM-DD"T"HH24:MI:SS"Z"') AS created_at
            FROM user_blocks
            WHERE blocker_user_id = ?
            ORDER BY created_at DESC
            """,
        (rs, rowNum) -> new UserBlockResponse(
            rs.getString("blocker_user_id"),
            rs.getString("blocked_user_id"),
            rs.getString("reason"),
            rs.getString("created_at")
        ),
        blockerUserId
    );
    return new UserBlockListResponse(items, items.size());
  }
}
