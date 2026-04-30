package com.housing.ownertenantapi.controller;

import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
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
class OwnerAccessControllerTest {

  @Autowired
  private MockMvc mockMvc;

  @Test
  void shouldCreateOwnerAccountAndFirstListingDraft() throws Exception {
    String response = mockMvc.perform(post("/api/v1/owners/get-started")
            .contentType(MediaType.APPLICATION_JSON)
            .content("""
                {
                  "fullName": "Nisha Rao",
                  "email": "nisha.rao@example.com",
                  "phoneNumber": "+919543210987",
                  "password": "OwnerPassword@123",
                  "title": "Owner-listed 2BHK near HSR Layout",
                  "propertyType": "Apartment",
                  "city": "Bengaluru",
                  "locality": "HSR Layout",
                  "rent": 38000,
                  "deposit": 114000,
                  "bhk": "2BHK",
                  "furnishing": "Semi Furnished",
                  "amenities": ["Lift", "Security", "Power Backup"],
                  "photos": ["https://images.example.com/owners/nisha-cover.jpg"]
                }
                """))
        .andExpect(status().isOk())
        .andExpect(jsonPath("$.session.role").value("OWNER"))
        .andExpect(jsonPath("$.session.authMethod").value("OWNER_ONBOARDING"))
        .andExpect(jsonPath("$.listing.listingId").value(org.hamcrest.Matchers.startsWith("owner_listing_")))
        .andExpect(jsonPath("$.listing.status").value("DRAFT"))
        .andExpect(jsonPath("$.dashboardHref").value("/owner/dashboard"))
        .andReturn()
        .getResponse()
        .getContentAsString();

    String accessToken = new com.fasterxml.jackson.databind.ObjectMapper()
        .readTree(response)
        .path("session")
        .path("accessToken")
        .asText();

    mockMvc.perform(get("/api/v1/owners/listings")
            .header("Authorization", "Bearer " + accessToken))
        .andExpect(status().isOk())
        .andExpect(jsonPath("$.items.length()").value(1))
        .andExpect(jsonPath("$.items[0].locality").value("HSR Layout"));
  }

  @Test
  void shouldRejectTenantEmailFromOwnerGetStarted() throws Exception {
    mockMvc.perform(post("/api/v1/owners/get-started")
            .contentType(MediaType.APPLICATION_JSON)
            .content("""
                {
                  "fullName": "Aarav Kumar",
                  "email": "aarav@example.com",
                  "phoneNumber": "+919123450000",
                  "password": "OwnerPassword@123",
                  "title": "Duplicate account attempt",
                  "propertyType": "Apartment",
                  "city": "Bengaluru",
                  "locality": "Indiranagar",
                  "rent": 42000,
                  "deposit": 126000,
                  "bhk": "2BHK",
                  "furnishing": "Furnished",
                  "amenities": ["Lift"],
                  "photos": ["https://images.example.com/owners/duplicate.jpg"]
                }
                """))
        .andExpect(status().isConflict());
  }
}
