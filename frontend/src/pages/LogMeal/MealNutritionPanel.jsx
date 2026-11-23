import { Flame } from "lucide-react";

export default function MealNutritionPanel({ form, updateField, updateNutrientMap }) {
  return (
    <section className="log-panel log-nutrition-panel">
      <div className="log-panel-heading">
        <div>
          <span className="log-step-label">STEP 03</span>
          <h2>Nutrition information</h2>
        </div>
        <Flame size={20} />
      </div>

      <p className="log-panel-description">
        Enter the nutrition values for your selected serving.
      </p>

      <div className="log-nutrition-grid">
        <label className="log-nutrition-field calories">
          <span>Calories</span>
          <div>
            <input
              type="number"
              name="calories"
              min="0"
              step="1"
              value={form.calories}
              onChange={updateField}
              placeholder="0"
              required
            />
            <span>kcal</span>
          </div>
        </label>

        <label className="log-nutrition-field protein">
          <span>Protein</span>
          <div>
            <input
              type="number"
              name="protein"
              min="0"
              step="0.1"
              value={form.protein}
              onChange={updateField}
              placeholder="0"
              required
            />
            <span>g</span>
          </div>
        </label>

        <label className="log-nutrition-field carbs">
          <span>Carbohydrates</span>
          <div>
            <input
              type="number"
              name="carbs"
              min="0"
              step="0.1"
              value={form.carbs}
              onChange={updateField}
              placeholder="0"
              required
            />
            <span>g</span>
          </div>
        </label>

        <label className="log-nutrition-field fat">
          <span>Fat</span>
          <div>
            <input
              type="number"
              name="fat"
              min="0"
              step="0.1"
              value={form.fat}
              onChange={updateField}
              placeholder="0"
              required
            />
            <span>g</span>
          </div>
        </label>
      </div>

      <div className="log-nutrition-grid log-extra-nutrition-grid">
        <label className="log-nutrition-field fiber">
          <span>Fiber</span>
          <div>
            <input
              type="number"
              name="fiber"
              min="0"
              step="0.1"
              value={form.fiber}
              onChange={updateField}
              placeholder="0"
            />
            <span>g</span>
          </div>
        </label>

        <label className="log-nutrition-field sugar">
          <span>Sugar</span>
          <div>
            <input
              type="number"
              name="sugar"
              min="0"
              step="0.1"
              value={form.sugar}
              onChange={updateField}
              placeholder="0"
            />
            <span>g</span>
          </div>
        </label>
      </div>

      <details className="log-micronutrients-details">
        <summary>
          <span>
            <strong>Micronutrients</strong>
            <small> Optional(Add vitamins and minerals)</small>
          </span>
        </summary>

        <div className="log-micronutrients-content">
          <p className="log-micronutrients-hint">
            Enter values for your selected serving. Leave fields blank if
            the nutrition information is unavailable.
          </p>

          <h3>Vitamins</h3>
          <div className="log-micronutrient-grid">
            {[
              ["vitaminA", "Vitamin A", "µg"],
              ["vitaminC", "Vitamin C", "mg"],
              ["vitaminD", "Vitamin D", "µg"],
              ["vitaminE", "Vitamin E", "mg"],
              ["vitaminK", "Vitamin K", "µg"],
              ["vitaminB1", "Vitamin B1", "mg"],
              ["vitaminB2", "Vitamin B2", "mg"],
              ["vitaminB6", "Vitamin B6", "mg"],
              ["vitaminB12", "Vitamin B12", "µg"],
              ["folate", "Folate", "µg"],
            ].map(([key, label, unit]) => (
              <label className="log-field" key={key}>
                <span>{label} ({unit})</span>
                <input
                  type="number"
                  min="0"
                  step="any"
                  value={form.vitamins[key] ?? ""}
                  onChange={(event) =>
                    updateNutrientMap("vitamins", key, event.target.value)
                  }
                  placeholder="—"
                />
              </label>
            ))}
          </div>

          <h3>Minerals</h3>
          <div className="log-micronutrient-grid">
            {[
              ["calcium", "Calcium", "mg"],
              ["iron", "Iron", "mg"],
              ["sodium", "Sodium", "mg"],
              ["potassium", "Potassium", "mg"],
              ["magnesium", "Magnesium", "mg"],
              ["zinc", "Zinc", "mg"],
              ["phosphorus", "Phosphorus", "mg"],
            ].map(([key, label, unit]) => (
              <label className="log-field" key={key}>
                <span>{label} ({unit})</span>
                <input
                  type="number"
                  min="0"
                  step="any"
                  value={form.minerals[key] ?? ""}
                  onChange={(event) =>
                    updateNutrientMap("minerals", key, event.target.value)
                  }
                  placeholder="—"
                />
              </label>
            ))}
          </div>
        </div>
      </details>

      <label className="log-field log-notes-field">
        <span>Notes (optional)</span>
        <textarea
          name="notes"
          value={form.notes}
          onChange={updateField}
          placeholder="Add ingredients, portion details or anything else..."
          rows={3}
        />
      </label>
    </section>
  );
}
