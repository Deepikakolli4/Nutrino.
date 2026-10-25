package com.example.CalTrac.controller;

import com.example.CalTrac.service.NutritionReportService;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDate;
import java.util.Map;

@RestController
@RequestMapping("/api/nutrition-reports")
public class NutritionReportController {

    private final NutritionReportService nutritionReportService;

    public NutritionReportController(
            NutritionReportService nutritionReportService) {
        this.nutritionReportService = nutritionReportService;
    }


    //Daily Report
    @GetMapping("/daily")
    public ResponseEntity<Map<String, Object>> getDailySummary(
            @RequestParam
            @DateTimeFormat(iso = DateTimeFormat.ISO.DATE)
            LocalDate date,
            Authentication authentication) {

        Map<String, Object> summary =
                nutritionReportService.getDailySummary(authentication.getName(), date);

        return ResponseEntity.ok(summary);
    }

    //Weekly Report
    @GetMapping("/weekly")
    public ResponseEntity<?> getWeeklySummary(@RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE)
                                              LocalDate startDate, Authentication authentication) {

        Map<String, Object> summary = nutritionReportService.getWeeklySummary(authentication.getName(), startDate);
        return ResponseEntity.ok(summary);
    }
}
