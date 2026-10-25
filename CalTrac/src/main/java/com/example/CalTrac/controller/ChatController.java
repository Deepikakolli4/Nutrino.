package com.example.CalTrac.controller;

import com.example.CalTrac.model.FoodEntry;
import com.example.CalTrac.model.HealthGoal;
import com.example.CalTrac.repository.FoodEntryRepository;
import com.example.CalTrac.repository.HealthGoalRepository;
import com.example.CalTrac.service.ChatContextService;
import com.example.CalTrac.service.GeminiChatService;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.time.DayOfWeek;
import java.time.LocalDate;
import java.util.*;

@RestController
@RequestMapping("/api/chat")
public class ChatController {

    private final GeminiChatService geminiChatService;
    private final ChatContextService chatContextService;
    private final FoodEntryRepository foodEntryRepository;
    private final HealthGoalRepository healthGoalRepository;
    private final ObjectMapper objectMapper;

    public ChatController(
            GeminiChatService geminiChatService,
            ChatContextService chatContextService,
            FoodEntryRepository foodEntryRepository,
            HealthGoalRepository healthGoalRepository,
            ObjectMapper objectMapper) {
        this.geminiChatService = geminiChatService;
        this.chatContextService = chatContextService;
        this.foodEntryRepository = foodEntryRepository;
        this.healthGoalRepository = healthGoalRepository;
        this.objectMapper = objectMapper;
    }

    //Chat
    @PostMapping
    public ResponseEntity<?> chat(@RequestBody Map<String, String> request, Authentication authentication) {

        if (authentication == null || !authentication.isAuthenticated()) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                    .body(Map.of("error", "Please log in to use Nourish AI."));
        }

        String message = request.get("message");

        if (message == null || message.isBlank() || message.length() > 4000) {
            return ResponseEntity.badRequest()
                    .body(Map.of("error", "Message must contain 1 to 4000 characters."));
        }

        String userId = authentication.getName();
        String normalized = message.toLowerCase(Locale.ROOT);

        try {
            if (asksForWeeklySummary(normalized)) {
                return weeklySummary(userId);
            }

            if (asksForGoalProgress(normalized)) {
                return goalProgress(userId);
            }

            if (asksForGoals(normalized)) {
                return getGoals(userId);
            }

            if (asksForTodayIntake(normalized)) {
                return todayIntake(userId);
            }

            String context = chatContextService.buildContext(userId);
            String raw = geminiChatService.generateResponse(message, context);

            Map<String, Object> aiResponse = objectMapper.readValue(raw, Map.class);

            String intent = String.valueOf(aiResponse.getOrDefault("intent", "QUESTION"));

            if ("LOG_MEAL".equalsIgnoreCase(intent)) {

                Object dateValue = aiResponse.get("entryDate");

                if (dateValue == null || String.valueOf(dateValue).isBlank()) {
                    aiResponse.put("entryDate", LocalDate.now().toString());
                } else {
                    LocalDate.parse(String.valueOf(dateValue));
                }

                String foodName = stringValue(aiResponse.get("foodName"));
                String mealType = normalizeMealType(stringValue(aiResponse.get("mealType")));

                if (foodName == null || foodName.isBlank()
                        || mealType == null
                        || numberValue(aiResponse.get("quantity")) == null
                        || numberValue(aiResponse.get("calories")) == null
                        || numberValue(aiResponse.get("protein")) == null
                        || numberValue(aiResponse.get("carbs")) == null
                        || numberValue(aiResponse.get("fat")) == null) {

                    return ResponseEntity.ok(Map.of(
                            "reply", "Please provide the food name, quantity, meal type, and enough details to estimate nutrition.",
                            "intent", "LOG_MEAL",
                            "requiresConfirmation", false,
                            "needsMoreInformation", true
                    ));
                }

                aiResponse.put("mealType", mealType);

                Map<String, Object> preview = new LinkedHashMap<>();
                preview.put("reply", aiResponse.getOrDefault("reply", "Review the meal details before saving."));
                preview.put("intent", "LOG_MEAL");
                preview.put("action", "CREATE_FOOD_ENTRY");
                preview.put("requiresConfirmation", true);
                preview.put("preview", aiResponse);

                return ResponseEntity.ok(preview);
            }

            return ResponseEntity.ok(aiResponse);

        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.BAD_GATEWAY)
                    .body(Map.of("error",
                            "Nourish AI could not process your message."));
        }
    }


    //Saving Meal from Chat
    @PostMapping("/confirm-meal")
    public ResponseEntity<?> confirmMeal(@RequestBody Map<String, Object> request, Authentication authentication) {

        if (authentication == null || !authentication.isAuthenticated()) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                    .body(Map.of("error", "Please log in first."));
        }

        try {
            String foodName = stringValue(request.get("foodName"));
            String mealType = normalizeMealType(stringValue(request.get("mealType")));

            if (foodName == null || foodName.isBlank() || mealType == null) {
                return ResponseEntity.badRequest()
                        .body(Map.of("error", "Valid food name and meal type are required."));
            }

            Double quantity = numberValue(request.get("quantity"));
            Double calories = numberValue(request.get("calories"));
            Double protein = numberValue(request.get("protein"));
            Double carbs = numberValue(request.get("carbs"));
            Double fat = numberValue(request.get("fat"));
            Double fiber = numberValue(request.get("fiber"));
            Double sugar = numberValue(request.get("sugar"));

            if (quantity == null || quantity <= 0
                    || calories == null || protein == null
                    || carbs == null || fat == null
                    || !finiteNonNegative(calories)
                    || !finiteNonNegative(protein)
                    || !finiteNonNegative(carbs)
                    || !finiteNonNegative(fat)
                    || (fiber != null && !finiteNonNegative(fiber))
                    || (sugar != null && !finiteNonNegative(sugar))) {
                return ResponseEntity.badRequest()
                        .body(Map.of("error",
                                "Quantity must be positive and nutrition values must be valid non-negative numbers."));
            }

            String unit = stringValue(request.get("quantityUnit"));
            String dateText = stringValue(request.get("entryDate"));

            if (dateText == null || dateText.isBlank()) {
                return ResponseEntity.badRequest()
                        .body(Map.of("error", "Meal date is required."));
            }

            LocalDate entryDate = LocalDate.parse(dateText);

            FoodEntry entry = new FoodEntry();
            entry.setId(null);
            entry.setUserId(authentication.getName());
            entry.setFoodName(foodName.trim());
            entry.setMealType(mealType);
            entry.setQuantity(quantity);
            entry.setQuantityUnit(
                    unit == null || unit.isBlank() ? "serving" : unit);
            entry.setCalories(calories);
            entry.setProtein(protein);
            entry.setCarbs(carbs);
            entry.setFat(fat);
            entry.setFiber(fiber == null ? 0 : fiber);
            entry.setSugar(sugar == null ? 0 : sugar);
            entry.setEntryDate(entryDate);

            FoodEntry saved = foodEntryRepository.save(entry);

            return ResponseEntity.status(HttpStatus.CREATED).body(Map.of(
                    "reply", "Your meal was saved successfully.",
                    "saved", true,
                    "entry", saved
            ));

        } catch (Exception e) {
            return ResponseEntity.badRequest()
                    .body(Map.of("error", "Invalid meal details or date. Please check your request."));
        }
    }

    private ResponseEntity<?> getGoals(String userId) {
        Optional<HealthGoal> optional = healthGoalRepository.findByUserId(userId);

        if (optional.isEmpty()) {
            return ResponseEntity.ok(Map.of(
                    "reply", "You haven't set your health goals yet.",
                    "source", "database",
                    "hasGoals", false
            ));
        }

        HealthGoal goal = optional.get();
        Map<String, Object> result = new LinkedHashMap<>();
        result.put("reply", "Here are your current nutrition goals.");
        result.put("source", "database");
        result.put("hasGoals", true);
        result.put("dailyCalorieTarget", goal.getDailyCalorieTarget());
        result.put("proteinTarget", goal.getProteinTarget());
        result.put("carbsTarget", goal.getCarbsTarget());
        result.put("fatTarget", goal.getFatTarget());
        result.put("currentWeightKg", goal.getCurrentWeightKg());
        result.put("targetWeightKg", goal.getTargetWeightKg());

        return ResponseEntity.ok(result);
    }

    private ResponseEntity<?> todayIntake(String userId) {
        LocalDate today = LocalDate.now();
        List<FoodEntry> entries =
                foodEntryRepository.findByUserIdAndEntryDate(userId, today);

        double calories = 0;
        double protein = 0;
        double carbs = 0;
        double fat = 0;

        for (FoodEntry entry : entries) {
            calories += entry.getCalories();
            protein += entry.getProtein();
            carbs += entry.getCarbs();
            fat += entry.getFat();
        }

        Map<String, Object> result = new LinkedHashMap<>();
        result.put("reply", "Here is your nutrition intake for today.");
        result.put("source", "database");
        result.put("date", today.toString());
        result.put("entryCount", entries.size());
        result.put("caloriesConsumed", calories);
        result.put("proteinConsumed", protein);
        result.put("carbsConsumed", carbs);
        result.put("fatConsumed", fat);

        Optional<HealthGoal> optionalGoal =
                healthGoalRepository.findByUserId(userId);

        if (optionalGoal.isPresent()) {
            HealthGoal goal = optionalGoal.get();

            result.put("dailyCalorieTarget", goal.getDailyCalorieTarget());
            result.put("caloriesRemaining", goal.getDailyCalorieTarget() - calories);
            result.put("proteinTarget", goal.getProteinTarget());
            result.put("carbsTarget", goal.getCarbsTarget());
            result.put("fatTarget", goal.getFatTarget());
        }

        return ResponseEntity.ok(result);
    }

    private ResponseEntity<?> weeklySummary(String userId) {
        LocalDate today = LocalDate.now();
        LocalDate start = today.with(DayOfWeek.MONDAY);

        List<FoodEntry> entries =
                foodEntryRepository.findByUserIdAndEntryDateBetween(userId, start, today);

        double calories = 0;
        double protein = 0;
        double carbs = 0;
        double fat = 0;

        for (FoodEntry entry : entries) {
            calories += entry.getCalories();
            protein += entry.getProtein();
            carbs += entry.getCarbs();
            fat += entry.getFat();
        }

        Map<String, Object> result = new LinkedHashMap<>();
        result.put("reply", "Here is your nutrition summary for this week so far.");
        result.put("source", "database");
        result.put("startDate", start.toString());
        result.put("endDate", today.toString());
        result.put("entryCount", entries.size());
        result.put("totalCalories", calories);
        result.put("totalProtein", protein);
        result.put("totalCarbs", carbs);
        result.put("totalFat", fat);

        return ResponseEntity.ok(result);
    }

    private ResponseEntity<?> goalProgress(String userId) {
        LocalDate today = LocalDate.now();
        List<FoodEntry> entries = foodEntryRepository.findByUserIdAndEntryDate(userId, today);
        Optional<HealthGoal> optional = healthGoalRepository.findByUserId(userId);

        if (optional.isEmpty()) {
            return ResponseEntity.ok(Map.of(
                    "reply", "Set your health goals first to see your progress.",
                    "hasGoals", false
            ));
        }

        double calories = 0;
        double protein = 0;
        double carbs = 0;
        double fat = 0;

        for (FoodEntry entry : entries) {
            calories += entry.getCalories();
            protein += entry.getProtein();
            carbs += entry.getCarbs();
            fat += entry.getFat();
        }

        HealthGoal goal = optional.get();
        Map<String, Object> result = new LinkedHashMap<>();
        result.put("reply", "Here is your progress against today's goals.");
        result.put("date", today.toString());
        result.put("caloriesConsumed", calories);
        result.put("calorieTarget", goal.getDailyCalorieTarget());
        result.put("caloriesRemaining", goal.getDailyCalorieTarget() - calories);
        result.put("proteinConsumed", protein);
        result.put("proteinTarget", goal.getProteinTarget());
        result.put("carbsConsumed", carbs);
        result.put("carbsTarget", goal.getCarbsTarget());
        result.put("fatConsumed", fat);
        result.put("fatTarget", goal.getFatTarget());

        return ResponseEntity.ok(result);
    }

    private boolean asksForWeeklySummary(String message) {
        return message.contains("weekly")
                || message.contains("this week")
                || message.contains("week summary")
                || message.contains("last 7 days");
    }

    private boolean asksForGoalProgress(String message) {
        return message.contains("progress")
                || message.contains("remaining")
                || message.contains("how close")
                || message.contains("goal vs")
                || message.contains("goal comparison");
    }

    private boolean asksForGoals(String message) {
        return message.contains("my goals")
                || message.contains("daily target")
                || message.contains("calorie target")
                || message.contains("protein target")
                || message.equals("goals")
                || message.equals("what are my goals");
    }

    private boolean asksForTodayIntake(String message) {
        boolean mentionsToday = message.contains("today")
                || message.contains("so far")
                || message.contains("have i eaten")
                || message.contains("consumed");

        boolean mentionsNutrition = message.contains("calorie")
                || message.contains("calories")
                || message.contains("protein")
                || message.contains("carbs")
                || message.contains("carbohydrate")
                || message.contains("fat")
                || message.contains("intake")
                || message.contains("nutrition");

        return mentionsToday && mentionsNutrition;
    }

    private String normalizeMealType(String mealType) {
        if (mealType == null) {
            return null;
        }

        return switch (mealType.trim().toLowerCase(Locale.ROOT)) {
            case "breakfast" -> "Breakfast";
            case "lunch" -> "Lunch";
            case "dinner" -> "Dinner";
            case "snack", "snacks" -> "Snacks";
            default -> null;
        };
    }

    private String stringValue(Object value) {
        return value == null ? null : String.valueOf(value);
    }

    private Double numberValue(Object value) {
        if (!(value instanceof Number number)) {
            return null;
        }

        double result = number.doubleValue();
        return Double.isFinite(result) ? result : null;
    }

    private boolean finiteNonNegative(double value) {
        return Double.isFinite(value) && value >= 0;
    }
}
