import {
  LayoutDashboard,
  FileText,
  Search,
  Upload,
  Settings,
  Bot,
  LogOut,
  Users,
  Shield,
  ScrollText,
  Activity,
  Menu,
  X,
  BookOpen,
  Brain,
  BarChart3,
  Bell,
} from "lucide-react";

import {
  NavLink,
  Outlet,
  useNavigate,
  useLocation,
} from "react-router-dom";

import { useState } from "react";

import Logo from "../ui/Logo";
import Notifications from "../notifications/Notifications";
import { useAuth } from "../../context/AuthContext";

import "./DashboardLayout.css";

export default function DashboardLayout() {
  const navigate = useNavigate();
  const location = useLocation();

  const { user, logoutUser } = useAuth();

  const [mobileOpen, setMobileOpen] = useState(false);

  // =====================================================
  // ROLE
  // =====================================================

  const role =
    user?.role?.trim() ||
    user?.Role?.trim() ||
    localStorage.getItem("role")?.trim() ||
    localStorage.getItem("Role")?.trim() ||
    "User";

  const normalizedRole = role.toLowerCase();

  const isAdmin = normalizedRole === "admin";

  const isManager =
    normalizedRole === "manager" ||
    normalizedRole === "responsable";

  const isEtudiant =
    normalizedRole === "étudiant" ||
    normalizedRole === "etudiant" ||
    normalizedRole === "student";

  // =====================================================
  // USER NAME
  // =====================================================

  const userName =
    user?.name ||
    user?.Name ||
    `${user?.firstName || user?.FirstName || ""} ${
      user?.lastName || user?.LastName || ""
    }`.trim() ||
    user?.email ||
    user?.Email ||
    "User";

  // =====================================================
  // EMAIL
  // =====================================================

  const userEmail =
    user?.email ||
    user?.Email ||
    "";

  // =====================================================
  // AVATAR
  // =====================================================

  const avatarLetter =
    userName?.charAt(0)?.toUpperCase() || "U";

  // =====================================================
  // EMPLOYEE / USER MENU
  // =====================================================

  const employeeMenu = [
    {
      name: "Dashboard",
      path: "/dashboard",
      icon: <LayoutDashboard size={19} />,
    },
    {
      name: "Documents",
      path: "/dashboard/documents",
      icon: <FileText size={19} />,
    },
    {
      name: "Upload",
      path: "/dashboard/upload",
      icon: <Upload size={19} />,
    },
    {
      name: "Semantic Search",
      path: "/dashboard/search",
      icon: <Search size={19} />,
    },
    {
      name: "AI Assistant",
      path: "/dashboard/assistant",
      icon: <Bot size={19} />,
    },
    {
      name: "Settings",
      path: "/dashboard/settings",
      icon: <Settings size={19} />,
    },
  ];

  // =====================================================
  // ETUDIANT MENU
  // =====================================================

  const etudiantMenu = [
    {
      name: "Learning Dashboard",
      path: "/dashboard/employee",
      icon: <LayoutDashboard size={19} />,
    },
    {
      name: "Smart Search",
      path: "/dashboard/employee/search",
      icon: <Search size={19} />,
    },
    {
      name: "Study Copilot",
      path: "/dashboard/employee/assistant",
      icon: <Brain size={19} />,
    },
    {
      name: "Study Mode",
      path: "/dashboard/employee/study-mode",
      icon: <BookOpen size={19} />,
    },
    {
      name: "Learning Insights",
      path: "/dashboard/employee/insights",
      icon: <BarChart3 size={19} />,
    },
    {
      name: "Notifications",
      path: "/dashboard/employee/notifications",
      icon: <Bell size={19} />,
    },
    {
      name: "Settings",
      path: "/dashboard/employee/settings",
      icon: <Settings size={19} />,
    },
  ];

  // =====================================================
  // MANAGER MENU
  // =====================================================

  const managerMenu = [
    {
      name: "Dashboard",
      path: "/dashboard",
      icon: <LayoutDashboard size={19} />,
    },
    {
      name: "Documents",
      path: "/dashboard/documents",
      icon: <FileText size={19} />,
    },
    {
      name: "Team",
      path: "/dashboard/team",
      icon: <Users size={19} />,
    },
    {
      name: "Activity",
      path: "/dashboard/activity",
      icon: <Activity size={19} />,
    },
    {
      name: "Settings",
      path: "/dashboard/settings",
      icon: <Settings size={19} />,
    },
  ];

  // =====================================================
  // ADMIN MENU
  // =====================================================

  const adminMenu = [
    {
      name: "Dashboard",
      path: "/dashboard/admin",
      icon: <LayoutDashboard size={19} />,
    },
    {
      name: "Documents",
      path: "/dashboard/documents",
      icon: <FileText size={19} />,
    },
    {
      name: "Upload",
      path: "/dashboard/upload",
      icon: <Upload size={19} />,
    },
    {
      name: "Semantic Search",
      path: "/dashboard/search",
      icon: <Search size={19} />,
    },
    {
      name: "AI Assistant",
      path: "/dashboard/assistant",
      icon: <Bot size={19} />,
    },
    {
      name: "Settings",
      path: "/dashboard/settings",
      icon: <Settings size={19} />,
    },
  ];

  // =====================================================
  // ADMINISTRATION
  // =====================================================

  const adminManagementMenu = [
    {
      name: "User Management",
      path: "/dashboard/admin/users",
      icon: <Users size={18} />,
    },
    {
      name: "Roles & Permissions",
      path: "/dashboard/admin/roles",
      icon: <Shield size={18} />,
    },
    {
      name: "Audit Logs",
      path: "/dashboard/admin/audit-logs",
      icon: <ScrollText size={18} />,
    },
  ];

  // =====================================================
  // SELECT MENU
  // =====================================================

  let menu = employeeMenu;

  if (isAdmin) {
    menu = [...adminMenu, ...adminManagementMenu];
  } else if (isManager) {
    menu = managerMenu;
  } else if (isEtudiant) {
    menu = etudiantMenu;
  }

  // =====================================================
  // CLOSE MOBILE MENU
  // =====================================================

  const handleNavigation = () => {
    setMobileOpen(false);
  };

  // =====================================================
  // LOGOUT
  // =====================================================

  const handleLogout = () => {
    setMobileOpen(false);

    logoutUser();

    navigate("/login", {
      replace: true,
    });
  };

  // =====================================================
  // PAGE TITLE
  // =====================================================

  const getPageTitle = () => {
    const path = location.pathname;

    // ===================================================
    // ETUDIANT
    // ===================================================

    if (
      path === "/dashboard/employee" ||
      path === "/dashboard/employee/"
    ) {
      if (isEtudiant) {
        return "Learning Dashboard";
      }

      return "Dashboard";
    }

    if (path.includes("/dashboard/employee/search")) {
      return "Smart Search";
    }

    if (path.includes("/dashboard/employee/assistant")) {
      return "Study Copilot";
    }

    if (path.includes("/dashboard/employee/study-mode")) {
      return "Study Mode";
    }

    if (path.includes("/dashboard/employee/insights")) {
      return "Learning Insights";
    }

    if (path.includes("/dashboard/employee/notifications")) {
      return "Notifications";
    }

    if (path.includes("/dashboard/employee/settings")) {
      return "Settings";
    }

    // ===================================================
    // MAIN DASHBOARD
    // ===================================================

    if (
      path === "/dashboard" ||
      path === "/dashboard/"
    ) {
      if (isAdmin) {
        return "Admin Dashboard";
      }

      if (isManager) {
        return "Manager Dashboard";
      }

      return "Dashboard";
    }

    // ===================================================
    // ADMIN
    // ===================================================

    if (path === "/dashboard/admin") {
      return "Admin Dashboard";
    }

    if (path.includes("/dashboard/admin/users")) {
      return "User Management";
    }

    if (path.includes("/dashboard/admin/roles")) {
      return "Roles & Permissions";
    }

    if (path.includes("/dashboard/admin/audit-logs")) {
      return "Audit Logs";
    }

    // ===================================================
    // MANAGER
    // ===================================================

    if (path.includes("/dashboard/team")) {
      return "Team";
    }

    if (path.includes("/dashboard/activity")) {
      return "Activity";
    }

    // ===================================================
    // GENERAL
    // ===================================================

    if (path.includes("/dashboard/documents")) {
      return "Documents";
    }

    if (path.includes("/dashboard/upload")) {
      return "Upload";
    }

    if (path.includes("/dashboard/search")) {
      return "Semantic Search";
    }

    if (path.includes("/dashboard/assistant")) {
      return "AI Assistant";
    }

    if (path.includes("/dashboard/settings")) {
      return "Settings";
    }

    return "KnowFlow AI";
  };

  // =====================================================
  // RENDER
  // =====================================================

  return (
    <div className="dashboard-layout">

      {/* =================================================
          MOBILE OVERLAY
      ================================================= */}

      {mobileOpen && (
        <div
          className="sidebar-mobile-overlay"
          onClick={() => setMobileOpen(false)}
        />
      )}

      {/* =================================================
          SIDEBAR
      ================================================= */}

      <aside
        className={`sidebar ${
          mobileOpen ? "sidebar-mobile-open" : ""
        }`}
      >

        {/* LOGO */}

        <div className="sidebar-logo">
          <Logo />
        </div>

        {/* MOBILE CLOSE */}

        <button
          type="button"
          className="sidebar-mobile-close"
          onClick={() => setMobileOpen(false)}
          aria-label="Close menu"
        >
          <X size={20} />
        </button>

        {/* WORKSPACE */}

        <div className="sidebar-title">
          Knowledge Workspace
        </div>

        {/* ROLE */}

        <div className="sidebar-role">
          <Shield size={14} />

          <span>
            {role}
          </span>
        </div>

        {/* NAVIGATION */}

        <nav className="sidebar-nav">

          {menu.map((item) => (
            <NavLink
              key={item.path}
              to={item.path}
              end={
                item.path === "/dashboard" ||
                item.path === "/dashboard/admin" ||
                item.path === "/dashboard/employee"
              }
              onClick={handleNavigation}
              className={({ isActive }) =>
                `menu-item ${
                  isActive ? "active" : ""
                }`
              }
            >
              <span className="menu-icon">
                {item.icon}
              </span>

              <span className="menu-label">
                {item.name}
              </span>
            </NavLink>
          ))}

        </nav>

        {/* ADMINISTRATION */}

        {isAdmin && (
          <div className="sidebar-section-label">
            ADMINISTRATION
          </div>
        )}

        {/* USER */}

        <div className="sidebar-user">

          <div className="user-avatar">
            {avatarLetter}
          </div>

          <div className="user-info">

            <h4>
              {userName}
            </h4>

            <p>
              {role}
            </p>

          </div>

        </div>

        {/* LOGOUT */}

        <button
          type="button"
          className="logout-btn"
          onClick={handleLogout}
        >
          <LogOut size={18} />

          <span>
            Logout
          </span>
        </button>

      </aside>

      {/* =================================================
          MAIN
      ================================================= */}

      <main className="dashboard-main">

        {/* TOPBAR */}

        <header className="dashboard-topbar">

          <button
            type="button"
            className="mobile-menu-btn"
            onClick={() => setMobileOpen(true)}
            aria-label="Open menu"
          >
            <Menu size={22} />
          </button>

          <div className="topbar-title">

            <h1>
              {getPageTitle()}
            </h1>

            <span>
              KnowFlow AI
            </span>

          </div>

          <div className="topbar-actions">

            <Notifications />

            <button
              type="button"
              className="topbar-user"
              onClick={() => {
                if (isEtudiant) {
                  navigate("/dashboard/employee/settings");
                } else {
                  navigate("/dashboard/settings");
                }
              }}
            >

              <div className="topbar-avatar">
                {avatarLetter}
              </div>

              <div className="topbar-user-info">

                <strong>
                  {userName}
                </strong>

                <span>
                  {userEmail || role}
                </span>

              </div>

            </button>

          </div>

        </header>

        {/* PAGE */}

        <div className="dashboard-content">
          <Outlet />
        </div>

      </main>

    </div>
  );
}