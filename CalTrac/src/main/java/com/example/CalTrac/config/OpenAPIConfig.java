
package com.example.CalTrac.config;

import io.swagger.v3.oas.annotations.OpenAPIDefinition;
import io.swagger.v3.oas.annotations.enums.SecuritySchemeType;
import io.swagger.v3.oas.annotations.info.Info;
import io.swagger.v3.oas.annotations.security.SecurityScheme;
import io.swagger.v3.oas.annotations.media.Schema;
import io.swagger.v3.oas.models.Components;
import io.swagger.v3.oas.models.OpenAPI;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

@Configuration
@OpenAPIDefinition(
        info = @Info(
                title = "CalTrac API",
                version = "1.0",
                description = "REST API for calorie tracking, health goals, nutrition reports, AI nutrition extraction, PDF imports, and conversational chat."
        )
)
@SecurityScheme(
        name = "bearerAuth",
        type = SecuritySchemeType.HTTP,
        scheme = "bearer",
        bearerFormat = "JWT"
)
public class OpenAPIConfig {

    @Bean
    public OpenAPI customOpenAPI() {
        io.swagger.v3.oas.models.media.Schema<?> userSchema =
                new io.swagger.v3.oas.models.media.Schema<>()
                        .type("object")
                        .addProperty("id", new io.swagger.v3.oas.models.media.Schema<>().type("string"))
                        .addProperty("name", new io.swagger.v3.oas.models.media.Schema<>().type("string"))
                        .addProperty("email", new io.swagger.v3.oas.models.media.Schema<>().type("string"))
                        .addProperty("createdAt", new io.swagger.v3.oas.models.media.Schema<>()
                                .type("string")
                                .format("date-time"));

        Components components = new Components();
        components.addSchemas("User", userSchema);

        return new OpenAPI().components(components);
    }
}
