package com.example.CalTrac.service;

import com.example.CalTrac.model.FoodEntry;
import com.example.CalTrac.model.HealthGoal;
import com.example.CalTrac.repository.FoodEntryRepository;
import com.example.CalTrac.repository.HealthGoalRepository;
import org.springframework.stereotype.Service;

import java.time.LocalDate;
import java.util.List;
import java.util.Optional;

@Service
public class ChatContextService {

    private final FoodEntryRepository foodEntryRepository;
    private final HealthGoalRepository healthGoalRepository;

    public ChatContextService(
            FoodEntryRepository foodEntryRepository,
            HealthGoalRepository healthGoalRepository) {
        this.foodEntryRepository = foodEntryRepository;
        this.healthGoalRepository = healthGoalRepository;
    }

    public String buildContext(String userId) {
        LocalDate today = LocalDate.now();
        LocalDate weekStart = today.minusDays(6);

        List<FoodEntry> todayEntries = foodEntryRepository.findByUserIdAndEntryDate(userId, today);

        List<FoodEntry> weekEntries = foodEntryRepository.findByUserIdAndEntryDateBetween(userId, weekStart, today);

        Optional<HealthGoal> goalOptional = healthGoalRepository.findByUserId(userId);

        double todayCalories = 0;
        double todayProtein = 0;
        double todayCarbs = 0;
        double todayFat = 0;

        for (FoodEntry entry : todayEntries) {
            todayCalories += entry.getCalories();
            todayProtein += entry.getProtein();
            todayCarbs += entry.getCarbs();
            todayFat += entry.getFat();
        }

        double weekCalories = 0;

        for (FoodEntry entry : weekEntries) {
            weekCalories += entry.getCalories();
        }

        StringBuilder context = new StringBuilder();

        context.append("Today's date: ").append(today).append("\n");
        context.append("Today's food entries: ").append(todayEntries.size()).append("\n");
        context.append("Today's calories: ").append(todayCalories).append(" kcal\n");
        context.append("Today's protein: ").append(todayProtein).append(" g\n");
        context.append("Today's carbohydrates: ").append(todayCarbs).append(" g\n");
        context.append("Today's fat: ").append(todayFat).append(" g\n");
        context.append("Calories over the last 7 days: ").append(weekCalories).append(" kcal\n");

        if (goalOptional.isPresent()) {
            HealthGoal goal = goalOptional.get();

            context.append("Daily calorie target: ").append(goal.getDailyCalorieTarget()).append(" kcal\n");
            context.append("Protein target: ").append(goal.getProteinTarget()).append(" g\n");
            context.append("Carbohydrate target: ").append(goal.getCarbsTarget()).append(" g\n");
            context.append("Fat target: ").append(goal.getFatTarget()).append(" g\n");
            context.append("Current weight: ").append(goal.getCurrentWeightKg()).append(" kg\n");
            context.append("Target weight: ").append(goal.getTargetWeightKg()).append(" kg\n");
        } else {
            context.append("The user has not configured health goals.\n");
        }

        return context.toString();
    }
}
