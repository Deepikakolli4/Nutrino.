import { Flame, Target } from "lucide-react";

export default function NutritionTargets({ goals, updateGoal }) {
  const macroCalories =
    (Number(goals.protein) || 0) * 4 +
    (Number(goals.carbs) || 0) * 4 +
    (Number(goals.fat) || 0) * 9;
  const calorieDifference =
    macroCalories - (Number(goals.calories) || 0);

  return (
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
  );
}
