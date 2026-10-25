
import { useEffect, useMemo, useState } from "react";
import {
  Flame,
  Target,
  Scale,
  Save,
  LoaderCircle,
  Activity,
} from "lucide-react";

import {
  getHealthGoals,
  createHealthGoals,
  updateHealthGoals,
} from "../../api/healthGoals";

import { getFoodEntries } from "../../api/foodEntries";
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

function ProgressItem({ label, current, target, unit, color }) {
  const percentage =
    target > 0 ? (current / target) * 100 : 0;

  const displayedPercentage = Math.round(percentage);
  const remaining = Math.max(target - current, 0);

  const formatNumber = (value) =>
    Number(value.toFixed(1)).toLocaleString();

  return (
    <div className="health-progress-item">
      <div className="health-progress-label">
        <span>{label}</span>
        <strong>{displayedPercentage}%</strong>
      </div>

      <div
        className="health-progress-track"
        role="progressbar"
        aria-label={`${label} daily goal progress`}
        aria-valuemin={0}
        aria-valuemax={100}
        aria-valuenow={Math.min(displayedPercentage, 100)}
      >
        <div
          className={`health-progress-fill ${color}`}
          style={{ width: `${Math.min(percentage, 100)}%` }}
        />
      </div>

      <div className="health-progress-values">
        <strong>
          {formatNumber(current)} / {formatNumber(target)} {unit}
        </strong>

        <span>
          {remaining > 0
            ? `${formatNumber(remaining)} ${unit} remaining`
            : "Target reached"}
        </span>
      </div>

      {percentage > 100 && (
        <p className="health-progress-over">
          Target exceeded by {formatNumber(current - target)} {unit}
        </p>
      )}
    </div>
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

  const macroCalories = useMemo(() => {
    return (
      (Number(goals.protein) || 0) * 4 +
      (Number(goals.carbs) || 0) * 4 +
      (Number(goals.fat) || 0) * 9
    );
  }, [goals.protein, goals.carbs, goals.fat]);

  const currentWeight = Number(goals.currentWeight) || 0;
  const targetWeight = Number(goals.targetWeight) || 0;
  const weightDifference = currentWeight - targetWeight;
  const weightToGo = Math.abs(weightDifference);

  const calorieDifference =
    macroCalories - (Number(goals.calories) || 0);

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

      {/* YOUR PROGRESS */}
      <section className="health-progress-card">
        <div className="health-progress-heading">
          <span className="health-goal-icon">
            <Activity size={22} />
          </span>

          <div>
            <h2>Your Progress</h2>
            <p>
              Today's nutrition compared with your saved goals
            </p>
          </div>
        </div>

        {progressLoading ? (
          <div className="health-progress-message" role="status">
            <LoaderCircle
              size={18}
              className="health-save-spinner"
            />
            Loading today's nutrition...
          </div>
        ) : progressError ? (
          <div className="health-progress-message" role="alert">
            {progressError}
          </div>
        ) : loading ? (
          <p className="health-progress-message">
            Loading your saved goals...
          </p>
        ) : !hasExistingGoal ? (
          <div className="health-progress-empty">
            <Target size={24} />
            <p>
              Save your health goals below to start tracking your
              daily nutrition progress.
            </p>
          </div>
        ) : (
          <>
            <div className="health-progress-date">
              Today's logged food
            </div>

            <div className="health-progress-grid">
              <ProgressItem
                label="Calories"
                current={todayIntake.calories}
                target={Number(goals.calories) || 0}
                unit="kcal"
                color="calories"
              />

              <ProgressItem
                label="Protein"
                current={todayIntake.protein}
                target={Number(goals.protein) || 0}
                unit="g"
                color="protein"
              />

              <ProgressItem
                label="Carbohydrates"
                current={todayIntake.carbs}
                target={Number(goals.carbs) || 0}
                unit="g"
                color="carbs"
              />

              <ProgressItem
                label="Fat"
                current={todayIntake.fat}
                target={Number(goals.fat) || 0}
                unit="g"
                color="fat"
              />
            </div>

            <p className="health-progress-footnote">
              Progress is calculated from your logged food entries
              for today. 
            </p>
          </>
        )}
      </section>

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
          <div className="health-goals-top-grid">
            <section className="health-goal-card">
              <div className="health-card-title">
                <span className="health-goal-icon">
                  <Flame size={22} />
                </span>
                <h2>Daily calorie target</h2>
              </div>

              <label className="health-field health-calorie-field">
                <span>Calories (kcal)</span>
                <input
                  type="number"
                  min="1"
                  max="10000"
                  step="1"
                  value={goals.calories}
                  onChange={(event) =>
                    updateGoal("calories", event.target.value)
                  }
                  required
                />
              </label>

              <div className="health-goal-note">
                Macros below currently sum to{" "}
                <strong>
                  {macroCalories.toLocaleString()} kcal
                </strong>
                {" — "}
                {Math.abs(calorieDifference) <= 100
                  ? "well aligned with your calorie target."
                  : `${calorieDifference > 0 ? "above" : "below"} your calorie target by ${Math.abs(
                      calorieDifference,
                    ).toLocaleString()} kcal.`}
              </div>
            </section>

            <section className="health-goal-card">
              <div className="health-card-title">
                <span className="health-goal-icon">
                  <Target size={22} />
                </span>
                <h2>Macro targets / day</h2>
              </div>

              <div className="health-macro-fields">
                <label className="health-field">
                  <span>Protein (g)</span>
                  <input
                    className="health-protein-input"
                    type="number"
                    min="0"
                    max="1000"
                    step="any"
                    value={goals.protein}
                    onChange={(event) =>
                      updateGoal("protein", event.target.value)
                    }
                    required
                  />
                </label>

                <label className="health-field">
                  <span>Carbs (g)</span>
                  <input
                    className="health-carbs-input"
                    type="number"
                    min="0"
                    max="1000"
                    step="any"
                    value={goals.carbs}
                    onChange={(event) =>
                      updateGoal("carbs", event.target.value)
                    }
                    required
                  />
                </label>

                <label className="health-field">
                  <span>Fat (g)</span>
                  <input
                    className="health-fat-input"
                    type="number"
                    min="0"
                    max="1000"
                    step="any"
                    value={goals.fat}
                    onChange={(event) =>
                      updateGoal("fat", event.target.value)
                    }
                    required
                  />
                </label>
              </div>

              <p className="health-helper-text">
                Protein and carbs contribute 4 kcal per gram; fat
                contributes 9.
              </p>
            </section>
          </div>

          <section className="health-goal-card health-weight-card">
            <div className="health-card-title">
              <span className="health-goal-icon">
                <Scale size={22} />
              </span>
              <h2>Weight goal</h2>
            </div>

            <div className="health-weight-fields">
              <label className="health-field">
                <span>Current weight (kg)</span>
                <input
                  type="number"
                  min="1"
                  max="500"
                  step="0.1"
                  value={goals.currentWeight}
                  onChange={(event) =>
                    updateGoal("currentWeight", event.target.value)
                  }
                  required
                />
              </label>

              <label className="health-field">
                <span>Target weight (kg)</span>
                <input
                  type="number"
                  min="1"
                  max="500"
                  step="0.1"
                  value={goals.targetWeight}
                  onChange={(event) =>
                    updateGoal("targetWeight", event.target.value)
                  }
                  required
                />
              </label>

              <div className="health-weight-summary">
                <span>
                  {weightDifference === 0
                    ? "GOAL REACHED"
                    : weightDifference > 0
                      ? "TO LOSE"
                      : "TO GAIN"}
                </span>
                <strong>{weightToGo.toFixed(1)} kg</strong>
              </div>
            </div>
          </section>
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
