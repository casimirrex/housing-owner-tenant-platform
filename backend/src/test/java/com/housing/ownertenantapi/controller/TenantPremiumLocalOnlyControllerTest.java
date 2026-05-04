package com.housing.ownertenantapi.controller;

import static org.hamcrest.Matchers.containsString;
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
    "app.premium.wallet-activation.enabled=false"
})
@AutoConfigureMockMvc
@DirtiesContext(classMode = DirtiesContext.ClassMode.BEFORE_EACH_TEST_METHOD)
class TenantPremiumLocalOnlyControllerTest {

  @Autowired
  private MockMvc mockMvc;

  @Autowired
  private ObjectMapper objectMapper;

  @Autowired
  private JdbcTemplate jdbcTemplate;

  @Test
  void shouldBlockWalletPremiumActivationWhenLocalFlagIsDisabled() throws Exception {
    jdbcTemplate.update("""
        UPDATE wallet_accounts
        SET balance = 1200
        WHERE user_id = 'user_7n6m5l4k'
        """);

    String accessToken = login("divya.nair@example.com", "StrongPassword@123");

    mockMvc.perform(get("/api/v1/subscriptions/tenant-premium")
            .header("Authorization", "Bearer " + accessToken))
        .andExpect(status().isOk())
        .andExpect(jsonPath("$.premiumActive").value(false))
        .andExpect(jsonPath("$.walletBalance").value(1200))
        .andExpect(jsonPath("$.shortfallAmount").value(0))
        .andExpect(jsonPath("$.canActivate").value(false))
        .andExpect(jsonPath("$.message").value(containsString("local development")));

    mockMvc.perform(post("/api/v1/subscriptions/tenant-premium/activate")
            .header("Authorization", "Bearer " + accessToken))
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
