package com.housing.ownertenantapi.service;

import com.housing.ownertenantapi.dto.ListingReportRequest;
import com.housing.ownertenantapi.dto.ListingReportResponse;
import java.time.OffsetDateTime;
import java.time.ZoneOffset;
import java.time.format.DateTimeFormatter;
import java.time.temporal.ChronoUnit;
import java.util.UUID;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.dao.DuplicateKeyException;
import org.springframework.dao.EmptyResultDataAccessException;
import org.springframework.http.HttpStatus;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

/**
 * Tier 0 trust & safety — "Report listing" flow.
 *
 * Tenants flag a listing for moderation. We allow exactly one OPEN report per
 * (listing, reporter) — re-reporting is a no-op that returns the existing
 * row. Once a moderator transitions a report to RESOLVED/DISMISSED, the user
 * can file a fresh OPEN report (the partial unique index only covers OPEN).
 */
@Service
public class ListingReportService {

  private static final Logger log = LoggerFactory.getLogger(ListingReportService.class);
  private static final DateTimeFormatter ISO = DateTimeFormatter.ISO_OFFSET_DATE_TIME;

  private final JdbcTemplate jdbcTemplate;
  private final CurrentSessionService currentSessionService;

  public ListingReportService(
      JdbcTemplate jdbcTemplate,
      CurrentSessionService currentSessionService
  ) {
    this.jdbcTemplate = jdbcTemplate;
    this.currentSessionService = currentSessionService;
  }

  @Transactional
  public ListingReportResponse report(
      String authorizationHeader,
      String listingId,
      ListingReportRequest request
  ) {
    String reporterUserId = currentSessionService.resolveUserId(authorizationHeader);

    // Confirm the listing exists; otherwise the FK insert would 500.
    Integer listingCount = jdbcTemplate.queryForObject(
        "SELECT COUNT(*) FROM listings WHERE listing_id = ?",
        Integer.class,
        listingId
    );
    if (listingCount == null || listingCount == 0) {
      throw new ResponseStatusException(HttpStatus.NOT_FOUND,
          "Listing not found: " + listingId);
    }

    String reportId = "rpt_" + UUID.randomUUID().toString().replace("-", "").substring(0, 12);
    OffsetDateTime now = OffsetDateTime.now(ZoneOffset.UTC).truncatedTo(ChronoUnit.SECONDS);

    try {
      jdbcTemplate.update("""
              INSERT INTO listing_reports (
                report_id, listing_id, reporter_user_id, reason, details, status, created_at
              )
              VALUES (?, ?, ?, ?, ?, 'OPEN', ?::timestamptz)
              """,
          reportId,
          listingId,
          reporterUserId,
          request.reason(),
          request.details(),
          now.format(ISO)
      );
      log.info("listing report created: report={} listing={} reporter={} reason={}",
          reportId, listingId, reporterUserId, request.reason());
      return new ListingReportResponse(reportId, listingId, request.reason(), "OPEN",
          now.format(ISO));
    } catch (DuplicateKeyException duplicate) {
      // User already has an OPEN report on this listing — return existing row.
      log.debug("duplicate report from user={} for listing={} — returning existing",
          reporterUserId, listingId);
      try {
        return jdbcTemplate.queryForObject("""
                SELECT report_id, listing_id, reason, status,
                       to_char(created_at AT TIME ZONE 'UTC', 'YYYY-MM-DD"T"HH24:MI:SS"Z"') AS created_at
                FROM listing_reports
                WHERE listing_id = ? AND reporter_user_id = ? AND status = 'OPEN'
                LIMIT 1
                """,
            (rs, rowNum) -> new ListingReportResponse(
                rs.getString("report_id"),
                rs.getString("listing_id"),
                rs.getString("reason"),
                rs.getString("status"),
                rs.getString("created_at")
            ),
            listingId,
            reporterUserId
        );
      } catch (EmptyResultDataAccessException impossible) {
        // Race between the duplicate check and us reading the row — rethrow as 409.
        throw new ResponseStatusException(HttpStatus.CONFLICT,
            "Could not load existing report after duplicate insert");
      }
    }
  }
}
