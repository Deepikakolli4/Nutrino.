import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Camera, Plus, Flame, MessageCircle, ArrowRight } from "lucide-react";

import "./Dashboard.css";
import api from "../../api/axios";

const MACRO_CONFIG = [
  { label: "Protein", key: "protein", color: "#ff7066" },
  { label: "Carbs", key: "carbs", color: "#ffbd42" },
  { label: "Fat", key: "fat", color: "#43c4e6" },
];

function getLocalDate(date = new Date()) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");

  return `${year}-${month}-${day}`;
}

function formatDate() {
  return new Date()
    .toLocaleDateString("en-IN", {
      weekday: "long",
      day: "2-digit",
      month: "long",
    })
    .toUpperCase();
}

function getGreeting() {
  const hour = new Date().getHours();

  if (hour < 12) return "morning";
  if (hour < 17) return "afternoon";
  return "evening";
}

function getPageContent(responseData) {
  if (Array.isArray(responseData)) {
    return responseData;
  }

  return Array.isArray(responseData?.content) ? responseData.content : [];
}

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

export default function Dashboard() {
  const navigate = useNavigate();

  const [todayEntries, setTodayEntries] = useState([]);
  const [weeklyEntries, setWeeklyEntries] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let cancelled = false;

    async function loadDashboard() {
      setLoading(true);
      setError("");

      try {
        const today = new Date();
        const todayString = getLocalDate(today);

        const weekStart = new Date(today);
        weekStart.setDate(today.getDate() - 6);
        const startDate = getLocalDate(weekStart);

        const [todayResponse, weeklyResponse] = await Promise.all([
          api.get("/food-entries", {
            params: {
              date: todayString,
              page: 0,
              size: 100,
            },
          }),

          api.get("/food-entries", {
            params: {
              startDate,
              endDate: todayString,
              page: 0,
              size: 100,
            },
          }),
        ]);

        if (cancelled) return;

        setTodayEntries(getPageContent(todayResponse.data));
        setWeeklyEntries(getPageContent(weeklyResponse.data));
      } catch (err) {
        if (!cancelled) {
          setError(
            err.response?.data?.message ||
              err.response?.data?.error ||
              "Unable to load your food entries.",
          );
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    }

    loadDashboard();

    return () => {
      cancelled = true;
    };
  }, []);

  const consumedCalories = useMemo(
    () =>
      todayEntries.reduce(
        (total, entry) => total + (Number(entry.calories) || 0),
        0,
      ),
    [todayEntries],
  );

  const macros = useMemo(
    () =>
      MACRO_CONFIG.map((macro) => ({
        ...macro,
        consumed: todayEntries.reduce(
          (total, entry) => total + (Number(entry[macro.key]) || 0),
          0,
        ),
      })),
    [todayEntries],
  );

  const averageCalories = useMemo(() => {
    const dailyTotals = {};

    for (const entry of weeklyEntries) {
      const date = entry.entryDate;
      if (!date) continue;

      dailyTotals[date] =
        (dailyTotals[date] || 0) + (Number(entry.calories) || 0);
    }

    const totalCalories = Object.values(dailyTotals).reduce(
      (sum, calories) => sum + calories,
      0,
    );

    // Include days with zero entries in the seven-day average.
    return Math.round(totalCalories / 7);
  }, [weeklyEntries]);

  if (loading) {
    return (
      <main className="nourish-dashboard">
        <p>Loading your nutrition dashboard...</p>
      </main>
    );
  }

  if (error) {
    return (
      <main className="nourish-dashboard">
        <p role="alert">{error}</p>

        <button
          className="nourish-button primary"
          onClick={() => window.location.reload()}
        >
          Try again
        </button>
      </main>
    );
  }

  return (
    <main className="nourish-dashboard">
      <header className="nourish-dashboard-header">
        <div>
          <p className="nourish-date">{formatDate()}</p>

          <h1>Good {getGreeting()}</h1>

          <p className="nourish-subtitle">
            Track your daily nutrition and build healthy habits.
          </p>
        </div>

        <div className="nourish-header-actions">
          <button
            className="nourish-button secondary"
            onClick={() => navigate("/log-meal?mode=photo")}
          >
            <Camera size={18} />
            Snap a meal
          </button>

          <button
            className="nourish-button primary"
            onClick={() => navigate("/log-meal")}
          >
            <Plus size={19} />
            Log meal
          </button>
        </div>
      </header>

      <section className="nourish-dashboard-grid">
        <article className="nourish-card nourish-calorie-card">
          <h2 className="nourish-today-title">Today's calories</h2>

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

              <circle className="nourish-ring-track" cx="100" cy="100" r="84" />

              <circle
                className="nourish-ring-value"
                cx="100"
                cy="100"
                r="84"
                stroke="url(#calorieGradient)"
                strokeDasharray={`${consumedCalories > 0 ? 1 : 0} ${
                  2 * Math.PI * 84
                }`}
              />
            </svg>

            <div className="nourish-ring-center">
              <strong>{Math.round(consumedCalories).toLocaleString()}</strong>
              <span>kcal consumed</span>
            </div>
          </div>

          <div className="nourish-macros">
            {macros.map((macro) => (
              <MacroProgress key={macro.label} {...macro} />
            ))}
          </div>
        </article>

        <div className="nourish-dashboard-right">
          <section className="nourish-summary-grid">
            <SummaryCard icon={Flame} label="7-day average">
              {averageCalories.toLocaleString()} <small>kcal/day</small>
            </SummaryCard>

            <SummaryCard icon={Plus} label="Food entries today">
              {todayEntries.length} <small>entries</small>
            </SummaryCard>
            <SummaryCard icon={Flame} label="Today's protein">
              {Math.round(
                todayEntries.reduce(
                  (total, entry) => total + (Number(entry.protein) || 0),
                  0,
                ),
              )}
              <small>g consumed</small>
            </SummaryCard>
          </section>

          <article className="nourish-card nourish-coach-card">
            <div className="nourish-coach-icon">
              <MessageCircle size={36} />
            </div>

            <h2>Ask your nutrition coach</h2>

            <p>
              Get guidance about your food choices, calorie intake, and
              nutrition habits using your logged entries.
            </p>

            <button
              className="nourish-button secondary"
              onClick={() => navigate("/ai-coach")}
            >
              Open chat <ArrowRight size={16} />
            </button>
          </article>
        </div>
      </section>
    </main>
  );
}
