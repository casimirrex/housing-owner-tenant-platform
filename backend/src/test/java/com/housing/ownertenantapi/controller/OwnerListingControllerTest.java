package com.housing.ownertenantapi.controller;

import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import com.fasterxml.jackson.databind.ObjectMapper;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.http.MediaType;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.test.annotation.DirtiesContext;
import org.springframework.test.web.servlet.MockMvc;

@SpringBootTest
@AutoConfigureMockMvc
@DirtiesContext(classMode = DirtiesContext.ClassMode.BEFORE_EACH_TEST_METHOD)
class OwnerListingControllerTest {

  @Autowired
  private MockMvc mockMvc;

  @Autowired
  private ObjectMapper objectMapper;

  @Autowired
  private JdbcTemplate jdbcTemplate;

  @Test
  void shouldReturnOwnerListingsForOwnerSession() throws Exception {
    String ownerAccessToken = login("rohit.mehta@example.com", "StrongPassword@123");

    mockMvc.perform(get("/api/v1/owners/listings")
            .header("Authorization", "Bearer " + ownerAccessToken))
        .andExpect(status().isOk())
        .andExpect(jsonPath("$.items.length()").value(2))
        .andExpect(jsonPath("$.items[0].listingId").isNotEmpty());
  }

  @Test
  void shouldCreateOwnerListingDraft() throws Exception {
    String ownerAccessToken = login("rohit.mehta@example.com", "StrongPassword@123");

    mockMvc.perform(post("/api/v1/owners/listings")
            .header("Authorization", "Bearer " + ownerAccessToken)
            .contentType(MediaType.APPLICATION_JSON)
            .content("""
                {
                  "title": "Owner test listing near Koramangala",
                  "propertyType": "Apartment",
                  "city": "Bengaluru",
                  "locality": "Koramangala",
                  "rent": 36000,
                  "deposit": 108000,
                  "bhk": "2BHK",
                  "furnishing": "Semi Furnished",
                  "amenities": ["Lift", "Power Backup", "Security"],
                  "photos": ["https://images.example.com/owners/test-cover.jpg"],
                  "lat": 12.9352,
                  "lng": 77.6245
                }
                """))
        .andExpect(status().isOk())
        .andExpect(jsonPath("$.listingId").value(org.hamcrest.Matchers.startsWith("owner_listing_")))
        .andExpect(jsonPath("$.status").value("DRAFT"));
  }

  @Test
  void shouldPublishOwnerListingWhenOwnerPremiumIsActive() throws Exception {
    activateOwnerPremiumForRohit();
    String ownerAccessToken = login("rohit.mehta@example.com", "StrongPassword@123");

    mockMvc.perform(post("/api/v1/owners/listings")
            .header("Authorization", "Bearer " + ownerAccessToken)
            .contentType(MediaType.APPLICATION_JSON)
            .content("""
                {
                  "title": "Premium owner listing near HSR",
                  "propertyType": "Apartment",
                  "city": "Bengaluru",
                  "locality": "HSR Layout",
                  "rent": 42000,
                  "deposit": 126000,
                  "bhk": "3BHK",
                  "furnishing": "Fully Furnished",
                  "amenities": ["Lift", "Gym", "Security"],
                  "photos": ["https://images.example.com/owners/premium-cover.jpg"],
                  "lat": 12.9116,
                  "lng": 77.6474
                }
                """))
        .andExpect(status().isOk())
        .andExpect(jsonPath("$.listingId").value(org.hamcrest.Matchers.startsWith("owner_listing_")))
        .andExpect(jsonPath("$.status").value("PUBLISHED"));
  }

  @Test
  void shouldRejectTenantFromOwnerListingsFlow() throws Exception {
    String tenantAccessToken = login("aarav@example.com", "StrongPassword@123");

    mockMvc.perform(get("/api/v1/owners/listings")
            .header("Authorization", "Bearer " + tenantAccessToken))
        .andExpect(status().isForbidden());
  }

  private String login(String identifier, String password) throws Exception {
    String response = mockMvc.perform(post("/auth/login")
            .contentType(MediaType.APPLICATION_JSON)
            .content("""
                {
                  "identifier": "%s",
                  "password": "%s"
                }
                """.formatted(identifier, password)))
        .andExpect(status().isOk())
        .andReturn()
        .getResponse()
        .getContentAsString();

    return objectMapper.readTree(response).path("accessToken").asText();
  }

  private void activateOwnerPremiumForRohit() {
    jdbcTemplate.update("""
        INSERT INTO user_subscriptions (
          subscription_id, user_id, plan_code, status, started_at, expires_at,
          activated_via, amount_paid, currency, payment_reference, created_at, updated_at
        )
        VALUES (
          'sub_owner_premium_test_101', 'owner_101', 'OWNER_PREMIUM_ANNUAL', 'ACTIVE',
          CURRENT_TIMESTAMP, CURRENT_TIMESTAMP + INTERVAL '365 days',
          'TEST', 1000, 'INR', 'owner_listing_test', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP
        )
        """);
  }
}
