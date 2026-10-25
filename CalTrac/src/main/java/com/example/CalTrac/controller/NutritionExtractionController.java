package com.example.CalTrac.controller;

import com.example.CalTrac.service.GeminiNutritionService;
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.util.Map;
import java.util.Set;

@RestController
@RequestMapping("/api/nutrition")
public class NutritionExtractionController {

    private static final long MAX_FILE_SIZE = 5 * 1024 * 1024;

    private static final Set<String> ALLOWED_TYPES = Set.of(
            "image/jpeg",
            "image/png",
            "image/webp"
    );

    private final GeminiNutritionService geminiNutritionService;
    private final ObjectMapper objectMapper;

    public NutritionExtractionController(GeminiNutritionService geminiNutritionService, ObjectMapper objectMapper) {
        this.geminiNutritionService = geminiNutritionService;
        this.objectMapper = objectMapper;
    }


    //Nutrition Extraction
    @PostMapping(value = "/extract", consumes = MediaType.MULTIPART_FORM_DATA_VALUE,
            produces = MediaType.APPLICATION_JSON_VALUE)

    public ResponseEntity<?> extractNutrition(@RequestParam("image") MultipartFile image) {
        if (image == null || image.isEmpty()) {
            return ResponseEntity.badRequest().body(Map.of("error", "Please upload an image."));
        }

        if (image.getSize() > MAX_FILE_SIZE) {
            return ResponseEntity.badRequest().body(Map.of("error", "Image size must not exceed 5 MB."));
        }

        String contentType = image.getContentType();

        if (contentType == null || !ALLOWED_TYPES.contains(contentType)) {
            return ResponseEntity.badRequest().body(
                    Map.of("error", "Only JPEG, PNG, and WebP images are supported."));
        }

        try {
            String result = geminiNutritionService.analyzeImage(image.getBytes(), contentType);

            JsonNode nutrition = objectMapper.readTree(result);

            if (nutrition == null || !nutrition.isObject()) {
                return ResponseEntity.status(HttpStatus.BAD_GATEWAY).body(
                        Map.of("error", "AI returned an invalid nutrition response."));
            }

            return ResponseEntity.ok(nutrition);

        } catch (IOException e) {
            return ResponseEntity.badRequest().body(Map.of("error", "Unable to read the uploaded image."));
        } catch (Exception e) {
            System.err.println("Gemini nutrition extraction failed:");
            e.printStackTrace();

            return ResponseEntity.status(HttpStatus.BAD_GATEWAY).body(
                    Map.of("error", "Nutrition analysis failed. Please try again."));
        }
    }
}
