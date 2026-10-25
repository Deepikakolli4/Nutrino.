
package com.example.CalTrac.controller;

import com.example.CalTrac.model.FoodEntry;
import com.example.CalTrac.repository.FoodEntryRepository;
import com.example.CalTrac.service.PdfFoodImportService;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.util.ArrayList;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/food-import/pdf")
public class PdfFoodImportController {

    private static final long MAX_FILE_SIZE = 10 * 1024 * 1024;

    private static final List<String> MEAL_TYPES =
            List.of("BREAKFAST", "LUNCH", "DINNER", "SNACKS");

    private final PdfFoodImportService pdfFoodImportService;
    private final FoodEntryRepository foodEntryRepository;

    public PdfFoodImportController(
            PdfFoodImportService pdfFoodImportService,
            FoodEntryRepository foodEntryRepository) {
        this.pdfFoodImportService = pdfFoodImportService;
        this.foodEntryRepository = foodEntryRepository;
    }

    //PDF Preview
    @PostMapping(value = "/preview", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    public ResponseEntity<?> previewPdf(@RequestParam("file") MultipartFile file) {

        if (file == null || file.isEmpty()) {
            return ResponseEntity.badRequest()
                    .body(Map.of("error", "Please upload a PDF file."));
        }

        if (file.getSize() > MAX_FILE_SIZE) {
            return ResponseEntity.badRequest()
                    .body(Map.of("error", "PDF size must not exceed 10 MB."));
        }

        try {
            byte[] bytes = file.getBytes();

            if (!isPdf(bytes)) {
                return ResponseEntity.badRequest()
                        .body(Map.of("error", "The uploaded file is not a valid PDF."));
            }

            List<FoodEntry> entries = pdfFoodImportService.parsePdf(bytes);

            return ResponseEntity.ok(Map.of(
                    "totalEntries", entries.size(),
                    "entries", entries,
                    "message", "Review the parsed entries before importing."
            ));

        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest()
                    .body(Map.of("error", e.getMessage()));
        } catch (IOException e) {
            return ResponseEntity.badRequest()
                    .body(Map.of("error", "Unable to read the PDF file."));
        }
    }

    //Import PDF
    @PostMapping("/import")
    public ResponseEntity<?> importEntries(@RequestBody List<FoodEntry> entries, Authentication authentication) {

        if (authentication == null
                || !authentication.isAuthenticated()
                || authentication.getName() == null
                || authentication.getName().isBlank()) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                    .body(Map.of("error", "Please log in before importing entries."));
        }

        if (entries == null || entries.isEmpty()) {
            return ResponseEntity.badRequest()
                    .body(Map.of("error", "No food entries provided."));
        }

        if (entries.size() > 500) {
            return ResponseEntity.badRequest()
                    .body(Map.of("error",
                            "A maximum of 500 entries can be imported at once."));
        }

        String userId = authentication.getName();
        List<FoodEntry> entriesToSave = new ArrayList<>();

        for (int i = 0; i < entries.size(); i++) {
            FoodEntry entry = entries.get(i);

            if (entry == null
                    || entry.getFoodName() == null
                    || entry.getFoodName().isBlank()) {
                return ResponseEntity.badRequest().body(Map.of(
                        "error", "Food name is required for every entry.",
                        "row", i + 1
                ));
            }

            if (entry.getMealType() == null
                    || !MEAL_TYPES.contains(
                    entry.getMealType().trim().toUpperCase())) {
                return ResponseEntity.badRequest().body(Map.of(
                        "error",
                        "Meal type must be Breakfast, Lunch, Dinner, or Snacks.",
                        "row", i + 1
                ));
            }

            if (!validNumber(entry.getQuantity())
                    || entry.getQuantity() <= 0
                    || !validNumber(entry.getCalories())
                    || !validNumber(entry.getProtein())
                    || !validNumber(entry.getCarbs())
                    || !validNumber(entry.getFat())
                    || !validNumber(entry.getFiber())
                    || !validNumber(entry.getSugar())) {
                return ResponseEntity.badRequest().body(Map.of(
                        "error",
                        "Quantity must be positive and nutrition values must be finite and non-negative.",
                        "row", i + 1
                ));
            }

            if (entry.getEntryDate() == null) {
                return ResponseEntity.badRequest().body(Map.of(
                        "error", "Entry date is required.",
                        "row", i + 1
                ));
            }

            entry.setId(null);
            entry.setUserId(userId);
            entry.setMealType(normalizeMealType(entry.getMealType()));

            entriesToSave.add(entry);
        }

        List<FoodEntry> savedEntries = foodEntryRepository.saveAll(entriesToSave);

        return ResponseEntity.status(HttpStatus.CREATED).body(Map.of(
                "message", "Food entries imported successfully.",
                "importedCount", savedEntries.size(),
                "entries", savedEntries
        ));
    }

    private boolean isPdf(byte[] bytes) {
        return bytes.length >= 5
                && bytes[0] == '%'
                && bytes[1] == 'P'
                && bytes[2] == 'D'
                && bytes[3] == 'F'
                && bytes[4] == '-';
    }

    private boolean validNumber(double value) {
        return Double.isFinite(value) && value >= 0;
    }

    private String normalizeMealType(String mealType) {
        return switch (mealType.trim().toUpperCase()) {
            case "BREAKFAST" -> "Breakfast";
            case "LUNCH" -> "Lunch";
            case "DINNER" -> "Dinner";
            case "SNACKS" -> "Snacks";
            default -> mealType;
        };
    }
}
