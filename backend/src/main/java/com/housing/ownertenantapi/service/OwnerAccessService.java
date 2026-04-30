package com.housing.ownertenantapi.service;

import com.housing.ownertenantapi.dto.AuthSessionResponse;
import com.housing.ownertenantapi.dto.OwnerGetStartedRequest;
import com.housing.ownertenantapi.dto.OwnerGetStartedResponse;
import com.housing.ownertenantapi.dto.OwnerListingCreateRequest;
import com.housing.ownertenantapi.dto.OwnerListingCreateResponse;
import com.housing.ownertenantapi.util.CityCatalog;
import java.time.OffsetDateTime;
import java.time.ZoneOffset;
import java.time.temporal.ChronoUnit;
import java.util.Locale;
import java.util.UUID;
import org.springframework.http.HttpStatus;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.jdbc.core.simple.JdbcClient;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

@Service
public class OwnerAccessService {

  private final JdbcClient jdbcClient;
  private final PasswordEncoder passwordEncoder;
  private final AuthService authService;
  private final OwnerListingService ownerListingService;

  public OwnerAccessService(
      JdbcTemplate jdbcTemplate,
      PasswordEncoder passwordEncoder,
      AuthService authService,
      OwnerListingService ownerListingService
  ) {
    this.jdbcClient = JdbcClient.create(jdbcTemplate);
    this.passwordEncoder = passwordEncoder;
    this.authService = authService;
    this.ownerListingService = ownerListingService;
  }

  @Transactional
  public OwnerGetStartedResponse getStarted(OwnerGetStartedRequest request) {
    String normalizedEmail = request.email().trim().toLowerCase(Locale.ROOT);
    String normalizedPhone = request.phoneNumber().trim();
    String canonicalCity = CityCatalog.canonicalize(request.city());
    ExistingUser existingUser = findExistingUser(normalizedEmail, normalizedPhone);
    if (existingUser != null) {
      throw buildExistingUserException(existingUser);
    }

    String ownerUserId = buildOwnerUserId();
    OffsetDateTime now = OffsetDateTime.now(ZoneOffset.UTC).truncatedTo(ChronoUnit.SECONDS);

    jdbcClient.sql("""
            INSERT INTO users (
              user_id, full_name, email, phone_number, password_hash, role, profile_status,
              city, occupation, profile_completion, updated_at
            )
            VALUES (
              :userId, :fullName, :email, :phoneNumber, :passwordHash, 'OWNER', 'VERIFIED',
              :city, 'Property Owner', 68, :updatedAt
            )
            """)
        .param("userId", ownerUserId)
        .param("fullName", request.fullName().trim())
        .param("email", normalizedEmail)
        .param("phoneNumber", normalizedPhone)
        .param("passwordHash", passwordEncoder.encode(request.password()))
        .param("city", canonicalCity)
        .param("updatedAt", now)
        .update();

    OwnerListingCreateResponse listing = ownerListingService.createListingForOwnerUserId(
        ownerUserId,
        new OwnerListingCreateRequest(
            request.title(),
            request.propertyType(),
            canonicalCity,
            request.locality(),
            request.rent(),
            request.deposit(),
            request.bhk(),
            request.furnishing(),
            request.amenities(),
            request.photos(),
            request.lat() != null ? request.lat() : defaultLatitude(canonicalCity),
            request.lng() != null ? request.lng() : defaultLongitude(canonicalCity)
        )
    );

    String message = "Owner account created and your first listing is live.";
    AuthSessionResponse session = authService.createSessionForUser(
        ownerUserId,
        "OWNER_ONBOARDING",
        message
    );

    return new OwnerGetStartedResponse(session, listing, "/owner/dashboard", message);
  }

  private ExistingUser findExistingUser(String email, String phoneNumber) {
    return jdbcClient.sql("""
            SELECT user_id, role
            FROM users
            WHERE lower(email) = lower(:email)
               OR phone_number = :phoneNumber
            LIMIT 1
            """)
        .param("email", email)
        .param("phoneNumber", phoneNumber)
        .query((rs, rowNum) -> new ExistingUser(
            rs.getString("user_id"),
            rs.getString("role")
        ))
        .optional()
        .orElse(null);
  }

  private ResponseStatusException buildExistingUserException(ExistingUser existingUser) {
    if ("OWNER".equalsIgnoreCase(existingUser.role())) {
      return new ResponseStatusException(
          HttpStatus.CONFLICT,
          "An owner account already exists with this email or phone number. Sign in to continue managing listings."
      );
    }

    return new ResponseStatusException(
        HttpStatus.CONFLICT,
        "This email or phone number already belongs to a renter account. Use different contact details for an owner account."
    );
  }

  private String buildOwnerUserId() {
    return "owner_" + UUID.randomUUID().toString().replace("-", "").substring(0, 10);
  }

  private double defaultLatitude(String city) {
    String normalizedCity = city.trim().toLowerCase(Locale.ROOT);
    return switch (normalizedCity) {
      case "pune" -> 18.5204;
      case "hyderabad" -> 17.3850;
      case "chennai" -> 13.0827;
      case "ncr-delhi", "delhi", "new delhi" -> 28.6139;
      default -> 12.9716;
    };
  }

  private double defaultLongitude(String city) {
    String normalizedCity = city.trim().toLowerCase(Locale.ROOT);
    return switch (normalizedCity) {
      case "pune" -> 73.8567;
      case "hyderabad" -> 78.4867;
      case "chennai" -> 80.2707;
      case "ncr-delhi", "delhi", "new delhi" -> 77.2090;
      default -> 77.5946;
    };
  }

  private record ExistingUser(
      String userId,
      String role
  ) {
  }
}
