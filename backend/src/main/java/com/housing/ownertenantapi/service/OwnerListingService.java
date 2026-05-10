package com.housing.ownertenantapi.service;

import com.housing.ownertenantapi.dto.EntitlementResult;
import com.housing.ownertenantapi.dto.OwnerCreatePaymentRecordRequest;
import com.housing.ownertenantapi.dto.OwnerCreatePaymentRecordResponse;
import com.housing.ownertenantapi.dto.OwnerListingCreateRequest;
import com.housing.ownertenantapi.dto.OwnerListingCreateResponse;
import com.housing.ownertenantapi.dto.OwnerListingItemResponse;
import com.housing.ownertenantapi.dto.OwnerListingUpdateRequest;
import com.housing.ownertenantapi.dto.OwnerListingUpdateResponse;
import com.housing.ownertenantapi.dto.OwnerListingsResponse;
import com.housing.ownertenantapi.dto.PaginationResponse;
import com.housing.ownertenantapi.util.CityCatalog;
import java.time.OffsetDateTime;
import java.time.ZoneOffset;
import java.time.temporal.ChronoUnit;
import java.util.List;
import org.springframework.dao.EmptyResultDataAccessException;
import org.springframework.http.HttpStatus;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

@Service
public class OwnerListingService {

  private final JdbcTemplate jdbcTemplate;
  private final CurrentSessionService currentSessionService;
  private final TenantPremiumService premiumService;
  private final EntitlementService entitlementService;
  private final SavedSearchService savedSearchService;

  public OwnerListingService(
      JdbcTemplate jdbcTemplate,
      CurrentSessionService currentSessionService,
      TenantPremiumService premiumService,
      EntitlementService entitlementService,
      SavedSearchService savedSearchService
  ) {
    this.jdbcTemplate = jdbcTemplate;
    this.currentSessionService = currentSessionService;
    this.premiumService = premiumService;
    this.entitlementService = entitlementService;
    this.savedSearchService = savedSearchService;
  }

  public OwnerListingCreateResponse createListing(
      String authorizationHeader,
      OwnerListingCreateRequest request
  ) {
    CurrentSessionService.SessionIdentity ownerSession = requireOwnerSession(authorizationHeader);
    return createListingForOwnerUserId(ownerSession.userId(), request);
  }

  @Transactional
  public OwnerListingCreateResponse createListingForOwnerUserId(
      String ownerUserId,
      OwnerListingCreateRequest request
  ) {
    long sequenceValue = jdbcTemplate.queryForObject("SELECT nextval('owner_listing_seq')", Long.class);
    String listingId = "owner_listing_" + sequenceValue;

    // Free-trial gate: premium owners get unlimited posts; free-tier owners get N
    // (configured in feature_entitlements). tryConsume records usage atomically;
    // if the listing insert below fails, the whole transaction rolls back.
    EntitlementResult entitlement = entitlementService.tryConsume(
        ownerUserId, EntitlementService.Feature.OWNER_LISTING_POST, listingId);
    if (!entitlement.allowed()) {
      throw new ResponseStatusException(HttpStatus.PAYMENT_REQUIRED, entitlement.message());
    }

    boolean ownerPremiumActive = "PREMIUM".equals(entitlement.tier());
    // Both premium and free-trial publish — free trial is "use the app like a paying user".
    String listingStatus = "PUBLISHED";
    OffsetDateTime createdAt = OffsetDateTime.now(ZoneOffset.UTC).truncatedTo(ChronoUnit.SECONDS);
    OwnerIdentity ownerIdentity = fetchCurrentOwner(ownerUserId);
    String canonicalCity = CityCatalog.canonicalize(request.city());
    String normalizedLocality = request.locality().trim();

    jdbcTemplate.update("""
            INSERT INTO listings (
              listing_id, owner_id, owner_managed, property_type, title, subtitle,
              city, locality, address, description, rent, deposit, maintenance,
              brokerage, bhk, bathrooms, balconies, area_sq_ft, furnishing,
              floor_no, total_floors, facing, parking, availability_date,
              availability_status, lat, lng, verified, premium, pet_friendly,
              tenant_type, posted_label, urgency_label, recommendation_reason,
              recommendation_score, trending, new_listing, owner_name,
              owner_phone_masked, owner_preferred_language, owner_badge,
              owner_years_on_platform, verification_label, owner_response_rate,
              average_rating, rating_count, last_updated_label, can_schedule_visit,
              can_call_owner, can_chat_owner, can_save, can_start_kyc, status, created_at
            )
            VALUES (?, ?, TRUE, ?, ?, 'Owner-managed listing',
                    ?, ?, ?, 'Created from the owner listing flow.',
                    ?, ?, 0, 0, ?, 0, 0, 0, ?, 0, 0, NULL, NULL, CAST(? AS DATE),
                    'AVAILABLE', ?, ?, FALSE, FALSE, FALSE, NULL,
                    'Added today', NULL, NULL, NULL, FALSE, TRUE, ?, ?, ?, ?, ?,
                    'Pending verification', 90, 0.0, 0, 'Updated today', TRUE,
                    ?, FALSE, TRUE, FALSE, ?, ?)
            """,
        listingId,
        ownerUserId,
        request.propertyType(),
        request.title(),
        canonicalCity,
        normalizedLocality,
        normalizedLocality + ", " + canonicalCity,
        request.rent(),
        request.deposit(),
        request.bhk(),
        request.furnishing(),
        createdAt.toLocalDate().toString(),
        request.lat(),
        request.lng(),
        ownerIdentity.name(),
        ownerIdentity.phoneMasked(),
        ownerIdentity.preferredLanguage(),
        ownerIdentity.badge(),
        ownerIdentity.yearsOnPlatform(),
        ownerPremiumActive,
        listingStatus,
        createdAt
    );

    replaceAmenities(listingId, request.amenities());
    replacePhotos(listingId, request.photos());

    // Tier 2 #4 — fan out alerts to tenants whose saved searches match this
    // newly-published listing. Best-effort: fanoutForNewListing catches all
    // exceptions internally, so listing creation NEVER fails because of this.
    if ("PUBLISHED".equalsIgnoreCase(listingStatus)) {
      savedSearchService.fanoutForNewListing(listingId);
    }

    // Tier 1 — phone-reuse fraud check. Cheap heuristic: same masked phone
    // across multiple owner accounts → +30 score. Same phone has 5+ listings
    // already → +20 score. Best-effort: any failure is logged and ignored.
    try {
      runFraudCheck(listingId, ownerUserId, ownerIdentity.phoneMasked());
    } catch (Exception ignored) {
      // never let fraud scoring fail a real listing publish
    }

    return new OwnerListingCreateResponse(listingId, listingStatus, formatTimestamp(createdAt));
  }

  private void runFraudCheck(String listingId, String ownerUserId, String phoneMasked) {
    if (phoneMasked == null || phoneMasked.isBlank()) return;

    int score = 0;

    // Signal 1: same phone across multiple distinct owner accounts.
    Integer otherOwnersWithSamePhone = jdbcTemplate.queryForObject("""
            SELECT COUNT(DISTINCT owner_id)
            FROM listings
            WHERE owner_phone_masked = ?
              AND owner_id <> ?
            """,
        Integer.class, phoneMasked, ownerUserId
    );
    if (otherOwnersWithSamePhone != null && otherOwnersWithSamePhone > 0) {
      score += 30;
    }

    // Signal 2: very prolific phone number (potential broker farm).
    Integer listingsWithSamePhone = jdbcTemplate.queryForObject(
        "SELECT COUNT(*) FROM listings WHERE owner_phone_masked = ?",
        Integer.class, phoneMasked
    );
    if (listingsWithSamePhone != null && listingsWithSamePhone >= 5) {
      score += 20;
    }

    if (score > 0) {
      jdbcTemplate.update(
          "UPDATE listings SET fraud_score = ? WHERE listing_id = ?",
          score, listingId
      );
    }
  }

  public OwnerListingsResponse getListings(
      String authorizationHeader,
      String status,
      int page,
      int pageSize
  ) {
    CurrentSessionService.SessionIdentity ownerSession = requireOwnerSession(authorizationHeader);
    int safePage = sanitizePage(page);
    int safePageSize = sanitizePageSize(pageSize);
    long totalItems = status == null || status.isBlank()
        ? jdbcTemplate.queryForObject("""
            SELECT COUNT(*)
            FROM listings
            WHERE owner_id = ?
              AND owner_managed = TRUE
            """, Long.class, ownerSession.userId())
        : jdbcTemplate.queryForObject("""
            SELECT COUNT(*)
            FROM listings
            WHERE owner_id = ?
              AND owner_managed = TRUE
              AND status = ?
            """, Long.class, ownerSession.userId(), status);

    List<String> listingIds = status == null || status.isBlank()
        ? jdbcTemplate.query("""
                SELECT listing_id
                FROM listings
                WHERE owner_id = ?
                  AND owner_managed = TRUE
                ORDER BY created_at DESC
                LIMIT ? OFFSET ?
                """,
            (rs, rowNum) -> rs.getString("listing_id"),
            ownerSession.userId(),
            safePageSize,
            safePage * safePageSize
        )
        : jdbcTemplate.query("""
                SELECT listing_id
                FROM listings
                WHERE owner_id = ?
                  AND owner_managed = TRUE
                  AND status = ?
                ORDER BY created_at DESC
                LIMIT ? OFFSET ?
                """,
            (rs, rowNum) -> rs.getString("listing_id"),
            ownerSession.userId(),
            status,
            safePageSize,
            safePage * safePageSize
        );

    List<OwnerListingItemResponse> items = listingIds.stream()
        .map((listingId) -> fetchOwnerListing(ownerSession.userId(), listingId))
        .toList();

    return new OwnerListingsResponse(items, buildPagination(totalItems, safePage, safePageSize));
  }

  public OwnerListingUpdateResponse updateListing(
      String authorizationHeader,
      String listingId,
      OwnerListingUpdateRequest request
  ) {
    CurrentSessionService.SessionIdentity ownerSession = requireOwnerSession(authorizationHeader);
    fetchOwnerListing(ownerSession.userId(), listingId);
    jdbcTemplate.update("""
            UPDATE listings
            SET title = ?,
                rent = ?,
                deposit = ?,
                availability_date = CAST(? AS DATE),
                last_updated_label = 'Updated today'
            WHERE listing_id = ?
              AND owner_id = ?
              AND owner_managed = TRUE
            """,
        request.title(),
        request.rent(),
        request.deposit(),
        request.availabilityDate(),
        listingId,
        ownerSession.userId()
    );

    replaceAmenities(listingId, request.amenities());
    replacePhotos(listingId, request.photos());

    return new OwnerListingUpdateResponse(
        true,
        fetchOwnerListing(ownerSession.userId(), listingId)
    );
  }

  public OwnerCreatePaymentRecordResponse createPaymentRecord(
      String authorizationHeader,
      OwnerCreatePaymentRecordRequest request
  ) {
    CurrentSessionService.SessionIdentity ownerSession = requireOwnerSession(authorizationHeader);

    // Verify the listing belongs to this owner
    int listingCount = jdbcTemplate.queryForObject(
        "SELECT COUNT(*) FROM listings WHERE listing_id = ? AND owner_id = ? AND owner_managed = TRUE",
        Integer.class,
        request.listingId(),
        ownerSession.userId()
    );
    if (listingCount == 0) {
      throw new org.springframework.web.server.ResponseStatusException(
          org.springframework.http.HttpStatus.NOT_FOUND,
          "Listing not found or does not belong to your account."
      );
    }

    // Look up tenant by email
    String tenantUserId;
    String tenantName;
    try {
      Object[] tenantRow = jdbcTemplate.queryForObject(
          "SELECT user_id, full_name FROM users WHERE email = ? AND role = 'TENANT' LIMIT 1",
          (rs, rowNum) -> new Object[]{ rs.getString("user_id"), rs.getString("full_name") },
          request.tenantEmail()
      );
      tenantUserId = (String) tenantRow[0];
      tenantName   = (String) tenantRow[1];
    } catch (org.springframework.dao.EmptyResultDataAccessException ex) {
      throw new org.springframework.web.server.ResponseStatusException(
          org.springframework.http.HttpStatus.NOT_FOUND,
          "No tenant account found with email: " + request.tenantEmail() + ". Ask the tenant to register first."
      );
    }

    String paymentId = "pay_" + java.util.UUID.randomUUID().toString().replace("-", "").substring(0, 16);
    String receipt   = "rcpt_" + paymentId;
    OffsetDateTime now = OffsetDateTime.now(ZoneOffset.UTC).truncatedTo(ChronoUnit.SECONDS);
    String description = request.description() != null && !request.description().isBlank()
        ? request.description()
        : request.paymentLabel() + " for listing " + request.listingId();

    jdbcTemplate.update("""
            INSERT INTO payment_records (
              payment_id, tenant_user_id, owner_user_id, listing_id,
              payment_kind, payment_label, provider, receipt,
              amount, currency, status, due_date, description, notes,
              created_at, updated_at
            ) VALUES (?, ?, ?, ?, ?, ?, 'STRIPE', ?, ?, 'INR', 'DUE',
                      CAST(? AS DATE), ?, 'Created by owner via dashboard.',
                      ?, ?)
            """,
        paymentId,
        tenantUserId,
        ownerSession.userId(),
        request.listingId(),
        request.paymentKind().toUpperCase(java.util.Locale.ROOT),
        request.paymentLabel(),
        receipt,
        request.amount(),
        request.dueDate(),
        description,
        now,
        now
    );

    return new OwnerCreatePaymentRecordResponse(
        paymentId,
        tenantUserId,
        tenantName,
        request.listingId(),
        request.amount(),
        "INR",
        request.paymentKind().toUpperCase(java.util.Locale.ROOT),
        "DUE",
        request.dueDate(),
        "Payment record created for " + tenantName + ". They will see it immediately on their payments page."
    );
  }

  private CurrentSessionService.SessionIdentity requireOwnerSession(String authorizationHeader) {
    return currentSessionService.requireRole(
        authorizationHeader,
        "OWNER",
        "Sign in as an owner first before managing listings.",
        "This page is only available for owner accounts."
    );
  }

  private OwnerListingItemResponse fetchOwnerListing(String ownerId, String listingId) {
    try {
      OwnerListingBaseRow base = jdbcTemplate.queryForObject("""
              SELECT listing_id, title, property_type, city, locality, rent, deposit,
                     bhk, furnishing, availability_date, lat, lng, status, created_at
              FROM listings
              WHERE listing_id = ?
                AND owner_id = ?
                AND owner_managed = TRUE
              LIMIT 1
              """,
          (rs, rowNum) -> new OwnerListingBaseRow(
              rs.getString("listing_id"),
              rs.getString("title"),
              rs.getString("property_type"),
              rs.getString("city"),
              rs.getString("locality"),
              rs.getInt("rent"),
              rs.getInt("deposit"),
              rs.getString("bhk"),
              rs.getString("furnishing"),
              rs.getDate("availability_date").toLocalDate().toString(),
              rs.getDouble("lat"),
              rs.getDouble("lng"),
              rs.getString("status"),
              rs.getObject("created_at", OffsetDateTime.class)
          ),
          listingId,
          ownerId
      );

      return new OwnerListingItemResponse(
          base.listingId(),
          base.title(),
          base.propertyType(),
          base.city(),
          base.locality(),
          base.rent(),
          base.deposit(),
          base.bhk(),
          base.furnishing(),
          fetchAmenities(listingId),
          fetchPhotos(listingId),
          base.availabilityDate(),
          base.lat(),
          base.lng(),
          base.status(),
          formatTimestamp(base.createdAt())
      );
    } catch (EmptyResultDataAccessException exception) {
      throw new ResponseStatusException(HttpStatus.NOT_FOUND,
          "Owner listing not found for id " + listingId);
    }
  }

  private void replaceAmenities(String listingId, List<String> amenities) {
    jdbcTemplate.update("DELETE FROM listing_amenities WHERE listing_id = ?", listingId);
    for (int index = 0; index < amenities.size(); index++) {
      jdbcTemplate.update("""
              INSERT INTO listing_amenities (listing_id, sort_order, amenity)
              VALUES (?, ?, ?)
              """,
          listingId,
          index + 1,
          amenities.get(index)
      );
    }
  }

  private void replacePhotos(String listingId, List<String> photos) {
    jdbcTemplate.update("DELETE FROM listing_photos WHERE listing_id = ?", listingId);
    for (int index = 0; index < photos.size(); index++) {
      jdbcTemplate.update("""
              INSERT INTO listing_photos (listing_id, sort_order, photo_url)
              VALUES (?, ?, ?)
              """,
          listingId,
          index + 1,
          photos.get(index)
      );
    }
  }

  private List<String> fetchAmenities(String listingId) {
    return jdbcTemplate.query("""
            SELECT amenity
            FROM listing_amenities
            WHERE listing_id = ?
            ORDER BY sort_order
            """,
        (rs, rowNum) -> rs.getString("amenity"),
        listingId
    );
  }

  private List<String> fetchPhotos(String listingId) {
    return jdbcTemplate.query("""
            SELECT photo_url
            FROM listing_photos
            WHERE listing_id = ?
            ORDER BY sort_order
            """,
        (rs, rowNum) -> rs.getString("photo_url"),
        listingId
    );
  }

  private OwnerIdentity fetchCurrentOwner(String ownerId) {
    return jdbcTemplate.queryForObject("""
            SELECT full_name, phone_number
            FROM users
            WHERE user_id = ?
            """,
        (rs, rowNum) -> new OwnerIdentity(
            rs.getString("full_name"),
            maskPhone(rs.getString("phone_number")),
            "English, Hindi",
            "Owner draft",
            3
        ),
        ownerId
    );
  }

  private String maskPhone(String phoneNumber) {
    if (phoneNumber == null || phoneNumber.isBlank()) {
      return "Phone added after sign-in";
    }

    if (phoneNumber.length() <= 4) {
      return phoneNumber;
    }

    return phoneNumber.substring(0, Math.min(3, phoneNumber.length()))
        + "******"
        + phoneNumber.substring(phoneNumber.length() - 4);
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

  private String formatTimestamp(OffsetDateTime timestamp) {
    return timestamp.truncatedTo(ChronoUnit.SECONDS).toString();
  }

  /* ── Tier 1: bulk listing actions ────────────────────────────────────── */

  @Transactional
  public com.housing.ownertenantapi.dto.OwnerListingsBulkActionResponse bulkAction(
      String authorizationHeader,
      com.housing.ownertenantapi.dto.OwnerListingsBulkActionRequest request
  ) {
    String ownerUserId = currentSessionService.requireUserId(authorizationHeader);

    String resultingStatus = switch (request.action()) {
      case "PUBLISH" -> "PUBLISHED";
      case "PAUSE"   -> "PAUSED";
      case "ARCHIVE" -> "ARCHIVED";
      default -> throw new ResponseStatusException(HttpStatus.BAD_REQUEST,
          "Unknown action: " + request.action());
    };

    if (request.listingIds().isEmpty()) {
      return new com.housing.ownertenantapi.dto.OwnerListingsBulkActionResponse(
          request.action(), resultingStatus, 0, 0);
    }

    // PostgreSQL: pass the list as a comma-separated VARCHAR[] so we can use ANY().
    String[] ids = request.listingIds().toArray(new String[0]);

    // Only update listings owned by this user — extra safety on top of the
    // session check. Returns the count of rows that actually changed.
    int updated = jdbcTemplate.update(
        "UPDATE listings SET status = ?, updated_at = now() " +
            "WHERE owner_id = ? AND listing_id = ANY (?)",
        resultingStatus, ownerUserId, ids
    );

    int skipped = ids.length - updated;
    return new com.housing.ownertenantapi.dto.OwnerListingsBulkActionResponse(
        request.action(), resultingStatus, updated, Math.max(skipped, 0)
    );
  }

  /* ── Tier 1: CSV export of owner leads ───────────────────────────────── */

  public String exportOwnerLeadsCsv(String authorizationHeader) {
    String ownerUserId = currentSessionService.requireUserId(authorizationHeader);

    StringBuilder csv = new StringBuilder();
    csv.append("lead_id,listing_id,listing_title,tenant_name,tenant_phone,tenant_email,status,created_at\n");

    jdbcTemplate.query("""
            SELECT lr.lead_id,
                   lr.listing_id,
                   COALESCE(l.title, '') AS listing_title,
                   COALESCE(u.full_name, '') AS tenant_name,
                   COALESCE(u.phone_number, '') AS tenant_phone,
                   COALESCE(u.email, '') AS tenant_email,
                   lr.status,
                   to_char(lr.created_at AT TIME ZONE 'UTC', 'YYYY-MM-DD"T"HH24:MI:SS"Z"') AS created_at
            FROM lead_requests lr
            LEFT JOIN listings l ON l.listing_id = lr.listing_id
            LEFT JOIN users u    ON u.user_id    = lr.tenant_user_id
            WHERE lr.owner_user_id = ?
            ORDER BY lr.created_at DESC
            """,
        rs -> {
          csv.append(csvCell(rs.getString("lead_id"))).append(',')
              .append(csvCell(rs.getString("listing_id"))).append(',')
              .append(csvCell(rs.getString("listing_title"))).append(',')
              .append(csvCell(rs.getString("tenant_name"))).append(',')
              .append(csvCell(rs.getString("tenant_phone"))).append(',')
              .append(csvCell(rs.getString("tenant_email"))).append(',')
              .append(csvCell(rs.getString("status"))).append(',')
              .append(csvCell(rs.getString("created_at"))).append('\n');
        },
        ownerUserId
    );

    return csv.toString();
  }

  private String csvCell(String value) {
    if (value == null) return "";
    String escaped = value.replace("\"", "\"\"");
    if (escaped.contains(",") || escaped.contains("\"") || escaped.contains("\n")) {
      return "\"" + escaped + "\"";
    }
    return escaped;
  }

  /* ── Phase 1: multi-property cash-flow ───────────────────────────────── */

  public com.housing.ownertenantapi.dto.OwnerCashflowResponse cashflowOverview(
      String authorizationHeader
  ) {
    String ownerUserId = currentSessionService.requireUserId(authorizationHeader);

    // Active leases on the owner's listings → monthly rent stream.
    java.util.List<java.util.Map<String, Object>> leases = jdbcTemplate.queryForList("""
            SELECT lease_id, monthly_rent, start_date, end_date, listing_id
            FROM tenant_leases
            WHERE owner_id = ? AND status = 'ACTIVE'
            """, ownerUserId);

    long monthlyExpectedRupees = 0;
    long lifetimeBookedRupees = 0;
    java.time.LocalDate today = java.time.LocalDate.now();
    for (var l : leases) {
      long monthlyRent = ((Number) l.get("monthly_rent")).longValue();
      java.sql.Date end = (java.sql.Date) l.get("end_date");
      java.time.LocalDate endDate = end.toLocalDate();
      long monthsLeft = Math.max(0,
          java.time.temporal.ChronoUnit.MONTHS.between(today, endDate));
      monthlyExpectedRupees += monthlyRent;
      lifetimeBookedRupees += monthlyRent * monthsLeft;
    }

    long annualExpectedRupees = monthlyExpectedRupees * 12;

    java.util.List<com.housing.ownertenantapi.dto.OwnerCashflowResponse.ListingContribution> byListing =
        jdbcTemplate.query("""
                SELECT l.listing_id, l.title, l.locality, l.rent, l.status,
                       EXISTS(SELECT 1 FROM tenant_leases t
                              WHERE t.listing_id = l.listing_id AND t.status = 'ACTIVE') AS leased
                FROM listings l
                WHERE l.owner_id = ?
                ORDER BY l.created_at DESC
                """,
            (rs, rowNum) -> new com.housing.ownertenantapi.dto.OwnerCashflowResponse.ListingContribution(
                rs.getString("listing_id"),
                rs.getString("title"),
                rs.getString("locality"),
                rs.getLong("rent"),
                rs.getString("status"),
                rs.getBoolean("leased")
            ),
            ownerUserId
        );

    java.util.List<com.housing.ownertenantapi.dto.OwnerCashflowResponse.MonthlyBucket> upcoming = new java.util.ArrayList<>();
    java.time.format.DateTimeFormatter monthFmt = java.time.format.DateTimeFormatter.ofPattern("yyyy-MM");
    for (int i = 0; i < 12; i++) {
      java.time.LocalDate m = today.plusMonths(i);
      upcoming.add(new com.housing.ownertenantapi.dto.OwnerCashflowResponse.MonthlyBucket(
          monthFmt.format(m), monthlyExpectedRupees
      ));
    }

    int publishedCount = (int) byListing.stream().filter(b -> "PUBLISHED".equals(b.status())).count();
    return new com.housing.ownertenantapi.dto.OwnerCashflowResponse(
        monthlyExpectedRupees, annualExpectedRupees, lifetimeBookedRupees,
        leases.size(), publishedCount, upcoming, byListing
    );
  }

  /* ── Phase 1: pricing recommendation ─────────────────────────────────── */

  public com.housing.ownertenantapi.dto.PricingRecommendationResponse pricingRecommendation(
      String city, String locality, String bhk
  ) {
    String resolvedCity = com.housing.ownertenantapi.util.CityCatalog.canonicalize(city);

    // Pull comparable listings: same city + bhk; locality match preferred but
    // not required (if too few in the locality, we widen to whole city).
    java.util.List<Integer> rentsLocality = jdbcTemplate.queryForList("""
            SELECT rent FROM listings
            WHERE status = 'PUBLISHED' AND lower(city) = lower(?)
              AND lower(locality) = lower(?) AND bhk = ?
            """, Integer.class, resolvedCity, locality == null ? "" : locality, bhk);

    java.util.List<Integer> rents = rentsLocality.size() >= 5
        ? rentsLocality
        : jdbcTemplate.queryForList("""
                SELECT rent FROM listings
                WHERE status = 'PUBLISHED' AND lower(city) = lower(?) AND bhk = ?
                """, Integer.class, resolvedCity, bhk);

    if (rents.size() < 5) {
      return new com.housing.ownertenantapi.dto.PricingRecommendationResponse(
          resolvedCity, locality, bhk, rents.size(),
          0, 0, 0,
          "Not enough comparable listings yet — need at least 5 for a useful range.",
          "INSUFFICIENT_DATA"
      );
    }

    java.util.List<Integer> sorted = new java.util.ArrayList<>(rents);
    java.util.Collections.sort(sorted);
    long median = percentile(sorted, 50);
    long p25 = percentile(sorted, 25);
    long p75 = percentile(sorted, 75);

    String confidence = (p75 - p25) * 1.0 / median < 0.4 ? "NARROW" : "WIDE";
    String summary = String.format(
        "Median rent for %s in %s is ₹%s. The middle 50%% of listings sit between ₹%s and ₹%s.",
        bhk,
        rentsLocality.size() >= 5 ? locality : resolvedCity,
        formatRupees(median),
        formatRupees(p25),
        formatRupees(p75)
    );

    return new com.housing.ownertenantapi.dto.PricingRecommendationResponse(
        resolvedCity, locality, bhk, rents.size(), median, p25, p75, summary, confidence
    );
  }

  private long percentile(java.util.List<Integer> sortedAsc, int p) {
    if (sortedAsc.isEmpty()) return 0;
    int idx = (int) Math.round((p / 100.0) * (sortedAsc.size() - 1));
    return sortedAsc.get(Math.max(0, Math.min(sortedAsc.size() - 1, idx)));
  }

  private String formatRupees(long value) {
    if (value >= 100_000) return String.format("%.1fL", value / 100_000.0);
    if (value >= 1_000) return Math.round(value / 1_000.0) + "k";
    return String.valueOf(value);
  }

  /* ── Tier 1: rollup analytics across all owner listings ──────────────── */

  public java.util.Map<String, Object> getRollupAnalytics(String authorizationHeader) {
    String ownerUserId = currentSessionService.requireUserId(authorizationHeader);
    java.util.Map<String, Object> rollup = new java.util.LinkedHashMap<>();

    rollup.put("listingCount", jdbcTemplate.queryForObject(
        "SELECT COUNT(*) FROM listings WHERE owner_id = ?", Long.class, ownerUserId));
    rollup.put("publishedCount", jdbcTemplate.queryForObject(
        "SELECT COUNT(*) FROM listings WHERE owner_id = ? AND status = 'PUBLISHED'",
        Long.class, ownerUserId));
    rollup.put("totalLeads", jdbcTemplate.queryForObject(
        "SELECT COUNT(*) FROM lead_requests WHERE owner_user_id = ?", Long.class, ownerUserId));
    rollup.put("recentLeads", jdbcTemplate.queryForObject(
        "SELECT COUNT(*) FROM lead_requests WHERE owner_user_id = ? AND created_at >= now() - INTERVAL '7 days'",
        Long.class, ownerUserId));
    rollup.put("scheduledVisits", jdbcTemplate.queryForObject("""
            SELECT COUNT(*) FROM visits v
            JOIN listings l ON l.listing_id = v.listing_id
            WHERE l.owner_id = ? AND v.status = 'SCHEDULED'
            """, Long.class, ownerUserId));
    rollup.put("activeChats", jdbcTemplate.queryForObject(
        "SELECT COUNT(*) FROM chat_threads WHERE owner_id = ?", Long.class, ownerUserId));
    rollup.put("featuredCount", jdbcTemplate.queryForObject(
        "SELECT COUNT(*) FROM listings WHERE owner_id = ? AND featured_until > now()",
        Long.class, ownerUserId));
    rollup.put("avgRating", jdbcTemplate.queryForObject("""
            SELECT COALESCE(ROUND(AVG(r.rating)::numeric, 1), 0)::float8
            FROM property_reviews r
            JOIN listings l ON l.listing_id = r.listing_id
            WHERE l.owner_id = ?
            """, Double.class, ownerUserId));
    rollup.put("flaggedListings", jdbcTemplate.queryForObject(
        "SELECT COUNT(*) FROM listings WHERE owner_id = ? AND fraud_score > 0",
        Long.class, ownerUserId));

    return rollup;
  }

  private record OwnerIdentity(
      String name,
      String phoneMasked,
      String preferredLanguage,
      String badge,
      int yearsOnPlatform
  ) {
  }

  private record OwnerListingBaseRow(
      String listingId,
      String title,
      String propertyType,
      String city,
      String locality,
      int rent,
      int deposit,
      String bhk,
      String furnishing,
      String availabilityDate,
      double lat,
      double lng,
      String status,
      OffsetDateTime createdAt
  ) {
  }
}
