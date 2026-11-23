import { useEffect, useMemo, useState } from "react";
import { getNutritionReportRange } from "../../api/nutritionReports";
import "./reports.css";
import ReportHeader from "./ReportHeader";
import ReportSummary from "./ReportSummary";
import ReportCharts from "./ReportCharts";
import { formatDay } from "./reportFormatting";

const GOAL_NUTRIENTS = [
  { name: "Calories", key: "calories" },
  { name: "Protein", key: "protein" },
  { name: "Carbs", key: "carbs" },
  { name: "Fat", key: "fat" },
];

function getGoalComparison(day, nutrient) {
  return day.goalComparison?.[nutrient] || null;
}

export default function Reports() {
  const [range, setRange] = useState(7);
  const [report, setReport] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [refreshKey, setRefreshKey] = useState(0);

  useEffect(() => {
    let cancelled = false;

    async function loadReport() {
      setLoading(true);
      setError("");

      try {
        const result = await getNutritionReportRange(range);

        if (!cancelled) {
          setReport(result);
        }
      } catch (err) {
        if (!cancelled) {
          setReport(null);
          setError(err.message || "Unable to load nutrition report.");
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    }

    loadReport();

    return () => {
      cancelled = true;
    };
  }, [range, refreshKey]);

  const data = useMemo(() => {
    if (!report?.dailySummaries) return [];

    return Object.entries(report.dailySummaries)
      .sort(([dateA], [dateB]) => dateA.localeCompare(dateB))
      .map(([date, day]) => ({
        date,
        day: formatDay(date),
        calories: Number(day.totalCalories) || 0,
        protein: Number(day.totalProtein) || 0,
        carbs: Number(day.totalCarbs) || 0,
        fat: Number(day.totalFat) || 0,
        fiber: Number(day.totalFiber) || 0,
        sugar: Number(day.totalSugar) || 0,
        entries: Number(day.totalEntries) || 0,
        goalComparison: day.goalComparison || null,
      }));
  }, [report]);

  const average = (field) => {
    if (!data.length) return 0;

    return data.reduce((sum, day) => sum + day[field], 0) / data.length;
  };

  const averageCalories = average("calories");
  const averageProtein = average("protein");
  const totalLogged = data.reduce((sum, day) => sum + day.entries, 0);

  const hasGoals = data.some((day) => day.goalComparison);

  const goalData = GOAL_NUTRIENTS.map(({ name, key }) => {
    const values = data
      .map((day) => {
        const comparison = getGoalComparison(day, key);
        if (!comparison) return null;

        const percentage = Number(comparison.percentageAchieved);

        return Number.isFinite(percentage) ? percentage : null;
      })
      .filter((value) => value !== null);

    return {
      name,
      actual: values.length
        ? Math.round(
            values.reduce((sum, value) => sum + value, 0) / values.length,
          )
        : 0,
      goal: 100,
    };
  });

  return (
    <main className="reports-page">
      <ReportHeader report={report} range={range} setRange={setRange} />

      {error && (
        <div
          className="reports-error"
          role="alert"
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            gap: 12,
            padding: 16,
            marginBottom: 20,
            border: "1px solid rgba(255,100,100,0.3)",
            borderRadius: 12,
            color: "#ff9999",
          }}
        >
          <span>{error}</span>

          <button
            type="button"
            onClick={() => setRefreshKey((value) => value + 1)}
          >
            Retry
          </button>
        </div>
      )}

      <ReportSummary
        loading={loading}
        error={error}
        averageCalories={averageCalories}
        averageProtein={averageProtein}
        averageCarbs={average("carbs")}
        totalLogged={totalLogged}
      />
      <ReportCharts
        data={data}
        goalData={goalData}
        hasGoals={hasGoals}
        loading={loading}
        error={error}
        range={range}
        report={report}
      />
    </main>
  );
}
