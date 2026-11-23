function MacroProgress({ label, consumed, color }) {
  return (
    <div className="nourish-macro">
      <div className="nourish-macro-heading">
        <span>{label}</span>
        <span>{Math.round(consumed)}g</span>
      </div>

      <div className="nourish-progress-track">
        <div
          className="nourish-progress-fill"
          style={{
            width: consumed > 0 ? "100%" : "0%",
            background: color,
          }}
        />
      </div>
    </div>
  );
}

export default function CaloriesCard({ consumedCalories, dailyCalorieGoal, macros }) {
  return (
    <article className="nourish-card nourish-calorie-card">
      <h2 className="nourish-today-title">
        Today's calories
      </h2>

      <div
        className="nourish-calorie-ring"
        role="img"
        aria-label={`${Math.round(
          consumedCalories,
        )} calories consumed today`}
      >
        <svg
          viewBox="0 0 200 200"
          className="nourish-ring-svg"
          aria-hidden="true"
        >
          <defs>
            <linearGradient
              id="calorieGradient"
              x1="0"
              y1="0"
              x2="1"
              y2="1"
            >
              <stop offset="0%" stopColor="#b4f34a" />
              <stop offset="100%" stopColor="#58df9b" />
            </linearGradient>
          </defs>

          <circle
            className="nourish-ring-track"
            cx="100"
            cy="100"
            r="84"
          />

          <circle
            className="nourish-ring-value"
            cx="100"
            cy="100"
            r="84"
            stroke="url(#calorieGradient)"
            strokeDasharray={`${
              dailyCalorieGoal > 0
                ? Math.min(
                    consumedCalories / dailyCalorieGoal,
                    1,
                  ) *
                  2 *
                  Math.PI *
                  84
                : consumedCalories > 0
                ? 1
                : 0
            } ${2 * Math.PI * 84}`}
          />
        </svg>

        <div className="nourish-ring-center">
          <strong>
            {Math.round(
              consumedCalories,
            ).toLocaleString()}
          </strong>

          <span>
            {dailyCalorieGoal > 0
              ? `of ${dailyCalorieGoal.toLocaleString()} kcal`
              : "kcal consumed"}
          </span>
        </div>
      </div>

      <div className="nourish-macros">
        {macros.map((macro) => (
          <MacroProgress
            key={macro.label}
            {...macro}
          />
        ))}
      </div>
    </article>
  );
}
