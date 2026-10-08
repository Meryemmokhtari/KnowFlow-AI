
import React, { useEffect, useMemo, useState } from "react";
import {
  FileText,
  Users,
  Activity,
  TrendingUp,
  Upload,
  ArrowRight,
  RefreshCw,
  Clock3,
  CheckCircle2,
  AlertCircle,
  BarChart3,
  FolderOpen,
  Eye,
} from "lucide-react";

import { useNavigate } from "react-router-dom";
import "./ManagerDashboard.css";

const DOCUMENT_API = "http://localhost:5260/api/Document";

const getToken = () =>
  localStorage.getItem("token") ||
  localStorage.getItem("accessToken") ||
  sessionStorage.getItem("token") ||
  sessionStorage.getItem("accessToken") ||
  "";

export default function ManagerDashboard() {
  const navigate = useNavigate();

  const [documents, setDocuments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState("");

  // =====================================================
  // LOAD DOCUMENTS
  // =====================================================

  const loadDashboard = async (isRefresh = false) => {
    try {
      if (isRefresh) {
        setRefreshing(true);
      } else {
        setLoading(true);
      }

      setError("");

      const token = getToken();

      if (!token) {
        throw new Error("Authentication token not found.");
      }

      const response = await fetch(DOCUMENT_API, {
        method: "GET",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      });

      if (!response.ok) {
        throw new Error(
          `Unable to load workspace data (${response.status}).`
        );
      }

      const data = await response.json();

      setDocuments(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error("Manager dashboard error:", err);

      setError(
        err?.message || "Unable to load workspace information."
      );
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    loadDashboard();
  }, []);

  // =====================================================
  // HELPERS
  // =====================================================

  const getFileType = (document) => {
    const type = String(document?.fileType || "").toLowerCase();
    const name = String(document?.fileName || "").toLowerCase();

    if (type.includes("pdf") || name.endsWith(".pdf")) return "PDF";

    if (
      type.includes("word") ||
      type.includes("document") ||
      name.endsWith(".doc") ||
      name.endsWith(".docx")
    ) {
      return "DOCX";
    }

    if (type.includes("text") || name.endsWith(".txt")) return "TXT";

    if (
      type.includes("spreadsheet") ||
      name.endsWith(".xls") ||
      name.endsWith(".xlsx")
    ) {
      return "XLSX";
    }

    return "FILE";
  };

  const formatDate = (date) => {
    if (!date) return "Unknown";

    const value = new Date(date);

    if (Number.isNaN(value.getTime())) {
      return "Unknown";
    }

    return value.toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  };

  const formatRelativeDate = (date) => {
    if (!date) return "Recently";

    const value = new Date(date);

    if (Number.isNaN(value.getTime())) {
      return "Recently";
    }

    const diff = Date.now() - value.getTime();
    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(diff / 3600000);
    const days = Math.floor(diff / 86400000);

    if (minutes < 1) return "Just now";
    if (minutes < 60) return `${minutes} min ago`;
    if (hours < 24) return `${hours}h ago`;
    if (days < 7) return `${days}d ago`;

    return formatDate(date);
  };

  // =====================================================
  // STATISTICS
  // =====================================================

  const statistics = useMemo(() => {
    const total = documents.length;

    const pdf = documents.filter(
      (document) => getFileType(document) === "PDF"
    ).length;

    const docx = documents.filter(
      (document) => getFileType(document) === "DOCX"
    ).length;

    const txt = documents.filter(
      (document) => getFileType(document) === "TXT"
    ).length;

    const xlsx = documents.filter(
      (document) => getFileType(document) === "XLSX"
    ).length;

    const recent = documents.filter((document) => {
      const date = new Date(
        document?.uploadedAt || document?.createdAt
      );

      if (Number.isNaN(date.getTime())) return false;

      return Date.now() - date.getTime() <= 7 * 86400000;
    }).length;

    return {
      total,
      pdf,
      docx,
      txt,
      xlsx,
      recent,
    };
  }, [documents]);

  // =====================================================
  // RECENT DOCUMENTS
  // =====================================================

  const recentDocuments = useMemo(() => {
    return [...documents]
      .sort((a, b) => {
        const dateA = new Date(
          a?.uploadedAt || a?.createdAt || 0
        ).getTime();

        const dateB = new Date(
          b?.uploadedAt || b?.createdAt || 0
        ).getTime();

        return dateB - dateA;
      })
      .slice(0, 5);
  }, [documents]);

  // =====================================================
  // DOCUMENT DISTRIBUTION
  // =====================================================

  const distribution = [
    {
      type: "PDF",
      value: statistics.pdf,
      className: "pdf",
    },
    {
      type: "DOCX",
      value: statistics.docx,
      className: "docx",
    },
    {
      type: "TXT",
      value: statistics.txt,
      className: "txt",
    },
    {
      type: "XLSX",
      value: statistics.xlsx,
      className: "xlsx",
    },
  ];

  // =====================================================
  // LOADING
  // =====================================================

  if (loading) {
    return (
      <div className="manager-dashboard-page">
        <div className="manager-dashboard-loading">
          <div className="manager-dashboard-spinner" />
          <p>Loading workspace overview...</p>
        </div>
      </div>
    );
  }

  // =====================================================
  // RENDER
  // =====================================================

  return (
    <div className="manager-dashboard-page">

      {/* =================================================
          HERO
      ================================================= */}

      <section className="manager-dashboard-hero">

        <div className="manager-hero-content">
          <span className="manager-dashboard-eyebrow">
            KNOWFLOW AI · MANAGER WORKSPACE
          </span>

          <h1>
            Workspace Overview
          </h1>

          <p>
            Monitor your team knowledge, documents and workspace
            activity from one place.
          </p>

          <div className="manager-hero-actions">

            <button
              type="button"
              className="manager-primary-btn"
              onClick={() =>
                navigate("/dashboard/documents")
              }
            >
              <FolderOpen size={17} />
              Manage Documents
              <ArrowRight size={16} />
            </button>

            <button
              type="button"
              className="manager-secondary-btn"
              onClick={() =>
                navigate("/dashboard/team")
              }
            >
              <Users size={17} />
              View Team
            </button>

          </div>
        </div>

        <div className="manager-hero-visual">

          <div className="manager-orbit manager-orbit-one" />
          <div className="manager-orbit manager-orbit-two" />

          <div className="manager-hero-icon">
            <BarChart3 size={38} />
          </div>

          <div className="manager-floating-card manager-floating-card-one">
            <Activity size={15} />
            <span>
              Workspace active
            </span>
          </div>

          <div className="manager-floating-card manager-floating-card-two">
            <FileText size={15} />
            <strong>
              {statistics.total}
            </strong>
            <span>
              documents
            </span>
          </div>

        </div>

      </section>

      {/* =================================================
          ERROR
      ================================================= */}

      {error && (
        <div className="manager-dashboard-error">
          <AlertCircle size={18} />
          <span>{error}</span>

          <button
            type="button"
            onClick={() => loadDashboard(true)}
          >
            Retry
          </button>
        </div>
      )}

      {/* =================================================
          STATISTICS
      ================================================= */}

      <section className="manager-stat-grid">

        <div className="manager-stat-card main-stat">

          <div className="manager-stat-icon blue">
            <FileText size={21} />
          </div>

          <div className="manager-stat-content">
            <span>Total Documents</span>
            <strong>{statistics.total}</strong>
            <small>
              Knowledge stored in workspace
            </small>
          </div>

          <div className="manager-stat-arrow">
            <ArrowRight size={17} />
          </div>

        </div>

        <div className="manager-stat-card">

          <div className="manager-stat-icon green">
            <TrendingUp size={21} />
          </div>

          <div className="manager-stat-content">
            <span>Recent Uploads</span>
            <strong>{statistics.recent}</strong>
            <small>
              Last 7 days
            </small>
          </div>

        </div>

        <div className="manager-stat-card">

          <div className="manager-stat-icon purple">
            <Users size={21} />
          </div>

          <div className="manager-stat-content">
            <span>Team Members</span>
            <strong>—</strong>
            <small>
              Open team overview
            </small>
          </div>

        </div>

        <div className="manager-stat-card">

          <div className="manager-stat-icon orange">
            <Activity size={21} />
          </div>

          <div className="manager-stat-content">
            <span>Workspace Status</span>
            <strong className="status-text">
              Active
            </strong>
            <small>
              Everything is running
            </small>
          </div>

        </div>

      </section>

      {/* =================================================
          MAIN GRID
      ================================================= */}

      <section className="manager-dashboard-grid">

        {/* DOCUMENT DISTRIBUTION */}

        <div className="manager-panel distribution-panel">

          <div className="manager-panel-header">

            <div>
              <span className="manager-panel-kicker">
                DOCUMENT INSIGHTS
              </span>

              <h2>
                Knowledge distribution
              </h2>
            </div>

            <div className="manager-panel-icon">
              <BarChart3 size={18} />
            </div>

          </div>

          <div className="distribution-content">

            <div className="distribution-circle">

              <div>
                <strong>
                  {statistics.total}
                </strong>

                <span>
                  files
                </span>
              </div>

            </div>

            <div className="distribution-list">

              {distribution.map((item) => {

                const percentage =
                  statistics.total > 0
                    ? Math.round(
                        (item.value /
                          statistics.total) *
                          100
                      )
                    : 0;

                return (
                  <div
                    className="distribution-item"
                    key={item.type}
                  >

                    <div className="distribution-item-top">

                      <span>
                        <i
                          className={`distribution-dot ${item.className}`}
                        />

                        {item.type}
                      </span>

                      <strong>
                        {item.value}
                      </strong>

                    </div>

                    <div className="distribution-bar">
                      <div
                        className={`distribution-fill ${item.className}`}
                        style={{
                          width: `${percentage}%`,
                        }}
                      />
                    </div>

                    <small>
                      {percentage}% of workspace
                    </small>

                  </div>
                );
              })}

            </div>

          </div>

        </div>

        {/* QUICK ACTIONS */}

        <div className="manager-panel quick-panel">

          <div className="manager-panel-header">

            <div>
              <span className="manager-panel-kicker">
                MANAGER TOOLS
              </span>

              <h2>
                Quick actions
              </h2>
            </div>

          </div>

          <div className="manager-quick-actions">

            <button
              type="button"
              onClick={() =>
                navigate("/dashboard/documents")
              }
            >
              <div className="quick-icon blue">
                <FileText size={19} />
              </div>

              <div>
                <strong>
                  Workspace Documents
                </strong>

                <span>
                  Browse and manage files
                </span>
              </div>

              <ArrowRight size={16} />
            </button>

            <button
              type="button"
              onClick={() =>
                navigate("/dashboard/team")
              }
            >
              <div className="quick-icon purple">
                <Users size={19} />
              </div>

              <div>
                <strong>
                  Team Overview
                </strong>

                <span>
                  Review your team
                </span>
              </div>

              <ArrowRight size={16} />
            </button>

            <button
              type="button"
              onClick={() =>
                navigate("/dashboard/activity")
              }
            >
              <div className="quick-icon green">
                <Activity size={19} />
              </div>

              <div>
                <strong>
                  Team Activity
                </strong>

                <span>
                  Monitor recent activity
                </span>
              </div>

              <ArrowRight size={16} />
            </button>

            <button
              type="button"
              onClick={() =>
                navigate("/dashboard/settings")
              }
            >
              <div className="quick-icon orange">
                <Clock3 size={19} />
              </div>

              <div>
                <strong>
                  Workspace Settings
                </strong>

                <span>
                  Manage your preferences
                </span>
              </div>

              <ArrowRight size={16} />
            </button>

          </div>

        </div>

      </section>

      {/* =================================================
          RECENT DOCUMENTS
      ================================================= */}

      <section className="manager-panel recent-panel">

        <div className="manager-panel-header">

          <div>
            <span className="manager-panel-kicker">
              RECENT ACTIVITY
            </span>

            <h2>
              Latest workspace documents
            </h2>

            <p>
              Recently added documents in your workspace.
            </p>
          </div>

          <button
            type="button"
            className="manager-view-all"
            onClick={() =>
              navigate("/dashboard/documents")
            }
          >
            View all
            <ArrowRight size={15} />
          </button>

        </div>

        {recentDocuments.length === 0 ? (

          <div className="manager-no-documents">

            <div>
              <FileText size={25} />
            </div>

            <h3>
              No documents yet
            </h3>

            <p>
              Documents uploaded to the workspace
              will appear here.
            </p>

          </div>

        ) : (

          <div className="manager-recent-list">

            {recentDocuments.map((document) => {

              const type = getFileType(document);

              return (
                <div
                  className="manager-recent-item"
                  key={document.id}
                >

                  <div
                    className={`manager-recent-file ${type.toLowerCase()}`}
                  >
                    <FileText size={19} />
                  </div>

                  <div className="manager-recent-info">

                    <strong title={document.fileName}>
                      {document.fileName ||
                        "Untitled document"}
                    </strong>

                    <span>
                      {type} ·{" "}
                      {formatRelativeDate(
                        document.uploadedAt ||
                          document.createdAt
                      )}
                    </span>

                  </div>

                  <div className="manager-recent-status">

                    <CheckCircle2 size={15} />

                    <span>
                      Available
                    </span>

                  </div>

                  <button
                    type="button"
                    className="manager-recent-view"
                    title="View documents"
                    onClick={() =>
                      navigate("/dashboard/documents")
                    }
                  >
                    <Eye size={17} />
                  </button>

                </div>
              );
            })}

          </div>

        )}

      </section>

      {/* =================================================
          FOOTER ACTION
      ================================================= */}

      <div className="manager-dashboard-footer">

        <div>
          <Upload size={18} />

          <span>
            Keep your workspace organized and up to date.
          </span>
        </div>

        <button
          type="button"
          onClick={() => loadDashboard(true)}
          disabled={refreshing}
        >
          <RefreshCw
            size={15}
            className={
              refreshing
                ? "manager-refresh-spin"
                : ""
            }
          />

          {refreshing
            ? "Refreshing..."
            : "Refresh workspace"}
        </button>

      </div>

    </div>
  );
}
