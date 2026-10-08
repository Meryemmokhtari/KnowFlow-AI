
import React, { useCallback, useEffect, useMemo, useState } from "react";
import {
  Activity as ActivityIcon,
  Upload,
  FileText,
  Trash2,
  Users,
  UserPlus,
  UserMinus,
  Search,
  Filter,
  RefreshCw,
  Clock3,
  CheckCircle2,
  AlertCircle,
  X,
  LogIn,
  UserCog,
  Shield,
  Settings,
} from "lucide-react";

import "./Activity.css";

// =====================================================
// API
// =====================================================

const API_URL = "http://localhost:5282/api/AuditLogs/activity";

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
// DATE FORMAT
// =====================================================

function formatTime(timestamp) {
  if (!timestamp) {
    return "Unknown time";
  }

  const date = new Date(timestamp);

  if (Number.isNaN(date.getTime())) {
    return timestamp;
  }

  const now = new Date();
  const diff = Math.floor((now - date) / 1000);

  if (diff < 60) {
    return "Just now";
  }

  if (diff < 3600) {
    const minutes = Math.floor(diff / 60);
    return `${minutes} minute${minutes > 1 ? "s" : ""} ago`;
  }

  if (diff < 86400) {
    const hours = Math.floor(diff / 3600);
    return `${hours} hour${hours > 1 ? "s" : ""} ago`;
  }

  if (diff < 172800) {
    return "Yesterday";
  }

  return date.toLocaleDateString("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

// =====================================================
// ACTION TYPE
// =====================================================

function normalizeType(log) {
  const action = String(log?.action || "").toLowerCase();
  const category = String(log?.category || "").toLowerCase();

  if (
    action.includes("upload") ||
    action.includes("uploaded")
  ) {
    return "UPLOAD";
  }

  if (
    action.includes("delete") ||
    action.includes("deleted") ||
    action.includes("remove") ||
    action.includes("removed")
  ) {
    return action.includes("member") ||
      action.includes("user") ||
      category.includes("team")
      ? "TEAM_REMOVE"
      : "DELETE";
  }

  if (
    action.includes("add") &&
    (action.includes("member") || action.includes("user"))
  ) {
    return "TEAM";
  }

  if (
    category.includes("team") ||
    action.includes("member")
  ) {
    return "TEAM";
  }

  if (
    action.includes("login") ||
    action.includes("logout") ||
    category.includes("authentication")
  ) {
    return "AUTH";
  }

  if (
    action.includes("password") ||
    action.includes("profile") ||
    category.includes("account") ||
    category.includes("security")
  ) {
    return "ACCOUNT";
  }

  if (
    category.includes("authorization") ||
    category.includes("admin")
  ) {
    return "SECURITY";
  }

  if (
    category.includes("document") ||
    action.includes("document") ||
    action.includes("view") ||
    action.includes("update")
  ) {
    return "DOCUMENT";
  }

  return "SYSTEM";
}

// =====================================================
// ICON
// =====================================================

function getIcon(type) {
  switch (type) {
    case "UPLOAD":
      return <Upload size={18} />;

    case "DELETE":
      return <Trash2 size={18} />;

    case "TEAM":
      return <UserPlus size={18} />;

    case "TEAM_REMOVE":
      return <UserMinus size={18} />;

    case "DOCUMENT":
      return <FileText size={18} />;

    case "AUTH":
      return <LogIn size={18} />;

    case "ACCOUNT":
      return <UserCog size={18} />;

    case "SECURITY":
      return <Shield size={18} />;

    case "SYSTEM":
      return <Settings size={18} />;

    default:
      return <ActivityIcon size={18} />;
  }
}

// =====================================================
// LABEL
// =====================================================

function getLabel(type) {
  switch (type) {
    case "UPLOAD":
      return "Upload";

    case "DELETE":
      return "Delete";

    case "TEAM":
      return "Team";

    case "TEAM_REMOVE":
      return "Team";

    case "DOCUMENT":
      return "Document";

    case "AUTH":
      return "Authentication";

    case "ACCOUNT":
      return "Account";

    case "SECURITY":
      return "Security";

    case "SYSTEM":
      return "System";

    default:
      return "Activity";
  }
}

// =====================================================
// STATUS
// =====================================================

function isSuccess(status) {
  const value = String(status || "").toLowerCase();

  return (
    value === "success" ||
    value === "successful" ||
    value === "succeeded"
  );
}

// =====================================================
// COMPONENT
// =====================================================

export default function Activity() {
  const [activities, setActivities] = useState([]);

  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState("ALL");

  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const [error, setError] = useState("");

  // ===================================================
  // LOAD ACTIVITY
  // ===================================================

  const loadActivity = useCallback(async () => {
    const token = getToken();

    if (!token) {
      setActivities([]);
      setError("Your session has expired. Please log in again.");
      setLoading(false);
      setRefreshing(false);
      return;
    }

    try {
      setError("");

      const response = await fetch(API_URL, {
        method: "GET",
        headers: {
          Accept: "application/json",
          Authorization: `Bearer ${token}`,
        },
      });

      if (response.status === 401) {
        throw new Error("Unauthorized. Please log in again.");
      }

      if (response.status === 403) {
        throw new Error(
          "You do not have permission to view workspace activity."
        );
      }

      if (!response.ok) {
        throw new Error(
          `Activity request failed (${response.status}).`
        );
      }

      const data = await response.json();

      // Backend can return either:
      // [...]
      // or { data: [...] }
      const logs = Array.isArray(data)
        ? data
        : Array.isArray(data?.data)
          ? data.data
          : [];

      setActivities(logs);
    } catch (err) {
      console.error("Activity API error:", err);

      setActivities([]);

      setError(
        err?.message ||
          "Unable to load workspace activity."
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
    loadActivity();
  }, [loadActivity]);

  // ===================================================
  // REFRESH
  // ===================================================

  const handleRefresh = async () => {
    if (refreshing) {
      return;
    }

    setRefreshing(true);

    await loadActivity();
  };

  // ===================================================
  // PREPARED DATA
  // ===================================================

  const preparedActivities = useMemo(() => {
    return activities.map((item) => ({
      ...item,
      activityType: normalizeType(item),
    }));
  }, [activities]);

  // ===================================================
  // FILTER
  // ===================================================

  const filteredActivities = useMemo(() => {
    const query = search.trim().toLowerCase();

    return preparedActivities.filter((item) => {
      const userName = String(
        item.userName || ""
      ).toLowerCase();

      const action = String(
        item.action || ""
      ).toLowerCase();

      const category = String(
        item.category || ""
      ).toLowerCase();

      const target = String(
        item.target || ""
      ).toLowerCase();

      const description = String(
        item.description || ""
      ).toLowerCase();

      const matchesSearch =
        !query ||
        userName.includes(query) ||
        action.includes(query) ||
        category.includes(query) ||
        target.includes(query) ||
        description.includes(query);

      const matchesFilter =
        filter === "ALL" ||
        item.activityType === filter;

      return matchesSearch && matchesFilter;
    });
  }, [
    preparedActivities,
    search,
    filter,
  ]);

  // ===================================================
  // STATISTICS
  // ===================================================

  const statistics = useMemo(() => {
    return {
      total: activities.length,

      uploads: preparedActivities.filter(
        (item) => item.activityType === "UPLOAD"
      ).length,

      documents: preparedActivities.filter(
        (item) => item.activityType === "DOCUMENT"
      ).length,

      team: preparedActivities.filter(
        (item) =>
          item.activityType === "TEAM" ||
          item.activityType === "TEAM_REMOVE"
      ).length,
    };
  }, [activities, preparedActivities]);

  // ===================================================
  // CLEAR
  // ===================================================

  const clearFilters = () => {
    setSearch("");
    setFilter("ALL");
  };

  // ===================================================
  // RENDER
  // ===================================================

  return (
    <div className="manager-activity-page">

      {/* =================================================
          HEADER
      ================================================= */}

      <section className="activity-header">

        <div className="activity-header-left">

          <span className="activity-eyebrow">
            KNOWFLOW AI · MANAGER
          </span>

          <h1>Workspace Activity</h1>

          <p>
            Monitor real activity performed across your
            workspace.
          </p>

        </div>

        <button
          type="button"
          className="activity-refresh-btn"
          onClick={handleRefresh}
          disabled={refreshing || loading}
        >
          <RefreshCw
            size={17}
            className={
              refreshing
                ? "activity-spin"
                : ""
            }
          />

          {refreshing
            ? "Refreshing..."
            : "Refresh"}
        </button>

      </section>

      {/* =================================================
          ERROR
      ================================================= */}

      {error && (
        <div className="activity-error">

          <div className="activity-error-icon">
            <AlertCircle size={19} />
          </div>

          <div>
            <strong>
              Unable to load activity
            </strong>

            <span>
              {error}
            </span>
          </div>

          <button
            type="button"
            onClick={loadActivity}
          >
            Retry
          </button>

        </div>
      )}

      {/* =================================================
          STATISTICS
      ================================================= */}

      <section className="activity-stats">

        <div className="activity-stat-card">

          <div className="activity-stat-icon blue">
            <ActivityIcon size={20} />
          </div>

          <div className="activity-stat-content">
            <span>Total Activity</span>

            <strong>
              {loading ? "—" : statistics.total}
            </strong>
          </div>

        </div>

        <div className="activity-stat-card">

          <div className="activity-stat-icon green">
            <Upload size={20} />
          </div>

          <div className="activity-stat-content">
            <span>Uploads</span>

            <strong>
              {loading ? "—" : statistics.uploads}
            </strong>
          </div>

        </div>

        <div className="activity-stat-card">

          <div className="activity-stat-icon purple">
            <FileText size={20} />
          </div>

          <div className="activity-stat-content">
            <span>Documents</span>

            <strong>
              {loading ? "—" : statistics.documents}
            </strong>
          </div>

        </div>

        <div className="activity-stat-card">

          <div className="activity-stat-icon orange">
            <Users size={20} />
          </div>

          <div className="activity-stat-content">
            <span>Team Actions</span>

            <strong>
              {loading ? "—" : statistics.team}
            </strong>
          </div>

        </div>

      </section>

      {/* =================================================
          MAIN CARD
      ================================================= */}

      <section className="activity-card">

        <div className="activity-card-header">

          <div>
            <h2>Recent Activity</h2>

            <p>
              Real actions recorded by KnowFlow AI.
            </p>
          </div>

          <div className="activity-live">
            <span />
            Backend activity
          </div>

        </div>

        {/* =================================================
            TOOLBAR
        ================================================= */}

        <div className="activity-toolbar">

          <div className="activity-search">

            <Search size={17} />

            <input
              type="text"
              placeholder="Search activity..."
              value={search}
              onChange={(e) =>
                setSearch(e.target.value)
              }
            />

            {search && (
              <button
                type="button"
                onClick={() => setSearch("")}
                aria-label="Clear search"
              >
                <X size={15} />
              </button>
            )}

          </div>

          <div className="activity-filter">

            <Filter size={16} />

            <select
              value={filter}
              onChange={(e) =>
                setFilter(e.target.value)
              }
            >
              <option value="ALL">
                All activity
              </option>

              <option value="UPLOAD">
                Uploads
              </option>

              <option value="DOCUMENT">
                Documents
              </option>

              <option value="TEAM">
                Team
              </option>

              <option value="DELETE">
                Delete
              </option>

              <option value="AUTH">
                Authentication
              </option>

              <option value="ACCOUNT">
                Account
              </option>

              <option value="SECURITY">
                Security
              </option>
            </select>

          </div>

          {(search || filter !== "ALL") && (
            <button
              type="button"
              className="activity-clear-btn"
              onClick={clearFilters}
            >
              Clear
            </button>
          )}

        </div>

        {/* =================================================
            LOADING
        ================================================= */}

        {loading ? (

          <div className="activity-loading">

            <div className="activity-loading-spinner">
              <RefreshCw size={22} />
            </div>

            <h3>
              Loading activity
            </h3>

            <p>
              Fetching the latest workspace events...
            </p>

          </div>

        ) : filteredActivities.length === 0 ? (

          /* =================================================
             EMPTY
          ================================================= */

          <div className="activity-empty">

            <div className="activity-empty-icon">
              <ActivityIcon size={27} />
            </div>

            <h3>
              {activities.length === 0
                ? "No activity yet"
                : "No activity found"}
            </h3>

            <p>
              {activities.length === 0
                ? "Real workspace activity will appear here when actions are recorded."
                : "Try changing your search or filters."}
            </p>

            {(search || filter !== "ALL") && (
              <button
                type="button"
                onClick={clearFilters}
              >
                Clear filters
              </button>
            )}

          </div>

        ) : (

          /* =================================================
             ACTIVITY LIST
          ================================================= */

          <div className="activity-list">

            {filteredActivities.map(
              (item, index) => {

                const type =
                  item.activityType;

                const success =
                  isSuccess(item.status);

                return (
                  <div
                    className="activity-row"
                    key={
                      item.id ??
                      `${item.timestamp}-${index}`
                    }
                  >

                    <div
                      className={`activity-row-icon ${type.toLowerCase()}`}
                    >
                      {getIcon(type)}
                    </div>

                    <div className="activity-row-content">

                      <div className="activity-row-title">

                        <strong>
                          {item.userName ||
                            "System"}
                        </strong>

                        <span>
                          {item.action ||
                            "performed an action"}
                        </span>

                      </div>

                      <div className="activity-target">

                        {item.target &&
                          item.target !== "Unknown" && (
                            <span>
                              {item.target}
                            </span>
                          )}

                        {item.description && (
                          <small>
                            {item.description}
                          </small>
                        )}

                      </div>

                    </div>

                    <div className="activity-row-meta">

                      <span className="activity-type">
                        {getLabel(type)}
                      </span>

                      <span className="activity-time">
                        <Clock3 size={13} />

                        {formatTime(
                          item.timestamp
                        )}
                      </span>

                    </div>

                    <div
                      className={`activity-status ${
                        success
                          ? "success"
                          : "failed"
                      }`}
                      title={
                        success
                          ? "Successful"
                          : item.status ||
                            "Failed"
                      }
                    >
                      {success ? (
                        <CheckCircle2
                          size={17}
                        />
                      ) : (
                        <AlertCircle
                          size={17}
                        />
                      )}
                    </div>

                  </div>
                );
              }
            )}

          </div>
        )}

      </section>

    </div>
  );
}