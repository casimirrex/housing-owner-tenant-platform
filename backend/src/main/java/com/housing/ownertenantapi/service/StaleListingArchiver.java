package com.housing.ownertenantapi.service;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

/**
 * Tier 2 — Auto-archive stale listings.
 *
 * Listings that have been PUBLISHED but had no owner activity for 60 days
 * are moved to ARCHIVED. The job runs daily at 02:30 IST. An admin can
 * trigger it on demand via AdminController for a manual sweep.
 *
 * "Activity" here means `updated_at` — owners touching their listing in any
 * way (price tweak, photo change, status flip) refreshes it.
 */
@Service
public class StaleListingArchiver {

  private static final Logger log = LoggerFactory.getLogger(StaleListingArchiver.class);
  private static final int STALE_DAYS = 60;

  private final JdbcTemplate jdbcTemplate;

  public StaleListingArchiver(JdbcTemplate jdbcTemplate) {
    this.jdbcTemplate = jdbcTemplate;
  }

  /** Daily at 02:30 server-time. Spring's default is UTC unless configured otherwise. */
  @Scheduled(cron = "0 30 2 * * *")
  public void scheduledArchive() {
    int archived = sweep();
    if (archived > 0) {
      log.info("[stale-listing-archiver] archived {} listings (>{} days inactive)",
          archived, STALE_DAYS);
    }
  }

  /** Manual trigger; safe to call from an admin endpoint. Returns rows affected. */
  @Transactional
  public int sweep() {
    return jdbcTemplate.update(
        "UPDATE listings " +
            "SET status = 'ARCHIVED', updated_at = now() " +
            "WHERE status = 'PUBLISHED' " +
            "  AND updated_at < now() - INTERVAL '" + STALE_DAYS + " days'"
    );
  }
}
