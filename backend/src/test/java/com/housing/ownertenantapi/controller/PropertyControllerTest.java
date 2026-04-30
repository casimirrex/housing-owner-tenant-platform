package com.housing.ownertenantapi.controller;

import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.delete;
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
class PropertyControllerTest {

  @Autowired
  private MockMvc mockMvc;

  @Autowired
  private ObjectMapper objectMapper;

  @Test
  void shouldReturnTeaserPropertyDetailPayloadForGuestViewer() throws Exception {
    mockMvc.perform(get("/api/v1/properties/listing_001"))
        .andExpect(status().isOk())
        .andExpect(jsonPath("$.property.propertyId").value("listing_001"))
        .andExpect(jsonPath("$.pricing.monthlyRent").value(32000))
        .andExpect(jsonPath("$.specs.bhk").value("2BHK"))
        .andExpect(jsonPath("$.amenities.length()").value(3))
        .andExpect(jsonPath("$.trustSignals.verified").value(true))
        .andExpect(jsonPath("$.trustSignals.ownerResponseTimeLabel").value("Replies in about 10 mins"))
        .andExpect(jsonPath("$.trustSignals.propertyTrustScore.title").value("Property Trust Score"))
        .andExpect(jsonPath("$.ctaFlags.kycRequiredStage").value("AFTER_PREMIUM_UPGRADE"))
        .andExpect(jsonPath("$.viewerAccess.accessLevel").value("TEASER"))
        .andExpect(jsonPath("$.ownerInfo.name").value("Tenant Premium unlocks the owner panel"))
        .andExpect(jsonPath("$.ctaFlags.canSave").value(true));
  }

  @Test
  void shouldReturnFullPropertyDetailPayloadForPremiumTenant() throws Exception {
    String accessToken = login("aarav@example.com", "StrongPassword@123");

    mockMvc.perform(get("/api/v1/properties/listing_001")
            .header("Authorization", "Bearer " + accessToken))
        .andExpect(status().isOk())
        .andExpect(jsonPath("$.viewerAccess.accessLevel").value("FULL"))
        .andExpect(jsonPath("$.viewerAccess.premiumActive").value(true))
        .andExpect(jsonPath("$.ownerInfo.name").value("Rohit Mehta"))
        .andExpect(jsonPath("$.ctaFlags.canCallOwner").value(true))
        .andExpect(jsonPath("$.property.address").value("12th Main Road, HAL 2nd Stage, Indiranagar, Bengaluru"));
  }

  @Test
  void shouldReturnPropertyReviews() throws Exception {
    mockMvc.perform(get("/api/v1/properties/listing_001/reviews")
            .param("page", "0")
            .param("pageSize", "2"))
        .andExpect(status().isOk())
        .andExpect(jsonPath("$.reviews.length()").value(2))
        .andExpect(jsonPath("$.ratingSummary.averageRating").value(4.7))
        .andExpect(jsonPath("$.totalCount").value(3));
  }

  @Test
  void shouldReturnPropertyFaq() throws Exception {
    mockMvc.perform(get("/api/v1/properties/listing_001/faq"))
        .andExpect(status().isOk())
        .andExpect(jsonPath("$.faqItems.length()").value(3))
        .andExpect(jsonPath("$.faqItems[0].question").isNotEmpty());
  }

  @Test
  void shouldSaveAndRemoveProperty() throws Exception {
    mockMvc.perform(post("/api/v1/properties/listing_001/save"))
        .andExpect(status().isOk())
        .andExpect(jsonPath("$.saved").value(true))
        .andExpect(jsonPath("$.savedAt").isNotEmpty());

    mockMvc.perform(delete("/api/v1/properties/listing_001/save"))
        .andExpect(status().isOk())
        .andExpect(jsonPath("$.removed").value(true))
        .andExpect(jsonPath("$.removedAt").isNotEmpty());
  }

  @Test
  void shouldExposePropertyEndpointsInOpenApiDocument() throws Exception {
    mockMvc.perform(get("/api-docs"))
        .andExpect(status().isOk())
        .andExpect(jsonPath("$.paths['/api/v1/properties/{propertyId}'].get.summary")
            .value("Get main property detail page payload"))
        .andExpect(jsonPath("$.paths['/api/v1/properties/{propertyId}/reviews'].get.summary")
            .value("Get property or tenant reviews"))
        .andExpect(jsonPath("$.paths['/api/v1/properties/{propertyId}/faq'].get.summary")
            .value("Get property FAQ block"))
        .andExpect(jsonPath("$.paths['/api/v1/properties/{propertyId}/save'].post.summary")
            .value("Save or shortlist property"))
        .andExpect(jsonPath("$.paths['/api/v1/properties/{propertyId}/save'].delete.summary")
            .value("Remove property from shortlist"));
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
