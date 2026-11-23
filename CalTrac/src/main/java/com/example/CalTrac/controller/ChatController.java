
package com.example.CalTrac.controller;

import com.example.CalTrac.model.ChatMessage;
import com.example.CalTrac.model.FoodEntry;
import com.example.CalTrac.model.HealthGoal;
import com.example.CalTrac.repository.ChatMessageRepository;
import com.example.CalTrac.repository.FoodEntryRepository;
import com.example.CalTrac.repository.HealthGoalRepository;
import com.example.CalTrac.service.ChatContextService;
import com.example.CalTrac.service.GeminiChatService;
import com.fasterxml.jackson.core.type.TypeReference;
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

    private static final TypeReference<Map<String, Object>> JSON_OBJECT = new TypeReference<>() {};

    private final GeminiChatService geminiChatService;
    private final ChatContextService chatContextService;
    private final FoodEntryRepository foodEntryRepository;
    private final HealthGoalRepository healthGoalRepository;
    private final ObjectMapper objectMapper;
    private final ChatMessageRepository chatMessageRepository;

    public ChatController(
            GeminiChatService geminiChatService,
            ChatContextService chatContextService,
            FoodEntryRepository foodEntryRepository,
            HealthGoalRepository healthGoalRepository,
            ObjectMapper objectMapper, ChatMessageRepository chatMessageRepository) {
        this.geminiChatService = geminiChatService;
        this.chatContextService = chatContextService;
        this.foodEntryRepository = foodEntryRepository;
        this.healthGoalRepository = healthGoalRepository;
        this.objectMapper = objectMapper;
        this.chatMessageRepository = chatMessageRepository;
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
                return saveChatResponse(
                        userId,
                        message,
                        weeklySummary(userId)
                );
            }

            if (asksForGoalProgress(normalized)) {
                return saveChatResponse(
                        userId,
                        message,
                        goalProgress(userId)
                );
            }

            if (asksForGoals(normalized)) {
                return saveChatResponse(
                        userId,
                        message,
                        getGoals(userId)
                );
            }

            if (asksForTodayIntake(normalized)) {
                return saveChatResponse(
                        userId,
                        message,
                        todayIntake(userId)
                );
            }

            String context = chatContextService.buildContext(userId);

            String raw = geminiChatService.generateResponse(message, context);

            Map<String, Object> aiResponse =
                    objectMapper.readValue(raw, JSON_OBJECT);

            String intent = String.valueOf(
                    aiResponse.getOrDefault("intent", "QUESTION")
            );

            if ("LOG_MEAL".equalsIgnoreCase(intent)) {
                Object mealsValue = aiResponse.get("meals");
                if (!(mealsValue instanceof List<?> meals) || meals.isEmpty()) {
                    return saveChatResponse(userId, message, ResponseEntity.ok(Map.of(
                            "reply", "Please provide the food name, quantity, meal type, and enough details to estimate nutrition.",
                            "intent", "LOG_MEAL", "action", "CREATE_FOOD_ENTRIES",
                            "requiresConfirmation", false, "needsMoreInformation", true)));
                }

                List<Map<String, Object>> validatedMeals = new ArrayList<>();
                for (Object mealObject : meals) {
                    if (!(mealObject instanceof Map<?, ?> rawMeal)) {
                        return saveChatResponse(userId, message, ResponseEntity.ok(Map.of(
                                "reply", "I couldn't understand all the meal details. Please try again.",
                                "intent", "LOG_MEAL", "action", "CREATE_FOOD_ENTRIES",
                                "requiresConfirmation", false, "needsMoreInformation", true)));
                    }
                    Map<String, Object> meal = new LinkedHashMap<>();
                    rawMeal.forEach((key, value) -> meal.put(String.valueOf(key), value));
                    String foodName = stringValue(meal.get("foodName"));
                    String mealType = normalizeMealType(stringValue(meal.get("mealType")));
                    String dateText = stringValue(meal.get("entryDate"));
                    Double quantity = numberValue(meal.get("quantity"));
                    Double calories = numberValue(meal.get("calories"));
                    Double protein = numberValue(meal.get("protein"));
                    Double carbs = numberValue(meal.get("carbs"));
                    Double fat = numberValue(meal.get("fat"));

                    if (foodName == null || foodName.isBlank() || mealType == null
                            || quantity == null || quantity <= 0
                            || calories == null || protein == null || carbs == null || fat == null
                            || !finiteNonNegative(calories) || !finiteNonNegative(protein)
                            || !finiteNonNegative(carbs) || !finiteNonNegative(fat)
                            || (meal.get("fiber") != null && (numberValue(meal.get("fiber")) == null || !finiteNonNegative(numberValue(meal.get("fiber")))))
                            || (meal.get("sugar") != null && (numberValue(meal.get("sugar")) == null || !finiteNonNegative(numberValue(meal.get("sugar")))))) {
                        return saveChatResponse(userId, message, ResponseEntity.ok(Map.of(
                                "reply", "Some meal details are missing or invalid. Please review the food, quantity, meal type, and nutrition estimates.",
                                "intent", "LOG_MEAL", "action", "CREATE_FOOD_ENTRIES",
                                "requiresConfirmation", false, "needsMoreInformation", true)));
                    }
                    if (dateText == null || dateText.isBlank()) dateText = LocalDate.now().toString();
                    LocalDate.parse(dateText);
                    meal.put("foodName", foodName.trim());
                    meal.put("mealType", mealType);
                    meal.put("entryDate", dateText);
                    validatedMeals.add(meal);
                }

                Map<String, Object> preview = new LinkedHashMap<>();
                preview.put("reply", aiResponse.getOrDefault("reply", "Review the meal details before saving."));
                preview.put("intent", "LOG_MEAL");
                preview.put("action", "CREATE_FOOD_ENTRIES");
                preview.put("requiresConfirmation", true);
                preview.put("preview", Map.of("meals", validatedMeals));
                preview.put("meals", validatedMeals);
                return saveChatResponse(userId, message, ResponseEntity.ok(preview));
            }

            // For the normal Gemini response:
            return saveChatResponse(
                    userId,
                    message,
                    ResponseEntity.ok(aiResponse)
            );

        } catch (Exception e) {

            return ResponseEntity.status(HttpStatus.BAD_GATEWAY)
                    .body(Map.of(
                            "error",
                            "Nourish AI could not process your message."
                    ));
        }
    }


    //Saving Meal from Chat
    @PostMapping("/confirm-meal")
    public ResponseEntity<?> confirmMeal(@RequestBody Map<String, Object> request, Authentication authentication) {
        if (authentication == null || !authentication.isAuthenticated()) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body(Map.of("error", "Please log in first."));
        }
        try {
            Object mealsValue = request.get("meals");
            List<?> meals;
            if (mealsValue instanceof List<?> list) {
                meals = list;
            } else {
                // Backward compatibility with the previous single-food request payload.
                meals = List.of(request);
            }
            if (meals.isEmpty()) return ResponseEntity.badRequest().body(Map.of("error", "At least one meal is required."));

            List<FoodEntry> entries = new ArrayList<>();
            for (Object mealObject : meals) {
                if (!(mealObject instanceof Map<?, ?> rawMeal)) {
                    return ResponseEntity.badRequest().body(Map.of("error", "Invalid meal item."));
                }
                Map<String, Object> meal = new LinkedHashMap<>();
                rawMeal.forEach((key, value) -> meal.put(String.valueOf(key), value));
                String foodName = stringValue(meal.get("foodName"));
                String mealType = normalizeMealType(stringValue(meal.get("mealType")));
                Double quantity = numberValue(meal.get("quantity"));
                Double calories = numberValue(meal.get("calories"));
                Double protein = numberValue(meal.get("protein"));
                Double carbs = numberValue(meal.get("carbs"));
                Double fat = numberValue(meal.get("fat"));
                Double fiber = numberValue(meal.get("fiber"));
                Double sugar = numberValue(meal.get("sugar"));
                String dateText = stringValue(meal.get("entryDate"));

                if (foodName == null || foodName.isBlank() || mealType == null
                        || quantity == null || quantity <= 0 || calories == null || protein == null || carbs == null || fat == null
                        || !finiteNonNegative(calories) || !finiteNonNegative(protein) || !finiteNonNegative(carbs) || !finiteNonNegative(fat)
                        || (fiber != null && !finiteNonNegative(fiber)) || (sugar != null && !finiteNonNegative(sugar))) {
                    return ResponseEntity.badRequest().body(Map.of("error", "Meal details or nutrition values are invalid."));
                }
                if (dateText == null || dateText.isBlank()) dateText = LocalDate.now().toString();
                LocalDate entryDate = LocalDate.parse(dateText);

                FoodEntry entry = new FoodEntry();
                entry.setId(null);
                entry.setUserId(authentication.getName());
                entry.setFoodName(foodName.trim());
                entry.setMealType(mealType);
                entry.setQuantity(quantity);
                String unit = stringValue(meal.get("quantityUnit"));
                entry.setQuantityUnit(unit == null || unit.isBlank() ? "serving" : unit);
                entry.setCalories(calories);
                entry.setProtein(protein);
                entry.setCarbs(carbs);
                entry.setFat(fat);
                entry.setFiber(fiber == null ? 0 : fiber);
                entry.setSugar(sugar == null ? 0 : sugar);
                entry.setEntryDate(entryDate);
                entries.add(entry);
            }

            List<FoodEntry> savedEntries = foodEntryRepository.saveAll(entries);
            updateLatestMealPreview(authentication.getName(), savedEntries);
            return ResponseEntity.status(HttpStatus.CREATED).body(Map.of(
                    "reply", savedEntries.size() + " food item(s) saved successfully.",
                    "saved", true, "entries", savedEntries));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of("error", "Invalid meal details or date. Please check your request."));
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

    /**
     * Update the persisted meal-preview assistant message after the user confirms it.
     * This prevents the restored chat from showing a meal as still awaiting confirmation.
     */
    private void updateLatestMealPreview(String userId, List<FoodEntry> savedEntries) {
        List<ChatMessage> messages = chatMessageRepository.findByUserIdOrderByTimestampAsc(userId);
        for (int i = messages.size() - 1; i >= 0; i--) {
            ChatMessage message = messages.get(i);
            if (!"assistant".equalsIgnoreCase(message.getRole())) continue;
            try {
                Map<String, Object> content = objectMapper.readValue(message.getContent(), JSON_OBJECT);
                if ("LOG_MEAL".equalsIgnoreCase(String.valueOf(content.get("intent")))
                        && "CREATE_FOOD_ENTRIES".equalsIgnoreCase(String.valueOf(content.get("action")))
                        && Boolean.TRUE.equals(content.get("requiresConfirmation"))) {
                    content.put("reply", savedEntries.size() + " food item(s) saved successfully.");
                    content.put("requiresConfirmation", false);
                    content.put("mealStatus", "saved");
                    content.put("savedEntries", savedEntries);
                    message.setContent(objectMapper.writeValueAsString(content));
                    chatMessageRepository.save(message);
                    return;
                }
            } catch (Exception ignored) { }
        }
    }

    @GetMapping("/history")
    public ResponseEntity<?> getChatHistory(Authentication authentication) {

        if (authentication == null || !authentication.isAuthenticated()) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                    .body(Map.of("error", "Unauthorized"));
        }

        String userId = authentication.getName();

        List<ChatMessage> messages =
                chatMessageRepository.findByUserIdOrderByTimestampAsc(userId);

        return ResponseEntity.ok(messages);
    }

    private void saveMessage(String userId, String role, String content) {

        ChatMessage chatMessage = new ChatMessage(userId, role, content);

        chatMessageRepository.save(chatMessage);
    }

    private ResponseEntity<?> saveChatResponse(
            String userId,
            String userMessage,
            ResponseEntity<?> response
    ) {
        if (response.getStatusCode().is2xxSuccessful()
                && response.getBody() != null) {

            saveMessage(userId, "user", userMessage);

            try {
                String assistantContent =
                        objectMapper.writeValueAsString(response.getBody());

                saveMessage(userId, "assistant", assistantContent);

            } catch (Exception e) {
                throw new RuntimeException("Unable to save chat response", e);
            }
        }

        return response;
    }
}