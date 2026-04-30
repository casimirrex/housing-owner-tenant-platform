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
class PaymentControllerTest {

  @Autowired
  private MockMvc mockMvc;

  @Autowired
  private ObjectMapper objectMapper;

  @Test
  void shouldReturnTenantPaymentsDashboard() throws Exception {
    String accessToken = login("aarav@example.com", "StrongPassword@123");

    mockMvc.perform(get("/api/v1/payments/dashboard")
            .header("Authorization", "Bearer " + accessToken))
        .andExpect(status().isOk())
        .andExpect(jsonPath("$.role").value("TENANT"))
        .andExpect(jsonPath("$.tenantOverview.pendingCount").value(2))
        .andExpect(jsonPath("$.gateway.providerMode").value("MOCK"))
        .andExpect(jsonPath("$.history.length()").isNotEmpty());
  }

  @Test
  void shouldCreateAndVerifyTenantPaymentInSandboxMode() throws Exception {
    String accessToken = login("aarav@example.com", "StrongPassword@123");

    String checkoutResponse = mockMvc.perform(post("/api/v1/payments/checkout")
            .header("Authorization", "Bearer " + accessToken)
            .contentType(MediaType.APPLICATION_JSON)
            .content("""
                {
                  "paymentId": "payment_3001"
                }
                """))
        .andExpect(status().isOk())
        .andExpect(jsonPath("$.providerMode").value("MOCK"))
        .andExpect(jsonPath("$.status").value("PENDING"))
        .andReturn()
        .getResponse()
        .getContentAsString();

    String orderId = objectMapper.readTree(checkoutResponse).path("orderId").asText();

    mockMvc.perform(post("/api/v1/payments/verify")
            .header("Authorization", "Bearer " + accessToken)
            .contentType(MediaType.APPLICATION_JSON)
            .content("""
                {
                  "paymentId": "payment_3001",
                  "providerOrderId": "%s",
                  "providerPaymentId": "mock_pay_payment_3001",
                  "providerSignature": "mock_signature"
                }
                """.formatted(orderId)))
        .andExpect(status().isOk())
        .andExpect(jsonPath("$.verified").value(true))
        .andExpect(jsonPath("$.status").value("CAPTURED"));
  }

  @Test
  void shouldReturnOwnerCollectionsDashboard() throws Exception {
    String accessToken = login("rohit.mehta@example.com", "StrongPassword@123");

    mockMvc.perform(get("/api/v1/payments/dashboard")
            .header("Authorization", "Bearer " + accessToken))
        .andExpect(status().isOk())
        .andExpect(jsonPath("$.role").value("OWNER"))
        .andExpect(jsonPath("$.ownerOverview.listingsCovered").value(1))
        .andExpect(jsonPath("$.ownerOverview.pendingAmount").value(32000));
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
