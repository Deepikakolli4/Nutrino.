
package com.example.CalTrac.config;

import io.swagger.v3.oas.models.media.Schema;
import org.springdoc.core.customizers.OpenApiCustomizer;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

@Configuration
public class UserSchemaConfig {

    @Bean
    public OpenApiCustomizer userSchemaCustomizer() {
        return openApi -> {
            if (openApi.getComponents() == null) {
                openApi.setComponents(new io.swagger.v3.oas.models.Components());
            }

            Schema<?> userSchema = new Schema<>()
                    .type("object")
                    .description("Public user information")
                    .addProperty("id", new Schema<>().type("string"))
                    .addProperty("name", new Schema<>().type("string"))
                    .addProperty("email", new Schema<>().type("string"))
                    .addProperty("createdAt", new Schema<>().type("string").format("date-time"));
            openApi.getComponents().addSchemas("User", userSchema);
        };
    }
}
