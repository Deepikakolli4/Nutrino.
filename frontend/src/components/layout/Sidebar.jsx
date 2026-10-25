import {
  LayoutDashboard,
  Utensils,
  ClipboardList,
  ChartNoAxesCombined,
  Target,
  MessageCircle,
  FileUp,
  Citrus,
  Settings,
  LogOut,
} from "lucide-react";
import { logout } from "../../api/auth";
import { NavLink } from "react-router-dom";

const navigationItems = [
  {
    label: "Dashboard",
    path: "/dashboard",
    icon: LayoutDashboard,
  },
  {
    label: "Log Meal",
    path: "/log-meal",
    icon: Utensils,
  },
  {
    label: "Food Entries",
    path: "/food-entries",
    icon: ClipboardList,
  },
  {
    label: "Nutrition Reports",
    path: "/nutrition-reports",
    icon: ChartNoAxesCombined,
  },
  {
    label: "Health Goals",
    path: "/health-goals",
    icon: Target,
  },
  {
    label: "AI Nutrition Coach",
    path: "/ai-coach",
    icon: MessageCircle,
  },
  {
    label: "Import PDF",
    path: "/import-pdf",
    icon: FileUp,
  },
];

export default function Sidebar() {
  return (
    <aside className="sidebar">
      {/* Brand */}
      <div className="brand">
        <div className="brand-icon">
          <Citrus size={24} strokeWidth={2.2} />
        </div>

        <span className="brand-name">
          Nourish<span className="brand-dot">.</span>
        </span>
      </div>

      {/* Navigation */}
      <nav className="sidebar-nav">
        {/* <p className="nav-section-title">MENU</p> */}

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

      {/* Bottom section */}
      <div className="sidebar-bottom">
        {/* <NavLink to="/settings" className="nav-link">
    <Settings size={19} />
    <span>Settings</span>
  </NavLink> */}

        <div className="user-profile">
          <div className="avatar">DK</div>

          <div className="user-info">
            <strong>Your Profile</strong>
            <span>Personal account</span>
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
