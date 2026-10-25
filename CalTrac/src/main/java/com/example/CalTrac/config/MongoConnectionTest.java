package com.example.CalTrac.config;

import org.springframework.boot.CommandLineRunner;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.data.mongodb.core.MongoTemplate;

@Configuration
public class MongoConnectionTest {

    @Bean
    CommandLineRunner testMongoConnection(MongoTemplate mongoTemplate) {
        return args -> {
            mongoTemplate.getDb().runCommand(
                    new org.bson.Document("ping", 1)
            );
            System.out.println("MongoDB Atlas connected successfully!");
        };
    }
}
