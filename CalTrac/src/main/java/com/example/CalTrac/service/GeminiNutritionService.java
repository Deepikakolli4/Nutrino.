
package com.example.CalTrac.service;

import com.google.genai.Client;
import com.google.genai.types.Content;
import com.google.genai.types.GenerateContentConfig;
import com.google.genai.types.Part;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

@Service
public class GeminiNutritionService {

    private final Client geminiClient;
    private final String model;

    public GeminiNutritionService(@Value("${gemini.api.key}") String apiKey,
                                  @Value("${gemini.api.model}") String model) {

        this.geminiClient = Client.builder().apiKey(apiKey).build();
        this.model = model;
    }

    public String analyzeImage(byte[] imageBytes, String mimeType) {

        String prompt = """
                Analyze this food image for a calorie-tracking application.

                If it is a nutrition label, extract the displayed values
                and identify the serving size they refer to.

                If it is a photo of food, estimate nutrition for the
                visible portion and clearly mark the values as estimates.

                Return ONLY valid JSON with these fields:
                {
                  "foodName": "string",
                  "quantity": 1,
                  "quantityUnit": "serving",
                  "calories": 0,
                  "protein": 0,
                  "carbs": 0,
                  "fat": 0,
                  "fiber": 0,
                  "sugar": 0,
                  "vitamins": {
                    "vitaminA": null,
                    "vitaminC": null,
                    "vitaminD": null,
                    "vitaminE": null,
                    "vitaminK": null,
                    "vitaminB1": null,
                    "vitaminB2": null,
                    "vitaminB6": null,
                    "vitaminB12": null,
                    "folate": null
                  },
                  "minerals": {
                    "calcium": null,
                    "iron": null,
                    "sodium": null,
                    "potassium": null,
                    "magnesium": null,
                    "zinc": null,
                    "phosphorus": null
                  },
                  "isEstimate": true,
                  "servingDescription": "string",
                  "notes": "string"
                }

                Use the exact micronutrient keys shown above and include both objects.
                Report amounts for the same serving or visible portion as calories.
                Use grams for macronutrients. Use micrograms for vitaminA, vitaminD,
                vitaminK, vitaminB12, and folate. Use milligrams for all other
                vitamins listed above and all listed minerals.

                For a food photo, fill in reasonable micronutrient estimates for
                identifiable foods and set isEstimate to true. For a nutrition
                label, use displayed amounts and convert units where possible.
                If the label gives only a percentage and the reference intake
                cannot be established, return null for that nutrient.

                Use numbers without unit suffixes. Return null for unavailable
                values and use zero only when a zero amount is supported.
                Do not include Markdown fences around the JSON.
                """;

        Content content = Content.fromParts(
                Part.fromText(prompt),
                Part.fromBytes(imageBytes, mimeType)
        );

        GenerateContentConfig config = GenerateContentConfig.builder()
                .responseMimeType("application/json").build();

        return geminiClient.models.generateContent(model, content, config).text();
    }
}
