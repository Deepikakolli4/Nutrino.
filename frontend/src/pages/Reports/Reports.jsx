import { useEffect, useMemo, useState } from "react";
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  Legend,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { getNutritionReportRange } from "../../api/nutritionReports";
import "./reports.css";
import MicronutrientSummary from "../../components/Summary/MicronutrientSummary";

const MACRO_COLORS = {
  Protein: "#ff7168",
  Carbs: "#ffbd42",
  Fat: "#45c0e4",
};

const NUTRIENT_COLORS = [
  "#b4f34a",
  "#ff7168",
  "#ffbd42",
  "#45c0e4",
  "#b995ff",
  "#67d6a3",
  "#ff9f70",
];

const GOAL_NUTRIENTS = [
  { name: "Calories", key: "calories" },
  { name: "Protein", key: "protein" },
  { name: "Carbs", key: "carbs" },
  { name: "Fat", key: "fat" },
];

function formatNumber(value, maximumFractionDigits = 0) {
  const number = Number(value);

  if (!Number.isFinite(number)) return "0";

  return number.toLocaleString("en-IN", {
    maximumFractionDigits,
  });
}

function formatDay(date) {
  if (!date) return "";

  return new Date(`${date}T12:00:00`).toLocaleDateString("en-IN", {
    day: "2-digit",
    month: "short",
  });
}

function CustomTooltip({ active, payload, label }) {
  if (!active || !payload?.length) return null;

  return (
    <div className="report-tooltip">
      <strong>{label}</strong>

      {payload.map((item) => {
        const key = String(item.dataKey);
        const isCalories = key === "calories";
        const isGrams = ["protein", "carbs", "fat", "fiber", "sugar"].includes(
          key,
        );

        return (
          <div key={key}>
            <span
              style={{
                background: item.color || item.fill || "#b4f34a",
              }}
            />
            {item.name}: {formatNumber(item.value, 1)}
            {isCalories ? " kcal" : isGrams ? " g" : ""}
          </div>
        );
      })}
    </div>
  );
}

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

  const daysOnTarget = data.filter((day) => {
    const comparison = getGoalComparison(day, "calories");

    if (!comparison) return false;

    const target = Number(comparison.target);
    const actual = Number(comparison.actual);

    return (
      target > 0 &&
      Number.isFinite(actual) &&
      Math.abs(actual - target) / target <= 0.1
    );
  }).length;

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

  const nutrientTotals = useMemo(() => {
    if (!report) return [];

    return [
      {
        name: "Fiber",
        amount: report.totalFiber,
        unit: "g",
      },
      {
        name: "Sugar",
        amount: report.totalSugar,
        unit: "g",
      },
      ...Object.entries(report.vitamins || {}).map(([name, amount]) => ({
        name,
        amount,
        unit: "",
      })),
      ...Object.entries(report.minerals || {}).map(([name, amount]) => ({
        name,
        amount,
        unit: "",
      })),
    ];
  }, [report]);

  const hasLoggedData = totalLogged > 0;

  return (
    <main className="reports-page">
      <header className="reports-header">
        <div>
          <p className="reports-eyebrow">INSIGHTS</p>

          <h1>
            Nutrition <span>Reports.</span>
          </h1>

          <p className="reports-subtitle">
            See how your intake trends against your goals.
          </p>

          {report && (
            <p className="reports-subtitle">
              {formatDay(report.startDate)} – {formatDay(report.endDate)}
            </p>
          )}
        </div>

        <div
          className="reports-range"
          role="group"
          aria-label="Report date range"
        >
          {[7, 14, 30].map((days) => (
            <button
              key={days}
              type="button"
              className={range === days ? "active" : ""}
              aria-pressed={range === days}
              onClick={() => setRange(days)}
            >
              {days}D
            </button>
          ))}
        </div>
      </header>

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

      <section className="reports-stat-grid" aria-label="Nutrition summary">
        <article className="reports-stat-card">
          <span>Avg calories</span>
          <div>
            {loading ? "…" : error ? "—" : formatNumber(averageCalories)}
            <small> kcal/day</small>
          </div>
        </article>

        <article className="reports-stat-card">
          <span>Avg protein</span>
          <div>
            {loading ? "…" : error ? "—" : formatNumber(averageProtein, 1)}
            <small> g/day</small>
          </div>
        </article>

        <article className="reports-stat-card">
          <span>Days on target</span>
          <div>
            {loading || error
              ? "—"
              : hasGoals
                ? `${daysOnTarget}/${range}`
                : "—"}
            <small> ±10%</small>
          </div>
        </article>

        <article className="reports-stat-card">
          <span>Total logged</span>
          <div>
            {loading ? "…" : error ? "—" : formatNumber(totalLogged)}
            <small> entries</small>
          </div>
        </article>
      </section>

      {!loading && !error && !hasLoggedData && (
        <section
          className="reports-panel"
          style={{ marginBottom: 20 }}
          role="status"
        >
          <h2>No food entries in this period</h2>
          <p className="reports-subtitle">
            Log meals to see your nutrition trends and summaries here.
          </p>
        </section>
      )}

      <section className="reports-panel reports-calorie-panel">
        <h2>Calorie intake trend</h2>

        <div className="reports-chart reports-chart-tall">
          {loading ? (
            <p className="reports-subtitle">Loading report data…</p>
          ) : error ? (
            <p className="reports-subtitle">Calorie chart is unavailable.</p>
          ) : (
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart
                data={data}
                margin={{ top: 12, right: 12, left: 0, bottom: 0 }}
              >
                <defs>
                  <linearGradient id="calorieFill" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#b4f34a" stopOpacity={0.28} />
                    <stop
                      offset="100%"
                      stopColor="#b4f34a"
                      stopOpacity={0.015}
                    />
                  </linearGradient>
                </defs>

                <CartesianGrid vertical={false} stroke="#202d24" />

                <XAxis
                  dataKey="day"
                  axisLine={false}
                  tickLine={false}
                  tick={{ fill: "#929d90", fontSize: 12 }}
                  interval={range === 30 ? 4 : range === 14 ? 1 : 0}
                  dy={7}
                />

                <YAxis
                  domain={[0, "auto"]}
                  axisLine={false}
                  tickLine={false}
                  tick={{ fill: "#929d90", fontSize: 12 }}
                  width={52}
                />

                <Tooltip content={<CustomTooltip />} />

                <Area
                  type="monotone"
                  dataKey="calories"
                  name="Calories"
                  stroke="#b4f34a"
                  strokeWidth={3}
                  fill="url(#calorieFill)"
                  activeDot={{
                    r: 5,
                    fill: "#b4f34a",
                    stroke: "#0b1710",
                    strokeWidth: 2,
                  }}
                  dot={
                    range === 30
                      ? false
                      : {
                          r: 3,
                          fill: "#b4f34a",
                          stroke: "#b4f34a",
                        }
                  }
                />
              </AreaChart>
            </ResponsiveContainer>
          )}
        </div>
      </section>

      <section className="reports-chart-grid">
        <article className="reports-panel">
          <h2>Macronutrient breakdown (g)</h2>

          <div className="reports-chart reports-chart-medium">
            {loading ? (
              <p className="reports-subtitle">Loading chart…</p>
            ) : error ? (
              <p className="reports-subtitle">Chart unavailable.</p>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  data={data}
                  margin={{ top: 12, right: 8, left: -8, bottom: 0 }}
                >
                  <CartesianGrid vertical={false} stroke="#202d24" />

                  <XAxis
                    dataKey="day"
                    axisLine={false}
                    tickLine={false}
                    tick={{ fill: "#929d90", fontSize: 12 }}
                    interval={range === 30 ? 4 : range === 14 ? 1 : 0}
                  />

                  <YAxis
                    axisLine={false}
                    tickLine={false}
                    tick={{ fill: "#929d90", fontSize: 12 }}
                  />

                  <Tooltip content={<CustomTooltip />} />

                  <Legend
                    iconType="square"
                    wrapperStyle={{
                      color: "#cbd3c7",
                      fontSize: 12,
                      paddingTop: 10,
                    }}
                  />

                  <Bar
                    dataKey="protein"
                    name="Protein"
                    stackId="macro"
                    fill={MACRO_COLORS.Protein}
                  />

                  <Bar
                    dataKey="carbs"
                    name="Carbs"
                    stackId="macro"
                    fill={MACRO_COLORS.Carbs}
                  />

                  <Bar
                    dataKey="fat"
                    name="Fat"
                    stackId="macro"
                    fill={MACRO_COLORS.Fat}
                    radius={[5, 5, 0, 0]}
                  />
                </BarChart>
              </ResponsiveContainer>
            )}
          </div>
        </article>

        <article className="reports-panel">
          <h2>Goal vs actual (daily average)</h2>

          <div className="reports-chart reports-chart-medium">
            {loading ? (
              <p className="reports-subtitle">Loading chart…</p>
            ) : error ? (
              <p className="reports-subtitle">Chart unavailable.</p>
            ) : !hasGoals ? (
              <p className="reports-subtitle">
                No goal comparisons are available. Set your health goals and log
                meals to see this chart.
              </p>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  data={goalData}
                  layout="vertical"
                  margin={{ top: 12, right: 8, left: 12, bottom: 4 }}
                  barCategoryGap={24}
                >
                  <CartesianGrid horizontal={false} stroke="#202d24" />

                  <XAxis
                    type="number"
                    domain={[0, "auto"]}
                    tickFormatter={(value) => `${value}%`}
                    axisLine={false}
                    tickLine={false}
                    tick={{ fill: "#929d90", fontSize: 12 }}
                  />

                  <YAxis
                    type="category"
                    dataKey="name"
                    axisLine={false}
                    tickLine={false}
                    tick={{ fill: "#929d90", fontSize: 12 }}
                    width={76}
                  />

                  <Tooltip
                    formatter={(value, name) => [
                      `${value}%`,
                      name === "actual" ? "Actual" : "Goal",
                    ]}
                    contentStyle={{
                      background: "#0d1912",
                      border: "1px solid #293a2d",
                      borderRadius: 10,
                      color: "#edf0e8",
                    }}
                  />

                  <Bar
                    dataKey="goal"
                    name="Goal"
                    fill="#18251c"
                    barSize={15}
                    radius={[0, 8, 8, 0]}
                  />

                  <Bar
                    dataKey="actual"
                    name="Actual"
                    fill="#b4f34a"
                    barSize={15}
                    radius={[0, 8, 8, 0]}
                  />
                </BarChart>
              </ResponsiveContainer>
            )}
          </div>
        </article>

        <MicronutrientSummary report={report} />

        <article className="reports-panel">
          <h2>Fiber and sugar trends</h2>

          <div className="reports-chart reports-chart-medium">
            {loading ? (
              <p className="reports-subtitle">Loading chart…</p>
            ) : error ? (
              <p className="reports-subtitle">Chart unavailable.</p>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart
                  data={data}
                  margin={{ top: 12, right: 8, left: -8, bottom: 0 }}
                >
                  <CartesianGrid vertical={false} stroke="#202d24" />

                  <XAxis
                    dataKey="day"
                    axisLine={false}
                    tickLine={false}
                    tick={{ fill: "#929d90", fontSize: 12 }}
                    interval={range === 30 ? 4 : range === 14 ? 1 : 0}
                  />

                  <YAxis
                    axisLine={false}
                    tickLine={false}
                    tick={{ fill: "#929d90", fontSize: 12 }}
                  />

                  <Tooltip content={<CustomTooltip />} />

                  <Legend
                    iconType="square"
                    wrapperStyle={{
                      color: "#cbd3c7",
                      fontSize: 12,
                      paddingTop: 10,
                    }}
                  />

                  <Area
                    type="monotone"
                    dataKey="fiber"
                    name="Fiber"
                    stroke="#b4f34a"
                    fill="#b4f34a"
                    fillOpacity={0.15}
                  />

                  <Area
                    type="monotone"
                    dataKey="sugar"
                    name="Sugar"
                    stroke="#ff7168"
                    fill="#ff7168"
                    fillOpacity={0.12}
                  />
                </AreaChart>
              </ResponsiveContainer>
            )}
          </div>
        </article>
      </section>

      {/* <p className="reports-disclaimer">
        Nutrition totals are calculated from your logged food entries.
        They may not represent your complete intake if some meals were
        not recorded. Vitamin and mineral amounts are shown as recorded;
        daily-value percentages are not provided by the current API.
      </p> */}
    </main>
  );
}
