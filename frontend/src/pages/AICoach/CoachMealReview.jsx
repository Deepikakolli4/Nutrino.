import { CheckCircle2, LoaderCircle, Pencil, X } from "lucide-react";

export function formatNumber(value, digits = 1) {
  if (value === null || value === undefined || value === "") {
    return "—";
  }

  const number = Number(value);

  return Number.isFinite(number)
    ? number.toLocaleString("en-IN", {
        maximumFractionDigits: digits,
      })
    : "—";
}

function MealPreview({ meal, onChange, disabled }) {
  const fields = [
    { key: "foodName", label: "Food name", type: "text" },
    {
      key: "quantity",
      label: "Quantity",
      type: "number",
      min: "0.01",
      step: "any",
    },
    { key: "quantityUnit", label: "Unit", type: "text" },
    {
      key: "calories",
      label: "Calories (kcal)",
      type: "number",
      min: "0",
      step: "any",
    },
    {
      key: "protein",
      label: "Protein (g)",
      type: "number",
      min: "0",
      step: "any",
    },
    { key: "carbs", label: "Carbs (g)", type: "number", min: "0", step: "any" },
    { key: "fat", label: "Fat (g)", type: "number", min: "0", step: "any" },
    { key: "fiber", label: "Fiber (g)", type: "number", min: "0", step: "any" },
    { key: "sugar", label: "Sugar (g)", type: "number", min: "0", step: "any" },
  ];

  return (
    <div className="ai-coach-meal-preview">
      <strong>Review meal details</strong>

      <label className="ai-coach-meal-field">
        Meal type
        <select
          value={meal.mealType}
          onChange={(event) => onChange("mealType", event.target.value)}
          disabled={disabled}
        >
          {["Breakfast", "Lunch", "Dinner", "Snacks"].map((type) => (
            <option key={type} value={type}>
              {type}
            </option>
          ))}
        </select>
      </label>

      <label className="ai-coach-meal-field">
        Entry date
        <input
          type="date"
          value={meal.entryDate}
          onChange={(event) => onChange("entryDate", event.target.value)}
          disabled={disabled}
          required
        />
      </label>

      <div className="ai-coach-meal-fields">
        {fields.map((field) => (
          <label className="ai-coach-meal-field" key={field.key}>
            {field.label}
            <input
              type={field.type}
              min={field.min}
              step={field.step}
              value={meal[field.key]}
              onChange={(event) => onChange(field.key, event.target.value)}
              disabled={disabled}
              required={[
                "foodName",
                "quantity",
                "quantityUnit",
                "calories",
                "protein",
                "carbs",
                "fat",
              ].includes(field.key)}
            />
          </label>
        ))}
      </div>
    </div>
  );
}

export default function CoachMealReview({
  message,
  editingMealId,
  setEditingMealId,
  savingMealId,
  updateMeal,
  handleConfirmMeal,
  cancelMealPreview,
}) {
  return (
  <>
    <div className="ai-coach-meal-preview">
      <strong>
        {message.meals.length} food {message.meals.length === 1 ? "entry" : "entries"} ready for review
      </strong>

      {message.meals.map((meal, index) => {
        const itemEditingId = `${message.id}-${index}`;
        return (
          <div className="ai-coach-meal-item" key={itemEditingId}>
            {editingMealId === itemEditingId ? (
              <MealPreview
                meal={meal}
                disabled={savingMealId === message.id}
                  onChange={(key, value) => updateMeal(message.id, index, key, value)}
              />
            ) : (
              <div>
                <strong>{index + 1}. {meal.foodName || "Food not identified"}</strong>
                <p>Quantity: {meal.quantity} {meal.quantityUnit}</p>
                <p>Meal: {meal.mealType} · Date: {meal.entryDate}</p>
                <p>Calories: {formatNumber(meal.calories)} kcal</p>
              </div>
            )}

            <button
              type="button"
              className="ai-coach-meal-button secondary"
              onClick={() =>
                setEditingMealId(
                  editingMealId === itemEditingId ? null : itemEditingId,
                )
              }
              disabled={Boolean(savingMealId)}
            >
              <Pencil size={15} />
              {editingMealId === itemEditingId ? "Done editing" : "Edit"}
            </button>
          </div>
        );
      })}

      <small>
        Nutrition values may be estimates. Review each item before saving.
      </small>
    </div>

    <div className="ai-coach-meal-actions">
      <button
        type="button"
        className="ai-coach-meal-button"
        onClick={() => handleConfirmMeal(message)}
        disabled={Boolean(savingMealId)}
      >
        {savingMealId === message.id ? (
          <LoaderCircle size={15} className="ai-coach-spinner" />
        ) : (
          <CheckCircle2 size={15} />
        )}
        {savingMealId === message.id ? "Saving..." : "Confirm and save all"}
      </button>

      <button
        type="button"
        className="ai-coach-meal-button secondary"
        onClick={() => cancelMealPreview(message)}
        disabled={Boolean(savingMealId)}
      >
        <X size={15} />
        Cancel
      </button>
    </div>
  </>
  );
}
