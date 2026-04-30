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
class HomeDiscoveryControllerTest {

  @Autowired
  private MockMvc mockMvc;

  @Autowired
  private ObjectMapper objectMapper;

  @Test
  void shouldReturnCompositeHomePayload() throws Exception {
    mockMvc.perform(get("/api/v1/home")
            .param("city", "Bengaluru")
            .param("lat", "12.9716")
            .param("lng", "77.5946"))
        .andExpect(status().isOk())
        .andExpect(jsonPath("$.heroSearchConfig.city").value("Bengaluru"))
        .andExpect(jsonPath("$.recommendations.length()").value(3))
        .andExpect(jsonPath("$.premiumVerified.length()").isNotEmpty());
  }

  @Test
  void shouldReturnRecommendations() throws Exception {
    mockMvc.perform(get("/api/v1/recommendations")
            .param("userId", "user_1a2b3c4d")
            .param("city", "Bengaluru")
            .param("page", "0")
            .param("pageSize", "2"))
        .andExpect(status().isOk())
        .andExpect(jsonPath("$.items.length()").value(2))
        .andExpect(jsonPath("$.items[0].recommendationReason").isNotEmpty())
        .andExpect(jsonPath("$.pagination.page").value(0))
        .andExpect(jsonPath("$.pagination.pageSize").value(2));
  }

  @Test
  void shouldReturnTrendingListings() throws Exception {
    mockMvc.perform(get("/api/v1/listings/trending")
            .param("city", "Bengaluru")
            .param("page", "0")
            .param("pageSize", "2"))
        .andExpect(status().isOk())
        .andExpect(jsonPath("$.items.length()").value(2))
        .andExpect(jsonPath("$.totalCount").value(3));
  }

  @Test
  void shouldReturnNewListings() throws Exception {
    mockMvc.perform(get("/api/v1/listings/new")
            .param("page", "0")
            .param("pageSize", "2"))
        .andExpect(status().isOk())
        .andExpect(jsonPath("$.items.length()").value(2))
        .andExpect(jsonPath("$.totalCount").value(3));
  }

  @Test
  void shouldShowOwnerCreatedListingInTenantNewListingsWhenCityUsesAlias() throws Exception {
    String ownerAccessToken = login("rohit.mehta@example.com", "StrongPassword@123");
    String response = mockMvc.perform(post("/api/v1/owners/listings")
            .header("Authorization", "Bearer " + ownerAccessToken)
            .contentType(MediaType.APPLICATION_JSON)
            .content("""
                {
                  "title": "Owner alias visibility listing",
                  "propertyType": "Apartment",
                  "city": "Bangalore",
                  "locality": "Koramangala",
                  "rent": 35500,
                  "deposit": 106500,
                  "bhk": "2BHK",
                  "furnishing": "Semi Furnished",
                  "amenities": ["Lift", "Security"],
                  "photos": ["https://images.example.com/owners/alias-visibility-cover.jpg"],
                  "lat": 12.9352,
                  "lng": 77.6245
                }
                """))
        .andExpect(status().isOk())
        .andReturn()
        .getResponse()
        .getContentAsString();

    String listingId = objectMapper.readTree(response).path("listingId").asText();

    mockMvc.perform(get("/api/v1/listings/new")
            .param("city", "Bengaluru")
            .param("page", "0")
            .param("pageSize", "10"))
        .andExpect(status().isOk())
        .andExpect(jsonPath("$.items[0].listingId").value(listingId))
        .andExpect(jsonPath("$.items[0].city").value("Bengaluru"));
  }

  @Test
  void shouldExposeDiscoveryEndpointsInOpenApiDocument() throws Exception {
    mockMvc.perform(get("/api-docs"))
        .andExpect(status().isOk())
        .andExpect(jsonPath("$.paths['/api/v1/home'].get.summary")
            .value("Get composite home screen payload"))
        .andExpect(jsonPath("$.paths['/api/v1/recommendations'].get.summary")
            .value("Get personalized or rules-based recommendations"))
        .andExpect(jsonPath("$.paths['/api/v1/listings/trending'].get.summary")
            .value("Get trending listings"))
        .andExpect(jsonPath("$.paths['/api/v1/listings/new'].get.summary")
            .value("Get newly added listings"));
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
