
package com.example.CalTrac.service;

import com.example.CalTrac.model.HealthGoal;
import com.example.CalTrac.repository.HealthGoalRepository;
import org.springframework.stereotype.Service;

import java.time.Instant;

@Service
public class HealthGoalService {

    private final HealthGoalRepository healthGoalRepository;

    public HealthGoalService(HealthGoalRepository healthGoalRepository) {
        this.healthGoalRepository = healthGoalRepository;
    }

    public HealthGoal createGoal(String userId, HealthGoal goal) {
        validateGoal(goal);
        validateUserId(userId);

        if (healthGoalRepository.findByUserId(userId).isPresent()) {
            throw new IllegalArgumentException(
                    "A health goal already exists for this user");
        }

        goal.setId(null);
        goal.setUserId(userId);
        goal.setCreatedAt(Instant.now());
        goal.setUpdatedAt(Instant.now());

        return healthGoalRepository.save(goal);
    }

    public HealthGoal getGoalByUserId(String userId) {
        validateUserId(userId);

        return healthGoalRepository.findByUserId(userId)
                .orElseThrow(() -> new IllegalArgumentException(
                        "Health goal not found"));
    }

    public HealthGoal updateGoal(String userId, HealthGoal updatedGoal) {
        validateUserId(userId);
        validateGoal(updatedGoal);

        HealthGoal existingGoal = getGoalByUserId(userId);

        existingGoal.setDailyCalorieTarget(updatedGoal.getDailyCalorieTarget());
        existingGoal.setProteinTarget(updatedGoal.getProteinTarget());
        existingGoal.setCarbsTarget(updatedGoal.getCarbsTarget());
        existingGoal.setFatTarget(updatedGoal.getFatTarget());
        existingGoal.setCurrentWeightKg(updatedGoal.getCurrentWeightKg());
        existingGoal.setTargetWeightKg(updatedGoal.getTargetWeightKg());
        existingGoal.setUpdatedAt(Instant.now());

        return healthGoalRepository.save(existingGoal);
    }

    private void validateUserId(String userId) {
        if (userId == null || userId.isBlank()) {
            throw new IllegalArgumentException("User ID is required");
        }
    }

    private void validateGoal(HealthGoal goal) {
        if (goal == null) {
            throw new IllegalArgumentException("Goal is required");
        }

        if (!Double.isFinite(goal.getDailyCalorieTarget())
                || goal.getDailyCalorieTarget() <= 0) {
            throw new IllegalArgumentException("Daily calorie target must be greater than zero");
        }

        if (!Double.isFinite(goal.getProteinTarget())
                || !Double.isFinite(goal.getCarbsTarget())
                || !Double.isFinite(goal.getFatTarget())
                || goal.getProteinTarget() < 0
                || goal.getCarbsTarget() < 0
                || goal.getFatTarget() < 0) {
            throw new IllegalArgumentException("Macronutrient targets must be valid and cannot be negative");
        }

        if (!Double.isFinite(goal.getCurrentWeightKg())
                || !Double.isFinite(goal.getTargetWeightKg())
                || goal.getCurrentWeightKg() <= 0
                || goal.getTargetWeightKg() <= 0) {
            throw new IllegalArgumentException("Current and target weights must be greater than zero");
        }
    }
    public void deleteGoal(String userId) {
        HealthGoal goal = healthGoalRepository.findByUserId(userId)
                .orElseThrow(() -> new IllegalArgumentException("Health goal not found"));

        healthGoalRepository.delete(goal);
    }
}
