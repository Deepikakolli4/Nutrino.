package com.example.CalTrac.model;

import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.index.Indexed;
import org.springframework.data.mongodb.core.mapping.Document;

import java.time.Instant;
import java.time.LocalDate;
import java.util.HashMap;
import java.util.Map;

@Document(collection = "food_entries")
public class FoodEntry {

    @Id
    private String id;

    @Indexed
    private String userId;

    private String foodName;

    // Examples: BREAKFAST, LUNCH, DINNER, SNACK
    private String mealType;

    private double quantity;

    // Examples: grams, ml, pieces, servings
    private String quantityUnit;

    private double calories;

    // Macronutrients, measured in grams
    private double protein;
    private double carbs;
    private double fat;

    // Additional nutrition values, measured in grams
    private double fiber;
    private double sugar;

    // Example: {"vitaminC": 12.5, "vitaminA": 0.3}
    private Map<String, Double> vitamins = new HashMap<>();

    // Example: {"calcium": 80.0, "iron": 2.1}
    private Map<String, Double> minerals = new HashMap<>();

    // Date on which the food was consumed
    @Indexed
    private LocalDate entryDate = LocalDate.now();

    // Optional reference to the uploaded food image
    private String imageUrl;

    private Instant createdAt = Instant.now();

    public FoodEntry() {
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

    public String getFoodName() {
        return foodName;
    }

    public void setFoodName(String foodName) {
        this.foodName = foodName;
    }

    public String getMealType() {
        return mealType;
    }

    public void setMealType(String mealType) {
        this.mealType = mealType;
    }

    public double getQuantity() {
        return quantity;
    }

    public void setQuantity(double quantity) {
        this.quantity = quantity;
    }

    public String getQuantityUnit() {
        return quantityUnit;
    }

    public void setQuantityUnit(String quantityUnit) {
        this.quantityUnit = quantityUnit;
    }

    public double getCalories() {
        return calories;
    }

    public void setCalories(double calories) {
        this.calories = calories;
    }

    public double getProtein() {
        return protein;
    }

    public void setProtein(double protein) {
        this.protein = protein;
    }

    public double getCarbs() {
        return carbs;
    }

    public void setCarbs(double carbs) {
        this.carbs = carbs;
    }

    public double getFat() {
        return fat;
    }

    public void setFat(double fat) {
        this.fat = fat;
    }

    public double getFiber() {
        return fiber;
    }

    public void setFiber(double fiber) {
        this.fiber = fiber;
    }

    public double getSugar() {
        return sugar;
    }

    public void setSugar(double sugar) {
        this.sugar = sugar;
    }

    public Map<String, Double> getVitamins() {
        return vitamins;
    }

    public void setVitamins(Map<String, Double> vitamins) {
        this.vitamins = vitamins;
    }

    public Map<String, Double> getMinerals() {
        return minerals;
    }

    public void setMinerals(Map<String, Double> minerals) {
        this.minerals = minerals;
    }

    public LocalDate getEntryDate() {
        return entryDate;
    }

    public void setEntryDate(LocalDate entryDate) {
        this.entryDate = entryDate;
    }

    public String getImageUrl() {
        return imageUrl;
    }

    public void setImageUrl(String imageUrl) {
        this.imageUrl = imageUrl;
    }

    public Instant getCreatedAt() {
        return createdAt;
    }

    public void setCreatedAt(Instant createdAt) {
        this.createdAt = createdAt;
    }
}
