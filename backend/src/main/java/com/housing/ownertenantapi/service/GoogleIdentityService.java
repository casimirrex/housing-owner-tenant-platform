package com.housing.ownertenantapi.service;

import com.fasterxml.jackson.annotation.JsonProperty;
import com.google.api.client.googleapis.auth.oauth2.GoogleIdToken;
import com.google.api.client.googleapis.auth.oauth2.GoogleIdTokenVerifier;
import com.google.api.client.http.javanet.NetHttpTransport;
import com.google.api.client.json.gson.GsonFactory;
import java.io.IOException;
import java.security.GeneralSecurityException;
import java.util.Arrays;
import java.util.List;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.stereotype.Service;
import org.springframework.util.LinkedMultiValueMap;
import org.springframework.util.MultiValueMap;
import org.springframework.util.StringUtils;
import org.springframework.web.client.RestClient;
import org.springframework.web.client.RestClientException;
import org.springframework.web.server.ResponseStatusException;

@Service
public class GoogleIdentityService {

  private static final String DEMO_GOOGLE_IDENTITY_TOKEN = "google_demo_code";
  private static final String DEMO_GOOGLE_AUTHORIZATION_CODE = "google_demo_auth_code";
  private static final List<String> GOOGLE_ISSUERS = List.of(
      "accounts.google.com",
      "https://accounts.google.com"
  );

  private final RestClient oauthRestClient;
  private final GoogleIdTokenVerifier googleIdTokenVerifier;
  private final List<String> allowedClientIds;
  private final List<String> allowedRedirectUris;
  private final String googleClientId;
  private final String googleClientSecret;

  public GoogleIdentityService(
      RestClient.Builder restClientBuilder,
      @Value("${app.auth.google.client-id:}") String googleClientId,
      @Value("${app.auth.google.client-secret:}") String googleClientSecret,
      @Value("${app.auth.google.allowed-client-ids:}") String configuredAllowedClientIds,
      @Value("${app.auth.google.allowed-redirect-uris:}") String configuredAllowedRedirectUris
  ) {
    this.oauthRestClient = restClientBuilder
        .baseUrl("https://oauth2.googleapis.com")
        .build();
    this.googleClientId = normalizeValue(googleClientId);
    this.googleClientSecret = normalizeValue(googleClientSecret);
    this.allowedClientIds = buildAllowedClientIds(googleClientId, configuredAllowedClientIds);
    this.allowedRedirectUris = buildAllowedValues(configuredAllowedRedirectUris);
    GoogleIdTokenVerifier.Builder verifierBuilder = new GoogleIdTokenVerifier.Builder(
        new NetHttpTransport(),
        GsonFactory.getDefaultInstance()
    ).setIssuers(GOOGLE_ISSUERS);

    if (!this.allowedClientIds.isEmpty()) {
      verifierBuilder.setAudience(this.allowedClientIds);
    }

    this.googleIdTokenVerifier = verifierBuilder.build();
  }

  public GoogleIdentityProfile verifyIdentityToken(String identityToken) {
    if (!StringUtils.hasText(identityToken)) {
      throw new ResponseStatusException(
          HttpStatus.BAD_REQUEST,
          "Google identity token is required."
      );
    }

    if (DEMO_GOOGLE_IDENTITY_TOKEN.equals(identityToken)) {
      return buildDemoProfile();
    }

    validateIdentityVerificationConfiguration();

    try {
      GoogleIdToken googleIdToken = googleIdTokenVerifier.verify(identityToken);

      if (googleIdToken == null) {
        throw new ResponseStatusException(
            HttpStatus.UNAUTHORIZED,
            "Google identity token could not be verified."
        );
      }

      GoogleIdToken.Payload payload = googleIdToken.getPayload();
      Object emailVerified = payload.getEmailVerified();
      boolean isEmailVerified = emailVerified instanceof Boolean
          ? (Boolean) emailVerified
          : Boolean.parseBoolean(String.valueOf(emailVerified));

      if (!isEmailVerified) {
        throw new ResponseStatusException(
            HttpStatus.UNAUTHORIZED,
            "Google account email is not verified."
        );
      }

      return new GoogleIdentityProfile(
          payload.getSubject(),
          payload.getEmail(),
          true,
          (String) payload.get("name"),
          (String) payload.get("picture")
      );
    } catch (GeneralSecurityException | IOException exception) {
      throw new ResponseStatusException(
          HttpStatus.UNAUTHORIZED,
          "Google identity verification failed.",
          exception
      );
    }
  }

  public GoogleIdentityProfile exchangeAuthorizationCode(
      String authorizationCode,
      String redirectUri,
      String codeVerifier
  ) {
    if (!StringUtils.hasText(authorizationCode)) {
      throw new ResponseStatusException(
          HttpStatus.BAD_REQUEST,
          "Google authorization code is required."
      );
    }

    validateRedirectUri(redirectUri);
    validateCodeVerifier(codeVerifier);

    if (DEMO_GOOGLE_AUTHORIZATION_CODE.equals(authorizationCode)) {
      return buildDemoProfile();
    }

    validateCodeExchangeConfiguration();

    try {
      GoogleTokenExchangeResponse tokenResponse = oauthRestClient.post()
          .uri("/token")
          .contentType(MediaType.APPLICATION_FORM_URLENCODED)
          .body(buildTokenExchangeForm(authorizationCode, redirectUri, codeVerifier))
          .retrieve()
          .body(GoogleTokenExchangeResponse.class);

      if (tokenResponse == null || !StringUtils.hasText(tokenResponse.idToken())) {
        throw new ResponseStatusException(
            HttpStatus.UNAUTHORIZED,
            "Google OAuth code exchange did not return an identity token."
        );
      }

      return verifyIdentityToken(tokenResponse.idToken());
    } catch (RestClientException exception) {
      throw new ResponseStatusException(
          HttpStatus.UNAUTHORIZED,
          "Google OAuth code exchange failed.",
          exception
      );
    }
  }

  private List<String> buildAllowedClientIds(String googleClientId, String configuredAllowedClientIds) {
    return Arrays.stream((configuredAllowedClientIds + "," + googleClientId).split(","))
        .map(String::trim)
        .filter(value -> !value.isBlank())
        .distinct()
        .toList();
  }

  private List<String> buildAllowedValues(String rawValue) {
    return Arrays.stream(rawValue.split(","))
        .map(String::trim)
        .filter(value -> !value.isBlank())
        .distinct()
        .toList();
  }

  private String normalizeValue(String rawValue) {
    if (!StringUtils.hasText(rawValue)) {
      return null;
    }

    return rawValue.trim();
  }

  private void validateCodeExchangeConfiguration() {
    if (StringUtils.hasText(googleClientId) && StringUtils.hasText(googleClientSecret)) {
      return;
    }

    throw new ResponseStatusException(
        HttpStatus.SERVICE_UNAVAILABLE,
        "Google OAuth code exchange is not configured on the server. Set GOOGLE_OAUTH_CLIENT_ID or GOOGLE_CLIENT_ID, and GOOGLE_OAUTH_CLIENT_SECRET or GOOGLE_CLIENT_SECRET."
    );
  }

  private void validateIdentityVerificationConfiguration() {
    if (!allowedClientIds.isEmpty()) {
      return;
    }

    throw new ResponseStatusException(
        HttpStatus.SERVICE_UNAVAILABLE,
        "Google ID token verification is not configured on the server. Set GOOGLE_OAUTH_CLIENT_ID or GOOGLE_CLIENT_ID."
    );
  }

  private void validateRedirectUri(String redirectUri) {
    if (!StringUtils.hasText(redirectUri)) {
      throw new ResponseStatusException(
          HttpStatus.BAD_REQUEST,
          "Google redirect URI is required."
      );
    }

    if (allowedRedirectUris.isEmpty()) {
      throw new ResponseStatusException(
          HttpStatus.SERVICE_UNAVAILABLE,
          "Google redirect URIs are not configured on the server. Set GOOGLE_OAUTH_ALLOWED_REDIRECT_URIS."
      );
    }

    String normalizedRedirectUri = redirectUri.trim();
    if (allowedRedirectUris.contains(normalizedRedirectUri)) {
      return;
    }

    throw new ResponseStatusException(
        HttpStatus.BAD_REQUEST,
        "Google redirect URI is not allowed for this server configuration."
    );
  }

  private void validateCodeVerifier(String codeVerifier) {
    if (StringUtils.hasText(codeVerifier)) {
      return;
    }

    throw new ResponseStatusException(
        HttpStatus.BAD_REQUEST,
        "Google PKCE code verifier is required."
    );
  }

  private MultiValueMap<String, String> buildTokenExchangeForm(
      String authorizationCode,
      String redirectUri,
      String codeVerifier
  ) {
    MultiValueMap<String, String> form = new LinkedMultiValueMap<>();
    form.add("code", authorizationCode);
    form.add("client_id", googleClientId);
    form.add("client_secret", googleClientSecret);
    form.add("redirect_uri", redirectUri);
    form.add("code_verifier", codeVerifier);
    form.add("grant_type", "authorization_code");
    return form;
  }

  private GoogleIdentityProfile buildDemoProfile() {
    return new GoogleIdentityProfile(
        "demo_google_sub",
        "aarav@example.com",
        true,
        "Aarav Kumar",
        "https://images.example.com/users/aarav.jpg"
    );
  }

  private record GoogleTokenExchangeResponse(
      @JsonProperty("access_token")
      String accessToken,
      @JsonProperty("id_token")
      String idToken,
      @JsonProperty("token_type")
      String tokenType,
      @JsonProperty("expires_in")
      Integer expiresIn,
      String scope
  ) {
  }
}
