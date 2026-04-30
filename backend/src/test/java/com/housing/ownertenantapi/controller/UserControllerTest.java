package com.housing.ownertenantapi.controller;

import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.put;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.delete;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.http.MediaType;
import org.springframework.test.annotation.DirtiesContext;
import org.springframework.test.web.servlet.MockMvc;

@SpringBootTest
@AutoConfigureMockMvc
@DirtiesContext(classMode = DirtiesContext.ClassMode.BEFORE_EACH_TEST_METHOD)
class UserControllerTest {

  @Autowired
  private MockMvc mockMvc;

  @Test
  void shouldReturnCurrentUserProfile() throws Exception {
    mockMvc.perform(get("/api/v1/users/me"))
        .andExpect(status().isOk())
        .andExpect(jsonPath("$.userId").value("user_1a2b3c4d"))
        .andExpect(jsonPath("$.fullName").value("Aarav Kumar"))
        .andExpect(jsonPath("$.city").value("Bengaluru"))
        .andExpect(jsonPath("$.emergencyContactName").value("Meera Kumar"))
        .andExpect(jsonPath("$.upiId").value("aarav@upi"))
        .andExpect(jsonPath("$.profileCompletion").value(92))
        .andExpect(jsonPath("$.hasPassword").value(true));
  }

  @Test
  void shouldUpdateCurrentUserProfile() throws Exception {
    mockMvc.perform(put("/api/v1/users/me")
            .contentType(MediaType.APPLICATION_JSON)
            .content("""
                {
                  "fullName": "Aarav R. Kumar",
                  "dateOfBirth": "1995-08-14",
                  "gender": "Male",
                  "city": "Pune",
                  "occupation": "Product Designer",
                  "emergencyContactName": "Meera Kumar",
                  "emergencyContactPhone": "+919912345678",
                  "employmentType": "SALARIED",
                  "employerName": "TCS",
                  "monthlyIncomeRange": "Rs. 70,000-90,000",
                  "previousLandlordName": "Sanjay Menon",
                  "previousLandlordPhone": "+919800112233",
                  "aadhaarLast4": "4821",
                  "panCardNumber": "ABCDE1234F",
                  "governmentIdType": "Driving Licence",
                  "governmentIdPhotoUrl": "https://images.example.com/users/aarav-id-updated.jpg",
                  "upiId": "aarav@upi",
                  "photoUrl": "https://images.example.com/users/aarav-updated.jpg"
                }
                """))
        .andExpect(status().isOk())
        .andExpect(jsonPath("$.updated").value(true))
        .andExpect(jsonPath("$.user.fullName").value("Aarav R. Kumar"))
        .andExpect(jsonPath("$.user.city").value("Pune"));
  }

  @Test
  void shouldReturnPreferences() throws Exception {
    mockMvc.perform(get("/api/v1/users/me/preferences"))
        .andExpect(status().isOk())
        .andExpect(jsonPath("$.budgetMin").isNumber())
        .andExpect(jsonPath("$.preferredLocalities[0]").value("Koramangala"));
  }

  @Test
  void shouldUpdatePreferences() throws Exception {
    mockMvc.perform(put("/api/v1/users/me/preferences")
            .contentType(MediaType.APPLICATION_JSON)
            .content("""
                {
                  "budgetMin": 18000,
                  "budgetMax": 42000,
                  "bhkPreference": "2BHK",
                  "commuteLocation": "Whitefield",
                  "petFriendly": true,
                  "tenantType": "FAMILY",
                  "lifestyleTags": ["gated-community", "near-metro"]
                }
                """))
        .andExpect(status().isOk())
        .andExpect(jsonPath("$.updated").value(true))
        .andExpect(jsonPath("$.preferenceProfileId").value("pref_2eac91f4"));
  }

  @Test
  void shouldReturnVerificationStatus() throws Exception {
    mockMvc.perform(get("/api/v1/users/me/verification-status"))
        .andExpect(status().isOk())
        .andExpect(jsonPath("$.userId").value("user_1a2b3c4d"))
        .andExpect(jsonPath("$.profileStatus").value("VERIFIED"))
        .andExpect(jsonPath("$.kycStatus").value("VERIFIED"))
        .andExpect(jsonPath("$.kycRequiredStage").value("BEFORE_AGREEMENT"))
        .andExpect(jsonPath("$.profileCompletion").value(92))
        .andExpect(jsonPath("$.photoUploaded").value(true));
  }

  @Test
  void shouldUploadProfilePhoto() throws Exception {
    mockMvc.perform(post("/api/v1/users/me/photo")
            .contentType(MediaType.APPLICATION_JSON)
            .content("""
                {
                  "photoUrl": "https://images.example.com/users/aarav-onboarding.jpg"
                }
                """))
        .andExpect(status().isOk())
        .andExpect(jsonPath("$.uploaded").value(true))
        .andExpect(jsonPath("$.photoUrl").value("https://images.example.com/users/aarav-onboarding.jpg"))
        .andExpect(jsonPath("$.user.photoUrl").value("https://images.example.com/users/aarav-onboarding.jpg"));
  }

  @Test
  void shouldRequireSignInBeforeUpdatingPassword() throws Exception {
    mockMvc.perform(put("/api/v1/users/me/password")
            .contentType(MediaType.APPLICATION_JSON)
            .content("""
                {
                  "newPassword": "UpdatedPassword@123"
                }
                """))
        .andExpect(status().isUnauthorized());
  }

  @Test
  void shouldUpdatePasswordForAuthenticatedUser() throws Exception {
    String loginResponse = mockMvc.perform(post("/auth/login")
            .contentType(MediaType.APPLICATION_JSON)
            .content("""
                {
                  "identifier": "aarav@example.com",
                  "password": "StrongPassword@123"
                }
                """))
        .andExpect(status().isOk())
        .andReturn()
        .getResponse()
        .getContentAsString();

    String accessToken = new com.fasterxml.jackson.databind.ObjectMapper()
        .readTree(loginResponse)
        .path("accessToken")
        .asText();

    mockMvc.perform(put("/api/v1/users/me/password")
            .header("Authorization", "Bearer " + accessToken)
            .contentType(MediaType.APPLICATION_JSON)
            .content("""
                {
                  "newPassword": "UpdatedPassword@123"
                }
                """))
        .andExpect(status().isOk())
        .andExpect(jsonPath("$.updated").value(true))
        .andExpect(jsonPath("$.userId").value("user_1a2b3c4d"))
        .andExpect(jsonPath("$.hasPassword").value(true));
  }

  @Test
  void shouldDeactivateAccount() throws Exception {
    mockMvc.perform(delete("/api/v1/users/me"))
        .andExpect(status().isOk())
        .andExpect(jsonPath("$.deactivated").value(true))
        .andExpect(jsonPath("$.profileStatus").value("DEACTIVATED"));
  }

  @Test
  void shouldExposeUserEndpointsInOpenApiDocument() throws Exception {
    mockMvc.perform(get("/api-docs"))
        .andExpect(status().isOk())
        .andExpect(jsonPath("$.paths['/api/v1/users/me'].get.summary")
            .value("Get logged-in user profile"))
        .andExpect(jsonPath("$.paths['/api/v1/users/me'].put.summary")
            .value("Update profile"))
        .andExpect(jsonPath("$.paths['/api/v1/users/me/preferences'].get.summary")
            .value("Get search and recommendation preferences"))
        .andExpect(jsonPath("$.paths['/api/v1/users/me/preferences'].put.summary")
            .value("Save preferences"))
        .andExpect(jsonPath("$.paths['/api/v1/users/me/verification-status'].get.summary")
            .value("Check verification state"))
        .andExpect(jsonPath("$.paths['/api/v1/users/me/photo'].post.summary")
            .value("Upload profile image"))
        .andExpect(jsonPath("$.paths['/api/v1/users/me/password'].put.summary")
            .value("Set or update app password"))
        .andExpect(jsonPath("$.paths['/api/v1/users/me'].delete.summary")
            .value("Deactivate or delete account"));
  }
}
