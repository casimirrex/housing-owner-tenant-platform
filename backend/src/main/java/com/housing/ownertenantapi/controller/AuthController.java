package com.housing.ownertenantapi.controller;

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
import com.housing.ownertenantapi.service.AuthService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/auth")
@Tag(
    name = "Authentication",
    description = "Phase 1 authentication APIs for registration, OTP, OAuth, session refresh, and logout"
)
public class AuthController {

  private final AuthService authService;

  public AuthController(AuthService authService) {
    this.authService = authService;
  }

  @PostMapping("/register/phone")
  @Operation(summary = "Register with phone", description = "Creates a new tenant or owner account with a phone number and returns an authenticated session immediately")
  public AuthSessionResponse registerWithPhone(@Valid @RequestBody PhoneRegistrationRequest request) {
    return authService.registerWithPhone(request);
  }

  @PostMapping("/register/email")
  @Operation(summary = "Register with email", description = "Creates a new tenant or owner account with an email address and returns an authenticated session immediately")
  public AuthSessionResponse registerWithEmail(@Valid @RequestBody EmailRegistrationRequest request) {
    return authService.registerWithEmail(request);
  }

  @PostMapping("/login")
  @Operation(summary = "Login with email or phone", description = "Authenticates a user with an email or phone based credential set")
  public AuthSessionResponse login(@Valid @RequestBody LoginRequest request) {
    return authService.login(request);
  }

  @PostMapping("/otp/send")
  @Operation(summary = "Send OTP", description = "Sends an OTP for login, registration, or another verification flow")
  public AuthFlowResponse sendOtp(@Valid @RequestBody OtpSendRequest request) {
    return authService.sendOtp(request);
  }

  @PostMapping("/otp/verify")
  @Operation(summary = "Verify OTP", description = "Verifies an OTP and returns an authenticated session")
  public AuthSessionResponse verifyOtp(@Valid @RequestBody OtpVerifyRequest request) {
    return authService.verifyOtp(request);
  }

  @PostMapping("/oauth/google")
  @Operation(summary = "Google sign-in", description = "Verifies a Google identity token or OAuth authorization code and returns an authenticated session")
  public AuthSessionResponse loginWithGoogle(@Valid @RequestBody OAuthLoginRequest request) {
    return authService.loginWithGoogle(request);
  }

  @PostMapping("/oauth/apple")
  @Operation(summary = "Apple sign-in", description = "Exchanges an Apple OAuth authorization code for an authenticated session")
  public AuthSessionResponse loginWithApple(@Valid @RequestBody OAuthLoginRequest request) {
    return authService.loginWithApple(request);
  }

  @PostMapping("/token/refresh")
  @Operation(summary = "Refresh JWT or session token", description = "Refreshes an existing session token using a refresh token")
  public AuthSessionResponse refreshToken(@Valid @RequestBody TokenRefreshRequest request) {
    return authService.refreshToken(request);
  }

  @PostMapping("/logout")
  @Operation(summary = "Logout or session sign-out", description = "Signs out the active session so the web or mobile app can end the authenticated flow explicitly")
  public LogoutResponse logout(@Valid @RequestBody LogoutRequest request) {
    return authService.logout(request);
  }
}
