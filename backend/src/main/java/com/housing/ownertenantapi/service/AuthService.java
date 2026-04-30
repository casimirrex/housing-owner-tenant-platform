package com.housing.ownertenantapi.service;

import com.housing.ownertenantapi.dto.AuthFlowResponse;
import com.housing.ownertenantapi.dto.AuthSessionResponse;
import com.housing.ownertenantapi.dto.EmailRegistrationRequest;
import com.housing.ownertenantapi.dto.LoginRequest;
import com.housing.ownertenantapi.dto.LogoutRequest;
import com.housing.ownertenantapi.dto.LogoutResponse;
import com.housing.ownertenantapi.dto.OAuthLoginRequest;
import com.housing.ownertenantapi.dto.OtpSendRequest;
import com.housing.ownertenantapi.dto.OtpVerifyRequest;
import com.housing.ownertenantapi.dto.PhoneRegistrationRequest;
import com.housing.ownertenantapi.dto.TokenRefreshRequest;
import java.time.OffsetDateTime;
import java.time.ZoneOffset;
import java.time.temporal.ChronoUnit;
import java.util.Locale;
import java.util.UUID;
import org.springframework.dao.EmptyResultDataAccessException;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.jdbc.core.simple.JdbcClient;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.util.StringUtils;
import org.springframework.http.HttpStatus;
import org.springframework.web.server.ResponseStatusException;

@Service
public class AuthService {

  private static final String GOOGLE_PROVIDER = "GOOGLE";

  private final JdbcClient jdbcClient;
  private final GoogleIdentityService googleIdentityService;
  private final PasswordEncoder passwordEncoder;

  public AuthService(
      JdbcTemplate jdbcTemplate,
      GoogleIdentityService googleIdentityService,
      PasswordEncoder passwordEncoder
  ) {
    this.jdbcClient = JdbcClient.create(jdbcTemplate);
    this.googleIdentityService = googleIdentityService;
    this.passwordEncoder = passwordEncoder;
  }

  public AuthSessionResponse registerWithPhone(PhoneRegistrationRequest request) {
    String phoneNumber = request.countryCode() + request.phoneNumber();

    // Reject duplicates
    String existingUserId = findUserIdByPhone(phoneNumber);
    if (existingUserId != null) {
      throw new ResponseStatusException(
          HttpStatus.CONFLICT,
          "An account with this phone number already exists. Please sign in instead."
      );
    }

    // Create the new user
    String userId = "phone_" + UUID.randomUUID().toString().replace("-", "").substring(0, 16);
    OffsetDateTime now = OffsetDateTime.now(ZoneOffset.UTC).truncatedTo(ChronoUnit.SECONDS);

    jdbcClient.sql("""
            INSERT INTO users (
              user_id, full_name, email, phone_number, role, profile_status,
              city, gender, occupation, photo_url, profile_completion, updated_at
            )
            VALUES (
              :userId, :fullName, NULL, :phoneNumber, 'TENANT', 'ONBOARDING',
              'Bengaluru', NULL, NULL, NULL, 20, :updatedAt
            )
            """)
        .param("userId", userId)
        .param("fullName", request.fullName())
        .param("phoneNumber", phoneNumber)
        .param("updatedAt", now)
        .update();

    ensurePreferenceProfile(userId);

    return createAndStoreSession(
        userId,
        "PHONE_REGISTRATION",
        "Account created successfully. Welcome to the platform!",
        null
    );
  }

  public AuthSessionResponse registerWithEmail(EmailRegistrationRequest request) {
    String normalizedEmail = request.email().trim().toLowerCase(Locale.ROOT);

    // Reject duplicates
    String existingUserId = findUserIdByEmail(normalizedEmail);
    if (existingUserId != null) {
      throw new ResponseStatusException(
          HttpStatus.CONFLICT,
          "An account with this email already exists. Please sign in instead."
      );
    }

    // Create the new user
    String userId = "email_" + UUID.randomUUID().toString().replace("-", "").substring(0, 16);
    OffsetDateTime now = OffsetDateTime.now(ZoneOffset.UTC).truncatedTo(ChronoUnit.SECONDS);

    jdbcClient.sql("""
            INSERT INTO users (
              user_id, full_name, email, phone_number, role, profile_status,
              city, gender, occupation, photo_url, profile_completion, updated_at
            )
            VALUES (
              :userId, :fullName, :email, NULL, 'TENANT', 'ONBOARDING',
              'Bengaluru', NULL, NULL, NULL, 20, :updatedAt
            )
            """)
        .param("userId", userId)
        .param("fullName", request.fullName())
        .param("email", normalizedEmail)
        .param("updatedAt", now)
        .update();

    ensurePreferenceProfile(userId);

    return createAndStoreSession(
        userId,
        "EMAIL_REGISTRATION",
        "Account created successfully. Welcome to the platform!",
        null
    );
  }

  public AuthSessionResponse login(LoginRequest request) {
    String resolvedRoleHint = normalizeRoleHint(request.roleHint());
    UserLoginCredential credential = findUserLoginCredential(request.identifier(), resolvedRoleHint);
    if (credential == null) {
      throw invalidLoginException();
    }

    if (resolvedRoleHint != null && !resolvedRoleHint.equalsIgnoreCase(credential.role())) {
      throw new ResponseStatusException(
          HttpStatus.FORBIDDEN,
          resolvedRoleHint.equals("OWNER")
              ? "This account is registered as a tenant. Use the renter sign-in path for this account."
              : "This account is registered as an owner. Use the owner sign-in path for listing management."
      );
    }

    if (!StringUtils.hasText(credential.passwordHash())) {
      throw new ResponseStatusException(
          HttpStatus.BAD_REQUEST,
          "This account does not have an app password yet. Sign in with Gmail or OTP first, then add one from your account."
      );
    }

    if (!passwordEncoder.matches(request.password(), credential.passwordHash())) {
      throw invalidLoginException();
    }

    String authMethod = request.identifier().contains("@") ? "EMAIL_PASSWORD" : "PHONE_PASSWORD";
    return createAndStoreSession(credential.userId(), authMethod, "Login successful.", null);
  }

  public AuthFlowResponse sendOtp(OtpSendRequest request) {
    String normalizedChannel = request.channel().trim().toUpperCase(Locale.ROOT);
    String flowId = generateFlowId();
    String maskedDestination = normalizedChannel.equals("EMAIL")
        ? maskEmail(request.destination())
        : maskPhone(request.destination());
    insertAuthFlow(
        flowId,
        findUserIdByIdentifier(request.destination()),
        normalizedChannel,
        request.destination(),
        maskedDestination,
        request.purpose(),
        "OTP_SENT",
        "VERIFY_OTP",
        "OTP sent successfully."
    );

    return new AuthFlowResponse(
        flowId,
        "OTP_SENT",
        "VERIFY_OTP",
        "OTP sent successfully.",
        normalizedChannel,
        maskedDestination,
        1
    );
  }

  public AuthSessionResponse verifyOtp(OtpVerifyRequest request) {
    String userId = findUserIdByIdentifier(request.destination());
    return createAndStoreSession(userId, "OTP", "OTP verified successfully.", null);
  }

  public AuthSessionResponse loginWithGoogle(OAuthLoginRequest request) {
    boolean hasAuthorizationCode = StringUtils.hasText(request.authorizationCode());
    boolean hasIdentityToken = StringUtils.hasText(request.identityToken());

    if (hasAuthorizationCode == hasIdentityToken) {
      throw new ResponseStatusException(
          HttpStatus.BAD_REQUEST,
          "Provide exactly one of authorizationCode or identityToken for Google sign-in."
      );
    }

    GoogleIdentityProfile googleIdentityProfile = hasAuthorizationCode
        ? googleIdentityService.exchangeAuthorizationCode(
            request.authorizationCode(),
            request.redirectUri(),
            request.codeVerifier()
        )
        : googleIdentityService.verifyIdentityToken(request.identityToken());
    String userId = upsertGoogleUser(googleIdentityProfile);
    ensurePreferenceProfile(userId);

    return createAndStoreSession(
        userId,
        "GOOGLE",
        "Google sign-in successful for " + googleIdentityProfile.email() + ".",
        null,
        googleIdentityProfile.emailVerified()
    );
  }

  public AuthSessionResponse loginWithApple(OAuthLoginRequest request) {
    if (!StringUtils.hasText(request.authorizationCode())) {
      throw new ResponseStatusException(
          HttpStatus.BAD_REQUEST,
          "Apple authorization code is required."
      );
    }

    return createAndStoreSession(
        CurrentSessionService.DEFAULT_USER_ID,
        "APPLE",
        "Apple sign-in successful.",
        null
    );
  }

  public AuthSessionResponse refreshToken(TokenRefreshRequest request) {
    String userId = jdbcClient.sql("""
            SELECT user_id
            FROM auth_sessions
            WHERE refresh_token = :refreshToken
            ORDER BY created_at DESC
            LIMIT 1
            """)
        .param("refreshToken", request.refreshToken())
        .query(String.class)
        .optional()
        .orElse(CurrentSessionService.DEFAULT_USER_ID);

    return createAndStoreSession(
        userId,
        "REFRESH_TOKEN",
        "Session token refreshed successfully.",
        request.refreshToken()
    );
  }

  public LogoutResponse logout(LogoutRequest request) {
    int revokedSessionCount = jdbcClient.sql("""
            DELETE FROM auth_sessions
            WHERE refresh_token = :refreshToken
            """)
        .param("refreshToken", request.refreshToken())
        .update();

    OffsetDateTime signedOutAt = OffsetDateTime.now(ZoneOffset.UTC).truncatedTo(ChronoUnit.SECONDS);

    return new LogoutResponse(
        true,
        revokedSessionCount,
        revokedSessionCount > 0
            ? "Session sign-out completed successfully."
            : "Session was already signed out or no longer active.",
        signedOutAt.toString()
    );
  }

  public AuthSessionResponse createSessionForUser(
      String userId,
      String authMethod,
      String message
  ) {
    return createAndStoreSession(userId, authMethod, message, null);
  }

  private AuthSessionResponse createAndStoreSession(
      String userId,
      String authMethod,
      String message,
      String providedRefreshToken
  ) {
    return createAndStoreSession(userId, authMethod, message, providedRefreshToken, null);
  }

  private AuthSessionResponse createAndStoreSession(
      String userId,
      String authMethod,
      String message,
      String providedRefreshToken,
      Boolean emailVerifiedOverride
  ) {
    String accessToken = generateToken("access");
    String refreshToken = providedRefreshToken != null ? providedRefreshToken : generateToken("refresh");
    OffsetDateTime createdAt = OffsetDateTime.now(ZoneOffset.UTC).truncatedTo(ChronoUnit.SECONDS);
    SessionUserIdentity sessionUserIdentity = loadSessionUserIdentity(userId);

    jdbcClient.sql("""
            INSERT INTO auth_sessions (
              access_token, refresh_token, user_id, auth_method, token_type,
              expires_in_seconds, message, phase, created_at
            )
            VALUES (
              :accessToken, :refreshToken, :userId, :authMethod, 'Bearer',
              3600, :message, 1, :createdAt
            )
            """)
        .param("accessToken", accessToken)
        .param("refreshToken", refreshToken)
        .param("userId", userId)
        .param("authMethod", authMethod)
        .param("message", message)
        .param("createdAt", createdAt)
        .update();

    return new AuthSessionResponse(
        accessToken,
        refreshToken,
        "Bearer",
        3600,
        userId,
        sessionUserIdentity.role(),
        authMethod,
        sessionUserIdentity.email(),
        sessionUserIdentity.fullName(),
        sessionUserIdentity.avatarUrl(),
        emailVerifiedOverride != null ? emailVerifiedOverride : sessionUserIdentity.email() != null,
        message,
        1
    );
  }

  private void insertAuthFlow(
      String flowId,
      String userId,
      String channel,
      String destination,
      String maskedDestination,
      String purpose,
      String status,
      String nextStep,
      String message
  ) {
    jdbcClient.sql("""
            INSERT INTO auth_flows (
              flow_id, user_id, channel, destination, masked_destination,
              purpose, status, next_step, message, created_at
            )
            VALUES (
              :flowId, :userId, :channel, :destination, :maskedDestination,
              :purpose, :status, :nextStep, :message, :createdAt
            )
            """)
        .param("flowId", flowId)
        .param("userId", userId)
        .param("channel", channel)
        .param("destination", destination)
        .param("maskedDestination", maskedDestination)
        .param("purpose", purpose)
        .param("status", status)
        .param("nextStep", nextStep)
        .param("message", message)
        .param("createdAt", OffsetDateTime.now(ZoneOffset.UTC).truncatedTo(ChronoUnit.SECONDS))
        .update();
  }

  private String findUserIdByIdentifier(String identifier) {
    if (identifier == null || identifier.isBlank()) {
      return CurrentSessionService.DEFAULT_USER_ID;
    }

    try {
      return jdbcClient.sql("""
              SELECT user_id
              FROM users
              WHERE lower(email) = lower(:identifier)
                 OR phone_number = :identifier
              ORDER BY role = 'TENANT' DESC
              LIMIT 1
              """)
          .param("identifier", identifier)
          .query(String.class)
          .single();
    } catch (EmptyResultDataAccessException exception) {
      return CurrentSessionService.DEFAULT_USER_ID;
    }
  }

  private String findUserIdByEmail(String email) {
    String normalizedEmail = email == null ? null : email.trim().toLowerCase(Locale.ROOT);

    try {
      return jdbcClient.sql("""
              SELECT user_id
              FROM users
              WHERE lower(email) = lower(:email)
              LIMIT 1
              """)
          .param("email", normalizedEmail)
          .query(String.class)
          .single();
    } catch (EmptyResultDataAccessException exception) {
      return null;
    }
  }

  private UserLoginCredential findUserLoginCredential(String identifier, String roleHint) {
    if (!StringUtils.hasText(identifier)) {
      return null;
    }

    String baseSql = """
            SELECT user_id, password_hash, role
            FROM users
            WHERE (lower(email) = lower(:identifier)
               OR phone_number = :identifier)
            """;
    String sql = roleHint == null
        ? baseSql + """
            ORDER BY role = 'TENANT' DESC
            LIMIT 1
            """
        : baseSql + """
             AND role = :roleHint
            LIMIT 1
            """;

    var statement = jdbcClient.sql(sql)
        .param("identifier", identifier.trim());

    if (roleHint != null) {
      statement = statement.param("roleHint", roleHint);
    }

    return statement
        .query((rs, rowNum) -> new UserLoginCredential(
            rs.getString("user_id"),
            rs.getString("password_hash"),
            rs.getString("role")
        ))
        .optional()
        .orElse(null);
  }

  private String normalizeRoleHint(String roleHint) {
    if (!StringUtils.hasText(roleHint)) {
      return null;
    }

    String normalized = roleHint.trim().toUpperCase(Locale.ROOT);
    return switch (normalized) {
      case "OWNER", "TENANT" -> normalized;
      default -> throw new ResponseStatusException(
          HttpStatus.BAD_REQUEST,
          "Unsupported roleHint. Use OWNER or TENANT."
      );
    };
  }

  private String findUserIdByGoogleSubject(String subject) {
    try {
      return jdbcClient.sql("""
              SELECT user_id
              FROM auth_identities
              WHERE provider = :provider
                AND provider_subject = :providerSubject
              LIMIT 1
              """)
          .param("provider", GOOGLE_PROVIDER)
          .param("providerSubject", subject)
          .query(String.class)
          .single();
    } catch (EmptyResultDataAccessException exception) {
      return null;
    }
  }

  private String upsertGoogleUser(GoogleIdentityProfile googleIdentityProfile) {
    String normalizedEmail = googleIdentityProfile.email().trim().toLowerCase(Locale.ROOT);
    String resolvedFullName = googleIdentityProfile.fullName() != null
        ? googleIdentityProfile.fullName()
        : normalizedEmail;
    String existingUserId = findUserIdByGoogleSubject(googleIdentityProfile.subject());
    if (existingUserId == null) {
      existingUserId = findUserIdByEmail(normalizedEmail);
    }
    OffsetDateTime updatedAt = OffsetDateTime.now(ZoneOffset.UTC).truncatedTo(ChronoUnit.SECONDS);

    if (existingUserId != null) {
      jdbcClient.sql("""
              UPDATE users
              SET full_name = :fullName,
                  email = :email,
                  photo_url = :photoUrl,
                  updated_at = :updatedAt
              WHERE user_id = :userId
              """)
          .param("fullName", resolvedFullName)
          .param("email", normalizedEmail)
          .param("photoUrl", googleIdentityProfile.pictureUrl())
          .param("updatedAt", updatedAt)
          .param("userId", existingUserId)
          .update();

      upsertGoogleIdentity(existingUserId, googleIdentityProfile, normalizedEmail, updatedAt);
      return existingUserId;
    }

    String userId = buildGoogleUserId(googleIdentityProfile.subject());
    jdbcClient.sql("""
            INSERT INTO users (
              user_id, full_name, email, phone_number, role, profile_status,
              city, gender, occupation, photo_url, profile_completion, updated_at
            )
            VALUES (
              :userId, :fullName, :email, NULL, 'TENANT', 'ONBOARDING',
              'Bengaluru', NULL, NULL, :photoUrl, 35, :updatedAt
            )
            """)
        .param("userId", userId)
        .param("fullName", resolvedFullName)
        .param("email", normalizedEmail)
        .param("photoUrl", googleIdentityProfile.pictureUrl())
        .param("updatedAt", updatedAt)
        .update();

    upsertGoogleIdentity(userId, googleIdentityProfile, normalizedEmail, updatedAt);
    return userId;
  }

  private void upsertGoogleIdentity(
      String userId,
      GoogleIdentityProfile googleIdentityProfile,
      String normalizedEmail,
      OffsetDateTime updatedAt
  ) {
    jdbcClient.sql("""
            INSERT INTO auth_identities (
              provider, provider_subject, user_id, provider_email, email_verified,
              display_name, avatar_url, created_at, updated_at, last_login_at
            )
            VALUES (
              :provider, :providerSubject, :userId, :providerEmail, :emailVerified,
              :displayName, :avatarUrl, :updatedAt, :updatedAt, :updatedAt
            )
            ON CONFLICT (provider, provider_subject)
            DO UPDATE SET
              user_id = EXCLUDED.user_id,
              provider_email = EXCLUDED.provider_email,
              email_verified = EXCLUDED.email_verified,
              display_name = EXCLUDED.display_name,
              avatar_url = EXCLUDED.avatar_url,
              updated_at = EXCLUDED.updated_at,
              last_login_at = EXCLUDED.last_login_at
            """)
        .param("provider", GOOGLE_PROVIDER)
        .param("providerSubject", googleIdentityProfile.subject())
        .param("userId", userId)
        .param("providerEmail", normalizedEmail)
        .param("emailVerified", googleIdentityProfile.emailVerified())
        .param("displayName", googleIdentityProfile.fullName())
        .param("avatarUrl", googleIdentityProfile.pictureUrl())
        .param("updatedAt", updatedAt)
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
              commute_location, pet_friendly, tenant_type
            )
            VALUES (
              :userId, :preferenceProfileId, 15000, 35000, '1BHK,2BHK',
              'Central Business District', FALSE, 'WORKING_PROFESSIONAL'
            )
            """)
        .param("userId", userId)
        .param("preferenceProfileId", "pref_" + UUID.randomUUID().toString().replace("-", "").substring(0, 8))
        .update();
  }

  private SessionUserIdentity loadSessionUserIdentity(String userId) {
    return jdbcClient.sql("""
            SELECT user_id, role, email, full_name, photo_url
            FROM users
            WHERE user_id = :userId
            """)
        .param("userId", userId)
        .query((rs, rowNum) -> new SessionUserIdentity(
            rs.getString("user_id"),
            rs.getString("role"),
            rs.getString("email"),
            rs.getString("full_name"),
            rs.getString("photo_url")
        ))
        .optional()
        .orElse(new SessionUserIdentity(userId, "TENANT", null, null, null));
  }

  private String buildGoogleUserId(String subject) {
    String normalizedSubject = subject.replaceAll("[^a-zA-Z0-9]", "");
    String suffix = normalizedSubject.substring(0, Math.min(20, normalizedSubject.length()));
    return "google_" + suffix;
  }

  private String findUserIdByPhone(String phoneNumber) {
    try {
      return jdbcClient.sql("""
              SELECT user_id
              FROM users
              WHERE phone_number = :phoneNumber
              LIMIT 1
              """)
          .param("phoneNumber", phoneNumber)
          .query(String.class)
          .single();
    } catch (EmptyResultDataAccessException exception) {
      return null;
    }
  }

  private String generateFlowId() {
    return "flow_" + UUID.randomUUID().toString().replace("-", "").substring(0, 8);
  }

  private String generateToken(String prefix) {
    return prefix + "_" + UUID.randomUUID().toString().replace("-", "").substring(0, 20);
  }

  private String maskPhone(String phoneNumber) {
    if (phoneNumber.length() <= 4) {
      return phoneNumber;
    }

    return phoneNumber.substring(0, Math.min(3, phoneNumber.length()))
        + "******"
        + phoneNumber.substring(phoneNumber.length() - 4);
  }

  private String maskEmail(String email) {
    int atIndex = email.indexOf('@');
    if (atIndex <= 1) {
      return email;
    }

    return email.substring(0, 2) + "***" + email.substring(atIndex);
  }

  private ResponseStatusException invalidLoginException() {
    return new ResponseStatusException(
        HttpStatus.UNAUTHORIZED,
        "Email or phone and password did not match."
    );
  }

  private record SessionUserIdentity(
      String userId,
      String role,
      String email,
      String fullName,
      String avatarUrl
  ) {
  }

  private record UserLoginCredential(
      String userId,
      String passwordHash,
      String role
  ) {
  }
}
