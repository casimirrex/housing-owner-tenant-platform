package com.housing.ownertenantapi.controller;

import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.content;
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
class SearchControllerTest {

  @Autowired
  private MockMvc mockMvc;

  @Autowired
  private ObjectMapper objectMapper;

  @Test
  void shouldSearchListings() throws Exception {
    mockMvc.perform(get("/api/v1/search")
            .param("query", "metro")
            .param("city", "Bengaluru")
            .param("budgetMax", "35000")
            .param("page", "0")
            .param("pageSize", "2")
            .param("sortBy", "relevance"))
        .andExpect(status().isOk())
        .andExpect(jsonPath("$.items.length()").value(1))
        .andExpect(jsonPath("$.appliedFilters.city").value("Bengaluru"))
        .andExpect(jsonPath("$.summary.resultCount").value(1));
  }

  @Test
  void shouldSearchMapByViewport() throws Exception {
    mockMvc.perform(post("/api/v1/search/map")
            .contentType(MediaType.APPLICATION_JSON)
            .content("""
                {
                  "northEastLat": 13.10,
                  "northEastLng": 77.80,
                  "southWestLat": 12.85,
                  "southWestLng": 77.50,
                  "filters": {
                    "city": "Bengaluru",
                    "verified": true
                  }
                }
                """))
        .andExpect(status().isOk())
        .andExpect(jsonPath("$.pins.length()").value(4))
        .andExpect(jsonPath("$.count").value(4))
        .andExpect(jsonPath("$.clusters.length()").value(1));
  }

  @Test
  void shouldReturnFilterMetadata() throws Exception {
    mockMvc.perform(get("/api/v1/filters/metadata").param("city", "Bengaluru"))
        .andExpect(status().isOk())
        .andExpect(jsonPath("$.bhkOptions[0]").value("Studio"))
        .andExpect(jsonPath("$.quickFilters[0]").value("Verified"));
  }

  @Test
  void shouldAutocompleteLocations() throws Exception {
    mockMvc.perform(get("/api/v1/locations/autocomplete")
            .param("q", "Indi")
            .param("city", "Bengaluru"))
        .andExpect(status().isOk())
        .andExpect(jsonPath("$.suggestions.length()").value(2))
        .andExpect(jsonPath("$.suggestions[0].city").value("Bengaluru"));
  }

  @Test
  void shouldReturnNearbyListings() throws Exception {
    mockMvc.perform(get("/api/v1/locations/nearby")
            .param("lat", "12.9716")
            .param("lng", "77.5946")
            .param("radiusKm", "10"))
        .andExpect(status().isOk())
        .andExpect(jsonPath("$.items.length()").isNotEmpty())
        .andExpect(jsonPath("$.centerPoint.lat").value(12.9716))
        .andExpect(jsonPath("$.radiusKm").value(10.0));
  }

  @Test
  void shouldFindOwnerCreatedListingWhenTenantSearchUsesCanonicalCity() throws Exception {
    String ownerAccessToken = login("rohit.mehta@example.com", "StrongPassword@123");
    String response = mockMvc.perform(post("/api/v1/owners/listings")
            .header("Authorization", "Bearer " + ownerAccessToken)
            .contentType(MediaType.APPLICATION_JSON)
            .content("""
                {
                  "title": "Tenant searchable alias listing",
                  "propertyType": "Apartment",
                  "city": "Bangalore",
                  "locality": "HSR Layout",
                  "rent": 36500,
                  "deposit": 109500,
                  "bhk": "2BHK",
                  "furnishing": "Furnished",
                  "amenities": ["Lift", "Security", "Power Backup"],
                  "photos": ["https://images.example.com/owners/search-alias-cover.jpg"],
                  "lat": 12.9116,
                  "lng": 77.6474
                }
                """))
        .andExpect(status().isOk())
        .andReturn()
        .getResponse()
        .getContentAsString();

    String listingId = objectMapper.readTree(response).path("listingId").asText();

    mockMvc.perform(get("/api/v1/search")
            .param("query", "searchable alias")
            .param("city", "Bengaluru")
            .param("page", "0")
            .param("pageSize", "10")
            .param("sortBy", "newest"))
        .andExpect(status().isOk())
        .andExpect(content().string(org.hamcrest.Matchers.containsString(listingId)))
        .andExpect(jsonPath("$.items[0].city").value("Bengaluru"));
  }

  @Test
  void shouldExposeSearchEndpointsInOpenApiDocument() throws Exception {
    mockMvc.perform(get("/api-docs"))
        .andExpect(status().isOk())
        .andExpect(jsonPath("$.paths['/api/v1/search'].get.summary")
            .value("Standard listing search"))
        .andExpect(jsonPath("$.paths['/api/v1/search/map'].post.summary")
            .value("Map-based search with viewport"))
        .andExpect(jsonPath("$.paths['/api/v1/filters/metadata'].get.summary")
            .value("Get filter values and configuration"))
        .andExpect(jsonPath("$.paths['/api/v1/locations/autocomplete'].get.summary")
            .value("Get area, landmark, or office suggestions"))
        .andExpect(jsonPath("$.paths['/api/v1/locations/nearby'].get.summary")
            .value("Get near-me search seed listings"));
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
