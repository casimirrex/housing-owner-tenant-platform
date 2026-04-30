package com.housing.ownertenantapi.controller;

import static org.assertj.core.api.Assertions.assertThat;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.put;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import com.fasterxml.jackson.databind.ObjectMapper;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.http.MediaType;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.test.web.servlet.MockMvc;

@SpringBootTest(properties = {
    "app.auth.google.allowed-redirect-uris=http://127.0.0.1:3001/account/login/gmail,http://127.0.0.1:3001/account/register/gmail"
})
@AutoConfigureMockMvc
class AuthControllerTest {

  @Autowired
  private MockMvc mockMvc;

  @Autowired
  private ObjectMapper objectMapper;

  @Autowired
  private JdbcTemplate jdbcTemplate;

  @Test
  void shouldStartPhoneRegistration() throws Exception {
    mockMvc.perform(post("/auth/register/phone")
            .contentType(MediaType.APPLICATION_JSON)
            .content("""
                {
                  "fullName": "Aarav Kumar",
                  "countryCode": "+91",
                  "phoneNumber": "9876543210"
                }
                """))
        .andExpect(status().isOk())
        .andExpect(jsonPath("$.status").value("PENDING_OTP_VERIFICATION"))
        .andExpect(jsonPath("$.nextStep").value("VERIFY_OTP"))
        .andExpect(jsonPath("$.phase").value(1));
  }

  @Test
  void shouldLoginWithEmailOrPhone() throws Exception {
    mockMvc.perform(post("/auth/login")
            .contentType(MediaType.APPLICATION_JSON)
            .content("""
                {
                  "identifier": "aarav@example.com",
                  "password": "StrongPassword@123"
                }
                """))
        .andExpect(status().isOk())
        .andExpect(jsonPath("$.tokenType").value("Bearer"))
        .andExpect(jsonPath("$.authMethod").value("EMAIL_PASSWORD"))
        .andExpect(jsonPath("$.accessToken").isNotEmpty());
  }

  @Test
  void shouldLoginOwnerThroughOwnerPath() throws Exception {
    mockMvc.perform(post("/auth/login")
            .contentType(MediaType.APPLICATION_JSON)
            .content("""
                {
                  "identifier": "rohit.mehta@example.com",
                  "password": "StrongPassword@123",
                  "roleHint": "OWNER"
                }
                """))
        .andExpect(status().isOk())
        .andExpect(jsonPath("$.role").value("OWNER"))
        .andExpect(jsonPath("$.authMethod").value("EMAIL_PASSWORD"));
  }

  @Test
  void shouldRejectTenantAccountOnOwnerLoginPath() throws Exception {
    mockMvc.perform(post("/auth/login")
            .contentType(MediaType.APPLICATION_JSON)
            .content("""
                {
                  "identifier": "aarav@example.com",
                  "password": "StrongPassword@123",
                  "roleHint": "OWNER"
                }
                """))
        .andExpect(status().isForbidden());
  }

  @Test
  void shouldRejectLoginWhenPasswordDoesNotMatch() throws Exception {
    mockMvc.perform(post("/auth/login")
            .contentType(MediaType.APPLICATION_JSON)
            .content("""
                {
                  "identifier": "aarav@example.com",
                  "password": "WrongPassword@123"
                }
                """))
        .andExpect(status().isUnauthorized());
  }

  @Test
  void shouldVerifyOtpAndReturnSession() throws Exception {
    mockMvc.perform(post("/auth/otp/verify")
            .contentType(MediaType.APPLICATION_JSON)
            .content("""
                {
                  "flowId": "flow_12345678",
                  "destination": "+919876543210",
                  "otpCode": "123456"
                }
                """))
        .andExpect(status().isOk())
        .andExpect(jsonPath("$.authMethod").value("OTP"))
        .andExpect(jsonPath("$.refreshToken").isNotEmpty());
  }

  @Test
  void shouldLoginWithGoogleIdentityToken() throws Exception {
    mockMvc.perform(post("/auth/oauth/google")
            .contentType(MediaType.APPLICATION_JSON)
            .content("""
                {
                  "identityToken": "google_demo_code",
                  "redirectUri": "http://127.0.0.1:3001/login"
                }
                """))
        .andExpect(status().isOk())
        .andExpect(jsonPath("$.authMethod").value("GOOGLE"))
        .andExpect(jsonPath("$.email").value("aarav@example.com"))
        .andExpect(jsonPath("$.emailVerified").value(true));

    Integer googleIdentityCount = jdbcTemplate.queryForObject("""
        SELECT COUNT(*)
        FROM auth_identities
        WHERE provider = 'GOOGLE'
          AND provider_subject = 'demo_google_sub'
        """, Integer.class);

    assertThat(googleIdentityCount).isEqualTo(1);
  }

  @Test
  void shouldLoginWithGoogleAuthorizationCode() throws Exception {
    mockMvc.perform(post("/auth/oauth/google")
            .contentType(MediaType.APPLICATION_JSON)
            .content("""
                {
                  "authorizationCode": "google_demo_auth_code",
                  "codeVerifier": "pkce-code-verifier-for-tests-which-is-long-enough-123456",
                  "redirectUri": "http://127.0.0.1:3001/account/login/gmail"
                }
                """))
        .andExpect(status().isOk())
        .andExpect(jsonPath("$.authMethod").value("GOOGLE"))
        .andExpect(jsonPath("$.email").value("aarav@example.com"))
        .andExpect(jsonPath("$.emailVerified").value(true));
  }

  @Test
  void shouldAllowGoogleUserToSetPasswordAndLoginWithItLater() throws Exception {
    String googleResponse = mockMvc.perform(post("/auth/oauth/google")
            .contentType(MediaType.APPLICATION_JSON)
            .content("""
                {
                  "authorizationCode": "google_demo_auth_code",
                  "codeVerifier": "pkce-code-verifier-for-tests-which-is-long-enough-123456",
                  "redirectUri": "http://127.0.0.1:3001/account/register/gmail"
                }
                """))
        .andExpect(status().isOk())
        .andReturn()
        .getResponse()
        .getContentAsString();

    String accessToken = objectMapper.readTree(googleResponse).path("accessToken").asText();

    mockMvc.perform(put("/api/v1/users/me/password")
            .header("Authorization", "Bearer " + accessToken)
            .contentType(MediaType.APPLICATION_JSON)
            .content("""
                {
                  "newPassword": "GmailPassword@123"
                }
                """))
        .andExpect(status().isOk())
        .andExpect(jsonPath("$.updated").value(true))
        .andExpect(jsonPath("$.hasPassword").value(true));

    mockMvc.perform(post("/auth/login")
            .contentType(MediaType.APPLICATION_JSON)
            .content("""
                {
                  "identifier": "aarav@example.com",
                  "password": "GmailPassword@123"
                }
                """))
        .andExpect(status().isOk())
        .andExpect(jsonPath("$.authMethod").value("EMAIL_PASSWORD"));
  }

  @Test
  void shouldRejectGoogleLoginWhenBothIdentityTokenAndAuthorizationCodeAreProvided() throws Exception {
    mockMvc.perform(post("/auth/oauth/google")
            .contentType(MediaType.APPLICATION_JSON)
            .content("""
                {
                  "identityToken": "google_demo_code",
                  "authorizationCode": "google_demo_auth_code",
                  "codeVerifier": "pkce-code-verifier-for-tests-which-is-long-enough-123456",
                  "redirectUri": "http://127.0.0.1:3001/account/login/gmail"
                }
                """))
        .andExpect(status().isBadRequest());
  }

  @Test
  void shouldLogoutSession() throws Exception {
    String loginResponse = mockMvc.perform(post("/auth/oauth/google")
            .contentType(MediaType.APPLICATION_JSON)
            .content("""
                {
                  "authorizationCode": "google_demo_auth_code",
                  "codeVerifier": "pkce-code-verifier-for-tests-which-is-long-enough-123456",
                  "redirectUri": "http://127.0.0.1:3001/account/login/gmail"
                }
                """))
        .andExpect(status().isOk())
        .andReturn()
        .getResponse()
        .getContentAsString();

    String refreshToken = objectMapper.readTree(loginResponse).path("refreshToken").asText();

    mockMvc.perform(post("/auth/logout")
            .contentType(MediaType.APPLICATION_JSON)
            .content("""
                {
                  "refreshToken": "%s"
                }
                """.formatted(refreshToken)))
        .andExpect(status().isOk())
        .andExpect(jsonPath("$.signedOut").value(true))
        .andExpect(jsonPath("$.revokedSessionCount").value(1))
        .andExpect(jsonPath("$.message").value("Session sign-out completed successfully."));
  }

  @Test
  void shouldExposeAuthEndpointsInOpenApiDocument() throws Exception {
    mockMvc.perform(get("/api-docs"))
        .andExpect(status().isOk())
        .andExpect(jsonPath("$.paths['/auth/register/phone'].post.summary")
            .value("Start phone registration"))
        .andExpect(jsonPath("$.paths['/auth/register/email'].post.summary")
            .value("Start email registration"))
        .andExpect(jsonPath("$.paths['/auth/login'].post.summary")
            .value("Login with email or phone"))
        .andExpect(jsonPath("$.paths['/auth/otp/send'].post.summary")
            .value("Send OTP"))
        .andExpect(jsonPath("$.paths['/auth/otp/verify'].post.summary")
            .value("Verify OTP"))
        .andExpect(jsonPath("$.paths['/auth/oauth/google'].post.summary")
            .value("Google sign-in"))
        .andExpect(jsonPath("$.paths['/auth/oauth/apple'].post.summary")
            .value("Apple sign-in"))
        .andExpect(jsonPath("$.paths['/auth/token/refresh'].post.summary")
            .value("Refresh JWT or session token"))
        .andExpect(jsonPath("$.paths['/auth/logout'].post.summary")
            .value("Logout or session sign-out"));
  }
}
