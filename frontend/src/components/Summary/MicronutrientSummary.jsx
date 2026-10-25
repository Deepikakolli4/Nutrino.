import "./MicronutrientSummary.css";

const COLORS = [
  "#b4f34a",
  "#ff7168",
  "#ffbd42",
  "#45c0e4",
  "#b995ff",
  "#67d6a3",
  "#ff9f70",
];

// Adult reference values for visualization.
// Sugar uses 50 g as an added-sugar reference only;
// it is not a daily value for total sugars.
const REFERENCE_VALUES = {
  Fiber: 28,
  Sugar: 50,
  Sodium: 2300,
  "Vitamin A": 900,
  "Vitamin C": 90,
  Calcium: 1300,
  Iron: 18,
};

const DISPLAY_UNITS = {
  Fiber: "g",
  Sugar: "g",
  Sodium: "mg",
  "Vitamin A": "mcg",
  "Vitamin C": "mg",
  Calcium: "mg",
  Iron: "mg",
};

function findAmount(report, nutrient) {
  const normalized = (value) =>
    String(value)
      .toLowerCase()
      .replace(/[^a-z]/g, "");

  const findValue = (source, names) => {
    if (!source || typeof source !== "object") return null;

    const key = Object.keys(source).find((candidate) =>
      names.some((name) => normalized(candidate) === normalized(name)),
    );

    if (key === undefined) return null;

    const value = Number(source[key]);
    return Number.isFinite(value) && value >= 0 ? value : null;
  };

  if (nutrient === "Fiber") {
    const value = Number(report?.totalFiber);
    return Number.isFinite(value) && value >= 0 ? value : 0;
  }

  if (nutrient === "Sugar") {
    const value = Number(report?.totalSugar);
    return Number.isFinite(value) && value >= 0 ? value : 0;
  }

  if (nutrient === "Sodium") {
    return (
      findValue(report?.minerals, ["Sodium"]) ??
      findValue(report?.micronutrients, ["Sodium"]) ??
      0
    );
  }

  if (nutrient === "Vitamin A") {
    return findValue(report?.vitamins, ["Vitamin A", "VitaminA"]) ?? 0;
  }

  if (nutrient === "Vitamin C") {
    return findValue(report?.vitamins, ["Vitamin C", "VitaminC"]) ?? 0;
  }

  return (
    findValue(report?.minerals, [nutrient]) ??
    findValue(report?.micronutrients, [nutrient]) ??
    0
  );
}

function formatAmount(value) {
  return Number(value).toLocaleString("en-IN", {
    maximumFractionDigits: 2,
  });
}

function Ring({ nutrient, amount, index }) {
  const radius = 18 + index * 10;
  const circumference = 2 * Math.PI * radius;

  // These are reference comparisons, not personalized goal targets.
  const percentage =
    nutrient === "Sugar"
      ? null
      : Math.min(100, Math.round((amount / REFERENCE_VALUES[nutrient]) * 100));

  const offset =
    percentage === null
      ? circumference
      : circumference * (1 - percentage / 100);

  return (
    <circle
      className="micro-ring-progress"
      cx="120"
      cy="120"
      r={radius}
      fill="none"
      stroke={COLORS[index]}
      strokeWidth="7"
      strokeLinecap="round"
      strokeDasharray={circumference}
      strokeDashoffset={offset}
      transform="rotate(-90 120 120)"
    />
  );
}

export default function MicronutrientSummary({ report }) {
  const nutrients = Object.keys(REFERENCE_VALUES).map((name, index) => {
    const amount = findAmount(report, name);

    return {
      name,
      amount,
      unit: DISPLAY_UNITS[name],
      color: COLORS[index],
      index,
      percentage:
        name === "Sugar"
          ? null
          : Math.min(100, Math.round((amount / REFERENCE_VALUES[name]) * 100)),
    };
  });

  return (
    <section className="reports-panel micro-summary">
      <h2>Micronutrient summary</h2>
      <p className="reports-subtitle">
        Recorded amounts and reference comparisons
      </p>

      <div className="micro-summary-content">
        <div
          className="micro-ring-chart"
          role="img"
          aria-label="Circular nutrient reference comparison chart"
        >
          <svg viewBox="0 0 240 240" aria-hidden="true">
            {nutrients.map((nutrient) => {
              const radius = 18 + nutrient.index * 10;
              const circumference = 2 * Math.PI * radius;
              const percentage = nutrient.percentage;
              const offset =
                percentage === null
                  ? circumference
                  : circumference * (1 - percentage / 100);

              return (
                <g key={nutrient.name}>
                  <circle
                    cx="120"
                    cy="120"
                    r={radius}
                    fill="none"
                    stroke="#18251c"
                    strokeWidth="7"
                  />
                  <circle
                    className="micro-ring-progress"
                    cx="120"
                    cy="120"
                    r={radius}
                    fill="none"
                    stroke={nutrient.color}
                    strokeWidth="7"
                    strokeLinecap="round"
                    strokeDasharray={circumference}
                    strokeDashoffset={offset}
                    transform="rotate(-90 120 120)"
                  />
                </g>
              );
            })}
          </svg>
        </div>

        <div className="micro-summary-legend">
          {nutrients.map((nutrient) => (
            <div className="micro-legend-row" key={nutrient.name}>
              <span className="micro-legend-name">
                <i style={{ backgroundColor: nutrient.color }} />
                <span>{nutrient.name}</span>
              </span>

              <span className="micro-legend-amount">
                {formatAmount(nutrient.amount)}
                {nutrient.unit}
              </span>

              <strong className="micro-legend-percent">
                {nutrient.percentage === null ? "—" : `${nutrient.percentage}%`}
              </strong>
            </div>
          ))}
        </div>
      </div>

      {/* <p className="micro-summary-note">
        Percentages are approximate adult reference comparisons, not
        personalized targets. Total sugar has no established daily value;
        sodium, vitamins and minerals must use matching units in the API.
      </p> */}
    </section>
  );
}
