import { useEffect, useState } from "react";
import { getCoachHistory, sendCoachMessage, confirmCoachMeal } from "../../api/aiCoach";
import "./AICoach.css";
import CoachConversation from "./CoachConversation";
import CoachComposer from "./CoachComposer";

function mapStoredMessage(record, index) {
  const role = String(record.role ?? "").toLowerCase();
  const content = String(record.content ?? "");
  const id = record.id ?? record._id ?? `history-${index}`;

  if (role === "user") {
    return { id, role: "user", text: content };
  }

  let data = null;
  try {
    data = JSON.parse(content);
  } catch {
    data = null;
  }

  const text =
    data && typeof data.reply === "string" && data.reply.trim()
      ? data.reply
      : content;

  const isMealPreview =
    data?.intent === "LOG_MEAL" &&
    ["CREATE_FOOD_ENTRIES", "CREATE_FOOD_ENTRY"].includes(data?.action) &&
    data?.requiresConfirmation === true &&
    (Array.isArray(data?.preview?.meals) || data?.preview);

  const previewMeals = isMealPreview
    ? Array.isArray(data.preview?.meals)
      ? data.preview.meals
      : [data.preview]
    : [];

  return {
    id,
    role: "assistant",
    text,
    data: data && typeof data === "object" ? data : null,
    meals: previewMeals.map(getMealFromPreview),
    mealStatus: isMealPreview
      ? "pending"
      : data?.mealStatus === "saved"
        ? "saved"
        : null,
    savedEntries: data?.savedEntries ?? (data?.savedEntry ? [data.savedEntry] : []),
  };
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

export default function AICoach() {
  const [messages, setMessages] = useState([]);
  const [historyLoading, setHistoryLoading] = useState(true);

  useEffect(() => {
    let active = true;

    async function loadHistory() {
      try {
        const history = await getCoachHistory();
        if (!active) return;

        const restored = Array.isArray(history)
          ? history.map(mapStoredMessage)
          : [];

        setMessages(restored);
      } catch (apiError) {
        if (active) {
          setError(
            apiError.message || "Unable to load your previous chat history.",
          );
        }
      } finally {
        if (active) setHistoryLoading(false);
      }
    }

    loadHistory();

    return () => {
      active = false;
    };
  }, []);
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

    if (!trimmed || loading || savingMealId || historyLoading) return;

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
        ["CREATE_FOOD_ENTRIES", "CREATE_FOOD_ENTRY"].includes(response.action) &&
        response.requiresConfirmation === true &&
        (Array.isArray(response.preview?.meals) || response.preview);

      const previewMeals = isMealPreview
        ? Array.isArray(response.preview?.meals)
          ? response.preview.meals
          : [response.preview]
        : [];

      const assistantMessage = {
        id: `${Date.now()}-assistant`,
        role: "assistant",
        text: reply,
        data: response,
        meals: previewMeals.map(getMealFromPreview),
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
    if (!Array.isArray(message.meals) || message.meals.length === 0 || savingMealId) {
      return;
    }

    const nutritionFields = ["calories", "protein", "carbs", "fat", "fiber", "sugar"];
    const payloads = [];

    for (let index = 0; index < message.meals.length; index += 1) {
      const meal = message.meals[index];
      const quantity = Number(meal.quantity);

      if (!meal.foodName.trim() || !meal.quantityUnit.trim()) {
        setError(`Food ${index + 1}: enter a food name and quantity unit.`);
        return;
      }

      if (!Number.isFinite(quantity) || quantity <= 0) {
        setError(`Food ${index + 1}: quantity must be greater than zero.`);
        return;
      }

      if (!meal.entryDate || !meal.mealType) {
        setError(`Food ${index + 1}: choose a meal type and date.`);
        return;
      }

      for (const key of nutritionFields) {
        const value = Number(meal[key]);
        if (meal[key] === "" || !Number.isFinite(value) || value < 0) {
          setError(`Food ${index + 1}: enter a valid non-negative ${key} value.`);
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

      payloads.push(payload);
    }

    setError("");
    setSavingMealId(message.id);

    try {
      const result = await confirmCoachMeal(payloads);

      if (result.saved !== true) {
        throw new Error(
          result.error || "The backend did not confirm that the food entries were saved.",
        );
      }

      updateMessage(message.id, {
        mealStatus: "saved",
        text: result.reply || `${payloads.length} food ${payloads.length === 1 ? "entry was" : "entries were"} saved successfully.`,
        savedEntries: result.entries || (result.entry ? [result.entry] : []),
      });

      setEditingMealId(null);
    } catch (apiError) {
      setError(apiError.message || "Unable to save the food entries. Please try again.");
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

  function updateMeal(messageId, mealIndex, key, value) {
    setMessages((previous) =>
      previous.map((message) =>
        message.id === messageId
          ? {
              ...message,
              meals: message.meals.map((meal, index) =>
                index === mealIndex ? { ...meal, [key]: value } : meal,
              ),
            }
          : message,
      ),
    );
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
        <CoachConversation
          messages={messages}
          historyLoading={historyLoading}
          loading={loading}
          savingMealId={savingMealId}
          editingMealId={editingMealId}
          setEditingMealId={setEditingMealId}
          sendMessage={sendMessage}
          updateMeal={updateMeal}
          handleConfirmMeal={handleConfirmMeal}
          cancelMealPreview={cancelMealPreview}
        />

        {error && (
          <div className="ai-coach-error" role="alert">
            <span>{error}</span>
            <button type="button" onClick={() => setError("")}>
              Dismiss
            </button>
          </div>
        )}

        <CoachComposer
          input={input}
          setInput={setInput}
          loading={loading}
          disabled={historyLoading || loading || Boolean(savingMealId)}
          handleSubmit={handleSubmit}
        />
      </section>
    </main>
  );
}
