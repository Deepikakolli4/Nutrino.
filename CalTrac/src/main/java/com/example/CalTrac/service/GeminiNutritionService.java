
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
                  "vitamins": {},
                  "minerals": {},
                  "isEstimate": true,
                  "servingDescription": "string",
                  "notes": "string"
                }

                Use grams for macronutrients and milligrams or
                micrograms as appropriate for micronutrients.
                Use numeric values for nutrient amounts.
                If a value cannot be determined, return null for that
                value rather than inventing a precise measurement.
                Do not treat missing values as zero.
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
