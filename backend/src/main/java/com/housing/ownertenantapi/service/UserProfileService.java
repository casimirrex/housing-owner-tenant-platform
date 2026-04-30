package com.housing.ownertenantapi.service;

import com.housing.ownertenantapi.dto.UserPreferenceProfileResponse;
import com.housing.ownertenantapi.dto.UserPreferenceUpdateRequest;
import com.housing.ownertenantapi.dto.UserPreferenceUpdateResponse;
import com.housing.ownertenantapi.dto.UserPhotoUploadRequest;
import com.housing.ownertenantapi.dto.UserPhotoUploadResponse;
import com.housing.ownertenantapi.dto.UserAccountDeactivationResponse;
import com.housing.ownertenantapi.dto.UserPasswordUpdateRequest;
import com.housing.ownertenantapi.dto.UserPasswordUpdateResponse;
import com.housing.ownertenantapi.dto.UserProfileResponse;
import com.housing.ownertenantapi.dto.UserProfileUpdateRequest;
import com.housing.ownertenantapi.dto.UserProfileUpdateResponse;
import com.housing.ownertenantapi.dto.UserVerificationStatusResponse;
import java.time.OffsetDateTime;
import java.time.ZoneOffset;
import java.time.temporal.ChronoUnit;
import java.util.List;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.jdbc.core.simple.JdbcClient;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.util.StringUtils;

@Service
public class UserProfileService {

  private final JdbcClient jdbcClient;
  private final CurrentSessionService currentSessionService;
  private final PasswordEncoder passwordEncoder;

  public UserProfileService(
      JdbcTemplate jdbcTemplate,
      CurrentSessionService currentSessionService,
      PasswordEncoder passwordEncoder
  ) {
    this.jdbcClient = JdbcClient.create(jdbcTemplate);
    this.currentSessionService = currentSessionService;
    this.passwordEncoder = passwordEncoder;
  }

  public UserProfileResponse getCurrentUser(String authorizationHeader) {
    String currentUserId = resolveCurrentUserId(authorizationHeader);
    return jdbcClient.sql("""
            SELECT user_id, full_name, email, phone_number, role, profile_status,
                   city, date_of_birth, gender, occupation,
                   emergency_contact_name, emergency_contact_phone,
                   employment_type, employer_name, monthly_income_range,
                   previous_landlord_name, previous_landlord_phone,
                   aadhaar_last4, pan_card_number, government_id_type,
                   government_id_photo_url, upi_id, photo_url,
                   profile_completion,
                   EXISTS(
                     SELECT 1
                     FROM user_subscriptions us
                     WHERE us.user_id = users.user_id
                       AND us.plan_code = 'TENANT_PREMIUM_ANNUAL'
                       AND us.status = 'ACTIVE'
                       AND us.expires_at > CURRENT_TIMESTAMP
                   ) AS premium_tenant,
                   (
                     SELECT us.plan_code
                     FROM user_subscriptions us
                     WHERE us.user_id = users.user_id
                       AND us.status = 'ACTIVE'
                       AND us.expires_at > CURRENT_TIMESTAMP
                     ORDER BY us.expires_at DESC
                     LIMIT 1
                   ) AS premium_plan_code,
                   (
                     SELECT us.expires_at
                     FROM user_subscriptions us
                     WHERE us.user_id = users.user_id
                       AND us.status = 'ACTIVE'
                       AND us.expires_at > CURRENT_TIMESTAMP
                     ORDER BY us.expires_at DESC
                     LIMIT 1
                   ) AS premium_expires_at,
                   COALESCE(password_hash, '') <> '' AS has_password
            FROM users
            WHERE user_id = :userId
            """)
        .param("userId", currentUserId)
        .query((rs, rowNum) -> new UserProfileResponse(
            rs.getString("user_id"),
            rs.getString("full_name"),
            rs.getString("email"),
            rs.getString("phone_number"),
            rs.getString("role"),
            rs.getString("profile_status"),
            rs.getString("city"),
            rs.getDate("date_of_birth") != null ? rs.getDate("date_of_birth").toLocalDate().toString() : null,
            rs.getString("gender"),
            rs.getString("occupation"),
            rs.getString("emergency_contact_name"),
            rs.getString("emergency_contact_phone"),
            rs.getString("employment_type"),
            rs.getString("employer_name"),
            rs.getString("monthly_income_range"),
            rs.getString("previous_landlord_name"),
            rs.getString("previous_landlord_phone"),
            rs.getString("aadhaar_last4"),
            rs.getString("pan_card_number"),
            rs.getString("government_id_type"),
            rs.getString("government_id_photo_url"),
            rs.getString("upi_id"),
            rs.getString("photo_url"),
            rs.getInt("profile_completion"),
            rs.getBoolean("premium_tenant"),
            rs.getString("premium_plan_code"),
            rs.getObject("premium_expires_at", OffsetDateTime.class) != null
                ? rs.getObject("premium_expires_at", OffsetDateTime.class).truncatedTo(ChronoUnit.SECONDS).toString()
                : null,
            rs.getBoolean("has_password")
        ))
        .single();
  }

  public UserProfileUpdateResponse updateCurrentUser(
      String authorizationHeader,
      UserProfileUpdateRequest request
  ) {
    String currentUserId = resolveCurrentUserId(authorizationHeader);
    OffsetDateTime updatedAt = OffsetDateTime.now(ZoneOffset.UTC).truncatedTo(ChronoUnit.SECONDS);
    jdbcClient.sql("""
            UPDATE users
            SET full_name = :fullName,
                date_of_birth = CAST(NULLIF(:dateOfBirth, '') AS DATE),
                gender = :gender,
                city = :city,
                occupation = :occupation,
                emergency_contact_name = :emergencyContactName,
                emergency_contact_phone = :emergencyContactPhone,
                employment_type = NULLIF(:employmentType, ''),
                employer_name = NULLIF(:employerName, ''),
                monthly_income_range = NULLIF(:monthlyIncomeRange, ''),
                previous_landlord_name = NULLIF(:previousLandlordName, ''),
                previous_landlord_phone = NULLIF(:previousLandlordPhone, ''),
                aadhaar_last4 = NULLIF(:aadhaarLast4, ''),
                pan_card_number = NULLIF(:panCardNumber, ''),
                government_id_type = NULLIF(:governmentIdType, ''),
                government_id_photo_url = NULLIF(:governmentIdPhotoUrl, ''),
                upi_id = NULLIF(:upiId, ''),
                photo_url = :photoUrl,
                updated_at = :updatedAt
            WHERE user_id = :userId
            """)
        .param("fullName", request.fullName())
        .param("dateOfBirth", request.dateOfBirth())
        .param("gender", request.gender())
        .param("city", request.city())
        .param("occupation", request.occupation())
        .param("emergencyContactName", request.emergencyContactName())
        .param("emergencyContactPhone", request.emergencyContactPhone())
        .param("employmentType", request.employmentType())
        .param("employerName", request.employerName())
        .param("monthlyIncomeRange", request.monthlyIncomeRange())
        .param("previousLandlordName", request.previousLandlordName())
        .param("previousLandlordPhone", request.previousLandlordPhone())
        .param("aadhaarLast4", request.aadhaarLast4())
        .param("panCardNumber", request.panCardNumber())
        .param("governmentIdType", request.governmentIdType())
        .param("governmentIdPhotoUrl", request.governmentIdPhotoUrl())
        .param("upiId", request.upiId())
        .param("photoUrl", request.photoUrl())
        .param("updatedAt", updatedAt)
        .param("userId", currentUserId)
        .update();

    refreshOnboardingState(currentUserId, updatedAt);
    return new UserProfileUpdateResponse(true, getCurrentUser(authorizationHeader));
  }

  public UserPreferenceProfileResponse getPreferences(String authorizationHeader) {
    String currentUserId = resolveCurrentUserId(authorizationHeader);
    ensurePreferenceProfile(currentUserId);

    UserPreferenceProfileResponse base = jdbcClient.sql("""
            SELECT preference_profile_id, budget_min, budget_max, bhk_preference,
                   furnishing_preference, commute_location, move_in_date,
                   pet_friendly, tenant_type
            FROM user_preferences
            WHERE user_id = :userId
            """)
        .param("userId", currentUserId)
        .query((rs, rowNum) -> new UserPreferenceProfileResponse(
            rs.getString("preference_profile_id"),
            rs.getInt("budget_min"),
            rs.getInt("budget_max"),
            rs.getString("bhk_preference"),
            rs.getString("furnishing_preference"),
            List.of(),
            rs.getString("commute_location"),
            rs.getDate("move_in_date") != null ? rs.getDate("move_in_date").toLocalDate().toString() : null,
            List.of(),
            rs.getBoolean("pet_friendly"),
            rs.getString("tenant_type")
        ))
        .single();

    List<String> preferredLocalities = jdbcClient.sql("""
            SELECT locality
            FROM user_preferred_localities
            WHERE user_id = :userId
            ORDER BY sort_order
            """)
        .param("userId", currentUserId)
        .query(String.class)
        .list();

    List<String> lifestyleTags = jdbcClient.sql("""
            SELECT tag
            FROM user_lifestyle_tags
            WHERE user_id = :userId
            ORDER BY sort_order
            """)
        .param("userId", currentUserId)
        .query(String.class)
        .list();

    return new UserPreferenceProfileResponse(
        base.preferenceProfileId(),
        base.budgetMin(),
        base.budgetMax(),
        base.bhkPreference(),
        base.furnishingPreference(),
        preferredLocalities,
        base.commuteLocation(),
        base.moveInDate(),
        lifestyleTags,
        base.petFriendly(),
        base.tenantType()
    );
  }

  public UserPreferenceUpdateResponse updatePreferences(
      String authorizationHeader,
      UserPreferenceUpdateRequest request
  ) {
    String currentUserId = resolveCurrentUserId(authorizationHeader);
    ensurePreferenceProfile(currentUserId);
    OffsetDateTime updatedAt = OffsetDateTime.now(ZoneOffset.UTC).truncatedTo(ChronoUnit.SECONDS);
    jdbcClient.sql("""
            UPDATE user_preferences
            SET budget_min = :budgetMin,
                budget_max = :budgetMax,
                bhk_preference = :bhkPreference,
                furnishing_preference = NULLIF(:furnishingPreference, ''),
                commute_location = :commuteLocation,
                move_in_date = CAST(NULLIF(:moveInDate, '') AS DATE),
                pet_friendly = :petFriendly,
                tenant_type = :tenantType
            WHERE user_id = :userId
            """)
        .param("budgetMin", request.budgetMin())
        .param("budgetMax", request.budgetMax())
        .param("bhkPreference", request.bhkPreference())
        .param("furnishingPreference", request.furnishingPreference())
        .param("commuteLocation", request.commuteLocation())
        .param("moveInDate", request.moveInDate())
        .param("petFriendly", request.petFriendly())
        .param("tenantType", request.tenantType())
        .param("userId", currentUserId)
        .update();

    jdbcClient.sql("""
            UPDATE users
            SET updated_at = :updatedAt
            WHERE user_id = :userId
            """)
        .param("updatedAt", updatedAt)
        .param("userId", currentUserId)
        .update();

    jdbcClient.sql("DELETE FROM user_lifestyle_tags WHERE user_id = :userId")
        .param("userId", currentUserId)
        .update();

    for (int index = 0; index < request.lifestyleTags().size(); index++) {
      jdbcClient.sql("""
              INSERT INTO user_lifestyle_tags (user_id, sort_order, tag)
              VALUES (:userId, :sortOrder, :tag)
              """)
          .param("userId", currentUserId)
          .param("sortOrder", index + 1)
          .param("tag", request.lifestyleTags().get(index))
          .update();
    }

    String preferenceProfileId = jdbcClient.sql("""
            SELECT preference_profile_id
            FROM user_preferences
            WHERE user_id = :userId
            """)
        .param("userId", currentUserId)
        .query(String.class)
        .single();

    refreshOnboardingState(currentUserId, updatedAt);
    return new UserPreferenceUpdateResponse(true, preferenceProfileId);
  }

  public UserVerificationStatusResponse getVerificationStatus(String authorizationHeader) {
    String currentUserId = resolveCurrentUserId(authorizationHeader);
    return jdbcClient.sql("""
            SELECT user_id, profile_status, email, phone_number, photo_url,
                   aadhaar_last4, pan_card_number, government_id_photo_url,
                   profile_completion, updated_at
            FROM users
            WHERE user_id = :userId
            """)
        .param("userId", currentUserId)
        .query((rs, rowNum) -> {
          String profileStatus = rs.getString("profile_status");
          boolean deactivated = "DEACTIVATED".equalsIgnoreCase(profileStatus);
          String photoUrl = rs.getString("photo_url");
          int profileCompletion = rs.getInt("profile_completion");
          boolean hasAadhaar = StringUtils.hasText(rs.getString("aadhaar_last4"));
          boolean hasPan = StringUtils.hasText(rs.getString("pan_card_number"));
          boolean hasGovernmentId = StringUtils.hasText(rs.getString("government_id_photo_url"));
          String kycStatus = deactivated
              ? "NOT_AVAILABLE"
              : hasAadhaar && (hasPan || hasGovernmentId)
                  ? "VERIFIED"
                  : hasAadhaar || hasPan || hasGovernmentId ? "IN_PROGRESS" : "NOT_STARTED";

          return new UserVerificationStatusResponse(
              rs.getString("user_id"),
              profileStatus,
              !deactivated && StringUtils.hasText(rs.getString("email")),
              !deactivated && StringUtils.hasText(rs.getString("phone_number")),
              kycStatus,
              "BEFORE_AGREEMENT",
              "e-KYC is not required for browsing or shortlisting. Complete it before agreement signing and move-in.",
              profileCompletion,
              photoUrl != null && !photoUrl.isBlank(),
              rs.getObject("updated_at", OffsetDateTime.class).toString()
          );
        })
        .single();
  }

  public UserPhotoUploadResponse uploadPhoto(
      String authorizationHeader,
      UserPhotoUploadRequest request
  ) {
    String currentUserId = resolveCurrentUserId(authorizationHeader);
    OffsetDateTime updatedAt = OffsetDateTime.now(ZoneOffset.UTC).truncatedTo(ChronoUnit.SECONDS);

    jdbcClient.sql("""
            UPDATE users
            SET photo_url = :photoUrl,
                updated_at = :updatedAt
            WHERE user_id = :userId
            """)
        .param("photoUrl", request.photoUrl())
        .param("updatedAt", updatedAt)
        .param("userId", currentUserId)
        .update();

    refreshOnboardingState(currentUserId, updatedAt);
    return new UserPhotoUploadResponse(true, request.photoUrl(), getCurrentUser(authorizationHeader));
  }

  public UserPasswordUpdateResponse updatePassword(
      String authorizationHeader,
      UserPasswordUpdateRequest request
  ) {
    String currentUserId = currentSessionService.requireUserId(authorizationHeader);
    OffsetDateTime updatedAt = OffsetDateTime.now(ZoneOffset.UTC).truncatedTo(ChronoUnit.SECONDS);

    jdbcClient.sql("""
            UPDATE users
            SET password_hash = :passwordHash,
                updated_at = :updatedAt
            WHERE user_id = :userId
            """)
        .param("passwordHash", passwordEncoder.encode(request.newPassword()))
        .param("updatedAt", updatedAt)
        .param("userId", currentUserId)
        .update();

    refreshOnboardingState(currentUserId, updatedAt);
    return new UserPasswordUpdateResponse(
        true,
        currentUserId,
        true,
        "App password saved successfully. You can now sign in with your email or phone and this password.",
        updatedAt.toString()
    );
  }

  public UserAccountDeactivationResponse deactivateCurrentUser(String authorizationHeader) {
    String currentUserId = resolveCurrentUserId(authorizationHeader);
    OffsetDateTime deactivatedAt = OffsetDateTime.now(ZoneOffset.UTC).truncatedTo(ChronoUnit.SECONDS);

    jdbcClient.sql("""
            UPDATE users
            SET profile_status = 'DEACTIVATED',
                updated_at = :updatedAt,
                deactivated_at = :deactivatedAt
            WHERE user_id = :userId
            """)
        .param("updatedAt", deactivatedAt)
        .param("deactivatedAt", deactivatedAt)
        .param("userId", currentUserId)
        .update();

    jdbcClient.sql("""
            DELETE FROM auth_sessions
            WHERE user_id = :userId
            """)
        .param("userId", currentUserId)
        .update();

    return new UserAccountDeactivationResponse(
        true,
        currentUserId,
        "DEACTIVATED",
        "Account deactivated successfully.",
        deactivatedAt.toString()
    );
  }

  private String resolveCurrentUserId(String authorizationHeader) {
    return currentSessionService.resolveUserId(authorizationHeader);
  }

  private void refreshOnboardingState(String userId, OffsetDateTime updatedAt) {
    OnboardingSnapshot snapshot = jdbcClient.sql("""
            SELECT full_name, email, phone_number, date_of_birth, gender, city, occupation,
                   emergency_contact_name, emergency_contact_phone,
                   employment_type, employer_name, monthly_income_range, upi_id,
                   aadhaar_last4, pan_card_number, government_id_photo_url, photo_url,
                   profile_status,
                   COALESCE(password_hash, '') <> '' AS has_password,
                   EXISTS(
                     SELECT 1
                     FROM user_lifestyle_tags tags
                     WHERE tags.user_id = users.user_id
                   ) AS has_preferences
            FROM users
            WHERE user_id = :userId
            """)
        .param("userId", userId)
        .query((rs, rowNum) -> new OnboardingSnapshot(
            rs.getString("full_name"),
            rs.getString("email"),
            rs.getString("phone_number"),
            rs.getDate("date_of_birth") != null ? rs.getDate("date_of_birth").toLocalDate().toString() : null,
            rs.getString("gender"),
            rs.getString("city"),
            rs.getString("occupation"),
            rs.getString("emergency_contact_name"),
            rs.getString("emergency_contact_phone"),
            rs.getString("employment_type"),
            rs.getString("employer_name"),
            rs.getString("monthly_income_range"),
            rs.getString("upi_id"),
            rs.getString("aadhaar_last4"),
            rs.getString("pan_card_number"),
            rs.getString("government_id_photo_url"),
            rs.getString("photo_url"),
            rs.getString("profile_status"),
            rs.getBoolean("has_password"),
            rs.getBoolean("has_preferences")
        ))
        .single();

    if ("DEACTIVATED".equalsIgnoreCase(snapshot.profileStatus())) {
      return;
    }

    boolean hasContact = StringUtils.hasText(snapshot.email()) || StringUtils.hasText(snapshot.phoneNumber());
    boolean hasCoreProfile = StringUtils.hasText(snapshot.fullName())
        && StringUtils.hasText(snapshot.gender())
        && StringUtils.hasText(snapshot.city())
        && StringUtils.hasText(snapshot.occupation());
    boolean hasDateOfBirth = StringUtils.hasText(snapshot.dateOfBirth());
    boolean hasEmergencyContact = StringUtils.hasText(snapshot.emergencyContactName())
        && StringUtils.hasText(snapshot.emergencyContactPhone());
    boolean hasPhoto = StringUtils.hasText(snapshot.photoUrl());
    boolean hasPreferences = snapshot.hasPreferences();
    boolean hasFinancialProfile = StringUtils.hasText(snapshot.employmentType())
        || StringUtils.hasText(snapshot.employerName())
        || StringUtils.hasText(snapshot.monthlyIncomeRange())
        || StringUtils.hasText(snapshot.upiId());
    boolean hasKycStarted = StringUtils.hasText(snapshot.aadhaarLast4())
        || StringUtils.hasText(snapshot.panCardNumber())
        || StringUtils.hasText(snapshot.governmentIdPhotoUrl());

    int profileCompletion = 0;
    if (hasContact) {
      profileCompletion += 10;
    }
    if (hasCoreProfile) {
      profileCompletion += 15;
    }
    if (hasDateOfBirth) {
      profileCompletion += 5;
    }
    if (hasEmergencyContact) {
      profileCompletion += 15;
    }
    if (hasPhoto) {
      profileCompletion += 10;
    }
    if (hasPreferences) {
      profileCompletion += 15;
    }
    if (hasFinancialProfile) {
      profileCompletion += 10;
    }
    if (hasKycStarted) {
      profileCompletion += 10;
    }
    if (snapshot.hasPassword()) {
      profileCompletion += 10;
    }

    String profileStatus = hasCoreProfile && hasEmergencyContact && hasPreferences && hasPhoto
        ? "READY_TO_SEARCH"
        : hasCoreProfile && hasEmergencyContact && hasPreferences
            ? "PREFERENCES_SAVED"
            : hasCoreProfile && hasEmergencyContact ? "PROFILE_SAVED" : "ONBOARDING";

    jdbcClient.sql("""
            UPDATE users
            SET profile_status = :profileStatus,
                profile_completion = :profileCompletion,
                updated_at = :updatedAt
            WHERE user_id = :userId
            """)
        .param("profileStatus", profileStatus)
        .param("profileCompletion", Math.min(profileCompletion, 100))
        .param("updatedAt", updatedAt)
        .param("userId", userId)
        .update();
  }

  private void ensurePreferenceProfile(String userId) {
    boolean exists = jdbcClient.sql("""
            SELECT EXISTS(
              SELECT 1
              FROM user_preferences
              WHERE user_id = :userId
            )
            """)
        .param("userId", userId)
        .query(Boolean.class)
        .single();

    if (exists) {
      return;
    }

    jdbcClient.sql("""
            INSERT INTO user_preferences (
              user_id, preference_profile_id, budget_min, budget_max, bhk_preference,
              furnishing_preference, commute_location, move_in_date, pet_friendly, tenant_type
            )
            VALUES (
              :userId, :preferenceProfileId, 15000, 35000, '1BHK,2BHK',
              'Semi Furnished', 'City Center', NULL, FALSE, 'WORKING_PROFESSIONAL'
            )
            """)
        .param("userId", userId)
        .param("preferenceProfileId", "pref_" + userId.replaceAll("[^a-zA-Z0-9]", "").substring(0, Math.min(8, userId.replaceAll("[^a-zA-Z0-9]", "").length())))
        .update();
  }

  private record OnboardingSnapshot(
      String fullName,
      String email,
      String phoneNumber,
      String dateOfBirth,
      String gender,
      String city,
      String occupation,
      String emergencyContactName,
      String emergencyContactPhone,
      String employmentType,
      String employerName,
      String monthlyIncomeRange,
      String upiId,
      String aadhaarLast4,
      String panCardNumber,
      String governmentIdPhotoUrl,
      String photoUrl,
      String profileStatus,
      boolean hasPassword,
      boolean hasPreferences
  ) {
  }
}
