
package com.example.CalTrac.service;

import com.example.CalTrac.model.FoodEntry;
import com.example.CalTrac.model.HealthGoal;
import com.example.CalTrac.repository.FoodEntryRepository;
import com.example.CalTrac.repository.HealthGoalRepository;
import org.springframework.stereotype.Service;

import java.time.LocalDate;
import java.util.HashMap;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.TreeMap;

@Service
public class NutritionReportService {

    private final FoodEntryRepository foodEntryRepository;
    private final HealthGoalRepository healthGoalRepository;

    public NutritionReportService(FoodEntryRepository foodEntryRepository, HealthGoalRepository healthGoalRepository) {
        this.foodEntryRepository = foodEntryRepository;
        this.healthGoalRepository = healthGoalRepository;
    }

    public Map<String, Object> getDailySummary(String userId, LocalDate date) {

        List<FoodEntry> entries = foodEntryRepository.findByUserIdAndEntryDate(userId, date);

        Map<String, Object> summary = calculateNutrition(entries);

        summary.put("date", date);
        summary.put("totalEntries", entries.size());

        healthGoalRepository.findByUserId(userId)
                .ifPresent(goal -> summary.put("goalComparison", compareWithGoal(summary, goal, 1)));

        return summary;
    }

    public Map<String, Object> getWeeklySummary(String userId, LocalDate startDate) {

        LocalDate endDate = startDate.plusDays(6);

        List<FoodEntry> entries = foodEntryRepository.findByUserIdAndEntryDateBetween(userId, startDate, endDate);

        Map<String, Map<String, Object>> dailySummaries = new LinkedHashMap<>();

        for (LocalDate date = startDate; !date.isAfter(endDate); date = date.plusDays(1)) {
            LocalDate currentDate = date;
            List<FoodEntry> dayEntries = entries.stream()
                    .filter(entry -> entry.getEntryDate().equals(currentDate)).toList();

            Map<String, Object> daily = calculateNutrition(dayEntries);
            daily.put("date", currentDate);
            daily.put("totalEntries", dayEntries.size());

            dailySummaries.put(currentDate.toString(), daily);
        }

        Map<String, Object> weeklySummary = calculateNutrition(entries);

        weeklySummary.put("startDate", startDate);
        weeklySummary.put("endDate", endDate);
        weeklySummary.put("totalEntries", entries.size());
        weeklySummary.put("dailySummaries", dailySummaries);

        healthGoalRepository.findByUserId(userId)
                .ifPresent(goal -> {
                    weeklySummary.put("weeklyGoalComparison", compareWithGoal(weeklySummary, goal, 7));

                    for (Map<String, Object> daily : dailySummaries.values()) {
                        daily.put("goalComparison", compareWithGoal(daily, goal, 1));
                    }
                });

        return weeklySummary;
    }

    private Map<String, Object> calculateNutrition(List<FoodEntry> entries) {

        double calories = 0;
        double protein = 0;
        double carbs = 0;
        double fat = 0;
        double fiber = 0;
        double sugar = 0;

        Map<String, Double> vitamins = new TreeMap<>();
        Map<String, Double> minerals = new TreeMap<>();

        for (FoodEntry entry : entries) {
            calories += entry.getCalories();
            protein += entry.getProtein();
            carbs += entry.getCarbs();
            fat += entry.getFat();
            fiber += entry.getFiber();
            sugar += entry.getSugar();

            addNutrients(vitamins, entry.getVitamins());
            addNutrients(minerals, entry.getMinerals());
        }

        Map<String, Object> summary = new HashMap<>();
        summary.put("totalCalories", calories);
        summary.put("totalProtein", protein);
        summary.put("totalCarbs", carbs);
        summary.put("totalFat", fat);
        summary.put("totalFiber", fiber);
        summary.put("totalSugar", sugar);
        summary.put("vitamins", vitamins);
        summary.put("minerals", minerals);

        return summary;
    }

    private void addNutrients(Map<String, Double> totals, Map<String, Double> nutrients) {

        if (nutrients == null) {
            return;
        }

        nutrients.forEach((name, amount) -> {
            if (name != null && amount != null
                    && Double.isFinite(amount)) {
                totals.merge(name, amount, Double::sum);
            }
        });
    }

    private Map<String, Object> compareWithGoal(Map<String, Object> actual, HealthGoal goal, int days) {

        Map<String, Object> comparison = new LinkedHashMap<>();

        addComparison(comparison, "calories", (double) actual.get("totalCalories"), goal.getDailyCalorieTarget() * days);

        addComparison(comparison, "protein", (double) actual.get("totalProtein"), goal.getProteinTarget() * days);

        addComparison(comparison, "carbs", (double) actual.get("totalCarbs"), goal.getCarbsTarget() * days);

        addComparison(comparison, "fat", (double) actual.get("totalFat"), goal.getFatTarget() * days);

        return comparison;
    }

    private void addComparison(Map<String, Object> comparison, String nutrient, double actual, double target) {

        Map<String, Object> result = new LinkedHashMap<>();
        result.put("target", target);
        result.put("actual", actual);
        result.put("difference", actual - target);
        result.put("percentageAchieved", target > 0 ? actual / target * 100 : 0);

        comparison.put(nutrient, result);
    }
}
