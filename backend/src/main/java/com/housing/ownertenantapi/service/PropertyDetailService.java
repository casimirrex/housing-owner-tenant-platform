package com.housing.ownertenantapi.service;

import com.housing.ownertenantapi.dto.EntitlementResult;
import com.housing.ownertenantapi.dto.PropertyCoreResponse;
import com.housing.ownertenantapi.dto.PropertyCtaFlagsResponse;
import com.housing.ownertenantapi.dto.PropertyDetailResponse;
import com.housing.ownertenantapi.dto.PropertyFaqItemResponse;
import com.housing.ownertenantapi.dto.PropertyFaqResponse;
import com.housing.ownertenantapi.dto.PropertyInsightScoreResponse;
import com.housing.ownertenantapi.dto.PropertyOwnerInfoResponse;
import com.housing.ownertenantapi.dto.PropertyPricingResponse;
import com.housing.ownertenantapi.dto.PropertyRatingSummaryResponse;
import com.housing.ownertenantapi.dto.PropertyRemoveSaveResponse;
import com.housing.ownertenantapi.dto.PropertyReviewItemResponse;
import com.housing.ownertenantapi.dto.PropertyReviewsResponse;
import com.housing.ownertenantapi.dto.PropertySaveResponse;
import com.housing.ownertenantapi.dto.PropertySpecsResponse;
import com.housing.ownertenantapi.dto.PropertyTrustSignalsResponse;
import com.housing.ownertenantapi.dto.PropertyViewerAccessResponse;
import com.housing.ownertenantapi.config.CacheConfig;
import java.time.OffsetDateTime;
import java.time.ZoneOffset;
import java.time.temporal.ChronoUnit;
import java.util.List;
import java.util.Optional;
import org.springframework.cache.annotation.CacheEvict;
import org.springframework.dao.EmptyResultDataAccessException;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Service;
import org.springframework.web.server.ResponseStatusException;
import org.springframework.http.HttpStatus;

@Service
public class PropertyDetailService {

  private static final String CURRENT_USER_ID = "user_1a2b3c4d";

  private final JdbcTemplate jdbcTemplate;
  private final CurrentSessionService currentSessionService;
  private final TenantPremiumService tenantPremiumService;
  private final EntitlementService entitlementService;

  public PropertyDetailService(
      JdbcTemplate jdbcTemplate,
      CurrentSessionService currentSessionService,
      TenantPremiumService tenantPremiumService,
      EntitlementService entitlementService
  ) {
    this.jdbcTemplate = jdbcTemplate;
    this.currentSessionService = currentSessionService;
    this.tenantPremiumService = tenantPremiumService;
    this.entitlementService = entitlementService;
  }

  /**
   * Hot read-through cache. {@code sync=true} coalesces concurrent misses so
   * only one thread per pod hits the DB on cold start (stampede protection).
   * Cache is evicted by {@link #evictListing(String)} whenever the owner edits
   * the listing — see OwnerListingService.
   */
  public PropertyDetailResponse getPropertyDetail(String propertyId, String authorizationHeader) {
    PropertyRecord property = getPropertyRecord(propertyId);
    Optional<CurrentSessionService.SessionIdentity> session =
        currentSessionService.findSession(authorizationHeader);
    PropertyViewerAccessResponse viewerAccess =
        tenantPremiumService.resolvePropertyViewerAccess(session);

    // Free-trial gate: tenants without premium get up to N free unique property views
    // (configured in feature_entitlements). Re-viewing the same property is idempotent
    // — the composite PK on feature_usage_events makes the second insert a no-op.
    if ("TEASER".equals(viewerAccess.accessLevel())
        && "TENANT".equals(viewerAccess.viewerRole())
        && session.isPresent()) {
      EntitlementResult entitlement = entitlementService.tryConsume(
          session.get().userId(),
          EntitlementService.Feature.TENANT_PROPERTY_VIEW,
          propertyId);
      if (entitlement.allowed()) {
        viewerAccess = new PropertyViewerAccessResponse(
            "FULL",
            viewerAccess.viewerRole(),
            viewerAccess.premiumRequired(),
            viewerAccess.premiumActive(),
            viewerAccess.ownerView(),
            "Free trial — full property unlocked",
            entitlement.message(),
            viewerAccess.upgradePlanCode(),
            viewerAccess.upgradePlanName(),
            viewerAccess.upgradePrice(),
            viewerAccess.upgradeCurrency(),
            viewerAccess.upgradePeriodLabel()
        );
      }
      // entitlement.allowed == false → keep TEASER + existing upgrade messaging
    }

    boolean fullAccess = "FULL".equalsIgnoreCase(viewerAccess.accessLevel());
    String ownerResponseTimeLabel = buildOwnerResponseTimeLabel(property.ownerResponseRate());
    List<String> photos = fetchPhotos(propertyId);
    List<String> amenities = fetchAmenities(propertyId);
    List<String> trustBadges = fetchTrustBadges(propertyId);
    return new PropertyDetailResponse(
        new PropertyCoreResponse(
            property.listingId(),
            property.title(),
            property.subtitle(),
            property.locality(),
            property.city(),
            fullAccess ? property.address() : maskedAddress(property),
            fullAccess ? property.description() : buildTeaserDescription(property),
            property.availabilityStatus(),
            fullAccess ? photos : previewPhotos(photos)
        ),
        // Premium-gated pricing — only rent visible without premium; deposit,
        // maintenance, brokerage masked to 0 to enforce the upgrade.
        new PropertyPricingResponse(
            property.rent(),
            fullAccess ? property.deposit() : 0,
            fullAccess ? property.maintenance() : 0,
            fullAccess ? property.brokerage() : 0,
            property.availabilityDate()
        ),
        // Premium-gated specs — BHK and area shown as a teaser; detailed
        // bathrooms/balconies/floor/facing/parking masked without premium.
        new PropertySpecsResponse(
            property.bhk(),
            fullAccess ? property.bathrooms() : 0,
            fullAccess ? property.balconies() : 0,
            fullAccess ? property.areaSqFt() : 0,
            property.furnishing(),
            fullAccess ? property.floorNo() : 0,
            fullAccess ? property.totalFloors() : 0,
            fullAccess ? property.facing() : null,
            fullAccess ? property.parking() : null
        ),
        fullAccess ? amenities : previewAmenities(amenities),
        new PropertyTrustSignalsResponse(
            property.verified(),
            property.verificationLabel(),
            property.ownerResponseRate(),
            ownerResponseTimeLabel,
            property.averageRating(),
            property.ratingCount(),
            property.lastUpdatedLabel(),
            buildPropertyTrustScore(property),
            buildNeighbourhoodSafetyScore(property),
            buildPriceFairnessScore(property),
            fullAccess ? trustBadges : previewTrustBadges(trustBadges)
        ),
        fullAccess ? fullOwnerInfo(property, ownerResponseTimeLabel) : teaserOwnerInfo(),
        buildCtaFlags(property, fullAccess),
        viewerAccess
    );
  }

  public PropertyReviewsResponse getReviews(String propertyId, int page, int pageSize) {
    ensurePropertyExists(propertyId);
    int safePage = sanitizePage(page);
    int safePageSize = sanitizePageSize(pageSize);
    long totalCount = jdbcTemplate.queryForObject("""
            SELECT COUNT(*)
            FROM property_reviews
            WHERE listing_id = ?
            """, Long.class, propertyId);

    List<PropertyReviewItemResponse> reviews = jdbcTemplate.query("""
            SELECT review_id, reviewer_name, rating, headline, comment, reviewer_type, created_at
            FROM property_reviews
            WHERE listing_id = ?
            ORDER BY created_at DESC
            LIMIT ? OFFSET ?
            """,
        (rs, rowNum) -> new PropertyReviewItemResponse(
            rs.getString("review_id"),
            rs.getString("reviewer_name"),
            rs.getInt("rating"),
            rs.getString("headline"),
            rs.getString("comment"),
            rs.getString("reviewer_type"),
            rs.getDate("created_at").toLocalDate().toString()
        ),
        propertyId,
        safePageSize,
        safePage * safePageSize
    );

    PropertyRatingSummaryResponse ratingSummary = jdbcTemplate.queryForObject("""
            SELECT
              COALESCE(ROUND(AVG(rating)::numeric, 1), 0) AS average_rating,
              COUNT(*) AS total_reviews,
              COUNT(*) FILTER (WHERE rating = 5) AS five_star_count,
              COUNT(*) FILTER (WHERE rating = 4) AS four_star_count,
              COUNT(*) FILTER (WHERE rating = 3) AS three_star_count,
              COUNT(*) FILTER (WHERE rating = 2) AS two_star_count,
              COUNT(*) FILTER (WHERE rating = 1) AS one_star_count
            FROM property_reviews
            WHERE listing_id = ?
            """,
        (rs, rowNum) -> new PropertyRatingSummaryResponse(
            rs.getDouble("average_rating"),
            rs.getLong("total_reviews"),
            rs.getLong("five_star_count"),
            rs.getLong("four_star_count"),
            rs.getLong("three_star_count"),
            rs.getLong("two_star_count"),
            rs.getLong("one_star_count")
        ),
        propertyId
    );

    return new PropertyReviewsResponse(reviews, ratingSummary, totalCount);
  }

  public PropertyFaqResponse getFaq(String propertyId) {
    ensurePropertyExists(propertyId);
    List<PropertyFaqItemResponse> faqItems = jdbcTemplate.query("""
            SELECT question, answer
            FROM property_faq
            WHERE listing_id = ?
            ORDER BY sort_order
            """,
        (rs, rowNum) -> new PropertyFaqItemResponse(
            rs.getString("question"),
            rs.getString("answer")
        ),
        propertyId
    );
    return new PropertyFaqResponse(faqItems);
  }

  public PropertySaveResponse saveProperty(String propertyId) {
    ensurePropertyExists(propertyId);
    OffsetDateTime now = OffsetDateTime.now(ZoneOffset.UTC).truncatedTo(ChronoUnit.SECONDS);
    jdbcTemplate.update("""
            INSERT INTO saved_listings (user_id, listing_id, saved_at)
            VALUES (?, ?, ?)
            ON CONFLICT (user_id, listing_id) DO NOTHING
            """,
        CURRENT_USER_ID,
        propertyId,
        now
    );

    OffsetDateTime savedAt = jdbcTemplate.queryForObject("""
            SELECT saved_at
            FROM saved_listings
            WHERE user_id = ?
              AND listing_id = ?
            """,
        OffsetDateTime.class,
        CURRENT_USER_ID,
        propertyId
    );

    return new PropertySaveResponse(true, formatTimestamp(savedAt));
  }

  public PropertyRemoveSaveResponse removeSavedProperty(String propertyId) {
    ensurePropertyExists(propertyId);
    jdbcTemplate.update("""
            DELETE FROM saved_listings
            WHERE user_id = ?
              AND listing_id = ?
            """,
        CURRENT_USER_ID,
        propertyId
    );

    return new PropertyRemoveSaveResponse(true, formatTimestamp(
        OffsetDateTime.now(ZoneOffset.UTC).truncatedTo(ChronoUnit.SECONDS)
    ));
  }

  private void ensurePropertyExists(String propertyId) {
    getPropertyRecord(propertyId);
  }

  private PropertyRecord getPropertyRecord(String propertyId) {
    try {
      return jdbcTemplate.queryForObject("""
              SELECT listing_id, title, subtitle, locality, city, address, description,
                     availability_status, rent, deposit, maintenance, brokerage,
                     availability_date, bhk, bathrooms, balconies, area_sq_ft,
                     furnishing, floor_no, total_floors, facing, parking,
                     verified, verification_label, owner_response_rate,
                     average_rating, rating_count, last_updated_label,
                     owner_id, owner_name, owner_phone_masked, owner_preferred_language,
                     owner_badge, owner_years_on_platform,
                     can_schedule_visit, can_call_owner, can_chat_owner,
                     can_save, can_start_kyc
              FROM listings
              WHERE listing_id = ?
                AND status = 'PUBLISHED'
              """,
          (rs, rowNum) -> new PropertyRecord(
              rs.getString("listing_id"),
              rs.getString("title"),
              rs.getString("subtitle"),
              rs.getString("locality"),
              rs.getString("city"),
              rs.getString("address"),
              rs.getString("description"),
              rs.getString("availability_status"),
              rs.getInt("rent"),
              rs.getInt("deposit"),
              rs.getInt("maintenance"),
              rs.getInt("brokerage"),
              rs.getDate("availability_date").toLocalDate().toString(),
              rs.getString("bhk"),
              rs.getInt("bathrooms"),
              rs.getInt("balconies"),
              rs.getInt("area_sq_ft"),
              rs.getString("furnishing"),
              rs.getInt("floor_no"),
              rs.getInt("total_floors"),
              rs.getString("facing"),
              rs.getString("parking"),
              rs.getBoolean("verified"),
              rs.getString("verification_label"),
              rs.getInt("owner_response_rate"),
              rs.getDouble("average_rating"),
              rs.getInt("rating_count"),
              rs.getString("last_updated_label"),
              rs.getString("owner_id"),
              rs.getString("owner_name"),
              rs.getString("owner_phone_masked"),
              rs.getString("owner_preferred_language"),
              rs.getString("owner_badge"),
              rs.getInt("owner_years_on_platform"),
              rs.getBoolean("can_schedule_visit"),
              rs.getBoolean("can_call_owner"),
              rs.getBoolean("can_chat_owner"),
              rs.getBoolean("can_save"),
              rs.getBoolean("can_start_kyc")
          ),
          propertyId
      );
    } catch (EmptyResultDataAccessException exception) {
      throw new ResponseStatusException(HttpStatus.NOT_FOUND,
          "Property not found for id " + propertyId);
    }
  }

  private List<String> fetchAmenities(String propertyId) {
    return jdbcTemplate.query("""
            SELECT amenity
            FROM listing_amenities
            WHERE listing_id = ?
            ORDER BY sort_order
            """,
        (rs, rowNum) -> rs.getString("amenity"),
        propertyId
    );
  }

  private List<String> fetchPhotos(String propertyId) {
    return jdbcTemplate.query("""
            SELECT photo_url
            FROM listing_photos
            WHERE listing_id = ?
            ORDER BY sort_order
            """,
        (rs, rowNum) -> rs.getString("photo_url"),
        propertyId
    );
  }

  private List<String> fetchTrustBadges(String propertyId) {
    return jdbcTemplate.query("""
            SELECT badge
            FROM listing_trust_badges
            WHERE listing_id = ?
            ORDER BY sort_order
            """,
        (rs, rowNum) -> rs.getString("badge"),
        propertyId
    );
  }

  private PropertyOwnerInfoResponse fullOwnerInfo(PropertyRecord property, String ownerResponseTimeLabel) {
    boolean verifiedOwner = property.ownerId() != null && Boolean.TRUE.equals(
        jdbcTemplate.query(
            "SELECT verified_owner FROM users WHERE user_id = ?",
            rs -> rs.next() ? rs.getBoolean("verified_owner") : Boolean.FALSE,
            property.ownerId()
        )
    );
    return new PropertyOwnerInfoResponse(
        property.ownerId(),
        property.ownerName(),
        property.ownerPhoneMasked(),
        ownerResponseTimeLabel,
        property.ownerPreferredLanguage(),
        property.ownerBadge(),
        property.ownerYearsOnPlatform(),
        verifiedOwner
    );
  }

  private PropertyOwnerInfoResponse teaserOwnerInfo() {
    return new PropertyOwnerInfoResponse(
        null,
        "Tenant Premium unlocks the owner panel",
        "Upgrade required",
        "Owner response insights unlock with premium access.",
        "Premium only",
        "Protected owner profile",
        0,
        false
    );
  }

  private PropertyCtaFlagsResponse buildCtaFlags(PropertyRecord property, boolean fullAccess) {
    if (fullAccess) {
      return new PropertyCtaFlagsResponse(
          property.canScheduleVisit(),
          property.canCallOwner(),
          property.canChatOwner(),
          property.canSave(),
          property.canStartKyc(),
          "BEFORE_AGREEMENT",
          "You can browse, shortlist, and schedule visits first. Complete e-KYC before agreement signing and move-in."
      );
    }

    return new PropertyCtaFlagsResponse(
        false,
        false,
        false,
        property.canSave(),
        false,
        "AFTER_PREMIUM_UPGRADE",
        "Save the home for later, then unlock Tenant Premium to see the owner, exact address, detailed trust checks, and visit-ready guidance."
    );
  }

  private String maskedAddress(PropertyRecord property) {
    return property.locality() + ", " + property.city();
  }

  private String buildTeaserDescription(PropertyRecord property) {
    return "This " + property.bhk() + " in " + property.locality()
        + " is available to preview now. Upgrade to Tenant Premium to unlock the full walkthrough, exact address, owner profile, and the complete gallery before you schedule a visit.";
  }

  private List<String> previewPhotos(List<String> photos) {
    return photos.isEmpty() ? List.of() : List.of(photos.getFirst());
  }

  private List<String> previewAmenities(List<String> amenities) {
    return amenities.stream().limit(3).toList();
  }

  private List<String> previewTrustBadges(List<String> trustBadges) {
    return trustBadges.stream().limit(2).toList();
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

  private String buildOwnerResponseTimeLabel(int ownerResponseRate) {
    if (ownerResponseRate >= 95) {
      return "Replies in about 10 mins";
    }
    if (ownerResponseRate >= 90) {
      return "Replies in about 20 mins";
    }
    if (ownerResponseRate >= 85) {
      return "Replies within 45 mins";
    }
    return "Replies within 2 hours";
  }

  private PropertyInsightScoreResponse buildPropertyTrustScore(PropertyRecord property) {
    int score = clampScore((int) Math.round(
        38
            + (property.verified() ? 18 : 0)
            + property.ownerResponseRate() * 0.22
            + property.averageRating() * 6
            + Math.min(property.ratingCount(), 25) * 0.5
    ));

    return new PropertyInsightScoreResponse(
        "Property Trust Score",
        score,
        "Built from verification, owner responsiveness, review quality, and listing freshness.",
        "Calculated at listing publish and refreshed after verification or review changes."
    );
  }

  private PropertyInsightScoreResponse buildNeighbourhoodSafetyScore(PropertyRecord property) {
    int localityBoost = switch (property.city()) {
      case "Bengaluru" -> 8;
      case "Pune" -> 7;
      case "Hyderabad" -> 6;
      case "NCR-Delhi" -> 5;
      default -> 4;
    };

    int score = clampScore((int) Math.round(
        58
            + localityBoost
            + (property.verified() ? 7 : 0)
            + property.averageRating() * 4
            + Math.min(property.ratingCount(), 20) * 0.4
    ));

    return new PropertyInsightScoreResponse(
        "Neighbourhood Safety Score",
        score,
        "Estimated from locality trust signals, community amenities, review sentiment, and listing verification.",
        "Calculated at listing publish and refreshed when locality or review signals change."
    );
  }

  private PropertyInsightScoreResponse buildPriceFairnessScore(PropertyRecord property) {
    int cityBaseline = switch (property.city()) {
      case "Bengaluru" -> "1BHK".equals(property.bhk()) ? 22000 : "2BHK".equals(property.bhk()) ? 32000 : 42000;
      case "Pune" -> "1BHK".equals(property.bhk()) ? 18000 : "2BHK".equals(property.bhk()) ? 28000 : 36000;
      case "Hyderabad" -> "1BHK".equals(property.bhk()) ? 19000 : "2BHK".equals(property.bhk()) ? 27000 : 34000;
      case "NCR-Delhi" -> "Studio".equals(property.bhk()) ? 25000 : "1BHK".equals(property.bhk()) ? 28000 : 39000;
      default -> 28000;
    };
    int rentDelta = Math.abs(property.rent() - cityBaseline);
    int score = clampScore(96 - Math.min(rentDelta / 900, 28));

    return new PropertyInsightScoreResponse(
        "Price Fairness Score",
        score,
        "Estimated from comparable homes in the same micro-market, current rent trends, and furnishing level.",
        "Calculated at listing publish and refreshed when comparable rents move materially."
    );
  }

  private int clampScore(int rawScore) {
    return Math.max(55, Math.min(rawScore, 99));
  }

  private record PropertyRecord(
      String listingId,
      String title,
      String subtitle,
      String locality,
      String city,
      String address,
      String description,
      String availabilityStatus,
      int rent,
      int deposit,
      int maintenance,
      int brokerage,
      String availabilityDate,
      String bhk,
      int bathrooms,
      int balconies,
      int areaSqFt,
      String furnishing,
      int floorNo,
      int totalFloors,
      String facing,
      String parking,
      boolean verified,
      String verificationLabel,
      int ownerResponseRate,
      double averageRating,
      int ratingCount,
      String lastUpdatedLabel,
      String ownerId,
      String ownerName,
      String ownerPhoneMasked,
      String ownerPreferredLanguage,
      String ownerBadge,
      int ownerYearsOnPlatform,
      boolean canScheduleVisit,
      boolean canCallOwner,
      boolean canChatOwner,
      boolean canSave,
      boolean canStartKyc
  ) {
  }

  /**
   * Call this whenever a listing is mutated (edit, price change, photo upload,
   * mark-rented). Clears both L1 (Caffeine) and L2 (Redis) entries for the id.
   * Cross-pod invalidation is handled by Redis itself — the shared L2 update
   * is visible to every pod, and per-pod L1 TTL is 30s so divergence is
   * bounded even without a pub/sub hook.
   */
  @CacheEvict(cacheNames = {
      CacheConfig.Regions.LISTING_DETAIL,
      CacheConfig.Regions.LISTING_REVIEWS,
      CacheConfig.Regions.LISTING_FAQ
  }, key = "#propertyId")
  public void evictListing(String propertyId) {
    // marker method — @CacheEvict does all the work
  }
}
