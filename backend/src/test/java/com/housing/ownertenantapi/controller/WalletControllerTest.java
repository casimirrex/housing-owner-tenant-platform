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
class WalletControllerTest {

  @Autowired
  private MockMvc mockMvc;

  @Autowired
  private ObjectMapper objectMapper;

  @Test
  void shouldCreateWalletOnFirstDashboardLoad() throws Exception {
    String accessToken = login("aarav@example.com", "StrongPassword@123");

    mockMvc.perform(get("/api/v1/wallet")
            .header("Authorization", "Bearer " + accessToken))
        .andExpect(status().isOk())
        .andExpect(jsonPath("$.userId").value("user_1a2b3c4d"))
        .andExpect(jsonPath("$.ownerName").value("Aarav Kumar"))
        .andExpect(jsonPath("$.currency").value("INR"))
        .andExpect(jsonPath("$.walletId").value(org.hamcrest.Matchers.startsWith("wallet_")));
  }

  @Test
  void shouldCreateMockTopupCheckout() throws Exception {
    String accessToken = login("aarav@example.com", "StrongPassword@123");

    mockMvc.perform(post("/api/v1/wallet/topup/checkout")
            .header("Authorization", "Bearer " + accessToken)
            .contentType(MediaType.APPLICATION_JSON)
            .content("""
                {
                  "amount": 500,
                  "currency": "INR"
                }
                """))
        .andExpect(status().isOk())
        .andExpect(jsonPath("$.providerMode").value("MOCK"))
        .andExpect(jsonPath("$.amount").value(500))
        .andExpect(jsonPath("$.currency").value("INR"))
        .andExpect(jsonPath("$.txnId").value(org.hamcrest.Matchers.startsWith("wtxn_")));
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
