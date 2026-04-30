package com.housing.ownertenantapi.config;

import java.util.Arrays;
import org.springframework.context.annotation.Configuration;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.web.servlet.config.annotation.CorsRegistry;
import org.springframework.web.servlet.config.annotation.WebMvcConfigurer;

@Configuration
public class WebConfig implements WebMvcConfigurer {

  private final String[] allowedOrigins;

  public WebConfig(
      @Value("${app.cors.allowed-origins:http://127.0.0.1:3000,http://localhost:3000,http://127.0.0.1:3001,http://localhost:3001}")
      String allowedOrigins) {
    this.allowedOrigins = Arrays.stream(allowedOrigins.split(","))
        .map(String::trim)
        .filter(value -> !value.isEmpty())
        .toArray(String[]::new);
  }

  @Override
  public void addCorsMappings(CorsRegistry registry) {
    registry.addMapping("/api/**")
        .allowedOrigins(allowedOrigins)
        .allowedMethods("GET", "POST", "PUT", "DELETE", "OPTIONS")
        .allowedHeaders("*");
    registry.addMapping("/auth/**")
        .allowedOrigins(allowedOrigins)
        .allowedMethods("GET", "POST", "PUT", "DELETE", "OPTIONS")
        .allowedHeaders("*");
  }
}
