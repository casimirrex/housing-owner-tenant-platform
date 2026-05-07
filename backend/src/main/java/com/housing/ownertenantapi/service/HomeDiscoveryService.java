package com.housing.ownertenantapi.service;

import com.housing.ownertenantapi.dto.HomeHeroSearchConfigResponse;
import com.housing.ownertenantapi.dto.HomeResponse;
import com.housing.ownertenantapi.dto.ListingCollectionResponse;
import com.housing.ownertenantapi.dto.ListingSummaryResponse;
import com.housing.ownertenantapi.dto.PaginationResponse;
import com.housing.ownertenantapi.dto.RecommendationItemResponse;
import com.housing.ownertenantapi.dto.RecommendationResponse;
import com.housing.ownertenantapi.util.CityCatalog;
import java.util.Collections;
import java.util.List;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Service;

@Service
public class HomeDiscoveryService {

  private final JdbcTemplate jdbcTemplate;

  public HomeDiscoveryService(JdbcTemplate jdbcTemplate) {
    this.jdbcTemplate = jdbcTemplate;
  }

  public HomeResponse getHome(String city, Double lat, Double lng) {
    DiscoveryContext context = resolveContext(city, lat, lng);
    String cityPredicate = buildCityPredicate(context.city());
    Object[] cityArguments = cityArguments(context.city());

    return new HomeResponse(
        new HomeHeroSearchConfigResponse(
            context.city(),
            context.lat(),
            context.lng(),
            "Search by locality, landmark, metro, or owner",
            true,
            true
        ),
        queryRecommendations(context.city(), 0, 3),
        queryListingSummaries("""
                SELECT listing_id, title, locality, city, rent, bhk, verified, premium,
                       posted_label, urgency_label
                FROM listings
                WHERE status = 'PUBLISHED'
                  AND trending = TRUE
                  AND %s
                ORDER BY recommendation_score DESC NULLS LAST, rent ASC
                LIMIT ? OFFSET ?
                """.formatted(cityPredicate), appendPaging(cityArguments, 3, 0)),
        queryListingSummaries("""
                SELECT listing_id, title, locality, city, rent, bhk, verified, premium,
                       posted_label, urgency_label
                FROM listings
                WHERE status = 'PUBLISHED'
                  AND new_listing = TRUE
                ORDER BY created_at DESC
                LIMIT ? OFFSET ?
                """, 3, 0),
        queryListingSummaries("""
                SELECT listing_id, title, locality, city, rent, bhk, verified, premium,
                       posted_label, urgency_label
                FROM listings
                WHERE status = 'PUBLISHED'
                  AND premium = TRUE
                  AND verified = TRUE
                ORDER BY recommendation_score DESC NULLS LAST, rent ASC
                LIMIT ? OFFSET ?
                """, 3, 0),
        queryListingSummaries("""
                SELECT listing_id, title, locality, city, rent, bhk, verified, premium,
                       posted_label, urgency_label
                FROM listings
                WHERE status = 'PUBLISHED'
                  AND urgency_label IS NOT NULL
                ORDER BY created_at DESC
                LIMIT ? OFFSET ?
                """, 3, 0)
    );
  }

  public RecommendationResponse getRecommendations(
      String userId,
      String city,
      Double lat,
      Double lng,
      int page,
      int pageSize
  ) {
    DiscoveryContext context = resolveContext(city, lat, lng);
    String cityPredicate = buildCityPredicate(context.city());
    Object[] cityArguments = cityArguments(context.city());
    int safePage = sanitizePage(page);
    int safePageSize = sanitizePageSize(pageSize);
    long totalItems = jdbcTemplate.queryForObject("""
            SELECT COUNT(*)
            FROM listings
            WHERE status = 'PUBLISHED'
              AND recommendation_score IS NOT NULL
              AND %s
            """.formatted(cityPredicate), Long.class, cityArguments);

    return new RecommendationResponse(
        queryRecommendations(context.city(), safePage, safePageSize),
        buildPagination(totalItems, safePage, safePageSize)
    );
  }

  public ListingCollectionResponse getTrendingListings(
      String city,
      Double lat,
      Double lng,
      int page,
      int pageSize
  ) {
    DiscoveryContext context = resolveContext(city, lat, lng);
    String cityPredicate = buildCityPredicate(context.city());
    Object[] cityArguments = cityArguments(context.city());
    int safePage = sanitizePage(page);
    int safePageSize = sanitizePageSize(pageSize);
    long totalItems = jdbcTemplate.queryForObject("""
            SELECT COUNT(*)
            FROM listings
            WHERE status = 'PUBLISHED'
              AND trending = TRUE
              AND %s
            """.formatted(cityPredicate), Long.class, cityArguments);

    return new ListingCollectionResponse(
        queryListingSummaries("""
                SELECT listing_id, title, locality, city, rent, bhk, verified, premium,
                       posted_label, urgency_label
                FROM listings
                WHERE status = 'PUBLISHED'
                  AND trending = TRUE
                  AND %s
                ORDER BY recommendation_score DESC NULLS LAST, rent ASC
                LIMIT ? OFFSET ?
                """.formatted(cityPredicate), appendPaging(cityArguments, safePageSize, safePage * safePageSize)),
        totalItems
    );
  }

  public ListingCollectionResponse getNewListings(String city, int page, int pageSize) {
    String resolvedCity = CityCatalog.canonicalize(city);
    int safePage = sanitizePage(page);
    int safePageSize = sanitizePageSize(pageSize);
    long totalItems = resolvedCity == null
        ? jdbcTemplate.queryForObject("""
            SELECT COUNT(*)
            FROM listings
            WHERE status = 'PUBLISHED'
              AND new_listing = TRUE
            """, Long.class)
        : jdbcTemplate.queryForObject("""
            SELECT COUNT(*)
            FROM listings
            WHERE status = 'PUBLISHED'
              AND new_listing = TRUE
              AND %s
            """.formatted(buildCityPredicate(resolvedCity)), Long.class, cityArguments(resolvedCity));

    List<ListingSummaryResponse> items = resolvedCity == null
        ? queryListingSummaries("""
                SELECT listing_id, title, locality, city, rent, bhk, verified, premium,
                       posted_label, urgency_label
                FROM listings
                WHERE status = 'PUBLISHED'
                  AND new_listing = TRUE
                ORDER BY created_at DESC
                LIMIT ? OFFSET ?
                """, safePageSize, safePage * safePageSize)
        : queryListingSummaries("""
                SELECT listing_id, title, locality, city, rent, bhk, verified, premium,
                       posted_label, urgency_label
                FROM listings
                WHERE status = 'PUBLISHED'
                  AND new_listing = TRUE
                  AND %s
                ORDER BY created_at DESC
                LIMIT ? OFFSET ?
                """.formatted(buildCityPredicate(resolvedCity)), appendPaging(cityArguments(resolvedCity), safePageSize, safePage * safePageSize));

    return new ListingCollectionResponse(items, totalItems);
  }

  private List<RecommendationItemResponse> queryRecommendations(String city, int page, int pageSize) {
    int safePage = sanitizePage(page);
    int safePageSize = sanitizePageSize(pageSize);
    String cityPredicate = buildCityPredicate(city);
    Object[] parameters = appendPaging(cityArguments(city), safePageSize, safePage * safePageSize);
    return jdbcTemplate.query("""
            SELECT listing_id, title, locality, city, rent, bhk, verified, premium,
                   posted_label, recommendation_reason, recommendation_score
            FROM listings
            WHERE status = 'PUBLISHED'
              AND recommendation_score IS NOT NULL
              AND %s
            ORDER BY recommendation_score DESC, rent ASC
            LIMIT ? OFFSET ?
            """.formatted(cityPredicate),
        (rs, rowNum) -> new RecommendationItemResponse(
            rs.getString("listing_id"),
            rs.getString("title"),
            rs.getString("locality"),
            rs.getString("city"),
            rs.getInt("rent"),
            rs.getString("bhk"),
            rs.getBoolean("verified"),
            rs.getBoolean("premium"),
            rs.getString("posted_label"),
            rs.getString("recommendation_reason"),
            rs.getDouble("recommendation_score")
        ),
        parameters
    );
  }

  private List<ListingSummaryResponse> queryListingSummaries(String sql, Object... args) {
    return jdbcTemplate.query(sql, (rs, rowNum) -> new ListingSummaryResponse(
        rs.getString("listing_id"),
        rs.getString("title"),
        rs.getString("locality"),
        rs.getString("city"),
        rs.getInt("rent"),
        rs.getString("bhk"),
        rs.getBoolean("verified"),
        rs.getBoolean("premium"),
        // Defensive: the column might not be present in every SQL — default to false.
        hasColumn(rs, "featured") && rs.getBoolean("featured"),
        rs.getString("posted_label"),
        rs.getString("urgency_label")
    ), args);
  }

  /**
   * Helper: check whether a given column name exists in the result-set metadata.
   * Lets queryListingSummaries handle SQL queries that may or may not project the
   * featured column, without modifying every call site at once.
   */
  private static boolean hasColumn(java.sql.ResultSet rs, String columnName) {
    try {
      java.sql.ResultSetMetaData meta = rs.getMetaData();
      for (int i = 1; i <= meta.getColumnCount(); i++) {
        if (columnName.equalsIgnoreCase(meta.getColumnLabel(i))) return true;
      }
    } catch (java.sql.SQLException ignored) {
      // fall through to false
    }
    return false;
  }

  private PaginationResponse buildPagination(long totalItems, int page, int pageSize) {
    int totalPages = (int) Math.ceil((double) totalItems / pageSize);
    return new PaginationResponse(page, pageSize, totalItems, totalPages);
  }

  private int sanitizePage(int page) {
    return Math.max(page, 0);
  }

  private int sanitizePageSize(int pageSize) {
    if (pageSize <= 0) {
      return 10;
    }

    return Math.min(pageSize, 50);
  }

  private DiscoveryContext resolveContext(String city, Double lat, Double lng) {
    String resolvedCity = CityCatalog.canonicalize(city);
    if (resolvedCity == null) {
      return new DiscoveryContext("Bengaluru", 12.9716, 77.5946);
    }

    return new DiscoveryContext(
        resolvedCity,
        lat != null ? lat : 12.9716,
        lng != null ? lng : 77.5946
    );
  }

  private String buildCityPredicate(String city) {
    return "lower(city) IN (%s)".formatted(
        String.join(", ", Collections.nCopies(cityArguments(city).length, "?"))
    );
  }

  private Object[] cityArguments(String city) {
    List<String> aliases = CityCatalog.aliasesFor(city);
    return aliases.toArray();
  }

  private Object[] appendPaging(Object[] baseArguments, Object... pagingArguments) {
    Object[] merged = new Object[baseArguments.length + pagingArguments.length];
    System.arraycopy(baseArguments, 0, merged, 0, baseArguments.length);
    System.arraycopy(pagingArguments, 0, merged, baseArguments.length, pagingArguments.length);
    return merged;
  }

  private record DiscoveryContext(String city, double lat, double lng) {
  }
}
