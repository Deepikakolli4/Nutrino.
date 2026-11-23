package com.example.CalTrac.controller;

import com.example.CalTrac.model.FoodEntry;
import com.example.CalTrac.service.FoodEntryService;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDate;
import java.util.Map;

@RestController
@RequestMapping("/api/food-entries")
public class FoodEntryController {

    private final FoodEntryService foodEntryService;

    public FoodEntryController(FoodEntryService foodEntryService) {
        this.foodEntryService = foodEntryService;
    }

    // Create Food Entry
    @PostMapping
    public ResponseEntity<?> createFoodEntry(
            @RequestBody FoodEntry foodEntry,
            Authentication authentication) {

        FoodEntry savedEntry = foodEntryService.createFoodEntry(
                authentication.getName(),
                foodEntry
        );

        return ResponseEntity.status(HttpStatus.CREATED).body(savedEntry);
    }

    // Retrieve Food Entries
    @GetMapping
    public ResponseEntity<?> getFoodEntries(
            Authentication authentication,
            @RequestParam(required = false) String date,
            @RequestParam(required = false) String mealType,
            @RequestParam(required = false) String startDate,
            @RequestParam(required = false) String endDate,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size) {

        if (page < 0 || size < 1 || size > 100) {
            return ResponseEntity.badRequest()
                    .body(Map.of("error", "Invalid page or size"));
        }

        try {
            String userId = authentication.getName();

            Pageable pageable = PageRequest.of(
                    page,
                    size,
                    Sort.by(Sort.Direction.DESC, "entryDate")
            );

            Page<FoodEntry> entries;

            // Normalize meal type
            String normalizedMealType = (mealType != null && !mealType.isBlank())
                    ? mealType.trim().toUpperCase()
                    : null;

            // Filter by specific date
            if (date != null && !date.isBlank()) {

                entries = foodEntryService.getFoodEntriesByDate(
                        userId,
                        LocalDate.parse(date),
                        pageable
                );

            }
            // Filter by date range
            else if (startDate != null && endDate != null) {

                LocalDate start = LocalDate.parse(startDate);
                LocalDate end = LocalDate.parse(endDate);

                if (normalizedMealType != null) {

                    entries = foodEntryService.getFoodEntriesByMealAndDateRange(
                            userId,
                            normalizedMealType,
                            start,
                            end,
                            pageable
                    );

                } else {

                    entries = foodEntryService.getFoodEntriesByDateRange(
                            userId,
                            start,
                            end,
                            pageable
                    );
                }

            }
            // Filter by meal type
            else if (normalizedMealType != null) {

                entries = foodEntryService.getFoodEntriesByMealType(
                        userId,
                        normalizedMealType,
                        pageable
                );

            }
            // Retrieve all food entries
            else {

                entries = foodEntryService.getFoodEntries(
                        userId,
                        pageable
                );
            }

            return ResponseEntity.ok(entries);

        } catch (IllegalArgumentException e) {

            return ResponseEntity.badRequest()
                    .body(Map.of("error", e.getMessage()));
        }
    }

    // Update Food Entry
    @PutMapping("/{id}")
    public ResponseEntity<?> updateFoodEntry(
            @PathVariable String id,
            @RequestBody FoodEntry foodEntry,
            Authentication authentication) {

        try {
            FoodEntry updatedEntry = foodEntryService.updateFoodEntry(
                    id,
                    authentication.getName(),
                    foodEntry
            );

            return ResponseEntity.ok(updatedEntry);

        } catch (IllegalArgumentException e) {

            return ResponseEntity.status(HttpStatus.NOT_FOUND)
                    .body(Map.of("error", e.getMessage()));
        }
    }

    // Delete Food Entry
    @DeleteMapping("/{id}")
    public ResponseEntity<?> deleteFoodEntry(
            @PathVariable String id,
            Authentication authentication) {

        try {
            foodEntryService.deleteFoodEntry(
                    id,
                    authentication.getName()
            );

            return ResponseEntity.noContent().build();

        } catch (IllegalArgumentException e) {

            return ResponseEntity.status(HttpStatus.NOT_FOUND)
                    .body(Map.of("error", e.getMessage()));
        }
    }
}
