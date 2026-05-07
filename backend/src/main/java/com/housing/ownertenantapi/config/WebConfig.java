package com.housing.ownertenantapi.config;

import java.util.Arrays;
import org.springframework.context.annotation.Configuration;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.web.servlet.config.annotation.CorsRegistry;
import org.springframework.web.servlet.config.annotation.ResourceHandlerRegistry;
import org.springframework.web.servlet.config.annotation.WebMvcConfigurer;

@Configuration
public class WebConfig implements WebMvcConfigurer {

  private final String[] allowedOrigins;
  private final String uploadsDir;
  private final String uploadsPublicBasePath;

  public WebConfig(
      @Value("${app.cors.allowed-origins:http://127.0.0.1:3000,http://localhost:3000,http://127.0.0.1:3001,http://localhost:3001}")
      String allowedOrigins,
      @Value("${app.uploads.dir:/app/uploads}")
      String uploadsDir,
      @Value("${app.uploads.public-base-path:/uploads}")
      String uploadsPublicBasePath
  ) {
    this.allowedOrigins = Arrays.stream(allowedOrigins.split(","))
        .map(String::trim)
        .filter(value -> !value.isEmpty())
        .toArray(String[]::new);
    this.uploadsDir = uploadsDir;
    this.uploadsPublicBasePath = uploadsPublicBasePath.endsWith("/")
        ? uploadsPublicBasePath
        : uploadsPublicBasePath + "/";
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
    // Bug G.3 — uploaded images need CORS too so the frontend at testition.tech
    // can fetch them from api.testition.tech. (Image <img src> doesn't need CORS,
    // but explicit fetch / canvas usage will.)
    registry.addMapping("/uploads/**")
        .allowedOrigins(allowedOrigins)
        .allowedMethods("GET", "OPTIONS")
        .allowedHeaders("*");
  }

  @Override
  public void addResourceHandlers(ResourceHandlerRegistry registry) {
    // Bug G.3 — serve uploaded listing photos as static files.
    // The directory is a Docker volume so files persist across container rebuilds.
    String absolutePath = uploadsDir.startsWith("/") ? uploadsDir : "/" + uploadsDir;
    registry.addResourceHandler(uploadsPublicBasePath + "**")
        .addResourceLocations("file:" + absolutePath + "/")
        .setCachePeriod(3600);
  }
}
