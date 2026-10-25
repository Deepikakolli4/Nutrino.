
package com.example.CalTrac.repository;

import com.example.CalTrac.model.FoodEntry;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.mongodb.repository.MongoRepository;
import org.springframework.data.mongodb.repository.Query;

import java.time.LocalDate;
import java.util.List;

public interface FoodEntryRepository extends MongoRepository<FoodEntry, String> {

    List<FoodEntry> findByUserId(String userId);

    List<FoodEntry> findByUserIdAndEntryDate(String userId, LocalDate entryDate);

    List<FoodEntry> findByUserIdAndMealType(String userId, String mealType);

    List<FoodEntry> findByUserIdAndEntryDateBetween(String userId, LocalDate startDate, LocalDate endDate);

    @Query("{ 'userId': ?0, 'entryDate': { $gte: ?1, $lt: ?2 } }")
    Page<FoodEntry> findByUserIdAndEntryDateBetween(String userId, LocalDate startDate, LocalDate endDateExclusive, Pageable pageable);

    List<FoodEntry> findByUserIdAndMealTypeAndEntryDateBetween(
            String userId, String mealType, LocalDate startDate, LocalDate endDate);

    Page<FoodEntry> findByUserId(String userId, Pageable pageable);

    Page<FoodEntry> findByUserIdAndEntryDate(String userId, LocalDate entryDate, Pageable pageable);

    Page<FoodEntry> findByUserIdAndMealType(String userId, String mealType, Pageable pageable);

    Page<FoodEntry> findByUserIdAndMealTypeAndEntryDateBetween(
            String userId, String mealType, LocalDate startDate,
            LocalDate endDate, Pageable pageable);
}
