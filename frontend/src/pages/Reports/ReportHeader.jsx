import { formatDay } from "./reportFormatting";

export default function ReportHeader({ report, range, setRange }) {
  return (
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
  );
}
