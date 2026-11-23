import { Bot, CheckCircle2, LoaderCircle, Sparkles, UserRound } from "lucide-react";
import CoachMealReview, { formatNumber } from "./CoachMealReview";

const suggestions = [
  "Log 2 boiled eggs for breakfast",
  "How am I doing on my goals today?",
  "Give me my weekly summary",
  "How many calories in a banana?",
];

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

export default function CoachConversation({
  messages,
  historyLoading,
  loading,
  savingMealId,
  editingMealId,
  setEditingMealId,
  sendMessage,
  updateMeal,
  handleConfirmMeal,
  cancelMealPreview,
}) {
  return (
    <div className="ai-coach-conversation" aria-live="polite">
      {historyLoading ? (
        <div className="ai-coach-empty">
          <LoaderCircle className="ai-coach-spinner" size={24} />
          <p>Restoring your conversation…</p>
        </div>
      ) : messages.length === 0 ? (
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
                disabled={historyLoading || loading || Boolean(savingMealId)}
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
                  Array.isArray(message.meals) &&
                  message.meals.length > 0 &&
                  message.mealStatus === "pending" && (
                  <CoachMealReview
                    message={message}
                    editingMealId={editingMealId}
                    setEditingMealId={setEditingMealId}
                    savingMealId={savingMealId}
                    updateMeal={updateMeal}
                    handleConfirmMeal={handleConfirmMeal}
                    cancelMealPreview={cancelMealPreview}
                  />
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
  );
}
