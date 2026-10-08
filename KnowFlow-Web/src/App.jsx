
import React from "react";
import {
  Navigate,
  Route,
  Routes,
} from "react-router-dom";

import { useAuth } from "./context/AuthContext";

// =====================================================
// LAYOUT
// =====================================================

import DashboardLayout from "./components/layout/DashboardLayout";

// =====================================================
// AUTH
// =====================================================

import ProtectedRoute from "./components/auth/ProtectedRoute";
import Login from "./pages/auth/Login";

// =====================================================
// EMPLOYEE / ETUDIANT
// =====================================================

import EmployeeDashboard from "./pages/employee/EmployeeDashboard";

import EtudiantDashboard from "./pages/Etudiant/EtudiantDashboard";
import EtudiantSearch from "./pages/Etudiant/EtudiantSearch";
import EtudiantAssistant from "./pages/Etudiant/EtudiantAssistant";
import EtudiantStudyMode from "./pages/Etudiant/EtudiantStudyMode";
import EtudiantInsights from "./pages/Etudiant/EtudiantInsights";
import EtudiantNotifications from "./pages/Etudiant/EtudiantNotifications";
import EtudiantSettings from "./pages/Etudiant/EtudiantSettings";

// =====================================================
// SHARED PAGES
// =====================================================

import Documents from "./documents/Documents";
import Upload from "./upload/Upload";
import Search from "./search/Search";
import Settings from "./settings/Settings";
import Assistant from "./ai/Assistant";

// =====================================================
// ENSEIGNANT
// =====================================================

import EnseignantDashboard from "./pages/Enseignant/EnseignantDashboard";
import EnseignantUpload from "./pages/Enseignant/EnseignantUpload";
import EnseignantResources from "./pages/Enseignant/EnseignantResources";
import EnseignantSearch from "./pages/Enseignant/EnseignantSearch";
import EnseignantAssistant from "./pages/Enseignant/EnseignantAssistant";
import EnseignantNotifications from "./pages/Enseignant/EnseignantNotifications";
import EnseignantSettings from "./pages/Enseignant/EnseignantSettings";

// =====================================================
// MANAGER
// =====================================================

import ManagerDashboard from "./pages/Manager/ManagerDashboard";
import ManagerDocuments from "./pages/Manager/ManagerDocuments";
import ManagerTeam from "./pages/Manager/ManagerTeam";
import ManagerActivity from "./pages/Manager/Activity";
import ManagerSettings from "./pages/Manager/Settings";

// =====================================================
// ADMIN
// =====================================================

import AdminDashboard from "./pages/admin/AdminDashboard";
import AdminUsers from "./pages/admin/AdminUsers";
import RolesPermissions from "./pages/admin/RolesPermissions";
import AuditLogs from "./pages/admin/AuditLogs";

// =====================================================
// LOADING
// =====================================================

function AppLoading() {
  return (
    <div className="app-loading">
      <div className="app-loading-box">
        <div className="app-loading-spinner" />
        <p>Loading KnowFlow AI...</p>
      </div>

      <style>{`
        .app-loading {
          min-height: 100vh;
          display: flex;
          align-items: center;
          justify-content: center;
          background: #020617;
          color: #e2e8f0;
          font-family: Inter, Arial, sans-serif;
        }

        .app-loading-box {
          text-align: center;
        }

        .app-loading-spinner {
          width: 38px;
          height: 38px;
          margin: 0 auto 16px;
          border: 3px solid rgba(255,255,255,0.12);
          border-top-color: #60a5fa;
          border-radius: 50%;
          animation: knowflow-spin 0.8s linear infinite;
        }

        .app-loading p {
          margin: 0;
          color: #94a3b8;
          font-size: 14px;
        }

        @keyframes knowflow-spin {
          to {
            transform: rotate(360deg);
          }
        }
      `}</style>
    </div>
  );
}

// =====================================================
// DASHBOARD REDIRECT
// =====================================================

function DashboardRedirect() {
  const { user, loading } = useAuth();

  if (loading) {
    return <AppLoading />;
  }

  if (!user) {
    return (
      <Navigate
        to="/login"
        replace
      />
    );
  }

  const role = String(
    user?.role ??
    user?.Role ??
    user?.userRole ??
    user?.UserRole ??
    ""
  )
    .trim()
    .toLowerCase();

  // ===================================================
  // ADMIN
  // ===================================================

  if (
    role === "admin" ||
    role === "administrator" ||
    role === "administrateur"
  ) {
    return (
      <Navigate
        to="/dashboard/admin"
        replace
      />
    );
  }

  // ===================================================
  // MANAGER
  // ===================================================

  if (
    role === "manager" ||
    role === "responsable"
  ) {
    return (
      <Navigate
        to="/dashboard/manager"
        replace
      />
    );
  }

  // ===================================================
  // ENSEIGNANT
  // ===================================================

  if (
    role === "enseignant" ||
    role === "teacher"
  ) {
    return (
      <Navigate
        to="/dashboard/enseignant"
        replace
      />
    );
  }

  // ===================================================
  // ETUDIANT
  // ===================================================

  if (
    role === "étudiant" ||
    role === "etudiant" ||
    role === "student"
  ) {
    return (
      <Navigate
        to="/dashboard/employee"
        replace
      />
    );
  }

  // ===================================================
  // EMPLOYEE
  // ===================================================

  if (
    role === "employee" ||
    role === "employe" ||
    role === "employé"
  ) {
    return (
      <Navigate
        to="/dashboard/employee"
        replace
      />
    );
  }

  // ===================================================
  // FALLBACK
  // ===================================================

  return (
    <Navigate
      to="/dashboard/employee"
      replace
    />
  );
}

// =====================================================
// APP
// =====================================================

export default function App() {
  return (
    <Routes>

      {/* =================================================
          LOGIN
      ================================================= */}

      <Route
        path="/login"
        element={<Login />}
      />

      {/* =================================================
          PROTECTED DASHBOARD
      ================================================= */}

      <Route
        path="/dashboard"
        element={
          <ProtectedRoute>
            <DashboardLayout />
          </ProtectedRoute>
        }
      >

        {/* =================================================
            DASHBOARD ROOT
        ================================================= */}

        <Route
          index
          element={<DashboardRedirect />}
        />

        {/* =================================================
            EMPLOYEE / ETUDIANT DASHBOARD
        ================================================= */}

        <Route
          path="employee"
          element={
            <ProtectedRoute
              allowedRoles={[
                "Employee",
                "Employe",
                "Employé",
                "Étudiant",
                "Etudiant",
                "Student",
              ]}
            >
              <EmployeeDashboard />
            </ProtectedRoute>
          }
        />

        {/* =================================================
            ETUDIANT SEARCH
        ================================================= */}

        <Route
          path="employee/search"
          element={
            <ProtectedRoute
              allowedRoles={[
                "Employee",
                "Employe",
                "Employé",
                "Étudiant",
                "Etudiant",
                "Student",
              ]}
            >
              <EtudiantSearch />
            </ProtectedRoute>
          }
        />

        {/* =================================================
            ETUDIANT ASSISTANT
        ================================================= */}

        <Route
          path="employee/assistant"
          element={
            <ProtectedRoute
              allowedRoles={[
                "Employee",
                "Employe",
                "Employé",
                "Étudiant",
                "Etudiant",
                "Student",
              ]}
            >
              <EtudiantAssistant />
            </ProtectedRoute>
          }
        />

        {/* =================================================
            ETUDIANT STUDY MODE
        ================================================= */}

        <Route
          path="employee/study-mode"
          element={
            <ProtectedRoute
              allowedRoles={[
                "Employee",
                "Employe",
                "Employé",
                "Étudiant",
                "Etudiant",
                "Student",
              ]}
            >
              <EtudiantStudyMode />
            </ProtectedRoute>
          }
        />

        {/* =================================================
            ETUDIANT INSIGHTS
        ================================================= */}

        <Route
          path="employee/insights"
          element={
            <ProtectedRoute
              allowedRoles={[
                "Employee",
                "Employe",
                "Employé",
                "Étudiant",
                "Etudiant",
                "Student",
              ]}
            >
              <EtudiantInsights />
            </ProtectedRoute>
          }
        />

        {/* =================================================
            ETUDIANT NOTIFICATIONS
        ================================================= */}

        <Route
          path="employee/notifications"
          element={
            <ProtectedRoute
              allowedRoles={[
                "Employee",
                "Employe",
                "Employé",
                "Étudiant",
                "Etudiant",
                "Student",
              ]}
            >
              <EtudiantNotifications />
            </ProtectedRoute>
          }
        />

        {/* =================================================
            ETUDIANT SETTINGS
        ================================================= */}

        <Route
          path="employee/settings"
          element={
            <ProtectedRoute
              allowedRoles={[
                "Employee",
                "Employe",
                "Employé",
                "Étudiant",
                "Etudiant",
                "Student",
              ]}
            >
              <EtudiantSettings />
            </ProtectedRoute>
          }
        />

        {/* =================================================
            SHARED DOCUMENTS
        ================================================= */}

        <Route
          path="documents"
          element={
            <ProtectedRoute
              allowedRoles={[
                "Admin",
                "Administrator",
                "Administrateur",

                "Manager",
                "Responsable",

                "Employee",
                "Employe",
                "Employé",

                "Étudiant",
                "Etudiant",
                "Student",

                "Enseignant",
                "Teacher",
              ]}
            >
              <Documents />
            </ProtectedRoute>
          }
        />

        {/* =================================================
            SHARED UPLOAD
        ================================================= */}

        <Route
          path="upload"
          element={
            <ProtectedRoute
              allowedRoles={[
                "Admin",
                "Administrator",
                "Administrateur",

                "Employee",
                "Employe",
                "Employé",

                "Étudiant",
                "Etudiant",
                "Student",

                "Enseignant",
                "Teacher",
              ]}
            >
              <Upload />
            </ProtectedRoute>
          }
        />

        {/* =================================================
            SHARED SEARCH
        ================================================= */}

        <Route
          path="search"
          element={
            <ProtectedRoute
              allowedRoles={[
                "Admin",
                "Administrator",
                "Administrateur",

                "Employee",
                "Employe",
                "Employé",

                "Étudiant",
                "Etudiant",
                "Student",

                "Enseignant",
                "Teacher",
              ]}
            >
              <Search />
            </ProtectedRoute>
          }
        />

        {/* =================================================
            SHARED AI ASSISTANT
        ================================================= */}

        <Route
          path="assistant"
          element={
            <ProtectedRoute
              allowedRoles={[
                "Admin",
                "Administrator",
                "Administrateur",

                "Employee",
                "Employe",
                "Employé",

                "Étudiant",
                "Etudiant",
                "Student",

                "Enseignant",
                "Teacher",
              ]}
            >
              <Assistant />
            </ProtectedRoute>
          }
        />

        {/* =================================================
            SHARED SETTINGS
        ================================================= */}

        <Route
          path="settings"
          element={
            <ProtectedRoute
              allowedRoles={[
                "Admin",
                "Administrator",
                "Administrateur",

                "Manager",
                "Responsable",

                "Employee",
                "Employe",
                "Employé",

                "Étudiant",
                "Etudiant",
                "Student",

                "Enseignant",
                "Teacher",
              ]}
            >
              <Settings />
            </ProtectedRoute>
          }
        />

        {/* =================================================
            ENSEIGNANT DASHBOARD
        ================================================= */}

        <Route
          path="enseignant"
          element={
            <ProtectedRoute
              allowedRoles={[
                "Enseignant",
                "Teacher",
              ]}
            >
              <EnseignantDashboard />
            </ProtectedRoute>
          }
        />

        {/* =================================================
            ENSEIGNANT UPLOAD
        ================================================= */}

        <Route
          path="enseignant/upload"
          element={
            <ProtectedRoute
              allowedRoles={[
                "Enseignant",
                "Teacher",
              ]}
            >
              <EnseignantUpload />
            </ProtectedRoute>
          }
        />

        {/* =================================================
            ENSEIGNANT RESOURCES
        ================================================= */}

        <Route
          path="enseignant/resources"
          element={
            <ProtectedRoute
              allowedRoles={[
                "Enseignant",
                "Teacher",
              ]}
            >
              <EnseignantResources />
            </ProtectedRoute>
          }
        />

        {/* =================================================
            ENSEIGNANT SEARCH
        ================================================= */}

        <Route
          path="enseignant/search"
          element={
            <ProtectedRoute
              allowedRoles={[
                "Enseignant",
                "Teacher",
              ]}
            >
              <EnseignantSearch />
            </ProtectedRoute>
          }
        />

        {/* =================================================
            ENSEIGNANT ASSISTANT
        ================================================= */}

        <Route
          path="enseignant/assistant"
          element={
            <ProtectedRoute
              allowedRoles={[
                "Enseignant",
                "Teacher",
              ]}
            >
              <EnseignantAssistant />
            </ProtectedRoute>
          }
        />

        {/* =================================================
            ENSEIGNANT NOTIFICATIONS
        ================================================= */}

        <Route
          path="enseignant/notifications"
          element={
            <ProtectedRoute
              allowedRoles={[
                "Enseignant",
                "Teacher",
              ]}
            >
              <EnseignantNotifications />
            </ProtectedRoute>
          }
        />

        {/* =================================================
            ENSEIGNANT SETTINGS
        ================================================= */}

        <Route
          path="enseignant/settings"
          element={
            <ProtectedRoute
              allowedRoles={[
                "Enseignant",
                "Teacher",
              ]}
            >
              <EnseignantSettings />
            </ProtectedRoute>
          }
        />

        {/* =================================================
            MANAGER DASHBOARD
        ================================================= */}

        <Route
          path="manager"
          element={
            <ProtectedRoute
              allowedRoles={[
                "Manager",
                "Responsable",
              ]}
            >
              <ManagerDashboard />
            </ProtectedRoute>
          }
        />

        {/* =================================================
            MANAGER DOCUMENTS
        ================================================= */}

        <Route
          path="manager/documents"
          element={
            <ProtectedRoute
              allowedRoles={[
                "Manager",
                "Responsable",
              ]}
            >
              <ManagerDocuments />
            </ProtectedRoute>
          }
        />

        {/* =================================================
            MANAGER TEAM
        ================================================= */}

        <Route
          path="team"
          element={
            <ProtectedRoute
              allowedRoles={[
                "Manager",
                "Responsable",
              ]}
            >
              <ManagerTeam />
            </ProtectedRoute>
          }
        />

        {/* =================================================
            MANAGER ACTIVITY
        ================================================= */}

        <Route
          path="activity"
          element={
            <ProtectedRoute
              allowedRoles={[
                "Manager",
                "Responsable",
              ]}
            >
              <ManagerActivity />
            </ProtectedRoute>
          }
        />

        {/* =================================================
            MANAGER SETTINGS
        ================================================= */}

        <Route
          path="manager/settings"
          element={
            <ProtectedRoute
              allowedRoles={[
                "Manager",
                "Responsable",
              ]}
            >
              <ManagerSettings />
            </ProtectedRoute>
          }
        />

        {/* =================================================
            ADMIN DASHBOARD
        ================================================= */}

        <Route
          path="admin"
          element={
            <ProtectedRoute
              allowedRoles={[
                "Admin",
                "Administrator",
                "Administrateur",
              ]}
            >
              <AdminDashboard />
            </ProtectedRoute>
          }
        />

        {/* =================================================
            ADMIN USERS
        ================================================= */}

        <Route
          path="admin/users"
          element={
            <ProtectedRoute
              allowedRoles={[
                "Admin",
                "Administrator",
                "Administrateur",
              ]}
            >
              <AdminUsers />
            </ProtectedRoute>
          }
        />

        {/* =================================================
            ADMIN ROLES
        ================================================= */}

        <Route
          path="admin/roles"
          element={
            <ProtectedRoute
              allowedRoles={[
                "Admin",
                "Administrator",
                "Administrateur",
              ]}
            >
              <RolesPermissions />
            </ProtectedRoute>
          }
        />

        {/* =================================================
            ADMIN AUDIT LOGS
        ================================================= */}

        <Route
          path="admin/audit-logs"
          element={
            <ProtectedRoute
              allowedRoles={[
                "Admin",
                "Administrator",
                "Administrateur",
              ]}
            >
              <AuditLogs />
            </ProtectedRoute>
          }
        />

      </Route>

      {/* =================================================
          UNKNOWN ROUTE
      ================================================= */}

      <Route
        path="*"
        element={
          <Navigate
            to="/dashboard"
            replace
          />
        }
      />

    </Routes>
  );
}
