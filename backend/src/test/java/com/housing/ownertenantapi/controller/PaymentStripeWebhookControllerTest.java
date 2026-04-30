package com.housing.ownertenantapi.controller;

import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import com.fasterxml.jackson.databind.ObjectMapper;
import java.nio.charset.StandardCharsets;
import java.security.GeneralSecurityException;
import java.time.Instant;
import java.util.HexFormat;
import javax.crypto.Mac;
import javax.crypto.spec.SecretKeySpec;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.http.MediaType;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.test.annotation.DirtiesContext;
import org.springframework.test.web.servlet.MockMvc;

@SpringBootTest(properties = {
    "app.payments.provider=STRIPE",
    "app.payments.stripe.secret-key=sk_test_dummy",
    "app.payments.stripe.publishable-key=pk_test_dummy",
    "app.payments.stripe.webhook-secret=whsec_test"
})
@AutoConfigureMockMvc
@DirtiesContext(classMode = DirtiesContext.ClassMode.BEFORE_EACH_TEST_METHOD)
class PaymentStripeWebhookControllerTest {

  @Autowired
  private MockMvc mockMvc;

  @Autowired
  private ObjectMapper objectMapper;

  @Autowired
  private JdbcTemplate jdbcTemplate;

  @Test
  void shouldReturnStripeGatewaySummaryWhenConfigured() throws Exception {
    String accessToken = login("aarav@example.com", "StrongPassword@123");

    mockMvc.perform(get("/api/v1/payments/dashboard")
            .header("Authorization", "Bearer " + accessToken))
        .andExpect(status().isOk())
        .andExpect(jsonPath("$.gateway.providerMode").value("STRIPE"))
        .andExpect(jsonPath("$.gateway.publicKeyAvailable").value(true))
        .andExpect(jsonPath("$.gateway.guidance").value(org.hamcrest.Matchers.containsString("webhook")));
  }

  @Test
  void shouldReconcileStripeSuccessWebhookIntoPaymentRecord() throws Exception {
    String payload = "{\"id\":\"evt_test_1\",\"type\":\"payment_intent.succeeded\",\"data\":{\"object\":{\"id\":\"pi_test_payment_3001\",\"created\":"
        + Instant.now().getEpochSecond()
        + ",\"latest_charge\":\"ch_test_payment_3001\",\"status\":\"succeeded\",\"metadata\":{\"payment_id\":\"payment_3001\"}}}}";

    mockMvc.perform(post("/api/v1/payments/webhooks/stripe")
            .header("Stripe-Signature", signStripePayload(payload, "whsec_test"))
            .contentType(MediaType.APPLICATION_JSON)
            .content(payload))
        .andExpect(status().isOk())
        .andExpect(jsonPath("$.received").value(true))
        .andExpect(jsonPath("$.eventType").value("payment_intent.succeeded"));

    String status = jdbcTemplate.queryForObject(
        "SELECT status FROM payment_records WHERE payment_id = 'payment_3001'",
        String.class
    );
    String provider = jdbcTemplate.queryForObject(
        "SELECT provider FROM payment_records WHERE payment_id = 'payment_3001'",
        String.class
    );
    String providerOrderId = jdbcTemplate.queryForObject(
        "SELECT provider_order_id FROM payment_records WHERE payment_id = 'payment_3001'",
        String.class
    );

    org.junit.jupiter.api.Assertions.assertEquals("CAPTURED", status);
    org.junit.jupiter.api.Assertions.assertEquals("STRIPE", provider);
    org.junit.jupiter.api.Assertions.assertEquals("pi_test_payment_3001", providerOrderId);
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

  private String signStripePayload(String payload, String secret) throws GeneralSecurityException {
    long timestamp = Instant.now().getEpochSecond();
    String signedPayload = timestamp + "." + payload;

    Mac mac = Mac.getInstance("HmacSHA256");
    mac.init(new SecretKeySpec(secret.getBytes(StandardCharsets.UTF_8), "HmacSHA256"));
    byte[] digest = mac.doFinal(signedPayload.getBytes(StandardCharsets.UTF_8));
    String signature = HexFormat.of().formatHex(digest);

    return "t=" + timestamp + ",v1=" + signature;
  }
}
