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

@SpringBootTest(properties = {
    "app.payments.provider=MOCK"
})
@AutoConfigureMockMvc
@DirtiesContext(classMode = DirtiesContext.ClassMode.BEFORE_EACH_TEST_METHOD)
class TenantPremiumControllerTest {

  @Autowired
  private MockMvc mockMvc;

  @Autowired
  private ObjectMapper objectMapper;

  @Test
  void shouldReturnPremiumStatusForStandardTenant() throws Exception {
    String accessToken = login("divya.nair@example.com", "StrongPassword@123");

    mockMvc.perform(get("/api/v1/subscriptions/tenant-premium")
            .header("Authorization", "Bearer " + accessToken))
        .andExpect(status().isOk())
        .andExpect(jsonPath("$.planCode").value("TENANT_PREMIUM_ANNUAL"))
        .andExpect(jsonPath("$.priceAmount").value(500))
        .andExpect(jsonPath("$.premiumActive").value(false))
        .andExpect(jsonPath("$.walletBalance").value(650))
        .andExpect(jsonPath("$.canActivate").value(true));
  }

  @Test
  void shouldActivatePremiumFromWalletBalance() throws Exception {
    String accessToken = login("divya.nair@example.com", "StrongPassword@123");

    mockMvc.perform(post("/api/v1/subscriptions/tenant-premium/activate")
            .header("Authorization", "Bearer " + accessToken))
        .andExpect(status().isOk())
        .andExpect(jsonPath("$.premiumActive").value(true))
        .andExpect(jsonPath("$.subscriptionStatus").value("ACTIVE"))
        .andExpect(jsonPath("$.walletBalance").value(150));
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
