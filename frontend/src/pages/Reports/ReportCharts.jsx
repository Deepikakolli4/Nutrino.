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
import MicronutrientSummary from "../../components/Summary/MicronutrientSummary";
import { formatNumber } from "./reportFormatting";

const MACRO_COLORS = {
  Protein: "#ff7168",
  Carbs: "#ffbd42",
  Fat: "#45c0e4",
};

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

export default function ReportCharts({
  data,
  goalData,
  hasGoals,
  loading,
  error,
  range,
  report,
}) {
  return (
    <>
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
    </>
  );
}
