
package com.example.CalTrac.model;

import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.index.Indexed;
import org.springframework.data.mongodb.core.mapping.Document;

import java.time.Instant;

@Document(collection = "health_goals")
public class HealthGoal {

    @Id
    private String id;

    @Indexed
    private String userId;

    // Daily nutrition targets
    private double dailyCalorieTarget;
    private double proteinTarget;
    private double carbsTarget;
    private double fatTarget;

    // Weight values measured in kilograms
    private double currentWeightKg;
    private double targetWeightKg;

    private Instant createdAt = Instant.now();

    private Instant updatedAt = Instant.now();

    public HealthGoal() {
    }

    public String getId() {
        return id;
    }

    public void setId(String id) {
        this.id = id;
    }

    public String getUserId() {
        return userId;
    }

    public void setUserId(String userId) {
        this.userId = userId;
    }

    public double getDailyCalorieTarget() {
        return dailyCalorieTarget;
    }

    public void setDailyCalorieTarget(double dailyCalorieTarget) {
        this.dailyCalorieTarget = dailyCalorieTarget;
    }

    public double getProteinTarget() {
        return proteinTarget;
    }

    public void setProteinTarget(double proteinTarget) {
        this.proteinTarget = proteinTarget;
    }

    public double getCarbsTarget() {
        return carbsTarget;
    }

    public void setCarbsTarget(double carbsTarget) {
        this.carbsTarget = carbsTarget;
    }

    public double getFatTarget() {
        return fatTarget;
    }

    public void setFatTarget(double fatTarget) {
        this.fatTarget = fatTarget;
    }

    public double getCurrentWeightKg() {
        return currentWeightKg;
    }

    public void setCurrentWeightKg(double currentWeightKg) {
        this.currentWeightKg = currentWeightKg;
    }

    public double getTargetWeightKg() {
        return targetWeightKg;
    }

    public void setTargetWeightKg(double targetWeightKg) {
        this.targetWeightKg = targetWeightKg;
    }

    public Instant getCreatedAt() {
        return createdAt;
    }

    public void setCreatedAt(Instant createdAt) {
        this.createdAt = createdAt;
    }

    public Instant getUpdatedAt() {
        return updatedAt;
    }

    public void setUpdatedAt(Instant updatedAt) {
        this.updatedAt = updatedAt;
    }
}
