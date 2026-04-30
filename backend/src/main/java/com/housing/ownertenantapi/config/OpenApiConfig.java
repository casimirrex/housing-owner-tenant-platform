package com.housing.ownertenantapi.config;

import io.swagger.v3.oas.annotations.OpenAPIDefinition;
import io.swagger.v3.oas.annotations.info.Contact;
import io.swagger.v3.oas.annotations.info.Info;
import io.swagger.v3.oas.annotations.info.License;
import io.swagger.v3.oas.annotations.servers.Server;
import org.springframework.context.annotation.Configuration;

@Configuration
@OpenAPIDefinition(
    info = @Info(
        title = "Housing Owner-Tenant API",
        version = "v1",
        description = "Backend APIs that drive the owner-tenant website blueprint page.",
        contact = @Contact(
            name = "Housing Platform Team",
            email = "api@housing-platform.local"
        ),
        license = @License(
            name = "Internal Use"
        )
    ),
    servers = {
        @Server(url = "http://127.0.0.1:8080", description = "Local development server")
    }
)
public class OpenApiConfig {
}
