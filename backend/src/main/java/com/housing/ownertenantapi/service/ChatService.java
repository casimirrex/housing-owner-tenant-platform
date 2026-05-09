package com.housing.ownertenantapi.service;

import com.housing.ownertenantapi.dto.ChatMessagesResponse;
import com.housing.ownertenantapi.dto.ChatMessagesResponse.Message;
import com.housing.ownertenantapi.dto.ChatThreadResponse;
import java.time.OffsetDateTime;
import java.time.ZoneOffset;
import java.time.format.DateTimeFormatter;
import java.time.temporal.ChronoUnit;
import java.util.List;
import java.util.UUID;
import org.springframework.http.HttpStatus;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.jdbc.core.simple.JdbcClient;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

/**
 * Tier 2 #6 — In-app Chat (polling-based).
 *
 * One thread per (listing, tenant, owner). Tenant initiates by calling
 * startThread(listingId); reusing an existing thread is automatic via the
 * UNIQUE constraint. Both parties send via sendMessage. Frontend polls
 * fetchMessages every ~5 seconds — no WebSocket infrastructure.
 *
 * Owner cannot start threads — they reply only after a tenant has reached out.
 */
@Service
public class ChatService {

  private static final DateTimeFormatter ISO = DateTimeFormatter.ISO_OFFSET_DATE_TIME;
  private static final int PREVIEW_MAX_CHARS = 80;

  private final JdbcClient jdbcClient;

  public ChatService(JdbcTemplate jdbcTemplate) {
    this.jdbcClient = JdbcClient.create(jdbcTemplate);
  }

  /* ── Tenant: open or reuse a thread ─────────────────────────────────── */

  @Transactional
  public ChatThreadResponse startThread(String tenantId, String listingId) {
    // 1. Verify the listing exists, is published, and grab the owner.
    var listing = jdbcClient.sql("""
            SELECT listing_id, owner_id, status, title, locality, city
            FROM listings WHERE listing_id = :listingId
            """)
        .param("listingId", listingId)
        .query((rs, rowNum) -> new ListingMeta(
            rs.getString("listing_id"),
            rs.getString("owner_id"),
            rs.getString("status"),
            rs.getString("title"),
            rs.getString("locality"),
            rs.getString("city")
        ))
        .optional()
        .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Listing not found."));

    if (!"PUBLISHED".equalsIgnoreCase(listing.status())) {
      throw new ResponseStatusException(HttpStatus.BAD_REQUEST,
          "This listing is not available for messaging.");
    }
    if (tenantId.equals(listing.ownerId())) {
      throw new ResponseStatusException(HttpStatus.BAD_REQUEST,
          "You can't message yourself about your own listing.");
    }

    OffsetDateTime now = OffsetDateTime.now(ZoneOffset.UTC).truncatedTo(ChronoUnit.SECONDS);
    String threadId = "th_" + UUID.randomUUID().toString().replace("-", "").substring(0, 12);

    // 2. Insert-or-reuse via ON CONFLICT.
    jdbcClient.sql("""
            INSERT INTO chat_threads (thread_id, listing_id, tenant_id, owner_id, created_at, updated_at)
            VALUES (:threadId, :listingId, :tenantId, :ownerId, :now, :now)
            ON CONFLICT (listing_id, tenant_id, owner_id) DO NOTHING
            """)
        .param("threadId", threadId)
        .param("listingId", listingId)
        .param("tenantId", tenantId)
        .param("ownerId", listing.ownerId())
        .param("now", now)
        .update();

    // 3. Read back the (possibly pre-existing) thread.
    return loadThread(tenantId, threadId, listingId, listing.ownerId());
  }

  /* ── Inbox: list my threads (works for tenant or owner) ─────────────── */

  public List<ChatThreadResponse> listThreads(String userId) {
    return jdbcClient.sql("""
            SELECT t.thread_id, t.listing_id, t.tenant_id, t.owner_id,
                   t.last_message_at, t.last_message_preview,
                   l.title, l.locality, l.city,
                   CASE WHEN t.tenant_id = :userId THEN t.owner_id ELSE t.tenant_id END AS counterparty_id,
                   CASE WHEN t.tenant_id = :userId THEN o.full_name ELSE te.full_name END AS counterparty_name,
                   CASE WHEN t.tenant_id = :userId THEN 'TENANT' ELSE 'OWNER' END AS my_role,
                   COALESCE((
                     SELECT COUNT(*) FROM chat_messages m
                     WHERE m.thread_id = t.thread_id
                       AND m.sender_id <> :userId
                       AND m.read_at IS NULL
                   ), 0) AS unread_count
            FROM chat_threads t
            JOIN listings l ON l.listing_id = t.listing_id
            JOIN users te ON te.user_id = t.tenant_id
            JOIN users o  ON o.user_id  = t.owner_id
            WHERE (t.tenant_id = :userId OR t.owner_id = :userId)
              AND NOT EXISTS (
                SELECT 1 FROM user_blocks b
                WHERE b.blocker_user_id = :userId
                  AND b.blocked_user_id = CASE WHEN t.tenant_id = :userId
                                               THEN t.owner_id
                                               ELSE t.tenant_id END
              )
            ORDER BY COALESCE(t.last_message_at, t.created_at) DESC
            LIMIT 100
            """)
        .param("userId", userId)
        .query((rs, rowNum) -> new ChatThreadResponse(
            rs.getString("thread_id"),
            rs.getString("listing_id"),
            rs.getString("title"),
            rs.getString("locality"),
            rs.getString("city"),
            rs.getString("counterparty_id"),
            rs.getString("counterparty_name"),
            rs.getString("my_role"),
            rs.getString("last_message_preview"),
            formatNullableTimestamp(rs.getObject("last_message_at", OffsetDateTime.class)),
            rs.getLong("unread_count")
        ))
        .list();
  }

  /* ── Fetch messages in a thread ─────────────────────────────────────── */

  public ChatMessagesResponse fetchMessages(String userId, String threadId) {
    requireParticipant(userId, threadId);

    List<Message> messages = jdbcClient.sql("""
            SELECT m.message_id, m.sender_id, u.full_name AS sender_name,
                   m.content, m.sent_at, m.read_at
            FROM chat_messages m
            JOIN users u ON u.user_id = m.sender_id
            WHERE m.thread_id = :threadId
            ORDER BY m.sent_at ASC
            LIMIT 500
            """)
        .param("threadId", threadId)
        .query((rs, rowNum) -> {
          String senderId = rs.getString("sender_id");
          OffsetDateTime readAt = rs.getObject("read_at", OffsetDateTime.class);
          return new Message(
              rs.getString("message_id"),
              senderId,
              rs.getString("sender_name"),
              senderId.equals(userId),
              rs.getString("content"),
              ISO.format(rs.getObject("sent_at", OffsetDateTime.class)),
              readAt != null
          );
        })
        .list();

    return new ChatMessagesResponse(messages);
  }

  /* ── Send a message ─────────────────────────────────────────────────── */

  @Transactional
  public ChatMessagesResponse.Message sendMessage(String senderId, String threadId, String content) {
    if (content == null || content.isBlank()) {
      throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Message cannot be empty.");
    }
    String trimmed = content.trim();
    if (trimmed.length() > 1000) {
      throw new ResponseStatusException(HttpStatus.BAD_REQUEST,
          "Message exceeds 1000 characters.");
    }
    requireParticipant(senderId, threadId);

    String messageId = "msg_" + UUID.randomUUID().toString().replace("-", "").substring(0, 16);
    OffsetDateTime now = OffsetDateTime.now(ZoneOffset.UTC).truncatedTo(ChronoUnit.SECONDS);

    jdbcClient.sql("""
            INSERT INTO chat_messages (message_id, thread_id, sender_id, content, sent_at)
            VALUES (:messageId, :threadId, :senderId, :content, :sentAt)
            """)
        .param("messageId", messageId)
        .param("threadId", threadId)
        .param("senderId", senderId)
        .param("content", trimmed)
        .param("sentAt", now)
        .update();

    String preview = trimmed.length() > PREVIEW_MAX_CHARS
        ? trimmed.substring(0, PREVIEW_MAX_CHARS - 1) + "…"
        : trimmed;
    jdbcClient.sql("""
            UPDATE chat_threads
            SET last_message_at = :now,
                last_message_preview = :preview,
                updated_at = :now
            WHERE thread_id = :threadId
            """)
        .param("now", now)
        .param("preview", preview)
        .param("threadId", threadId)
        .update();

    String senderName = jdbcClient.sql("SELECT full_name FROM users WHERE user_id = :id")
        .param("id", senderId)
        .query(String.class)
        .optional()
        .orElse("Unknown");

    return new ChatMessagesResponse.Message(
        messageId, senderId, senderName, true, trimmed, ISO.format(now), false
    );
  }

  /* ── Mark thread read by current user ───────────────────────────────── */

  @Transactional
  public void markThreadRead(String userId, String threadId) {
    requireParticipant(userId, threadId);
    jdbcClient.sql("""
            UPDATE chat_messages
            SET read_at = CURRENT_TIMESTAMP
            WHERE thread_id = :threadId
              AND sender_id <> :userId
              AND read_at IS NULL
            """)
        .param("threadId", threadId)
        .param("userId", userId)
        .update();
  }

  /* ── Helpers ────────────────────────────────────────────────────────── */

  private void requireParticipant(String userId, String threadId) {
    boolean ok = Boolean.TRUE.equals(jdbcClient.sql("""
            SELECT EXISTS (
              SELECT 1 FROM chat_threads
              WHERE thread_id = :threadId AND (tenant_id = :userId OR owner_id = :userId)
            )
            """)
        .param("threadId", threadId)
        .param("userId", userId)
        .query(Boolean.class)
        .single());
    if (!ok) {
      throw new ResponseStatusException(HttpStatus.FORBIDDEN, "You are not a participant in this thread.");
    }
  }

  private ChatThreadResponse loadThread(String userId, String fallbackThreadId, String listingId, String ownerId) {
    return jdbcClient.sql("""
            SELECT t.thread_id, t.listing_id,
                   l.title, l.locality, l.city,
                   t.last_message_at, t.last_message_preview,
                   CASE WHEN t.tenant_id = :userId THEN t.owner_id ELSE t.tenant_id END AS counterparty_id,
                   CASE WHEN t.tenant_id = :userId THEN o.full_name ELSE te.full_name END AS counterparty_name,
                   CASE WHEN t.tenant_id = :userId THEN 'TENANT' ELSE 'OWNER' END AS my_role,
                   COALESCE((
                     SELECT COUNT(*) FROM chat_messages m
                     WHERE m.thread_id = t.thread_id AND m.sender_id <> :userId AND m.read_at IS NULL
                   ), 0) AS unread_count
            FROM chat_threads t
            JOIN listings l ON l.listing_id = t.listing_id
            JOIN users te ON te.user_id = t.tenant_id
            JOIN users o  ON o.user_id  = t.owner_id
            WHERE t.listing_id = :listingId AND t.tenant_id = :userId AND t.owner_id = :ownerId
            """)
        .param("userId", userId)
        .param("listingId", listingId)
        .param("ownerId", ownerId)
        .query((rs, rowNum) -> new ChatThreadResponse(
            rs.getString("thread_id"),
            rs.getString("listing_id"),
            rs.getString("title"),
            rs.getString("locality"),
            rs.getString("city"),
            rs.getString("counterparty_id"),
            rs.getString("counterparty_name"),
            rs.getString("my_role"),
            rs.getString("last_message_preview"),
            formatNullableTimestamp(rs.getObject("last_message_at", OffsetDateTime.class)),
            rs.getLong("unread_count")
        ))
        .single();
  }

  private static String formatNullableTimestamp(OffsetDateTime t) {
    return t == null ? null : ISO.format(t);
  }

  private record ListingMeta(
      String listingId, String ownerId, String status,
      String title, String locality, String city
  ) {}
}
