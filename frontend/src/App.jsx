import { Navigate, Route, Routes, useLocation } from "react-router-dom";

import AppLayout from "./components/layout/AppLayout";
import Dashboard from "./pages/DashBoard/DashBoard";
import LogMeal from "./pages/LogMeal/LogMeal";
import FoodEntries from "./pages/FoodEntries/FoodEntries";
import Reports from "./pages/Reports/Reports";
import HealthGoals from "./pages/HealthGoals/HealthGoals";
import AICoach from "./pages/AICoach/AICoach";
import ImportPDF from "./pages/ImportPDF/ImportPDF";
import Login from "./pages/AuthPages/Login";
import Signup from "./pages/AuthPages/Signup";
import ForgotPassword from "./pages/AuthPages/ForgotPassword";

function ProtectedRoute({ children }) {
  const token = localStorage.getItem("nourish_token");

  if (!token) {
    return <Navigate to="/login" replace />;
  }

  return children;
}

export default function App() {
  const location = useLocation();

  const isAuthPage = ["/login", "/signup", "/forgot-password"].includes(
    location.pathname,
  );

  if (isAuthPage) {
    return (
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route path="/signup" element={<Signup />} />
        <Route path="/forgot-password" element={<ForgotPassword />} />
      </Routes>
    );
  }

  return (
    <ProtectedRoute>
      <AppLayout>
        <Routes>
          <Route path="/" element={<Navigate to="/dashboard" replace />} />
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/log-meal" element={<LogMeal />} />
          <Route path="/food-entries" element={<FoodEntries />} />
          <Route path="/nutrition-reports" element={<Reports />} />
          <Route path="/health-goals" element={<HealthGoals />} />
          <Route path="/ai-coach" element={<AICoach />} />
          <Route path="/import-pdf" element={<ImportPDF />} />
          <Route path="*" element={<Navigate to="/dashboard" replace />} />
        </Routes>
      </AppLayout>
    </ProtectedRoute>
  );
}
