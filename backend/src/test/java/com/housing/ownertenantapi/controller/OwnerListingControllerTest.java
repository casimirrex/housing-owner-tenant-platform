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
}
