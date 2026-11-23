package com.example.CalTrac.service;

import com.example.CalTrac.model.FoodEntry;
import com.example.CalTrac.repository.FoodEntryRepository;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import java.util.ArrayList;
import java.time.LocalDate;
import java.util.List;

@Service
public class FoodEntryService {

    private final FoodEntryRepository foodEntryRepository;

    public FoodEntryService(FoodEntryRepository foodEntryRepository) {
        this.foodEntryRepository = foodEntryRepository;
    }

    // Normalize meal type
    private String normalizeMealType(String mealType) {
        if (mealType == null) {
            return null;
        }

        return mealType.trim().toUpperCase();
    }

    // Create Food Entry
    public FoodEntry createFoodEntry(String userId, FoodEntry foodEntry) {
        foodEntry.setId(null);
        foodEntry.setUserId(userId);
        foodEntry.setMealType(normalizeMealType(foodEntry.getMealType()));

        return foodEntryRepository.save(foodEntry);
    }

    // Get All Food Entries
    public List<FoodEntry> getFoodEntries(String userId) {
        return foodEntryRepository.findByUserId(userId);
    }

    // Get All Food Entries with Pagination
    public Page<FoodEntry> getFoodEntries(String userId, Pageable pageable) {
        return foodEntryRepository.findByUserId(userId, pageable);
    }

    // Get Food Entries by Date
    public List<FoodEntry> getFoodEntriesByDate(
            String userId,
            LocalDate date) {

        return foodEntryRepository.findByUserIdAndEntryDate(
                userId,
                date
        );
    }

    // Get Food Entries by Date with Pagination
    public Page<FoodEntry> getFoodEntriesByDate(
            String userId,
            LocalDate date,
            Pageable pageable) {

        return foodEntryRepository.findByUserIdAndEntryDate(
                userId,
                date,
                pageable
        );
    }

    // Get Food Entries by Meal Type
    public List<FoodEntry> getFoodEntriesByMealType(
            String userId,
            String mealType) {

        return foodEntryRepository.findByUserIdAndMealType(
                userId,
                normalizeMealType(mealType)
        );
    }

    // Get Food Entries by Meal Type with Pagination
    public Page<FoodEntry> getFoodEntriesByMealType(
            String userId,
            String mealType,
            Pageable pageable) {

        return foodEntryRepository.findByUserIdAndMealType(
                userId,
                normalizeMealType(mealType),
                pageable
        );
    }

    // Get Food Entries by Date Range
    public List<FoodEntry> getFoodEntriesByDateRange(
            String userId,
            LocalDate startDate,
            LocalDate endDate) {

        validateDateRange(startDate, endDate);

        return foodEntryRepository.findByUserIdAndEntryDateRange(
                userId,
                startDate,
                endDate.plusDays(1)
        );
    }

    // Get Food Entries by Date Range with Pagination
    public Page<FoodEntry> getFoodEntriesByDateRange(
            String userId,
            LocalDate startDate,
            LocalDate endDate,
            Pageable pageable) {

        validateDateRange(startDate, endDate);

        return foodEntryRepository.findByUserIdAndEntryDateRange(
                userId,
                startDate,
                endDate.plusDays(1),
                pageable
        );
    }

    // Get Food Entries by Meal Type and Date Range
    public List<FoodEntry> getFoodEntriesByMealAndDateRange(
            String userId,
            String mealType,
            LocalDate startDate,
            LocalDate endDate) {

        validateDateRange(startDate, endDate);

        return foodEntryRepository
                .findByUserIdAndMealTypeAndEntryDateBetween(
                        userId,
                        normalizeMealType(mealType),
                        startDate,
                        endDate
                );
    }

    // Get Food Entries by Meal Type and Date Range with Pagination
    public Page<FoodEntry> getFoodEntriesByMealAndDateRange(
            String userId,
            String mealType,
            LocalDate startDate,
            LocalDate endDate,
            Pageable pageable) {

        validateDateRange(startDate, endDate);

        return foodEntryRepository
                .findByUserIdAndMealTypeAndEntryDateRange(
                        userId,
                        normalizeMealType(mealType),
                        startDate,
                        endDate.plusDays(1),
                        pageable
                );
    }

    // Update Food Entry
    public FoodEntry updateFoodEntry(
            String id,
            String userId,
            FoodEntry updatedEntry) {

        FoodEntry existingEntry = foodEntryRepository.findById(id)
                .orElseThrow(() ->
                        new IllegalArgumentException(
                                "Food entry not found"
                        )
                );

        checkOwnership(existingEntry, userId);

        updatedEntry.setId(id);
        updatedEntry.setUserId(userId);
        updatedEntry.setCreatedAt(existingEntry.getCreatedAt());
        updatedEntry.setMealType(
                normalizeMealType(updatedEntry.getMealType())
        );

        return foodEntryRepository.save(updatedEntry);
    }

    // Delete Food Entry
    public void deleteFoodEntry(String id, String userId) {

        FoodEntry existingEntry = foodEntryRepository.findById(id)
                .orElseThrow(() ->
                        new IllegalArgumentException(
                                "Food entry not found"
                        )
                );

        checkOwnership(existingEntry, userId);

        foodEntryRepository.delete(existingEntry);
    }

    // Check User Ownership
    private void checkOwnership(FoodEntry entry, String userId) {

        if (!userId.equals(entry.getUserId())) {
            throw new IllegalArgumentException(
                    "You cannot access another user's food entry"
            );
        }
    }

    // Validate Date Range
    private void validateDateRange(
            LocalDate startDate,
            LocalDate endDate) {

        if (startDate == null || endDate == null) {
            throw new IllegalArgumentException(
                    "Start date and end date are required"
            );
        }

        if (startDate.isAfter(endDate)) {
            throw new IllegalArgumentException(
                    "Start date cannot be after end date"
            );
        }
    }


    // Add this method beside createFoodEntry() in FoodEntryService.java:
    // Create multiple Food Entries in one operation (used by Nourish AI chat)
    public List<FoodEntry> createFoodEntries(String userId, List<FoodEntry> foodEntries) {
        if (foodEntries == null || foodEntries.isEmpty()) {
            throw new IllegalArgumentException("At least one food entry is required");
        }

        List<FoodEntry> entriesToSave = new ArrayList<>(foodEntries);
        for (FoodEntry foodEntry : entriesToSave) {
            foodEntry.setId(null);
            foodEntry.setUserId(userId);
            foodEntry.setMealType(normalizeMealType(foodEntry.getMealType()));
        }

        return foodEntryRepository.saveAll(entriesToSave);
    }

}
