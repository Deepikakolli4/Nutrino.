import {
  LayoutDashboard,
  Utensils,
  ClipboardList,
  ChartNoAxesCombined,
  Target,
  MessageCircle,
  FileUp,
  Citrus,
  LogOut,
} from "lucide-react";
import { NavLink } from "react-router-dom";
import { logout } from "../../api/auth";

const navigationItems = [
  { label: "Dashboard", path: "/dashboard", icon: LayoutDashboard },
  { label: "Log Meal", path: "/log-meal", icon: Utensils },
  { label: "Food Entries", path: "/food-entries", icon: ClipboardList },
  {
    label: "Nutrition Reports",
    path: "/nutrition-reports",
    icon: ChartNoAxesCombined,
  },
  { label: "Health Goals", path: "/health-goals", icon: Target },
  { label: "AI Nutrition Coach", path: "/ai-coach", icon: MessageCircle },
  { label: "Import PDF", path: "/import-pdf", icon: FileUp },
];

function getUserName() {
  const token = localStorage.getItem("nourish_token");

  if (!token) return "User";

  try {
    const payload = token.split(".")[1];
    if (!payload) return "User";

    const normalized = payload.replace(/-/g, "+").replace(/_/g, "/");
    const decoded = atob(normalized);
    const bytes = Uint8Array.from(decoded, (char) => char.charCodeAt(0));
    const data = JSON.parse(new TextDecoder().decode(bytes));

    return data.email || "User";
  } catch {
    return "User";
  }
}

export default function Sidebar() {
  const userName = getUserName();

  const initials =
    userName
      .trim()
      .split(/\s+/)
      .filter(Boolean)
      .slice(0, 2)
      .map((part) => part[0])
      .join("")
      .toUpperCase() || "U";

  return (
    <aside className="sidebar">
      <div className="brand">
        <div className="brand-icon">
          <Citrus size={24} strokeWidth={2.2} />
        </div>

        <span className="brand-name">
          Nourish<span className="brand-dot">.</span>
        </span>
      </div>

      <nav className="sidebar-nav">
        {navigationItems.map((item) => {
          const Icon = item.icon;

          return (
            <NavLink
              key={item.path}
              to={item.path}
              end={item.path === "/dashboard"}
              className={({ isActive }) =>
                `nav-link ${isActive ? "active" : ""}`
              }
            >
              <Icon size={19} strokeWidth={2} />
              <span>{item.label}</span>
            </NavLink>
          );
        })}
      </nav>

      <div className="sidebar-bottom">
        <div className="user-profile">
          <div className="avatar">{initials}</div>

          <div className="user-info">
            <strong>{userName}</strong>
          </div>

          <button
            type="button"
            className="logout-icon-button"
            aria-label="Log out"
            onClick={logout}
          >
            <LogOut size={18} />
          </button>
        </div>
      </div>
    </aside>
  );
}
