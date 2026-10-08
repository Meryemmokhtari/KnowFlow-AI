
import React, { useCallback, useEffect, useMemo, useState } from "react";
import {
  Users,
  UserCheck,
  UserX,
  RefreshCw,
  Search,
  ShieldCheck,
  BriefcaseBusiness,
  GraduationCap,
  Mail,
  CalendarDays,
  AlertCircle,
} from "lucide-react";

import "./ManagerTeam.css";

const API_URL = "http://localhost:5282/api/Manager/team";

// =====================================================
// TOKEN
// =====================================================

function getToken() {
  return (
    localStorage.getItem("token") ||
    localStorage.getItem("accessToken") ||
    sessionStorage.getItem("token") ||
    sessionStorage.getItem("accessToken") ||
    ""
  );
}

// =====================================================
// HELPERS
// =====================================================

function getFullName(member) {
  const firstName = member?.firstName || "";
  const lastName = member?.lastName || "";

  const fullName = `${firstName} ${lastName}`.trim();

  return fullName || member?.email || "Unknown user";
}

function normalizeRole(role) {
  if (!role) return "Unknown";

  const value = String(role).trim().toLowerCase();

  if (value === "employee" || value === "employé") {
    return "Employee";
  }

  if (value === "manager" || value === "responsable") {
    return "Manager";
  }

  if (value === "enseignant" || value === "teacher") {
    return "Enseignant";
  }

  if (value === "admin" || value === "administrator") {
    return "Admin";
  }

  if (value === "étudiant" || value === "student") {
    return "Étudiant";
  }

  return role;
}

function formatDate(dateValue) {
  if (!dateValue) return "—";

  const date = new Date(dateValue);

  if (Number.isNaN(date.getTime())) {
    return "—";
  }

  return new Intl.DateTimeFormat("fr-FR", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  }).format(date);
}

// =====================================================
// COMPONENT
// =====================================================

export default function ManagerTeam() {
  const [members, setMembers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState("");

  const [search, setSearch] = useState("");
  const [roleFilter, setRoleFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");

  // ===================================================
  // LOAD TEAM
  // ===================================================

  const loadTeam = useCallback(async (isRefresh = false) => {
    const token = getToken();

    if (!token) {
      setError("Authentication token not found. Please log in again.");
      setLoading(false);
      setRefreshing(false);
      return;
    }

    try {
      if (isRefresh) {
        setRefreshing(true);
      } else {
        setLoading(true);
      }

      setError("");

      const response = await fetch(API_URL, {
        method: "GET",
        headers: {
          Authorization: `Bearer ${token}`,
          Accept: "application/json",
        },
      });

      if (!response.ok) {
        let message = `Request failed: ${response.status}`;

        try {
          const errorData = await response.json();

          if (errorData?.message) {
            message = errorData.message;
          }
        } catch {
          // Ignore invalid error response
        }

        throw new Error(message);
      }

      const data = await response.json();

      if (!Array.isArray(data)) {
        throw new Error("Invalid team data received from server.");
      }

      setMembers(data);
    } catch (err) {
      console.error("Manager team error:", err);

      setMembers([]);
      setError(
        err?.message || "Unable to load team members."
      );
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  // ===================================================
  // INITIAL LOAD
  // ===================================================

  useEffect(() => {
    loadTeam();
  }, [loadTeam]);

  // ===================================================
  // STATS
  // ===================================================

  const stats = useMemo(() => {
    const total = members.length;

    const active = members.filter(
      (member) => member.isActive === true
    ).length;

    const inactive = members.filter(
      (member) => member.isActive === false
    ).length;

    const employees = members.filter(
      (member) =>
        normalizeRole(member.role) === "Employee"
    ).length;

    const managers = members.filter(
      (member) =>
        normalizeRole(member.role) === "Manager"
    ).length;

    const enseignants = members.filter(
      (member) =>
        normalizeRole(member.role) === "Enseignant"
    ).length;

    const admins = members.filter(
      (member) =>
        normalizeRole(member.role) === "Admin"
    ).length;

    return {
      total,
      active,
      inactive,
      employees,
      managers,
      enseignants,
      admins,
    };
  }, [members]);

  // ===================================================
  // FILTERING
  // ===================================================

  const filteredMembers = useMemo(() => {
    const searchValue = search.trim().toLowerCase();

    return members.filter((member) => {
      const fullName = getFullName(member).toLowerCase();
      const email = String(member.email || "").toLowerCase();
      const role = normalizeRole(member.role);

      const matchesSearch =
        !searchValue ||
        fullName.includes(searchValue) ||
        email.includes(searchValue) ||
        role.toLowerCase().includes(searchValue);

      const matchesRole =
        roleFilter === "all" ||
        role === roleFilter;

      const matchesStatus =
        statusFilter === "all" ||
        (statusFilter === "active" &&
          member.isActive === true) ||
        (statusFilter === "inactive" &&
          member.isActive === false);

      return (
        matchesSearch &&
        matchesRole &&
        matchesStatus
      );
    });
  }, [
    members,
    search,
    roleFilter,
    statusFilter,
  ]);

  // ===================================================
  // RENDER
  // ===================================================

  return (
    <div className="manager-team-page">

      {/* =================================================
          HEADER
      ================================================= */}

      <section className="manager-team-header">
        <div>
          <div className="manager-team-eyebrow">
            <Users size={16} />
            Workspace Management
          </div>

          <h1>Team</h1>

          <p>
            Monitor your workspace members, roles and
            account activity from one place.
          </p>
        </div>

        <button
          type="button"
          className="manager-team-refresh"
          onClick={() => loadTeam(true)}
          disabled={loading || refreshing}
        >
          <RefreshCw
            size={17}
            className={
              refreshing
                ? "manager-team-spin"
                : ""
            }
          />

          {refreshing ? "Refreshing..." : "Refresh"}
        </button>
      </section>

      {/* =================================================
          ERROR
      ================================================= */}

      {error && (
        <div className="manager-team-error">
          <div className="manager-team-error-icon">
            <AlertCircle size={20} />
          </div>

          <div className="manager-team-error-content">
            <strong>Unable to load team</strong>
            <span>{error}</span>
          </div>

          <button
            type="button"
            onClick={() => loadTeam(true)}
          >
            Retry
          </button>
        </div>
      )}

      {/* =================================================
          STATS
      ================================================= */}

      <section className="manager-team-stats">

        <div className="manager-team-stat-card">
          <div className="manager-team-stat-icon">
            <Users size={20} />
          </div>

          <div className="manager-team-stat-content">
            <span>Total Members</span>
            <strong>{stats.total}</strong>
            <small>Workspace users</small>
          </div>
        </div>

        <div className="manager-team-stat-card">
          <div className="manager-team-stat-icon">
            <UserCheck size={20} />
          </div>

          <div className="manager-team-stat-content">
            <span>Active</span>
            <strong>{stats.active}</strong>
            <small>Currently active</small>
          </div>
        </div>

        <div className="manager-team-stat-card">
          <div className="manager-team-stat-icon">
            <BriefcaseBusiness size={20} />
          </div>

          <div className="manager-team-stat-content">
            <span>Employees</span>
            <strong>{stats.employees}</strong>
            <small>Employee accounts</small>
          </div>
        </div>

        <div className="manager-team-stat-card">
          <div className="manager-team-stat-icon">
            <ShieldCheck size={20} />
          </div>

          <div className="manager-team-stat-content">
            <span>Managers</span>
            <strong>{stats.managers}</strong>
            <small>Manager accounts</small>
          </div>
        </div>

      </section>

      {/* =================================================
          TEAM OVERVIEW
      ================================================= */}

      <section className="manager-team-overview">

        <div className="manager-team-overview-main">

          <div className="manager-team-section-heading">
            <div>
              <span className="manager-team-section-kicker">
                TEAM OVERVIEW
              </span>

              <h2>Your Team</h2>

              <p>
                {stats.active} active members out of{" "}
                {stats.total} total
              </p>
            </div>

            <div className="manager-team-member-count">
              <Users size={17} />
              {filteredMembers.length}
            </div>
          </div>

          {/* =================================================
              FILTERS
          ================================================= */}

          <div className="manager-team-filters">

            <div className="manager-team-search">
              <Search size={17} />

              <input
                type="text"
                placeholder="Search members..."
                value={search}
                onChange={(event) =>
                  setSearch(event.target.value)
                }
              />
            </div>

            <select
              value={roleFilter}
              onChange={(event) =>
                setRoleFilter(event.target.value)
              }
            >
              <option value="all">
                All roles
              </option>

              <option value="Employee">
                Employee
              </option>

              <option value="Manager">
                Manager
              </option>

              <option value="Enseignant">
                Enseignant
              </option>

              <option value="Admin">
                Admin
              </option>

              <option value="Étudiant">
                Étudiant
              </option>
            </select>

            <select
              value={statusFilter}
              onChange={(event) =>
                setStatusFilter(event.target.value)
              }
            >
              <option value="all">
                All status
              </option>

              <option value="active">
                Active
              </option>

              <option value="inactive">
                Inactive
              </option>
            </select>

          </div>

          {/* =================================================
              LOADING
          ================================================= */}

          {loading ? (
            <div className="manager-team-loading">
              <RefreshCw
                size={24}
                className="manager-team-spin"
              />

              <span>
                Loading team members...
              </span>
            </div>
          ) : filteredMembers.length > 0 ? (

            <div className="manager-team-list">

              {filteredMembers.map((member) => {
                const role = normalizeRole(member.role);
                const fullName = getFullName(member);

                return (
                  <article
                    key={member.id}
                    className="manager-team-member"
                  >

                    <div className="manager-team-avatar">
                      {fullName
                        .split(" ")
                        .filter(Boolean)
                        .slice(0, 2)
                        .map((part) => part[0])
                        .join("")
                        .toUpperCase()}
                    </div>

                    <div className="manager-team-member-info">

                      <div className="manager-team-member-name-row">
                        <h3>{fullName}</h3>

                        <span
                          className={`manager-team-status ${
                            member.isActive
                              ? "active"
                              : "inactive"
                          }`}
                        >
                          <span />
                          {member.isActive
                            ? "Active"
                            : "Inactive"}
                        </span>
                      </div>

                      <div className="manager-team-member-meta">

                        <span>
                          <Mail size={14} />
                          {member.email || "—"}
                        </span>

                        <span>
                          <CalendarDays size={14} />
                          Joined{" "}
                          {formatDate(
                            member.createdAt
                          )}
                        </span>

                      </div>

                    </div>

                    <div className="manager-team-member-role">

                      {role === "Employee" && (
                        <BriefcaseBusiness size={15} />
                      )}

                      {role === "Manager" && (
                        <ShieldCheck size={15} />
                      )}

                      {role === "Enseignant" && (
                        <GraduationCap size={15} />
                      )}

                      {role === "Admin" && (
                        <ShieldCheck size={15} />
                      )}

                      {role}

                    </div>

                  </article>
                );
              })}

            </div>

          ) : (

            <div className="manager-team-empty">

              <div className="manager-team-empty-icon">
                <Users size={30} />
              </div>

              <h3>
                {members.length === 0
                  ? "No team members yet"
                  : "No matching members"}
              </h3>

              <p>
                {members.length === 0
                  ? "There are currently no users available in the workspace."
                  : "Try changing your search or filters."}
              </p>

            </div>
          )}

        </div>

        {/* =================================================
            SIDE SUMMARY
        ================================================= */}

        <aside className="manager-team-summary">

          <div className="manager-team-summary-header">
            <span>MEMBERS</span>
            <Users size={18} />
          </div>

          <div className="manager-team-summary-number">
            {stats.total}
          </div>

          <p>
            Total users registered in the workspace.
          </p>

          <div className="manager-team-summary-divider" />

          <div className="manager-team-summary-row">
            <span>
              <i />
              Active
            </span>

            <strong>{stats.active}</strong>
          </div>

          <div className="manager-team-summary-row">
            <span>
              <i />
              Inactive
            </span>

            <strong>{stats.inactive}</strong>
          </div>

          <div className="manager-team-summary-divider" />

          <div className="manager-team-summary-role">
            <span>Employees</span>
            <strong>{stats.employees}</strong>
          </div>

          <div className="manager-team-summary-role">
            <span>Managers</span>
            <strong>{stats.managers}</strong>
          </div>

          <div className="manager-team-summary-role">
            <span>Enseignants</span>
            <strong>{stats.enseignants}</strong>
          </div>

        </aside>

      </section>

    </div>
  );
}