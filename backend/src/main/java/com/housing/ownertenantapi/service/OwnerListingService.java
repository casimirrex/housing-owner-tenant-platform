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

    return new OwnerListingCreateResponse(listingId, listingStatus, formatTimestamp(createdAt));
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
