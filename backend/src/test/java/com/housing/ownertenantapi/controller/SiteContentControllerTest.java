package com.housing.ownertenantapi.controller;

import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.test.web.servlet.MockMvc;

@SpringBootTest
@AutoConfigureMockMvc
class SiteContentControllerTest {

  @Autowired
  private MockMvc mockMvc;

  @Test
  void shouldReturnOverview() throws Exception {
    mockMvc.perform(get("/api/v1/site-overview"))
        .andExpect(status().isOk())
        .andExpect(jsonPath("$.eyebrow").value("Website Blueprint"))
        .andExpect(jsonPath("$.launchCities[0]").value("Bengaluru"));
  }

  @Test
  void shouldReturnPages() throws Exception {
    mockMvc.perform(get("/api/v1/site-pages"))
        .andExpect(status().isOk())
        .andExpect(jsonPath("$.pages.length()").value(8))
        .andExpect(jsonPath("$.pages[0].page").value("Landing / Home page"));
  }

  @Test
  void shouldReturnBackendLayer() throws Exception {
    mockMvc.perform(get("/api/v1/tech-stack/backend"))
        .andExpect(status().isOk())
        .andExpect(jsonPath("$.recommendedTechStack").value("Java + Spring Boot"));
  }

  @Test
  void shouldReturnProductPages() throws Exception {
    mockMvc.perform(get("/api/v1/product-pages"))
        .andExpect(status().isOk())
        .andExpect(jsonPath("$.pages.length()").value(17))
        .andExpect(jsonPath("$.pages[0].page").value("Splash / intro equivalent"))
        .andExpect(jsonPath("$.pages[0].source").value("PRD"));
  }

  @Test
  void shouldReturnDynamicWebContentPage() throws Exception {
    mockMvc.perform(get("/api/v1/web-content/onboarding"))
        .andExpect(status().isOk())
        .andExpect(jsonPath("$.slug").value("onboarding"))
        .andExpect(jsonPath("$.pageType").value("AUTH"))
        .andExpect(jsonPath("$.sections.length()").value(3))
        .andExpect(jsonPath("$.sections[0].heading").value("Complete your profile"));
  }

  @Test
  void shouldSubmitSupportEnquiry() throws Exception {
    mockMvc.perform(org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post("/api/v1/support/enquiries")
            .contentType(org.springframework.http.MediaType.APPLICATION_JSON)
            .content("""
                {
                  "fullName": "Aarav Kumar",
                  "email": "aarav@example.com",
                  "phoneNumber": "+919876543210",
                  "city": "Bengaluru",
                  "message": "I need help with a visit confirmation."
                }
                """))
        .andExpect(status().isOk())
        .andExpect(jsonPath("$.status").value("SUBMITTED"))
        .andExpect(jsonPath("$.enquiryId").isNotEmpty());
  }

  @Test
  void shouldExposeOpenApiDocument() throws Exception {
    mockMvc.perform(get("/api-docs"))
        .andExpect(status().isOk())
        .andExpect(jsonPath("$.info.title").value("Housing Owner-Tenant API"))
        .andExpect(jsonPath("$.paths['/api/v1/site-overview']").exists())
        .andExpect(jsonPath("$.paths['/api/v1/product-pages']").exists())
        .andExpect(jsonPath("$.paths['/api/v1/web-content/{slug}']").exists())
        .andExpect(jsonPath("$.paths['/api/v1/support/enquiries']").exists());
  }
}
