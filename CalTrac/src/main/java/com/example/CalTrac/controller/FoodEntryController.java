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

    //Food Entry Creation
    @PostMapping
    public ResponseEntity<?> createFoodEntry(@RequestBody FoodEntry foodEntry, Authentication authentication) {

        FoodEntry savedEntry = foodEntryService.createFoodEntry(authentication.getName(), foodEntry);

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
            return ResponseEntity.badRequest().body(Map.of("error", "Invalid page or size"));
        }

        try {
            String userId = authentication.getName();
            Pageable pageable = PageRequest.of(page, size, Sort.by(Sort.Direction.DESC, "entryDate"));

            Page<FoodEntry> entries;

            if (date != null) {
                entries = foodEntryService.getFoodEntriesByDate(userId, LocalDate.parse(date), pageable);
            } else if (startDate != null && endDate != null) {
                LocalDate start = LocalDate.parse(startDate);
                LocalDate end = LocalDate.parse(endDate);

                if (mealType != null) {
                    entries = foodEntryService.getFoodEntriesByMealAndDateRange(userId, mealType, start, end, pageable);
                } else {
                    entries = foodEntryService.getFoodEntriesByDateRange(userId, start, end, pageable);
                }
            } else if (mealType != null) {
                entries = foodEntryService.getFoodEntriesByMealType(userId, mealType, pageable);
            } else {
                entries = foodEntryService.getFoodEntries(userId, pageable);
            }

            return ResponseEntity.ok(entries);
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }


    //Update Food Entry
    @PutMapping("/{id}")
    public ResponseEntity<?> updateFoodEntry(
            @PathVariable String id,
            @RequestBody FoodEntry foodEntry,
            Authentication authentication) {

        try {
            FoodEntry updatedEntry = foodEntryService.updateFoodEntry(id, authentication.getName(), foodEntry);
            return ResponseEntity.ok(updatedEntry);
        } catch (IllegalArgumentException e) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND).body(Map.of("error", e.getMessage()));
        }
    }


    //Delete Food Entry
    @DeleteMapping("/{id}")
    public ResponseEntity<?> deleteFoodEntry(@PathVariable String id, Authentication authentication) {
        try {
            foodEntryService.deleteFoodEntry(id, authentication.getName());
            return ResponseEntity.noContent().build();
        } catch (IllegalArgumentException e) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND)
                    .body(Map.of("error", e.getMessage()));
        }
    }
}
