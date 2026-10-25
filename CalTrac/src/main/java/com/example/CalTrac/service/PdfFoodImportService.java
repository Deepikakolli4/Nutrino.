
package com.example.CalTrac.service;

import com.example.CalTrac.model.FoodEntry;
import org.apache.pdfbox.Loader;
import org.apache.pdfbox.pdmodel.PDDocument;
import org.apache.pdfbox.text.PDFTextStripper;
import org.apache.pdfbox.text.TextPosition;
import org.springframework.stereotype.Service;

import java.io.IOException;
import java.time.LocalDate;
import java.util.ArrayList;
import java.util.List;
import java.util.Locale;
import java.util.regex.Pattern;

@Service
public class PdfFoodImportService {

    public List<FoodEntry> parsePdf(byte[] pdfBytes) throws IOException {
        try (PDDocument document = Loader.loadPDF(pdfBytes)) {
            PDFTextStripper stripper = new PDFTextStripper() {
                private float previousX;
                private float previousY;

                @Override
                protected void writeString(String text, List<TextPosition> positions) throws IOException {

                    for (TextPosition position : positions) {
                        float x = position.getXDirAdj();
                        float y = position.getYDirAdj();

                        if (Math.abs(y - previousY) > 2) {
                            super.writeString("\n");
                            previousX = 0;
                        } else if (x - previousX > 4) {
                            super.writeString("\t");
                        }

                        super.writeString(position.getUnicode());
                        previousX = position.getXDirAdj()
                                + position.getWidthDirAdj();
                        previousY = y;
                    }
                }
            };

            stripper.setSortByPosition(true);
            String text = stripper.getText(document);
            return parseText(text);
        }
    }

    private List<FoodEntry> parseText(String text) {
        List<FoodEntry> entries = new ArrayList<>();
        String[] lines = text.split("\\R");

        String[] headers = null;

        for (String line : lines) {
            if (line.isBlank()) {
                continue;
            }

            String[] columns = line.trim().split("\\t+");

            if (headers == null) {
                if (containsFoodHeader(columns)) {
                    headers = normalizeHeaders(columns);
                }
                continue;
            }

            FoodEntry entry = parseRow(headers, columns);
            if (entry != null) {
                entries.add(entry);
            }
        }

        if (entries.isEmpty()) {
            throw new IllegalArgumentException(
                    "No food entries found. The PDF must contain a readable "
                            + "food table with headers such as Date, Meal Type, "
                            + "Food Name, Calories, Protein, Carbs, and Fat.");
        }

        return entries;
    }

    private boolean containsFoodHeader(String[] columns) {
        for (String column : columns) {
            String value = normalize(column);
            if (List.of("foodname", "fooditem", "food", "item",
                    "fooditemname").contains(value)) {
                return true;
            }
        }
        return false;
    }

    private String[] normalizeHeaders(String[] columns) {
        String[] headers = new String[columns.length];
        for (int i = 0; i < columns.length; i++) {
            headers[i] = normalize(columns[i]);
        }
        return headers;
    }

    private FoodEntry parseRow(String[] headers, String[] columns) {
        String foodName = value(headers, columns,
                "foodname", "fooditem", "food", "item", "fooditemname");

        if (foodName == null || foodName.isBlank()) {
            return null;
        }

        try {
            FoodEntry entry = new FoodEntry();
            entry.setFoodName(foodName.trim());

            entry.setQuantity(number(value(headers, columns, "quantity", "servings", "amount"), 1));

            entry.setQuantityUnit(defaultValue(value(headers, columns, "quantityunit", "unit"), "serving"));

            entry.setCalories(number(value(headers, columns, "calories", "kcal", "energy"), 0));

            entry.setProtein(number(value(headers, columns, "protein", "proteing"), 0));

            entry.setCarbs(number(value(headers, columns, "carbs", "carbohydrates", "carbohydrateg"), 0));

            entry.setFat(number(value(headers, columns, "fat", "totalfat", "fatg"), 0));

            entry.setFiber(number(value(headers, columns, "fiber", "dietaryfiber"), 0));

            entry.setSugar(number(value(headers, columns, "sugar", "sugars"), 0));

            String mealType = value(headers, columns, "mealtype", "meal", "category");

            if (mealType != null && !mealType.isBlank()) {
                entry.setMealType(normalizeMealType(mealType));
            }

            String date = value(headers, columns, "entrydate", "date", "mealdate");

            entry.setEntryDate(date == null || date.isBlank()
                    ? LocalDate.now()
                    : LocalDate.parse(date.trim()));

            return entry;
        } catch (RuntimeException exception) {
            return null;
        }
    }

    private String value(
            String[] headers, String[] columns, String... names) {

        for (int i = 0; i < headers.length && i < columns.length; i++) {
            for (String name : names) {
                if (headers[i].equals(name)) {
                    return columns[i].trim();
                }
            }
        }
        return null;
    }

    private double number(String value, double defaultValue) {
        if (value == null || value.isBlank()) {
            return defaultValue;
        }

        String cleaned = value.replace(",", "")
                .replaceAll("(?i)\\s*(kcal|g)$", "")
                .trim();

        if (!Pattern.matches("-?\\d+(\\.\\d+)?", cleaned)) {
            throw new IllegalArgumentException("Invalid numeric value");
        }

        return Double.parseDouble(cleaned);
    }

    private String defaultValue(String value, String fallback) {
        return value == null || value.isBlank() ? fallback : value.trim();
    }

    private String normalize(String value) {
        return value.toLowerCase(Locale.ROOT).replaceAll("[^a-z0-9]", "");
    }

    private String normalizeMealType(String value) {
        return switch (value.trim().toUpperCase(Locale.ROOT)) {
            case "BREAKFAST" -> "Breakfast";
            case "LUNCH" -> "Lunch";
            case "DINNER" -> "Dinner";
            case "SNACK", "SNACKS" -> "Snacks";
            default -> value.trim();
        };
    }
}
