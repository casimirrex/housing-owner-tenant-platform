package com.housing.ownertenantapi.service;

import com.housing.ownertenantapi.dto.CenterPointResponse;
import com.housing.ownertenantapi.dto.FilterMetadataResponse;
import com.housing.ownertenantapi.dto.ListingSummaryResponse;
import com.housing.ownertenantapi.dto.LocationAutocompleteResponse;
import com.housing.ownertenantapi.dto.LocationSuggestionResponse;
import com.housing.ownertenantapi.dto.NearbyListingResponse;
import com.housing.ownertenantapi.dto.NearbyResponse;
import com.housing.ownertenantapi.dto.PaginationResponse;
import com.housing.ownertenantapi.dto.SearchAppliedFiltersResponse;
import com.housing.ownertenantapi.dto.SearchMapClusterResponse;
import com.housing.ownertenantapi.dto.SearchMapFiltersRequest;
import com.housing.ownertenantapi.dto.SearchMapPinResponse;
import com.housing.ownertenantapi.dto.SearchMapRequest;
import com.housing.ownertenantapi.dto.SearchMapResponse;
import com.housing.ownertenantapi.dto.SearchResponse;
import com.housing.ownertenantapi.dto.SearchSummaryResponse;
import com.housing.ownertenantapi.config.CacheConfig;
import com.housing.ownertenantapi.util.CityCatalog;
import java.util.ArrayList;
import java.util.Collections;
import java.util.List;
import java.util.Locale;
import java.util.stream.Collectors;
import org.springframework.cache.annotation.Cacheable;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Service;

@Service
public class SearchService {

  private final JdbcTemplate jdbcTemplate;

  public SearchService(JdbcTemplate jdbcTemplate) {
    this.jdbcTemplate = jdbcTemplate;
  }

  public SearchResponse search(
      String query,
      String city,
      Integer budgetMin,
      Integer budgetMax,
      String bhk,
      String furnishing,
      String tenantType,
      Boolean petFriendly,
      Boolean verified,
      int page,
      int pageSize,
      String sortBy
  ) {
    int safePage = sanitizePage(page);
    int safePageSize = sanitizePageSize(pageSize);
    String resolvedSort = sortBy == null || sortBy.isBlank() ? "relevance" : sortBy;

    SqlBundle searchBundle = buildSearchBundle(
        query, city, budgetMin, budgetMax, bhk, furnishing, tenantType, petFriendly, verified
    );
    long totalItems = jdbcTemplate.queryForObject(
        "SELECT COUNT(*) " + searchBundle.fromClause(),
        Long.class,
        searchBundle.parameters().toArray()
    );

    List<Object> itemParams = new ArrayList<>(searchBundle.parameters());
    itemParams.add(safePageSize);
    itemParams.add(safePage * safePageSize);

    List<ListingSummaryResponse> items = jdbcTemplate.query("""
            SELECT listing_id, title, locality, city, rent, bhk, verified, premium,
                   (featured_until IS NOT NULL AND featured_until > now()) AS featured,
                   posted_label, urgency_label
            """
            + searchBundle.fromClause()
            + " ORDER BY " + resolveSortClause(resolvedSort)
            + " LIMIT ? OFFSET ?",
        (rs, rowNum) -> new ListingSummaryResponse(
            rs.getString("listing_id"),
            rs.getString("title"),
            rs.getString("locality"),
            rs.getString("city"),
            rs.getInt("rent"),
            rs.getString("bhk"),
            rs.getBoolean("verified"),
            rs.getBoolean("premium"),
            rs.getBoolean("featured"),
            rs.getString("posted_label"),
            rs.getString("urgency_label")
        ),
        itemParams.toArray()
    );

    return new SearchResponse(
        items,
        buildPagination(totalItems, safePage, safePageSize),
        new SearchAppliedFiltersResponse(
            query, city, budgetMin, budgetMax, bhk, furnishing, tenantType, petFriendly,
            verified, resolvedSort
        ),
        new SearchSummaryResponse(
            buildSummary(query, city, totalItems),
            city == null || city.isBlank() ? "All cities" : CityCatalog.canonicalize(city),
            resolvedSort,
            totalItems
        )
    );
  }

  public SearchMapResponse searchMap(SearchMapRequest request) {
    SearchMapFiltersRequest filters = request.filters();
    SqlBundle mapBundle = buildSearchBundle(
        null,
        filters != null ? filters.city() : null,
        filters != null ? filters.budgetMin() : null,
        filters != null ? filters.budgetMax() : null,
        filters != null ? filters.bhk() : null,
        filters != null ? filters.furnishing() : null,
        filters != null ? filters.tenantType() : null,
        filters != null ? filters.petFriendly() : null,
        filters != null ? filters.verified() : null
    );

    List<Object> params = new ArrayList<>(mapBundle.parameters());
    params.add(request.northEastLat());
    params.add(request.southWestLat());
    params.add(request.northEastLng());
    params.add(request.southWestLng());

    List<SearchMapPinWithCity> matched = jdbcTemplate.query("""
            SELECT listing_id, title, locality, city, lat, lng, rent, verified
            """
            + mapBundle.fromClause()
            + " AND lat <= ?"
            + " AND lat >= ?"
            + " AND lng <= ?"
            + " AND lng >= ?"
            + " ORDER BY verified DESC, premium DESC, rent ASC",
        (rs, rowNum) -> new SearchMapPinWithCity(
            new SearchMapPinResponse(
                rs.getString("listing_id"),
                rs.getString("title"),
                rs.getString("locality"),
                rs.getDouble("lat"),
                rs.getDouble("lng"),
                rs.getInt("rent"),
                rs.getBoolean("verified")
            ),
            rs.getString("city")
        ),
        params.toArray()
    );

    List<SearchMapPinResponse> pins = matched.stream()
        .map(SearchMapPinWithCity::pin)
        .toList();

    List<SearchMapClusterResponse> clusters = matched.stream()
        .collect(Collectors.groupingBy(SearchMapPinWithCity::city))
        .entrySet()
        .stream()
        .filter(entry -> entry.getValue().size() > 1)
        .map(entry -> {
          double averageLat = entry.getValue().stream()
              .mapToDouble(item -> item.pin().lat())
              .average()
              .orElse(0);
          double averageLng = entry.getValue().stream()
              .mapToDouble(item -> item.pin().lng())
              .average()
              .orElse(0);
          return new SearchMapClusterResponse(
              "cluster_" + entry.getKey().toLowerCase(Locale.ROOT).replace(" ", "_"),
              averageLat,
              averageLng,
              entry.getValue().size(),
              entry.getKey() + " cluster"
          );
        })
        .toList();

    return new SearchMapResponse(pins, pins.size(), clusters);
  }

  /**
   * Filter options rarely change (config data). Cache by city for 24h.
   * Safe to key on {@code city} alone because the method is deterministic.
   */
  @Cacheable(
      cacheNames = CacheConfig.Regions.FILTER_METADATA,
      key = "T(java.util.Objects).toString(#city, 'ALL')",
      sync = true)
  public FilterMetadataResponse getFilterMetadata(String city) {
    String resolvedCity = CityCatalog.canonicalize(city);
    return new FilterMetadataResponse(
        fetchFilterValues("budgetRanges", resolvedCity),
        fetchFilterValues("bhkOptions", resolvedCity),
        fetchFilterValues("furnishingOptions", resolvedCity),
        fetchFilterValues("tenantTypes", resolvedCity),
        fetchFilterValues("quickFilters", resolvedCity)
    );
  }

  /**
   * Autocomplete is called on every keystroke. Cache by normalised prefix for
   * 1h — the trigram index is fast but Redis is ~20× faster still.
   */
  @Cacheable(
      cacheNames = CacheConfig.Regions.LOCATION_AUTOCOMPLETE,
      key = "T(java.util.Objects).toString(#q,'').toLowerCase() + '|' + T(java.util.Objects).toString(#city,'')",
      condition = "#q != null && #q.length() >= 2",
      sync = true)
  public LocationAutocompleteResponse autocomplete(String q, String city, Double lat, Double lng) {
    String resolvedCity = CityCatalog.canonicalize(city);
    String normalized = q == null ? "" : "%" + q.trim().toLowerCase(Locale.ROOT) + "%";
    List<LocationSuggestionResponse> suggestions;
    if (resolvedCity == null || resolvedCity.isBlank()) {
      suggestions = jdbcTemplate.query("""
              SELECT label, type, city, lat, lng
              FROM location_suggestions
              WHERE lower(label) LIKE ?
              ORDER BY label
              LIMIT 8
              """,
          (rs, rowNum) -> new LocationSuggestionResponse(
              rs.getString("label"),
              rs.getString("type"),
              rs.getString("city"),
              rs.getDouble("lat"),
              rs.getDouble("lng")
          ),
          normalized
      );
    } else {
      suggestions = jdbcTemplate.query("""
              SELECT label, type, city, lat, lng
              FROM location_suggestions
              WHERE lower(city) IN (%s)
                AND lower(label) LIKE ?
              ORDER BY label
              LIMIT 8
              """.formatted(buildAliasPlaceholders(CityCatalog.aliasesFor(resolvedCity))),
          (rs, rowNum) -> new LocationSuggestionResponse(
              rs.getString("label"),
              rs.getString("type"),
              rs.getString("city"),
              rs.getDouble("lat"),
              rs.getDouble("lng")
          ),
          buildAutocompleteParameters(resolvedCity, normalized)
      );
    }

    return new LocationAutocompleteResponse(suggestions);
  }

  public NearbyResponse getNearby(Double lat, Double lng, Double radiusKm) {
    double centerLat = lat != null ? lat : 12.9716;
    double centerLng = lng != null ? lng : 77.5946;
    double resolvedRadius = radiusKm != null && radiusKm > 0 ? Math.min(radiusKm, 50.0) : 5.0;

    // Haversine formula in SQL: 2 * R * asin(sqrt(...)). R = 6371 km (Earth radius).
    // Each lat/lng parameter is bound twice — once for SELECT, once for WHERE.
    List<NearbyListingResponse> items = jdbcTemplate.query("""
            SELECT listing_id, title, locality, city, rent, bhk, verified, premium,
                   (featured_until IS NOT NULL AND featured_until > now()) AS featured,
                   posted_label, urgency_label, lat, lng,
                   2 * 6371 * asin(sqrt(
                     power(sin(radians((lat - ?) / 2)), 2) +
                     cos(radians(?)) * cos(radians(lat)) *
                     power(sin(radians((lng - ?) / 2)), 2)
                   )) AS distance_km
            FROM listings
            WHERE status = 'PUBLISHED'
              AND lat IS NOT NULL AND lng IS NOT NULL
              AND 2 * 6371 * asin(sqrt(
                    power(sin(radians((lat - ?) / 2)), 2) +
                    cos(radians(?)) * cos(radians(lat)) *
                    power(sin(radians((lng - ?) / 2)), 2)
                  )) <= ?
            ORDER BY distance_km ASC
            LIMIT 60
            """,
        (rs, rowNum) -> new NearbyListingResponse(
            rs.getString("listing_id"),
            rs.getString("title"),
            rs.getString("locality"),
            rs.getString("city"),
            rs.getInt("rent"),
            rs.getString("bhk"),
            rs.getBoolean("verified"),
            rs.getBoolean("premium"),
            rs.getBoolean("featured"),
            rs.getString("posted_label"),
            rs.getString("urgency_label"),
            rs.getDouble("lat"),
            rs.getDouble("lng"),
            Math.round(rs.getDouble("distance_km") * 100.0) / 100.0
        ),
        // SELECT-clause Haversine inputs
        centerLat, centerLat, centerLng,
        // WHERE-clause Haversine inputs
        centerLat, centerLat, centerLng,
        resolvedRadius
    );

    return new NearbyResponse(
        items,
        new CenterPointResponse(centerLat, centerLng),
        resolvedRadius
    );
  }

  private List<String> fetchFilterValues(String category, String city) {
    if (city == null || city.isBlank()) {
      return jdbcTemplate.query("""
              SELECT filter_value
              FROM search_filter_metadata
              WHERE filter_category = ?
              ORDER BY sort_order
              """,
          (rs, rowNum) -> rs.getString("filter_value"),
          category
      );
    }

    return jdbcTemplate.query("""
            SELECT filter_value
            FROM search_filter_metadata
            WHERE filter_category = ?
              AND (city IS NULL OR city = ?)
            ORDER BY sort_order
            """,
        (rs, rowNum) -> rs.getString("filter_value"),
        category,
        city
    );
  }

  private SqlBundle buildSearchBundle(
      String query,
      String city,
      Integer budgetMin,
      Integer budgetMax,
      String bhk,
      String furnishing,
      String tenantType,
      Boolean petFriendly,
      Boolean verified
  ) {
    String resolvedCity = CityCatalog.canonicalize(city);
    StringBuilder fromClause = new StringBuilder("""
        FROM listings
        WHERE status = 'PUBLISHED'
        """);
    List<Object> parameters = new ArrayList<>();

    if (resolvedCity != null && !resolvedCity.isBlank()) {
      appendCityFilter(fromClause, parameters, resolvedCity);
    }

    if (query != null && !query.isBlank()) {
      fromClause.append(" AND (lower(title) LIKE ? OR lower(locality) LIKE ?)");
      String normalized = "%" + query.trim().toLowerCase(Locale.ROOT) + "%";
      parameters.add(normalized);
      parameters.add(normalized);
    }

    if (budgetMin != null) {
      fromClause.append(" AND rent >= ?");
      parameters.add(budgetMin);
    }

    if (budgetMax != null) {
      fromClause.append(" AND rent <= ?");
      parameters.add(budgetMax);
    }

    if (bhk != null && !bhk.isBlank()) {
      fromClause.append(" AND bhk = ?");
      parameters.add(bhk);
    }

    if (furnishing != null && !furnishing.isBlank()) {
      fromClause.append(" AND furnishing = ?");
      parameters.add(furnishing);
    }

    if (tenantType != null && !tenantType.isBlank()) {
      fromClause.append(" AND tenant_type = ?");
      parameters.add(tenantType);
    }

    if (petFriendly != null) {
      fromClause.append(" AND pet_friendly = ?");
      parameters.add(petFriendly);
    }

    if (verified != null) {
      fromClause.append(" AND verified = ?");
      parameters.add(verified);
    }

    return new SqlBundle(fromClause.toString(), parameters);
  }

  private String resolveSortClause(String sortBy) {
    // Featured Listings: any listing whose featured_until is still in the future
    // sorts above non-featured listings, regardless of the chosen sortBy.
    // Within each group (featured / not), the user-selected sort applies.
    String featuredFirst = "(featured_until IS NOT NULL AND featured_until > now()) DESC";
    return switch (sortBy.toLowerCase(Locale.ROOT)) {
      case "rentasc"  -> featuredFirst + ", rent ASC";
      case "rentdesc" -> featuredFirst + ", rent DESC";
      case "newest"   -> featuredFirst + ", created_at DESC";
      default         -> featuredFirst + ", verified DESC, premium DESC, rent ASC";
    };
  }

  private String buildSummary(String query, String city, long count) {
    String locationLabel = city == null || city.isBlank() ? "all cities" : CityCatalog.canonicalize(city);
    String queryLabel = query == null || query.isBlank() ? "homes" : "\"" + query + "\" homes";
    return count + " " + queryLabel + " found in " + locationLabel;
  }

  private void appendCityFilter(StringBuilder fromClause, List<Object> parameters, String city) {
    List<String> aliases = CityCatalog.aliasesFor(city);
    fromClause
        .append(" AND lower(city) IN (")
        .append(buildAliasPlaceholders(aliases))
        .append(")");
    parameters.addAll(aliases);
  }

  private String buildAliasPlaceholders(List<String> aliases) {
    return String.join(", ", Collections.nCopies(aliases.size(), "?"));
  }

  private Object[] buildAutocompleteParameters(String city, String normalizedQuery) {
    List<String> aliases = CityCatalog.aliasesFor(city);
    List<Object> parameters = new ArrayList<>(aliases);
    parameters.add(normalizedQuery);
    return parameters.toArray();
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

  private record SqlBundle(String fromClause, List<Object> parameters) {
  }

  private record SearchMapPinWithCity(SearchMapPinResponse pin, String city) {
  }
}
