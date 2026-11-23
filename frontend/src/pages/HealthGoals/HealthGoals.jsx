import { useEffect, useState } from "react";
import { LoaderCircle, Save } from "lucide-react";
import {
  getHealthGoals,
  createHealthGoals,
  updateHealthGoals,
} from "../../api/healthGoals";

import { getFoodEntries } from "../../api/foodEntries";
import HealthGoalProgress from "./HealthGoalProgress";
import NutritionTargets from "./NutritionTargets";
import WeightGoal from "./WeightGoal";
import "./health-goals.css";

const initialGoals = {
  calories: "2100",
  protein: "120",
  carbs: "230",
  fat: "70",
  currentWeight: "74.2",
  targetWeight: "70",
};

const emptyIntake = {
  calories: 0,
  protein: 0,
  carbs: 0,
  fat: 0,
};

function mapApiGoalsToForm(goal) {
  return {
    calories: String(goal.dailyCalorieTarget ?? ""),
    protein: String(goal.proteinTarget ?? ""),
    carbs: String(goal.carbsTarget ?? ""),
    fat: String(goal.fatTarget ?? ""),
    currentWeight: String(goal.currentWeightKg ?? ""),
    targetWeight: String(goal.targetWeightKg ?? ""),
  };
}

function mapFormGoalsToApi(goals) {
  return {
    dailyCalorieTarget: Number(goals.calories),
    proteinTarget: Number(goals.protein),
    carbsTarget: Number(goals.carbs),
    fatTarget: Number(goals.fat),
    currentWeightKg: Number(goals.currentWeight),
    targetWeightKg: Number(goals.targetWeight),
  };
}

function validateGoals(goals) {
  const fields = [
    { key: "calories", label: "Daily calorie target", min: 1, max: 10000 },
    { key: "protein", label: "Protein target", min: 0, max: 1000 },
    { key: "carbs", label: "Carbohydrate target", min: 0, max: 1000 },
    { key: "fat", label: "Fat target", min: 0, max: 1000 },
    { key: "currentWeight", label: "Current weight", min: 1, max: 500 },
    { key: "targetWeight", label: "Target weight", min: 1, max: 500 },
  ];

  for (const field of fields) {
    const rawValue = goals[field.key];
    const value = Number(rawValue);

    if (
      rawValue.trim() === "" ||
      !Number.isFinite(value) ||
      value < field.min ||
      value > field.max
    ) {
      return `${field.label} must be between ${field.min} and ${field.max}.`;
    }
  }

  return "";
}

function getLocalDateString() {
  const today = new Date();

  const year = today.getFullYear();
  const month = String(today.getMonth() + 1).padStart(2, "0");
  const day = String(today.getDate()).padStart(2, "0");

  return `${year}-${month}-${day}`;
}

function calculateIntake(entries) {
  return entries.reduce(
    (total, entry) => ({
      calories: total.calories + (Number(entry.calories) || 0),
      protein: total.protein + (Number(entry.protein) || 0),
      carbs: total.carbs + (Number(entry.carbs) || 0),
      fat: total.fat + (Number(entry.fat) || 0),
    }),
    { ...emptyIntake },
  );
}

export default function HealthGoals() {
  const [goals, setGoals] = useState(initialGoals);
  const [savedGoals, setSavedGoals] = useState(null);
  const [hasExistingGoal, setHasExistingGoal] = useState(false);

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const [todayIntake, setTodayIntake] = useState({ ...emptyIntake });
  const [progressLoading, setProgressLoading] = useState(true);
  const [progressError, setProgressError] = useState("");

  const [notice, setNotice] = useState("");
  const [error, setError] = useState("");

  // Load saved health goals.
  useEffect(() => {
    let cancelled = false;

    async function loadGoals() {
      setLoading(true);
      setError("");
      setNotice("");

      try {
        const saved = await getHealthGoals();

        if (cancelled) return;

        const formGoals = mapApiGoalsToForm(saved);

        setGoals(formGoals);
        setSavedGoals(formGoals);
        setHasExistingGoal(true);
      } catch (apiError) {
        if (cancelled) return;

        if (apiError.status === 404) {
          setGoals({ ...initialGoals });
          setSavedGoals(null);
          setHasExistingGoal(false);
        } else {
          setError(
            apiError.message || "Unable to load your health goals.",
          );
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    }

    loadGoals();

    return () => {
      cancelled = true;
    };
  }, []);

  // Load today's logged nutrition.
  useEffect(() => {
    let cancelled = false;

    async function loadTodayIntake() {
      setProgressLoading(true);
      setProgressError("");

      try {
        const today = getLocalDateString();

        const response = await getFoodEntries({
          startDate: today,
          endDate: today,
          page: 0,
          size: 100,
        });

        const entries = Array.isArray(response)
          ? response
          : Array.isArray(response?.content)
            ? response.content
            : [];

        const totals = calculateIntake(entries);

        if (!cancelled) {
          setTodayIntake(totals);
        }
      } catch (apiError) {
        if (!cancelled) {
          setProgressError(
            apiError.message || "Unable to load today's nutrition.",
          );
        }
      } finally {
        if (!cancelled) {
          setProgressLoading(false);
        }
      }
    }

    loadTodayIntake();

    return () => {
      cancelled = true;
    };
  }, []);

  const isSaved =
    savedGoals !== null &&
    Object.keys(goals).every(
      (key) => goals[key] === savedGoals[key],
    );

  function updateGoal(field, value) {
    setGoals((previous) => ({
      ...previous,
      [field]: value,
    }));

    setNotice("");
    setError("");
  }

  async function saveGoals(event) {
    event.preventDefault();

    if (loading || saving) return;

    const validationError = validateGoals(goals);

    if (validationError) {
      setError(validationError);
      setNotice("");
      return;
    }

    setSaving(true);
    setError("");
    setNotice("");

    try {
      const payload = mapFormGoalsToApi(goals);

      const saved = hasExistingGoal
        ? await updateHealthGoals(payload)
        : await createHealthGoals(payload);

      const formGoals = mapApiGoalsToForm(saved);

      setGoals(formGoals);
      setSavedGoals(formGoals);
      setHasExistingGoal(true);

      setNotice("Your health goals have been saved successfully.");
    } catch (apiError) {
      setError(
        apiError.message ||
          "Unable to save your health goals. Please try again.",
      );
    } finally {
      setSaving(false);
    }
  }

  return (
    <main className="health-goals-page">
      <header className="health-goals-header">
        <div>
          <p className="health-goals-eyebrow">Targets</p>

          <h1>
            Health <span>Goals.</span>
          </h1>

          <p>
            Personalize your daily targets. Every screen recalibrates
            to these numbers.
          </p>
        </div>
      </header>

      <HealthGoalProgress
        goals={goals}
        hasExistingGoal={hasExistingGoal}
        loading={loading}
        todayIntake={todayIntake}
        progressLoading={progressLoading}
        progressError={progressError}
      />

      {loading && (
        <div
          className="health-goals-feedback visible"
          role="status"
        >
          <LoaderCircle
            size={17}
            className="health-save-spinner"
          />
          Loading your saved goals...
        </div>
      )}

      {error && (
        <div
          className="health-goals-feedback visible"
          role="alert"
        >
          {error}
        </div>
      )}

      <form id="health-goals-form" onSubmit={saveGoals}>
        <fieldset
          className="health-goals-fieldset"
          disabled={loading || saving}
        >
          <NutritionTargets goals={goals} updateGoal={updateGoal} />
          <WeightGoal goals={goals} updateGoal={updateGoal} />
        </fieldset>

        <div
          className={`health-goals-feedback ${
            notice || (!isSaved && !loading && !error)
              ? "visible"
              : ""
          }`}
          role="status"
          aria-live="polite"
        >
          {notice ||
            (!loading && !error && !isSaved
              ? "You have unsaved changes."
              : "")}
        </div>

        <div className="health-goals-actions">
          <button
            className="health-save-button"
            type="submit"
            disabled={loading || saving}
          >
            {saving ? (
              <LoaderCircle
                size={18}
                className="health-save-spinner"
              />
            ) : (
              <Save size={18} />
            )}

            {saving
              ? "Saving..."
              : hasExistingGoal
                ? "Update goals"
                : "Save goals"}
          </button>
        </div>
      </form>
    </main>
  );
}
