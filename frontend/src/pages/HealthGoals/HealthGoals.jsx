import { useEffect, useMemo, useState } from "react";
import { Flame, Target, Scale, Save, LoaderCircle } from "lucide-react";
import {
  getHealthGoals,
  createHealthGoals,
  updateHealthGoals,
} from "../../api/healthGoals";
import "./health-goals.css";

const initialGoals = {
  calories: "2100",
  protein: "120",
  carbs: "230",
  fat: "70",
  currentWeight: "74.2",
  targetWeight: "70",
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

export default function HealthGoals() {
  const [goals, setGoals] = useState(initialGoals);
  const [savedGoals, setSavedGoals] = useState(null);
  const [hasExistingGoal, setHasExistingGoal] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [notice, setNotice] = useState("");
  const [error, setError] = useState("");

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
          setError(apiError.message || "Unable to load your health goals.");
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
  const calorieDifference = macroCalories - (Number(goals.calories) || 0);

  const isSaved =
    savedGoals !== null &&
    Object.keys(goals).every((key) => goals[key] === savedGoals[key]);

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
            Personalize your daily targets. Every screen recalibrates to these
            numbers.
          </p>
        </div>
      </header>

      {loading && (
        <div className="health-goals-feedback visible" role="status">
          <LoaderCircle size={17} className="health-save-spinner" />
          Loading your saved goals...
        </div>
      )}

      {error && (
        <div className="health-goals-feedback visible" role="alert">
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
                <strong>{macroCalories.toLocaleString()} kcal</strong>
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
                    onChange={(event) => updateGoal("fat", event.target.value)}
                    required
                  />
                </label>
              </div>

              <p className="health-helper-text">
                Protein and carbs contribute 4 kcal per gram; fat contributes 9.
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
          className={`health-goals-feedback ${notice || (!isSaved && !loading && !error) ? "visible" : ""}`}
          role="status"
          aria-live="polite"
        >
          {notice ||
            (!loading && !error && !isSaved ? "You have unsaved changes." : "")}
        </div>
        <div className="health-goals-actions">
          <button
            className="health-save-button"
            type="submit"
            disabled={loading || saving}
          >
            {saving ? (
              <LoaderCircle size={18} className="health-save-spinner" />
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
