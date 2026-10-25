import { useState } from "react";
import {
  Sparkles,
  ArrowUp,
  Bot,
  UserRound,
  LoaderCircle,
  CheckCircle2,
  Pencil,
  X,
} from "lucide-react";
import { sendCoachMessage, confirmCoachMeal } from "../../api/aiCoach";
import "./AICoach.css";

const suggestions = [
  "Log 2 boiled eggs for breakfast",
  "How am I doing on my goals today?",
  "Give me my weekly summary",
  "How many calories in a banana?",
];

function formatNumber(value, digits = 1) {
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

function getMealFromPreview(preview = {}) {
  return {
    foodName: preview.foodName ?? "",
    quantity: preview.quantity ?? "",
    quantityUnit: preview.quantityUnit ?? "serving",
    mealType: preview.mealType ?? "Breakfast",
    entryDate: preview.entryDate ?? new Date().toLocaleDateString("en-CA"),
    calories: preview.calories ?? "",
    protein: preview.protein ?? "",
    carbs: preview.carbs ?? "",
    fat: preview.fat ?? "",
    fiber: preview.fiber ?? 0,
    sugar: preview.sugar ?? 0,
  };
}

function SummaryDetails({ data }) {
  if (!data || typeof data !== "object") return null;

  const hasGoalData =
    data.hasGoals === true ||
    data.dailyCalorieTarget != null ||
    data.calorieTarget != null;

  const rows = [];

  if (data.date) rows.push(["Date", data.date]);
  if (data.startDate) {
    rows.push([
      "Period",
      `${data.startDate}${data.endDate ? ` – ${data.endDate}` : ""}`,
    ]);
  }

  if (data.entryCount != null) {
    rows.push(["Meals logged", formatNumber(data.entryCount, 0)]);
  }

  if (data.caloriesConsumed != null) {
    rows.push([
      "Calories consumed",
      `${formatNumber(data.caloriesConsumed)} kcal`,
    ]);
  }

  if (data.totalCalories != null) {
    rows.push(["Total calories", `${formatNumber(data.totalCalories)} kcal`]);
  }

  if (data.dailyCalorieTarget != null) {
    rows.push([
      "Daily calorie target",
      `${formatNumber(data.dailyCalorieTarget)} kcal`,
    ]);
  } else if (data.calorieTarget != null) {
    rows.push([
      "Daily calorie target",
      `${formatNumber(data.calorieTarget)} kcal`,
    ]);
  }

  if (data.caloriesRemaining != null) {
    rows.push([
      "Calories remaining",
      `${formatNumber(data.caloriesRemaining)} kcal`,
    ]);
  }

  if (data.totalProtein != null) {
    rows.push(["Protein this week", `${formatNumber(data.totalProtein)} g`]);
  } else if (data.proteinConsumed != null) {
    rows.push(["Protein consumed", `${formatNumber(data.proteinConsumed)} g`]);
  }

  if (data.proteinTarget != null) {
    rows.push(["Protein target", `${formatNumber(data.proteinTarget)} g`]);
  }

  if (data.totalCarbs != null) {
    rows.push(["Carbs this week", `${formatNumber(data.totalCarbs)} g`]);
  } else if (data.carbsConsumed != null) {
    rows.push(["Carbs consumed", `${formatNumber(data.carbsConsumed)} g`]);
  }

  if (data.carbsTarget != null) {
    rows.push(["Carbs target", `${formatNumber(data.carbsTarget)} g`]);
  }

  if (data.totalFat != null) {
    rows.push(["Fat this week", `${formatNumber(data.totalFat)} g`]);
  } else if (data.fatConsumed != null) {
    rows.push(["Fat consumed", `${formatNumber(data.fatConsumed)} g`]);
  }

  if (data.fatTarget != null) {
    rows.push(["Fat target", `${formatNumber(data.fatTarget)} g`]);
  }

  if (data.dailyCalorieTarget != null && data.caloriesConsumed != null) {
    const percentage =
      data.dailyCalorieTarget > 0
        ? (data.caloriesConsumed / data.dailyCalorieTarget) * 100
        : null;

    if (percentage != null) {
      rows.push(["Calorie target reached", `${formatNumber(percentage)}%`]);
    }
  }

  if (data.currentWeightKg != null) {
    rows.push(["Current weight", `${formatNumber(data.currentWeightKg)} kg`]);
  }

  if (data.targetWeightKg != null) {
    rows.push(["Target weight", `${formatNumber(data.targetWeightKg)} kg`]);
  }

  if (!rows.length && data.hasGoals === false) {
    return (
      <div className="ai-coach-summary">
        You haven't set your health goals yet.
      </div>
    );
  }

  if (!rows.length) return null;

  return (
    <div className="ai-coach-summary">
      {hasGoalData && (
        <div className="ai-coach-summary-heading">Your nutrition data</div>
      )}

      {rows.map(([label, value]) => (
        <div className="ai-coach-summary-row" key={label}>
          <span>{label}</span>
          <strong>{value}</strong>
        </div>
      ))}
    </div>
  );
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

export default function AICoach() {
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [editingMealId, setEditingMealId] = useState(null);
  const [savingMealId, setSavingMealId] = useState(null);

  function updateMessage(messageId, changes) {
    setMessages((previous) =>
      previous.map((message) =>
        message.id === messageId ? { ...message, ...changes } : message,
      ),
    );
  }

  async function sendMessage(message = input) {
    const trimmed = message.trim();

    if (!trimmed || loading || savingMealId) return;

    const userMessage = {
      id: `${Date.now()}-user`,
      role: "user",
      text: trimmed,
    };

    setMessages((previous) => [...previous, userMessage]);
    setInput("");
    setError("");
    setLoading(true);

    try {
      const response = await sendCoachMessage(trimmed);

      const reply =
        typeof response.reply === "string" && response.reply.trim()
          ? response.reply
          : "I couldn't generate a response. Please try again.";

      const isMealPreview =
        response.intent === "LOG_MEAL" &&
        response.action === "CREATE_FOOD_ENTRY" &&
        response.requiresConfirmation === true &&
        response.preview;

      const assistantMessage = {
        id: `${Date.now()}-assistant`,
        role: "assistant",
        text: reply,
        data: response,
        meal: isMealPreview ? getMealFromPreview(response.preview) : null,
        mealStatus: isMealPreview ? "pending" : null,
      };

      setMessages((previous) => [...previous, assistantMessage]);
    } catch (apiError) {
      setError(
        apiError.message || "Nourish AI couldn't respond. Please try again.",
      );
    } finally {
      setLoading(false);
    }
  }

  function handleSubmit(event) {
    event.preventDefault();
    sendMessage();
  }

  async function handleConfirmMeal(message) {
    if (!message.meal || savingMealId) return;

    const meal = message.meal;
    const quantity = Number(meal.quantity);
    const nutritionFields = [
      "calories",
      "protein",
      "carbs",
      "fat",
      "fiber",
      "sugar",
    ];

    if (!meal.foodName.trim() || !meal.quantityUnit.trim()) {
      setError("Enter a food name and quantity unit before saving.");
      return;
    }

    if (!Number.isFinite(quantity) || quantity <= 0) {
      setError("Quantity must be greater than zero.");
      return;
    }

    if (!meal.entryDate || !meal.mealType) {
      setError("Choose a meal type and date before saving.");
      return;
    }

    for (const key of nutritionFields) {
      const value = Number(meal[key]);

      if (meal[key] === "" || !Number.isFinite(value) || value < 0) {
        setError(`Enter a valid non-negative value for ${key}.`);
        return;
      }
    }

    const payload = {
      ...meal,
      foodName: meal.foodName.trim(),
      quantity,
      quantityUnit: meal.quantityUnit.trim(),
    };

    nutritionFields.forEach((key) => {
      payload[key] = Number(meal[key]);
    });

    setError("");
    setSavingMealId(message.id);

    try {
      const result = await confirmCoachMeal(payload);

      if (result.saved !== true) {
        throw new Error(
          result.error ||
            "The backend did not confirm that the meal was saved.",
        );
      }

      updateMessage(message.id, {
        mealStatus: "saved",
        text: result.reply || "Your meal was saved successfully.",
        savedEntry: result.entry || null,
      });

      setEditingMealId(null);
    } catch (apiError) {
      setError(
        apiError.message || "Unable to save the meal. Please try again.",
      );
    } finally {
      setSavingMealId(null);
    }
  }

  function cancelMealPreview(message) {
    updateMessage(message.id, {
      mealStatus: "cancelled",
    });
    setEditingMealId(null);
    setError("");
  }

  return (
    <main className="ai-coach-page">
      <header className="ai-coach-header">
        <p className="ai-coach-eyebrow">ASSISTANT</p>

        <h1>
          Nutrition <span>Coach.</span>
        </h1>

        <p className="ai-coach-subtitle">
          Do everything in plain language — log meals, check goals, ask
          questions.
        </p>
      </header>

      <section className="ai-coach-chat" aria-label="Nutrition coach chat">
        <div className="ai-coach-conversation" aria-live="polite">
          {messages.length === 0 ? (
            <div className="ai-coach-empty">
              <div className="ai-coach-sparkle">
                <Sparkles size={34} strokeWidth={2.1} />
              </div>

              <h2>What did you eat today?</h2>

              <div className="ai-coach-suggestions">
                {suggestions.map((suggestion) => (
                  <button
                    type="button"
                    className="ai-coach-suggestion"
                    key={suggestion}
                    onClick={() => sendMessage(suggestion)}
                    disabled={loading || Boolean(savingMealId)}
                  >
                    {suggestion}
                  </button>
                ))}
              </div>
            </div>
          ) : (
            <div className="ai-coach-messages">
              {messages.map((message) => (
                <div
                  className={`ai-coach-message ${message.role}`}
                  key={message.id}
                >
                  <span className="ai-coach-message-icon">
                    {message.role === "assistant" ? (
                      <Bot size={18} />
                    ) : (
                      <UserRound size={18} />
                    )}
                  </span>

                  <div className="ai-coach-message-bubble">
                    <div>{message.text}</div>

                    {message.role === "assistant" && message.data && (
                      <SummaryDetails data={message.data} />
                    )}

                    {message.role === "assistant" &&
                      message.meal &&
                      message.mealStatus === "pending" && (
                        <>
                          {editingMealId === message.id ? (
                            <MealPreview
                              meal={message.meal}
                              disabled={savingMealId === message.id}
                              onChange={(key, value) => {
                                setMessages((previous) =>
                                  previous.map((item) =>
                                    item.id === message.id
                                      ? {
                                          ...item,
                                          meal: {
                                            ...item.meal,
                                            [key]: value,
                                          },
                                        }
                                      : item,
                                  ),
                                );
                              }}
                            />
                          ) : (
                            <div className="ai-coach-meal-preview">
                              <strong>Meal ready for review</strong>
                              <p>
                                {message.meal.foodName || "Food not identified"}
                              </p>
                              <p>
                                Quantity: {message.meal.quantity}{" "}
                                {message.meal.quantityUnit}
                              </p>
                              <p>Meal: {message.meal.mealType}</p>
                              <p>
                                Calories: {formatNumber(message.meal.calories)}{" "}
                                kcal
                              </p>
                              <small>
                                Nutrition values may be estimates. Review before
                                saving.
                              </small>
                            </div>
                          )}

                          <div className="ai-coach-meal-actions">
                            <button
                              type="button"
                              className="ai-coach-meal-button secondary"
                              onClick={() =>
                                setEditingMealId(
                                  editingMealId === message.id
                                    ? null
                                    : message.id,
                                )
                              }
                              disabled={Boolean(savingMealId)}
                            >
                              <Pencil size={15} />
                              {editingMealId === message.id
                                ? "Done editing"
                                : "Edit"}
                            </button>

                            <button
                              type="button"
                              className="ai-coach-meal-button"
                              onClick={() => handleConfirmMeal(message)}
                              disabled={Boolean(savingMealId)}
                            >
                              {savingMealId === message.id ? (
                                <LoaderCircle
                                  size={15}
                                  className="ai-coach-spinner"
                                />
                              ) : (
                                <CheckCircle2 size={15} />
                              )}
                              {savingMealId === message.id
                                ? "Saving..."
                                : "Confirm and save"}
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
                      )}

                    {message.role === "assistant" &&
                      message.mealStatus === "saved" && (
                        <p className="ai-coach-meal-success">
                          <CheckCircle2 size={16} />
                          Saved to your food entries.
                        </p>
                      )}

                    {message.role === "assistant" &&
                      message.mealStatus === "cancelled" && (
                        <p className="ai-coach-meal-cancelled">
                          Meal preview cancelled. Nothing was saved.
                        </p>
                      )}
                  </div>
                </div>
              ))}

              {loading && (
                <div className="ai-coach-message assistant">
                  <span className="ai-coach-message-icon">
                    <Bot size={18} />
                  </span>
                  <div className="ai-coach-message-bubble ai-coach-thinking">
                    <LoaderCircle size={17} className="ai-coach-spinner" />
                    Thinking...
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        {error && (
          <div className="ai-coach-error" role="alert">
            <span>{error}</span>
            <button type="button" onClick={() => setError("")}>
              Dismiss
            </button>
          </div>
        )}

        <form className="ai-coach-composer" onSubmit={handleSubmit}>
          <input
            type="text"
            value={input}
            onChange={(event) => setInput(event.target.value)}
            placeholder="Message your coach..."
            aria-label="Message your coach"
            maxLength={4000}
            disabled={loading || Boolean(savingMealId)}
          />

          <button
            type="submit"
            className="ai-coach-send"
            aria-label="Send message"
            disabled={!input.trim() || loading || Boolean(savingMealId)}
          >
            {loading ? (
              <LoaderCircle size={21} className="ai-coach-spinner" />
            ) : (
              <ArrowUp size={21} />
            )}
          </button>
        </form>
      </section>
    </main>
  );
}
