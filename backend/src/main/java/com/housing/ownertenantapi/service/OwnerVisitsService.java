package com.housing.ownertenantapi.service;

import com.housing.ownertenantapi.dto.OwnerVisitsResponse;
import com.housing.ownertenantapi.dto.OwnerVisitsResponse.OwnerVisit;
import java.time.OffsetDateTime;
import java.time.format.DateTimeFormatter;
import java.util.List;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.jdbc.core.simple.JdbcClient;
import org.springframework.stereotype.Service;

/**
 * Owner-side view of visits scheduled on their listings.
 * Joins visits → listings (only the owner's) → users (tenant info).
 * Newest visits first.
 */
@Service
public class OwnerVisitsService {

  private static final DateTimeFormatter ISO = DateTimeFormatter.ISO_OFFSET_DATE_TIME;

  private final JdbcClient jdbcClient;

  public OwnerVisitsService(JdbcTemplate jdbcTemplate) {
    this.jdbcClient = JdbcClient.create(jdbcTemplate);
  }

  public OwnerVisitsResponse getVisitsForOwner(String ownerId) {
    List<OwnerVisit> visits = jdbcClient.sql("""
            SELECT v.visit_id, v.listing_id, l.title AS listing_title,
                   v.user_id AS tenant_id,
                   u.full_name AS tenant_name,
                   u.email AS tenant_email,
                   u.phone_number AS tenant_phone,
                   v.slot_id, v.slot_label, v.preferred_date,
                   v.notes, v.status, v.scheduled_at
            FROM visits v
            JOIN listings l ON l.listing_id = v.listing_id
            JOIN users u ON u.user_id = v.user_id
            WHERE l.owner_id = :ownerId
            ORDER BY
              CASE WHEN v.status = 'SCHEDULED' THEN 0 ELSE 1 END,
              v.preferred_date ASC,
              v.scheduled_at DESC
            LIMIT 50
            """)
        .param("ownerId", ownerId)
        .query((rs, rowNum) -> new OwnerVisit(
            rs.getString("visit_id"),
            rs.getString("listing_id"),
            rs.getString("listing_title"),
            rs.getString("tenant_id"),
            rs.getString("tenant_name"),
            rs.getString("tenant_email"),
            rs.getString("tenant_phone"),
            rs.getString("slot_id"),
            rs.getString("slot_label"),
            rs.getDate("preferred_date").toLocalDate().toString(),
            rs.getString("notes"),
            rs.getString("status"),
            ISO.format(rs.getObject("scheduled_at", OffsetDateTime.class))
        ))
        .list();

    long upcomingCount = visits.stream()
        .filter(v -> "SCHEDULED".equalsIgnoreCase(v.status()))
        .count();

    return new OwnerVisitsResponse(visits, upcomingCount);
  }
}
