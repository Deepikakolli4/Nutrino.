import { formatNumber } from "./reportFormatting";

export default function ReportSummary({
  loading,
  error,
  averageCalories,
  averageProtein,
  averageCarbs,
  totalLogged,
}) {
  const hasLoggedData = totalLogged > 0;

  return (
    <>
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
          <span>Avg carbohydrates</span>
          <div>
            {loading ? "…" : error ? "—" : formatNumber(averageCarbs, 1)}
            <small> g/day</small>
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
    </>
  );
}
