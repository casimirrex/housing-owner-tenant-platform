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
class TenantJourneyControllerTest {

  @Autowired
  private MockMvc mockMvc;

  @Test
  void shouldReturnMatches() throws Exception {
    mockMvc.perform(get("/api/v1/matches")
            .param("city", "Bengaluru")
            .param("page", "0")
            .param("pageSize", "2"))
        .andExpect(status().isOk())
        .andExpect(jsonPath("$.items.length()").value(2))
        .andExpect(jsonPath("$.items[0].matchScore").isNumber())
        .andExpect(jsonPath("$.items[0].matchReason").isNotEmpty())
        .andExpect(jsonPath("$.pagination.pageSize").value(2));
  }

  @Test
  void shouldReturnTenantDashboardSummary() throws Exception {
    mockMvc.perform(get("/api/v1/dashboard/tenant"))
        .andExpect(status().isOk())
        .andExpect(jsonPath("$.savedCount").value(4))
        .andExpect(jsonPath("$.scheduledVisits").value(2))
        .andExpect(jsonPath("$.recommendedCount").value(5))
        .andExpect(jsonPath("$.alertsSummary.unreadCount").value(5));
  }

  @Test
  void shouldReturnVisitSlots() throws Exception {
    mockMvc.perform(get("/api/v1/visits/slots")
            .param("propertyId", "listing_001")
            .param("date", "2026-04-12"))
        .andExpect(status().isOk())
        .andExpect(jsonPath("$.slots.length()").value(4))
        .andExpect(jsonPath("$.timeZone").value("Asia/Kolkata"))
        .andExpect(jsonPath("$.visitRules.length()").value(3));
  }

  @Test
  void shouldScheduleVisit() throws Exception {
    mockMvc.perform(post("/api/v1/visits")
            .contentType(MediaType.APPLICATION_JSON)
            .content("""
                {
                  "propertyId": "listing_001",
                  "slotId": "slot_morning_1",
                  "preferredDate": "2026-04-12",
                  "notes": "Please call 15 minutes before arrival."
                }
                """))
        .andExpect(status().isOk())
        .andExpect(jsonPath("$.visitId").value("visit_1003"))
        .andExpect(jsonPath("$.status").value("SCHEDULED"))
        .andExpect(jsonPath("$.propertySummary.propertyId").value("listing_001"));
  }

  @Test
  void shouldReturnTenantVisits() throws Exception {
    mockMvc.perform(get("/api/v1/visits")
            .param("status", "SCHEDULED")
            .param("page", "0")
            .param("pageSize", "2"))
        .andExpect(status().isOk())
        .andExpect(jsonPath("$.items.length()").value(2))
        .andExpect(jsonPath("$.items[0].status").value("SCHEDULED"))
        .andExpect(jsonPath("$.pagination.page").value(0))
        .andExpect(jsonPath("$.pagination.totalItems").value(2));
  }

  @Test
  void shouldExposeTenantJourneyEndpointsInOpenApiDocument() throws Exception {
    mockMvc.perform(get("/api-docs"))
        .andExpect(status().isOk())
        .andExpect(jsonPath("$.paths['/api/v1/matches'].get.summary")
            .value("Get personalized matches"))
        .andExpect(jsonPath("$.paths['/api/v1/dashboard/tenant'].get.summary")
            .value("Get tenant dashboard summary"))
        .andExpect(jsonPath("$.paths['/api/v1/visits/slots'].get.summary")
            .value("Get available visit slots"))
        .andExpect(jsonPath("$.paths['/api/v1/visits'].post.summary")
            .value("Schedule visit"))
        .andExpect(jsonPath("$.paths['/api/v1/visits'].get.summary")
            .value("Get tenant visits"));
  }
}
