
package com.example.CalTrac.repository;

import com.example.CalTrac.model.HealthGoal;
import org.springframework.data.mongodb.repository.MongoRepository;

import java.util.Optional;

public interface HealthGoalRepository extends MongoRepository<HealthGoal, String> {

    Optional<HealthGoal> findByUserId(String userId);
}
