import { useNavigate } from "react-router-dom";
import { ArrowRight, Flame, MessageCircle, Plus, Scale, Target } from "lucide-react";

function SummaryCard({ icon: Icon, label, children }) {
  return (
    <article className="nourish-summary-card">
      <div className="nourish-summary-label">
        <Icon size={18} />
        <span>{label}</span>
      </div>

      <div className="nourish-summary-value">{children}</div>
    </article>
  );
}

export default function DashboardInsights({
  averageCalories,
  todayEntries,
  healthGoals,
  goalsLoading,
  consumedCalories,
  dailyCalorieGoal,
}) {
  const navigate = useNavigate();

  const currentWeight =
    Number(healthGoals?.currentWeightKg) || 0;

  const targetWeight =
    Number(healthGoals?.targetWeightKg) || 0;

  // Calorie goal calculations.
  const calorieProgress =
    dailyCalorieGoal > 0
      ? (consumedCalories / dailyCalorieGoal) * 100
      : 0;

  const remainingCalories = Math.max(
    dailyCalorieGoal - consumedCalories,
    0,
  );


  const weightDifference = Math.abs(
    currentWeight - targetWeight,
  );

  const weightDirection =
    currentWeight > targetWeight
      ? "to lose"
      : currentWeight < targetWeight
      ? "to gain"
      : "target achieved";

  // Calorie goal status.
  const trackingStatus =
    dailyCalorieGoal <= 0
      ? "no-goal"
      : consumedCalories > dailyCalorieGoal
      ? "above"
      : consumedCalories === dailyCalorieGoal
      ? "reached"
      : "progress";

  const trackingMessage =
    trackingStatus === "no-goal"
      ? "Set your daily calorie goal in Health Goals."
      : trackingStatus === "above"
      ? "You've passed your daily target. Listen to your hunger and fullness cues. Your calorie target is a guide, not a strict limit."
      : trackingStatus === "reached"
      ? "You've reached your calorie target for today. Great job tracking your nutrition!"
      : `${remainingCalories.toLocaleString()} kcal below your target so far. Continue logging your meals throughout the day.`;

  return (
    <div className="nourish-dashboard-right">
      {/* SUMMARY CARDS */}
      <section className="nourish-summary-grid">
        <SummaryCard
          icon={Flame}
          label="7-day average"
        >
          {averageCalories.toLocaleString()}{" "}
          <small>kcal/day</small>
        </SummaryCard>

        <SummaryCard
          icon={Plus}
          label="Food entries today"
        >
          {todayEntries.length}{" "}
          <small>entries</small>
        </SummaryCard>

        <SummaryCard
          icon={Flame}
          label="Today's protein"
        >
          {Math.round(
            todayEntries.reduce(
              (total, entry) =>
                total +
                (Number(entry.protein) || 0),
              0,
            ),
          )}
          <small>g consumed</small>
        </SummaryCard>
      </section>

      {/* TRACKING AND AI COACH */}
      <div className="nourish-coach-row">
        {/* DAILY TRACKING CARD */}
        <article className="nourish-card nourish-tracking-card">
          <div className="nourish-tracking-heading">
            <Target size={22} />
            <h2>Daily Tracking</h2>
          </div>

          {/* CALORIE GOAL STATUS */}
          {goalsLoading ? (
            <p>Loading your health goals...</p>
          ) : dailyCalorieGoal > 0 ? (
            <>
              <div className="nourish-goal-status">
                <div className="nourish-goal-status-top">
                  <span className="nourish-goal-percentage">
                    {Math.round(calorieProgress)}%
                  </span>

                  <span
                    className={`nourish-goal-badge ${trackingStatus}`}
                  >
                    {trackingStatus === "above"
                      ? "Above target"
                      : trackingStatus === "reached"
                      ? "Goal reached"
                      : "Progress"}
                  </span>
                </div>

                <h3>
                  {trackingStatus === "above"
                    ? "You've passed your daily target"
                    : trackingStatus === "reached"
                    ? "Daily goal reached!"
                    : "You're making progress!"}
                </h3>

                <p>{trackingMessage}</p>
              </div>
            </>
          ) : (
            <div className="nourish-tracking-no-goal">
              <p>
                Set your daily calorie goal in Health Goals.
              </p>

              <button
                className="nourish-button secondary"
                onClick={() => navigate("/health-goals")}
              >
                Set calorie goal
                <ArrowRight size={16} />
              </button>
            </div>
          )}

          {/* WEIGHT TARGET */}
          <div className="nourish-weight-tracking">
            <div className="nourish-weight-heading">
              <Scale size={20} />
              <h3>Weight Target</h3>
            </div>

            {goalsLoading ? (
              <p>Loading weight target...</p>
            ) : currentWeight > 0 &&
              targetWeight > 0 ? (
              <>
                <div className="nourish-weight-values">
                  <div>
                    <span>Current</span>

                    <strong>
                      {currentWeight} kg
                    </strong>
                  </div>

                  <ArrowRight size={18} />

                  <div>
                    <span>Target</span>

                    <strong>
                      {targetWeight} kg
                    </strong>
                  </div>
                </div>

                <div className="nourish-weight-difference">
                  {currentWeight === targetWeight ? (
                    <p className="success">
                      Weight target achieved! Great job!
                    </p>
                  ) : (
                    <p>
                      <strong>
                        {weightDifference.toFixed(1)} kg
                      </strong>{" "}
                      {weightDirection}
                    </p>
                  )}
                </div>
              </>
            ) : (
              <div className="nourish-tracking-no-goal">
                <p>
                  Set your current and target weight
                  in Health Goals.
                </p>

                <button
                  className="nourish-button secondary"
                  onClick={() =>
                    navigate("/health-goals")
                  }
                >
                  Set weight target
                  <ArrowRight size={16} />
                </button>
              </div>
            )}
          </div>
        </article>

        {/* AI COACH CARD */}
        <article className="nourish-card nourish-coach-card">
          <div className="nourish-coach-icon">
            <MessageCircle size={36} />
          </div>

          <h2>Ask your nutrition coach</h2>

          <p>
            Get guidance about your food choices,
            calorie intake, and nutrition habits
            using your logged entries.
          </p>

          <button
            className="nourish-button secondary"
            onClick={() => navigate("/ai-coach")}
          >
            Open chat
            <ArrowRight size={16} />
          </button>
        </article>
      </div>
    </div>
  );
}
