import { Scale } from "lucide-react";

export default function WeightGoal({ goals, updateGoal }) {
  const currentWeight = Number(goals.currentWeight) || 0;
  const targetWeight = Number(goals.targetWeight) || 0;
  const weightDifference = currentWeight - targetWeight;
  const weightToGo = Math.abs(weightDifference);

  return (
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
  );
}
