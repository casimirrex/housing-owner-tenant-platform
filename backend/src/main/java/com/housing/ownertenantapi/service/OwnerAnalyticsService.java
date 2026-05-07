package com.housing.ownertenantapi.service;

import com.housing.ownertenantapi.dto.OwnerAnalyticsResponse;
import com.housing.ownertenantapi.dto.OwnerAnalyticsResponse.ListingMetrics;
import com.housing.ownertenantapi.dto.OwnerAnalyticsResponse.Totals;
import java.util.List;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.jdbc.core.simple.JdbcClient;
import org.springframework.stereotype.Service;

/**
 * Owner Analytics Dashboard.
 *
 * Pure read-only aggregation over existing tables — zero schema changes.
 *   - Views        → COUNT from feature_usage_events (TENANT_PROPERTY_VIEW)
 *   - Saves        → COUNT from saved_listings
 *   - Listings     → SELECT from listings WHERE owner_id = :ownerId
 *   - Trend (7d)   → COUNT views WHERE occurred_at > now() - 7 days
 *
 * One trip to the DB per metric (cheap because each query is indexed by
 * either user_id or listing_id). Could be optimised into a single CTE
 * later if needed; kept readable for the MVP.
 */
@Service
public class OwnerAnalyticsService {

  private static final String FEATURE_TENANT_VIEW = "TENANT_PROPERTY_VIEW";

  private final JdbcClient jdbcClient;

  public OwnerAnalyticsService(JdbcTemplate jdbcTemplate) {
    this.jdbcClient = JdbcClient.create(jdbcTemplate);
  }

  public OwnerAnalyticsResponse getAnalytics(String ownerId) {
    List<ListingMetrics> perListing = jdbcClient.sql("""
            SELECT
              l.listing_id,
              l.title,
              l.city,
              l.locality,
              l.status,
              l.rent,
              COALESCE((
                SELECT COUNT(*) FROM feature_usage_events e
                WHERE e.feature_key = :featureKey
                  AND e.resource_id = l.listing_id
              ), 0) AS views,
              COALESCE((
                SELECT COUNT(*) FROM saved_listings s
                WHERE s.listing_id = l.listing_id
              ), 0) AS saves,
              COALESCE((
                SELECT COUNT(*) FROM feature_usage_events e
                WHERE e.feature_key = :featureKey
                  AND e.resource_id = l.listing_id
                  AND e.occurred_at > CURRENT_TIMESTAMP - INTERVAL '7 days'
              ), 0) AS views_7d
            FROM listings l
            WHERE l.owner_id = :ownerId
            ORDER BY l.created_at DESC
            """)
        .param("ownerId", ownerId)
        .param("featureKey", FEATURE_TENANT_VIEW)
        .query((rs, rowNum) -> new ListingMetrics(
            rs.getString("listing_id"),
            rs.getString("title"),
            rs.getString("city"),
            rs.getString("locality"),
            rs.getString("status"),
            rs.getInt("rent"),
            rs.getLong("views"),
            rs.getLong("saves"),
            rs.getLong("views_7d")
        ))
        .list();

    long totalViews = perListing.stream().mapToLong(ListingMetrics::views).sum();
    long totalSaves = perListing.stream().mapToLong(ListingMetrics::saves).sum();
    long viewsLast7Days = perListing.stream().mapToLong(ListingMetrics::viewsLast7Days).sum();
    long totalListings = perListing.size();
    long publishedListings = perListing.stream()
        .filter(m -> "PUBLISHED".equalsIgnoreCase(m.status()))
        .count();

    return new OwnerAnalyticsResponse(
        new Totals(totalViews, totalSaves, totalListings, publishedListings, viewsLast7Days),
        perListing
    );
  }
}
