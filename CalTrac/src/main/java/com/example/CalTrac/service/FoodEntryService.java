package com.example.CalTrac.service;

import com.example.CalTrac.model.FoodEntry;
import com.example.CalTrac.repository.FoodEntryRepository;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;

import java.time.LocalDate;
import java.util.List;

@Service
public class FoodEntryService {

    private final FoodEntryRepository foodEntryRepository;

    public FoodEntryService(FoodEntryRepository foodEntryRepository) {
        this.foodEntryRepository = foodEntryRepository;
    }

    public FoodEntry createFoodEntry(String userId, FoodEntry foodEntry) {
        foodEntry.setId(null);
        foodEntry.setUserId(userId);
        return foodEntryRepository.save(foodEntry);
    }

    public List<FoodEntry> getFoodEntries(String userId) {
        return foodEntryRepository.findByUserId(userId);
    }

    public Page<FoodEntry> getFoodEntries(String userId, Pageable pageable) {
        return foodEntryRepository.findByUserId(userId, pageable);
    }

    public List<FoodEntry> getFoodEntriesByDate(String userId, LocalDate date) {
        return foodEntryRepository.findByUserIdAndEntryDate(userId, date);
    }

    public Page<FoodEntry> getFoodEntriesByDate(String userId, LocalDate date, Pageable pageable) {
        return foodEntryRepository.findByUserIdAndEntryDate(userId, date, pageable);
    }

    public List<FoodEntry> getFoodEntriesByMealType(String userId, String mealType) {
        return foodEntryRepository.findByUserIdAndMealType(userId, mealType);
    }

    public Page<FoodEntry> getFoodEntriesByMealType(String userId, String mealType, Pageable pageable) {
        return foodEntryRepository.findByUserIdAndMealType(userId, mealType, pageable);
    }

    public List<FoodEntry> getFoodEntriesByDateRange(String userId, LocalDate startDate, LocalDate endDate) {
        validateDateRange(startDate, endDate);
        return foodEntryRepository.findByUserIdAndEntryDateBetween(userId, startDate, endDate);
    }

    public Page<FoodEntry> getFoodEntriesByDateRange(
            String userId,
            LocalDate startDate,
            LocalDate endDate,
            Pageable pageable) {

        validateDateRange(startDate, endDate);

        return foodEntryRepository.findByUserIdAndEntryDateBetween(
                userId,
                startDate,
                endDate.plusDays(1),
                pageable
        );
    }
    public List<FoodEntry> getFoodEntriesByMealAndDateRange(
            String userId, String mealType, LocalDate startDate, LocalDate endDate) {
        validateDateRange(startDate, endDate);
        return foodEntryRepository
                .findByUserIdAndMealTypeAndEntryDateBetween(userId, mealType, startDate, endDate);
    }

    public Page<FoodEntry> getFoodEntriesByMealAndDateRange(
            String userId, String mealType, LocalDate startDate, LocalDate endDate, Pageable pageable) {
        validateDateRange(startDate, endDate);
        return foodEntryRepository
                .findByUserIdAndMealTypeAndEntryDateBetween(userId, mealType, startDate, endDate, pageable);
    }

    public FoodEntry updateFoodEntry(String id, String userId, FoodEntry updatedEntry) {
        FoodEntry existingEntry = foodEntryRepository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("Food entry not found"));

        checkOwnership(existingEntry, userId);

        updatedEntry.setId(id);
        updatedEntry.setUserId(userId);
        updatedEntry.setCreatedAt(existingEntry.getCreatedAt());

        return foodEntryRepository.save(updatedEntry);
    }

    public void deleteFoodEntry(String id, String userId) {
        FoodEntry existingEntry = foodEntryRepository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("Food entry not found"));

        checkOwnership(existingEntry, userId);
        foodEntryRepository.delete(existingEntry);
    }

    private void checkOwnership(FoodEntry entry, String userId) {
        if (!userId.equals(entry.getUserId())) {
            throw new IllegalArgumentException("You cannot access another user's food entry");
        }
    }

    private void validateDateRange(LocalDate startDate, LocalDate endDate) {
        if (startDate == null || endDate == null) {
            throw new IllegalArgumentException("Start date and end date are required");
        }

        if (startDate.isAfter(endDate)) {
            throw new IllegalArgumentException("Start date cannot be after end date");
        }
    }
}
