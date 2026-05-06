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

@SpringBootTest(properties = {
    "app.payments.provider=MOCK",
    "app.premium.wallet-activation.enabled=true"
})
@AutoConfigureMockMvc
@DirtiesContext(classMode = DirtiesContext.ClassMode.BEFORE_EACH_TEST_METHOD)
class TenantPremiumControllerTest {

  @Autowired
  private MockMvc mockMvc;

  @Autowired
  private ObjectMapper objectMapper;

  @Autowired
  private JdbcTemplate jdbcTemplate;

  @Test
  void shouldReturnPremiumStatusForStandardTenant() throws Exception {
    String accessToken = login("divya.nair@example.com", "StrongPassword@123");

    mockMvc.perform(get("/api/v1/subscriptions/tenant-premium")
            .header("Authorization", "Bearer " + accessToken))
        .andExpect(status().isOk())
        .andExpect(jsonPath("$.planCode").value("TENANT_PREMIUM_ANNUAL"))
        .andExpect(jsonPath("$.priceAmount").value(1000))
        .andExpect(jsonPath("$.premiumActive").value(false))
        .andExpect(jsonPath("$.walletBalance").value(650))
        .andExpect(jsonPath("$.canActivate").value(false))
        .andExpect(jsonPath("$.shortfallAmount").value(350));
  }

  @Test
  void shouldActivatePremiumFromWalletBalance() throws Exception {
    jdbcTemplate.update("""
        UPDATE wallet_accounts
        SET balance = 1200
        WHERE user_id = 'user_7n6m5l4k'
        """);

    String accessToken = login("divya.nair@example.com", "StrongPassword@123");

    mockMvc.perform(post("/api/v1/subscriptions/tenant-premium/activate")
            .header("Authorization", "Bearer " + accessToken))
        .andExpect(status().isOk())
        .andExpect(jsonPath("$.premiumActive").value(true))
        .andExpect(jsonPath("$.subscriptionStatus").value("ACTIVE"))
        .andExpect(jsonPath("$.walletBalance").value(200));
  }

  @Test
  void shouldEnableTenantPremiumAfterWalletTopupFlow() throws Exception {
    String accessToken = login("divya.nair@example.com", "StrongPassword@123");

    String checkoutResponse = mockMvc.perform(post("/api/v1/wallet/topup/checkout")
            .header("Authorization", "Bearer " + accessToken)
            .contentType(MediaType.APPLICATION_JSON)
            .content("""
                {
                  "amount": 350,
                  "currency": "INR"
                }
                """))
        .andExpect(status().isOk())
        .andExpect(jsonPath("$.providerMode").value("MOCK"))
        .andReturn()
        .getResponse()
        .getContentAsString();

    String txnId = objectMapper.readTree(checkoutResponse).path("txnId").asText();

    mockMvc.perform(post("/api/v1/wallet/topup/verify")
            .header("Authorization", "Bearer " + accessToken)
            .contentType(MediaType.APPLICATION_JSON)
            .content("""
                {
                  "txnId": "%s",
                  "paymentIntentId": "mock_pi_%s"
                }
                """.formatted(txnId, txnId)))
        .andExpect(status().isOk())
        .andExpect(jsonPath("$.newBalance").value(1000));

    mockMvc.perform(get("/api/v1/subscriptions/tenant-premium")
            .header("Authorization", "Bearer " + accessToken))
        .andExpect(status().isOk())
        .andExpect(jsonPath("$.walletBalance").value(1000))
        .andExpect(jsonPath("$.shortfallAmount").value(0))
        .andExpect(jsonPath("$.canActivate").value(true));

    mockMvc.perform(post("/api/v1/subscriptions/tenant-premium/activate")
            .header("Authorization", "Bearer " + accessToken))
        .andExpect(status().isOk())
        .andExpect(jsonPath("$.premiumActive").value(true))
        .andExpect(jsonPath("$.planCode").value("TENANT_PREMIUM_ANNUAL"))
        .andExpect(jsonPath("$.subscriptionStatus").value("ACTIVE"))
        .andExpect(jsonPath("$.walletBalance").value(0));
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
