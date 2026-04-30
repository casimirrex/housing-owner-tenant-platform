package com.housing.ownertenantapi.service;

import java.util.Optional;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.jdbc.core.simple.JdbcClient;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.web.server.ResponseStatusException;

@Service
public class CurrentSessionService {

  public static final String DEFAULT_USER_ID = "user_1a2b3c4d";

  private final JdbcClient jdbcClient;

  public CurrentSessionService(JdbcTemplate jdbcTemplate) {
    this.jdbcClient = JdbcClient.create(jdbcTemplate);
  }

  public String resolveUserId(String authorizationHeader) {
    String accessToken = extractAccessToken(authorizationHeader);
    if (accessToken == null) {
      return DEFAULT_USER_ID;
    }

    return findUserIdByAccessToken(accessToken).orElse(DEFAULT_USER_ID);
  }

  public String requireUserId(String authorizationHeader) {
    String accessToken = extractAccessToken(authorizationHeader);
    if (accessToken == null) {
      throw new ResponseStatusException(
          HttpStatus.UNAUTHORIZED,
          "Sign in first before setting an app password."
      );
    }

    return findUserIdByAccessToken(accessToken)
        .orElseThrow(() -> new ResponseStatusException(
            HttpStatus.UNAUTHORIZED,
            "Your session is no longer active. Please sign in again."
        ));
  }

  public SessionIdentity resolveSession(String authorizationHeader) {
    String userId = resolveUserId(authorizationHeader);
    return loadSessionIdentity(userId);
  }

  public SessionIdentity requireSession(String authorizationHeader, String signInMessage) {
    String accessToken = extractAccessToken(authorizationHeader);
    if (accessToken == null) {
      throw new ResponseStatusException(HttpStatus.UNAUTHORIZED, signInMessage);
    }

    String userId = findUserIdByAccessToken(accessToken)
        .orElseThrow(() -> new ResponseStatusException(
            HttpStatus.UNAUTHORIZED,
            "Your session is no longer active. Please sign in again."
        ));

    return loadSessionIdentity(userId);
  }

  public SessionIdentity requireRole(
      String authorizationHeader,
      String expectedRole,
      String signInMessage,
      String roleMessage
  ) {
    SessionIdentity sessionIdentity = requireSession(authorizationHeader, signInMessage);
    if (!expectedRole.equalsIgnoreCase(sessionIdentity.role())) {
      throw new ResponseStatusException(HttpStatus.FORBIDDEN, roleMessage);
    }

    return sessionIdentity;
  }

  public Optional<SessionIdentity> findSession(String authorizationHeader) {
    String accessToken = extractAccessToken(authorizationHeader);
    if (accessToken == null) {
      return Optional.empty();
    }

    return findUserIdByAccessToken(accessToken).flatMap(this::findSessionIdentity);
  }

  private String extractAccessToken(String authorizationHeader) {
    if (authorizationHeader == null || authorizationHeader.isBlank()) {
      return null;
    }

    if (!authorizationHeader.startsWith("Bearer ")) {
      return null;
    }

    String token = authorizationHeader.substring("Bearer ".length()).trim();
    return token.isEmpty() ? null : token;
  }

  private java.util.Optional<String> findUserIdByAccessToken(String accessToken) {
    return jdbcClient.sql("""
            SELECT user_id
            FROM auth_sessions
            WHERE access_token = :accessToken
            ORDER BY created_at DESC
            LIMIT 1
            """)
        .param("accessToken", accessToken)
        .query(String.class)
        .optional();
  }

  private SessionIdentity loadSessionIdentity(String userId) {
    return findSessionIdentity(userId)
        .orElseThrow(() -> new ResponseStatusException(
            HttpStatus.NOT_FOUND,
            "No user profile was found for the active session."
        ));
  }

  private Optional<SessionIdentity> findSessionIdentity(String userId) {
    return jdbcClient.sql("""
            SELECT user_id, role, full_name, email, phone_number
            FROM users
            WHERE user_id = :userId
            """)
        .param("userId", userId)
        .query((rs, rowNum) -> new SessionIdentity(
            rs.getString("user_id"),
            rs.getString("role"),
            rs.getString("full_name"),
            rs.getString("email"),
            rs.getString("phone_number")
        ))
        .optional();
  }

  public record SessionIdentity(
      String userId,
      String role,
      String fullName,
      String email,
      String phoneNumber
  ) {
  }
}
