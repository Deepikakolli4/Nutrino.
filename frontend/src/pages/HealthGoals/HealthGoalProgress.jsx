import { Activity, LoaderCircle, Target } from "lucide-react";

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

export default function HealthGoalProgress({
  goals,
  hasExistingGoal,
  loading,
  todayIntake,
  progressLoading,
  progressError,
}) {
  return (
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
  );
}
