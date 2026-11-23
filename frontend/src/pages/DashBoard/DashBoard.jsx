import { useEffect, useMemo, useState } from "react";
import DashboardHeader from "./DashboardHeader";
import CaloriesCard from "./CaloriesCard";
import DashboardInsights from "./DashboardInsights";

import "./DashBoard.css";
import api from "../../api/axios";
import { getHealthGoals } from "../../api/healthGoals";

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


function getPageContent(responseData) {
  if (Array.isArray(responseData)) {
    return responseData;
  }

  return Array.isArray(responseData?.content)
    ? responseData.content
    : [];
}

export default function Dashboard() {
  const [todayEntries, setTodayEntries] = useState([]);
  const [weeklyEntries, setWeeklyEntries] = useState([]);

  const [healthGoals, setHealthGoals] = useState(null);
  const [goalsLoading, setGoalsLoading] = useState(true);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  // Load today's and weekly food entries.
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

  // Load saved Health Goals.
  useEffect(() => {
    let cancelled = false;

    async function loadHealthGoals() {
      setGoalsLoading(true);

      try {
        const savedGoals = await getHealthGoals();

        if (!cancelled) {
          setHealthGoals(savedGoals);
        }
      } catch (err) {
        if (!cancelled) {
          setHealthGoals(null);
        }
      } finally {
        if (!cancelled) {
          setGoalsLoading(false);
        }
      }
    }

    loadHealthGoals();

    return () => {
      cancelled = true;
    };
  }, []);

  // Calculate today's calories.
  const consumedCalories = useMemo(
    () =>
      todayEntries.reduce(
        (total, entry) =>
          total + (Number(entry.calories) || 0),
        0,
      ),
    [todayEntries],
  );

  // Calculate macros.
  const macros = useMemo(
    () =>
      MACRO_CONFIG.map((macro) => ({
        ...macro,
        consumed: todayEntries.reduce(
          (total, entry) =>
            total + (Number(entry[macro.key]) || 0),
          0,
        ),
      })),
    [todayEntries],
  );

  // Calculate 7-day average.
  const averageCalories = useMemo(() => {
    const dailyTotals = {};

    for (const entry of weeklyEntries) {
      const date = entry.entryDate;

      if (!date) continue;

      dailyTotals[date] =
        (dailyTotals[date] || 0) +
        (Number(entry.calories) || 0);
    }

    const totalCalories = Object.values(dailyTotals).reduce(
      (sum, calories) => sum + calories,
      0,
    );

    return Math.round(totalCalories / 7);
  }, [weeklyEntries]);

  // Health Goals values.
  const dailyCalorieGoal =
    Number(healthGoals?.dailyCalorieTarget) || 0;

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
      <DashboardHeader />

      <section className="nourish-dashboard-grid">
        <CaloriesCard
          consumedCalories={consumedCalories}
          dailyCalorieGoal={dailyCalorieGoal}
          macros={macros}
        />
        <DashboardInsights
          averageCalories={averageCalories}
          todayEntries={todayEntries}
          healthGoals={healthGoals}
          goalsLoading={goalsLoading}
          consumedCalories={consumedCalories}
          dailyCalorieGoal={dailyCalorieGoal}
        />
      </section>
    </main>
  );
}
