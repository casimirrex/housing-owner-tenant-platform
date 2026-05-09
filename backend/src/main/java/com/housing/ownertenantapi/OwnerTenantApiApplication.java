package com.housing.ownertenantapi;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.scheduling.annotation.EnableScheduling;

@SpringBootApplication
@EnableScheduling
public class OwnerTenantApiApplication {

  public static void main(String[] args) {
    SpringApplication.run(OwnerTenantApiApplication.class, args);
  }
}
