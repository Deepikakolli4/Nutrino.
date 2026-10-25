package com.example.CalTrac.controller;

import com.example.CalTrac.model.HealthGoal;
import com.example.CalTrac.service.HealthGoalService;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@RestController
@RequestMapping("/api/health-goals")
public class HealthGoalController {

    private final HealthGoalService healthGoalService;

    public HealthGoalController(HealthGoalService healthGoalService) {
        this.healthGoalService = healthGoalService;
    }

    @PostMapping
    public ResponseEntity<?> createGoal(@RequestBody HealthGoal goal, Authentication authentication) {
        try {
            HealthGoal savedGoal = healthGoalService.createGoal(authentication.getName(), goal);

            return ResponseEntity.status(HttpStatus.CREATED).body(savedGoal);
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }

    @GetMapping
    public ResponseEntity<?> getGoal(Authentication authentication) {
        try {
            HealthGoal goal = healthGoalService.getGoalByUserId(authentication.getName());
            return ResponseEntity.ok(goal);

        } catch (IllegalArgumentException e) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND)
                    .body(Map.of("error", e.getMessage()));
        }
    }

    @PutMapping
    public ResponseEntity<?> updateGoal(@RequestBody HealthGoal goal, Authentication authentication) {
        try {
            HealthGoal updatedGoal = healthGoalService.updateGoal(
                    authentication.getName(), goal);

            return ResponseEntity.ok(updatedGoal);
        } catch (IllegalArgumentException e) {
            if ("Health goal not found".equals(e.getMessage())) {
                return ResponseEntity.status(HttpStatus.NOT_FOUND).body(Map.of("error", e.getMessage()));
            }

            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }

    @DeleteMapping
    public ResponseEntity<?> deleteGoal(Authentication authentication) {
        try {
            healthGoalService.deleteGoal(authentication.getName());

            return ResponseEntity.ok(
                    java.util.Map.of(
                            "message", "Health goal deleted successfully"
                    )
            );
        } catch (IllegalArgumentException e) {
            return ResponseEntity.status(404)
                    .body(java.util.Map.of("error", e.getMessage()));
        }
    }
}
