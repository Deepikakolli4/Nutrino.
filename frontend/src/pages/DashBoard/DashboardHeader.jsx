import { useNavigate } from "react-router-dom";
import { Camera, Plus } from "lucide-react";

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

export default function DashboardHeader() {
  const navigate = useNavigate();

  return (
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
  );
}
