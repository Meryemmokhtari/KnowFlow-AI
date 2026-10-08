
import React, { useEffect, useMemo, useState } from "react";
import {
  Search,
  Upload,
  FileText,
  File,
  FileImage,
  FileSpreadsheet,
  FileCode,
  FileArchive,
  Bot,
  Brain,
  BookOpen,
  GraduationCap,
  FlaskConical,
  Lightbulb,
  Database,
  RefreshCw,
  ArrowRight,
  Clock3,
  CheckCircle2,
  AlertCircle,
  Sparkles,
  Activity,
  BarChart3,
  Layers3,
  X,
} from "lucide-react";

import "./EnseignantDashboard.css";


// ============================================================
// API CONFIG
// ============================================================

const API = {
  AUTH: "http://localhost:5282",
  DOCUMENT: "http://localhost:5260",
  AI: "http://localhost:5057",
};


// ============================================================
// TOKEN
// ============================================================

function getToken() {
  return (
    localStorage.getItem("token") ||
    localStorage.getItem("accessToken") ||
    sessionStorage.getItem("token") ||
    sessionStorage.getItem("accessToken") ||
    ""
  );
}


// ============================================================
// HEADERS
// ============================================================

function getHeaders() {
  const token = getToken();

  return {
    Accept: "application/json",
    ...(token
      ? {
          Authorization: `Bearer ${token}`,
        }
      : {}),
  };
}


// ============================================================
// SAFE JSON
// ============================================================

async function safeJson(response) {
  const text = await response.text();

  if (!text) {
    return null;
  }

  try {
    return JSON.parse(text);
  } catch {
    return null;
  }
}


// ============================================================
// USER HELPERS
// ============================================================

function getUserId(user) {
  if (!user) return "";

  return String(
    user.id ||
      user.userId ||
      user.Id ||
      user.UserId ||
      ""
  ).toLowerCase();
}


function getDocumentUserId(document) {
  if (!document) return "";

  return String(
    document.userId ||
      document.UserId ||
      document.userID ||
      document.ownerId ||
      document.OwnerId ||
      ""
  ).toLowerCase();
}


function getUserDisplayName(user) {
  if (!user) return "Enseignant";

  const firstName =
    user.firstName ||
    user.FirstName ||
    user.firstname ||
    "";

  const lastName =
    user.lastName ||
    user.LastName ||
    user.lastname ||
    "";

  const fullName =
    user.fullName ||
    user.FullName ||
    user.name ||
    user.Name ||
    user.username ||
    user.Username ||
    "";

  if (firstName || lastName) {
    return `${firstName} ${lastName}`.trim();
  }

  if (fullName) {
    return fullName;
  }

  if (user.email || user.Email) {
    return String(user.email || user.Email).split("@")[0];
  }

  return "Enseignant";
}


// ============================================================
// DOCUMENT HELPERS
// ============================================================

function normalizeDocuments(data) {
  if (Array.isArray(data)) {
    return data;
  }

  if (Array.isArray(data?.documents)) {
    return data.documents;
  }

  if (Array.isArray(data?.data)) {
    return data.data;
  }

  if (Array.isArray(data?.items)) {
    return data.items;
  }

  return [];
}


function getFileName(document) {
  return (
    document?.fileName ||
    document?.FileName ||
    document?.name ||
    document?.Name ||
    "Document"
  );
}


function getFileType(document) {
  return (
    document?.fileType ||
    document?.FileType ||
    document?.mimeType ||
    document?.MimeType ||
    ""
  ).toLowerCase();
}


function getFileExtension(document) {
  const fileName = getFileName(document);

  if (!fileName.includes(".")) {
    return "";
  }

  return fileName.split(".").pop().toLowerCase();
}


function getFileCategory(document) {
  const type = getFileType(document);
  const extension = getFileExtension(document);

  if (
    type.includes("pdf") ||
    extension === "pdf"
  ) {
    return "PDF";
  }

  if (
    type.includes("word") ||
    type.includes("document") ||
    ["doc", "docx"].includes(extension)
  ) {
    return "Documents";
  }

  if (
    type.includes("spreadsheet") ||
    type.includes("excel") ||
    ["xls", "xlsx", "csv"].includes(extension)
  ) {
    return "Data";
  }

  if (
    type.includes("image") ||
    ["png", "jpg", "jpeg", "gif", "webp", "svg"].includes(extension)
  ) {
    return "Images";
  }

  if (
    type.includes("zip") ||
    type.includes("rar") ||
    ["zip", "rar", "7z"].includes(extension)
  ) {
    return "Archives";
  }

  if (
    type.includes("javascript") ||
    type.includes("typescript") ||
    type.includes("json") ||
    type.includes("text") ||
    ["js", "jsx", "ts", "tsx", "json", "css", "html", "cs", "java", "cpp"].includes(
      extension
    )
  ) {
    return "Code";
  }

  return "Other";
}


function getFileIcon(document) {
  const category = getFileCategory(document);

  switch (category) {
    case "PDF":
      return FileText;

    case "Data":
      return FileSpreadsheet;

    case "Images":
      return FileImage;

    case "Code":
      return FileCode;

    case "Archives":
      return FileArchive;

    case "Documents":
      return FileText;

    default:
      return File;
  }
}


// ============================================================
// DATE HELPERS
// ============================================================

function getDocumentDate(document) {
  return (
    document?.uploadedAt ||
    document?.UploadedAt ||
    document?.createdAt ||
    document?.CreatedAt ||
    document?.date ||
    document?.Date ||
    null
  );
}


function getRelativeDate(dateValue) {
  if (!dateValue) {
    return "Recently";
  }

  const date = new Date(dateValue);

  if (Number.isNaN(date.getTime())) {
    return "Recently";
  }

  const now = new Date();

  const difference =
    now.getTime() - date.getTime();

  const minutes = Math.floor(
    difference / (1000 * 60)
  );

  const hours = Math.floor(
    difference / (1000 * 60 * 60)
  );

  const days = Math.floor(
    difference / (1000 * 60 * 60 * 24)
  );

  if (minutes < 1) {
    return "Just now";
  }

  if (minutes < 60) {
    return `${minutes} min ago`;
  }

  if (hours < 24) {
    return `${hours}h ago`;
  }

  if (days === 1) {
    return "Yesterday";
  }

  if (days < 7) {
    return `${days} days ago`;
  }

  return date.toLocaleDateString();
}


function isWithinLastDays(dateValue, days = 7) {
  if (!dateValue) return false;

  const date = new Date(dateValue);

  if (Number.isNaN(date.getTime())) {
    return false;
  }

  const now = new Date();

  const limit = new Date(
    now.getTime() -
      days * 24 * 60 * 60 * 1000
  );

  return date >= limit && date <= now;
}


// ============================================================
// MAIN COMPONENT
// ============================================================

export default function EnseignantDashboard() {
  const [user, setUser] = useState(null);

  const [documents, setDocuments] = useState([]);

  const [loading, setLoading] = useState(true);

  const [refreshing, setRefreshing] = useState(false);

  const [error, setError] = useState("");

  const [searchTerm, setSearchTerm] = useState("");

  const [aiOnline, setAiOnline] = useState(null);


  // ==========================================================
  // LOAD DASHBOARD
  // ==========================================================

  const loadDashboard = async (isRefresh = false) => {
    const token = getToken();

    if (!token) {
      setError(
        "Authentication token not found. Please login again."
      );

      setLoading(false);

      return;
    }

    try {
      if (isRefresh) {
        setRefreshing(true);
      } else {
        setLoading(true);
      }

      setError("");


      // --------------------------------------------------------
      // CURRENT USER
      // --------------------------------------------------------

      const userResponse = await fetch(
        `${API.AUTH}/api/Auth/me`,
        {
          method: "GET",
          headers: getHeaders(),
        }
      );


      if (userResponse.status === 401) {
        localStorage.removeItem("token");
        localStorage.removeItem("accessToken");
        sessionStorage.removeItem("token");
        sessionStorage.removeItem("accessToken");

        throw new Error(
          "Your session has expired. Please login again."
        );
      }


      if (!userResponse.ok) {
        throw new Error(
          `Unable to load your profile (${userResponse.status}).`
        );
      }


      const userData = await safeJson(
        userResponse
      );

      setUser(userData);


      // --------------------------------------------------------
      // DOCUMENTS
      // --------------------------------------------------------

      const documentResponse = await fetch(
        `${API.DOCUMENT}/api/Document`,
        {
          method: "GET",
          headers: getHeaders(),
        }
      );


      if (!documentResponse.ok) {
        throw new Error(
          `Unable to load documents (${documentResponse.status}).`
        );
      }


      const documentData = await safeJson(
        documentResponse
      );

      const allDocuments =
        normalizeDocuments(documentData);


      // --------------------------------------------------------
      // FILTER DOCUMENTS BY CURRENT USER
      // --------------------------------------------------------

      const currentUserId =
        getUserId(userData);


      const userDocuments =
        allDocuments.filter((document) => {
          const documentUserId =
            getDocumentUserId(document);

          // If backend does not provide UserId,
          // keep the document instead of showing an empty dashboard.
          if (!documentUserId) {
            return true;
          }

          return (
            documentUserId === currentUserId
          );
        });


      setDocuments(userDocuments);


      // --------------------------------------------------------
      // AI SERVICE HEALTH
      // --------------------------------------------------------

      try {
        const aiResponse = await fetch(
          `${API.AI}/api/AI/health`,
          {
            method: "GET",
            headers: {
              Accept: "application/json",
            },
          }
        );

        setAiOnline(aiResponse.ok);
      } catch (aiError) {
        console.warn(
          "AIService unavailable:",
          aiError
        );

        setAiOnline(false);
      }


    } catch (err) {
      console.error(
        "Enseignant Dashboard Error:",
        err
      );

      setError(
        err?.message ||
          "Unable to load dashboard data."
      );

    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };


  // ==========================================================
  // INITIAL LOAD
  // ==========================================================

  useEffect(() => {
    loadDashboard();
  }, []);


  // ==========================================================
  // WELCOME NAME
  // ==========================================================

  const displayName = useMemo(() => {
    return getUserDisplayName(user);
  }, [user]);


  // ==========================================================
  // TOTAL DOCUMENTS
  // ==========================================================

  const totalDocuments =
    documents.length;


  // ==========================================================
  // DOCUMENTS ADDED THIS WEEK
  // ==========================================================

  const weeklyDocuments = useMemo(() => {
    return documents.filter((document) =>
      isWithinLastDays(
        getDocumentDate(document),
        7
      )
    ).length;
  }, [documents]);


  // ==========================================================
  // DOCUMENT DISTRIBUTION
  // ==========================================================

  const distribution = useMemo(() => {
    const categories = {
      PDF: 0,
      Documents: 0,
      Data: 0,
      Images: 0,
      Code: 0,
      Archives: 0,
      Other: 0,
    };

    documents.forEach((document) => {
      const category =
        getFileCategory(document);

      if (categories[category] !== undefined) {
        categories[category]++;
      } else {
        categories.Other++;
      }
    });

    return Object.entries(categories)
      .filter(([, value]) => value > 0)
      .sort((a, b) => b[1] - a[1]);
  }, [documents]);


  // ==========================================================
  // RECENT DOCUMENTS
  // ==========================================================

  const recentDocuments = useMemo(() => {
    return [...documents]
      .sort((a, b) => {
        const dateA = new Date(
          getDocumentDate(a) || 0
        ).getTime();

        const dateB = new Date(
          getDocumentDate(b) || 0
        ).getTime();

        return dateB - dateA;
      })
      .slice(0, 5);
  }, [documents]);


  // ==========================================================
  // SEARCHED DOCUMENTS
  // ==========================================================

  const filteredDocuments = useMemo(() => {
    const value =
      searchTerm.trim().toLowerCase();

    if (!value) {
      return recentDocuments;
    }

    return documents
      .filter((document) => {
        const fileName =
          getFileName(document).toLowerCase();

        const fileType =
          getFileType(document).toLowerCase();

        return (
          fileName.includes(value) ||
          fileType.includes(value)
        );
      })
      .slice(0, 5);
  }, [
    documents,
    recentDocuments,
    searchTerm,
  ]);


  // ==========================================================
  // LAST 7 DAYS ACTIVITY
  // ==========================================================

  const activity = useMemo(() => {
    const result = [];

    for (let i = 6; i >= 0; i--) {
      const date = new Date();

      date.setHours(0, 0, 0, 0);

      date.setDate(
        date.getDate() - i
      );

      const nextDate = new Date(date);

      nextDate.setDate(
        nextDate.getDate() + 1
      );


      const count = documents.filter(
        (document) => {
          const documentDate =
            getDocumentDate(document);

          if (!documentDate) {
            return false;
          }

          const parsed =
            new Date(documentDate);

          return (
            parsed >= date &&
            parsed < nextDate
          );
        }
      ).length;


      result.push({
        label: date.toLocaleDateString(
          "en-US",
          {
            weekday: "short",
          }
        ),
        date,
        count,
      });
    }

    return result;
  }, [documents]);


  const maxActivity = Math.max(
    ...activity.map(
      (item) => item.count
    ),
    1
  );


  // ==========================================================
  // GALAXY DATA
  // ==========================================================

  const galaxyItems = [
    {
      title: "Courses",
      subtitle: "Teaching materials",
      icon: GraduationCap,
      count: documents.filter(
        (document) =>
          getFileName(document)
            .toLowerCase()
            .includes("course")
      ).length,
      className: "galaxy-blue",
    },
    {
      title: "Research",
      subtitle: "Research knowledge",
      icon: FlaskConical,
      count: documents.filter(
        (document) =>
          getFileName(document)
            .toLowerCase()
            .includes("research")
      ).length,
      className: "galaxy-purple",
    },
    {
      title: "Practical",
      subtitle: "Exercises & projects",
      icon: Lightbulb,
      count: documents.filter(
        (document) => {
          const name =
            getFileName(document)
              .toLowerCase();

          return (
            name.includes("tp") ||
            name.includes("exercise") ||
            name.includes("project")
          );
        }
      ).length,
      className: "galaxy-orange",
    },
    {
      title: "Knowledge",
      subtitle: "Your document universe",
      icon: Brain,
      count: totalDocuments,
      className: "galaxy-cyan",
    },
  ];


  // ==========================================================
  // NAVIGATION
  // ==========================================================

  const goTo = (path) => {
    window.location.href = path;
  };


  // ==========================================================
  // SEARCH
  // ==========================================================

  const handleSearch = (event) => {
    event.preventDefault();

    if (!searchTerm.trim()) {
      return;
    }

    goTo(
      `/dashboard/search?query=${encodeURIComponent(
        searchTerm.trim()
      )}`
    );
  };


  // ==========================================================
  // LOADING
  // ==========================================================

  if (loading) {
    return (
      <div className="enseignant-dashboard-loading">
        <div className="loading-orb">
          <Brain size={34} />
        </div>

        <h2>Loading your knowledge space</h2>

        <p>
          Preparing your teaching intelligence...
        </p>

        <div className="loading-line">
          <span />
        </div>
      </div>
    );
  }


  // ==========================================================
  // ERROR
  // ==========================================================

  if (error) {
    return (
      <div className="enseignant-dashboard-error">
        <div className="error-card">
          <div className="error-icon">
            <AlertCircle size={34} />
          </div>

          <h2>Unable to load dashboard</h2>

          <p>{error}</p>

          <button
            type="button"
            onClick={() => loadDashboard()}
            className="retry-button"
          >
            <RefreshCw size={17} />
            Try again
          </button>
        </div>
      </div>
    );
  }


  // ==========================================================
  // RENDER
  // ==========================================================

  return (
    <div className="enseignant-dashboard">

      {/* ======================================================
          HEADER
      ====================================================== */}

      <header className="dashboard-header">

        <div className="header-brand">

          <div className="brand-mark">
            <Brain size={23} />
          </div>

          <div>
            <span className="brand-name">
              KNOWFLOW AI
            </span>

            <span className="brand-context">
              TEACHER INTELLIGENCE
            </span>
          </div>

        </div>


        <div className="header-actions">

          <div className="ai-status">

            <span
              className={`status-dot ${
                aiOnline === true
                  ? "online"
                  : aiOnline === false
                  ? "offline"
                  : "unknown"
              }`}
            />

            <span>
              {aiOnline === true
                ? "AI Online"
                : aiOnline === false
                ? "AI Offline"
                : "AI Status"}
            </span>

          </div>


          <button
            type="button"
            className={`refresh-button ${
              refreshing ? "spinning" : ""
            }`}
            onClick={() =>
              loadDashboard(true)
            }
            title="Refresh dashboard"
          >
            <RefreshCw size={18} />
          </button>

        </div>

      </header>


      {/* ======================================================
          WELCOME
      ====================================================== */}

      <section className="welcome-section">

        <div className="welcome-content">

          <div className="eyebrow">
            <Sparkles size={15} />
            TEACHING KNOWLEDGE CENTER
          </div>

          <h1>
            Welcome back,{" "}
            <span>{displayName}</span>
          </h1>

          <p>
            Your teaching knowledge, documents and
            AI intelligence — organized in one
            intelligent workspace.
          </p>

        </div>


        <div className="welcome-visual">

          <div className="visual-ring ring-one" />
          <div className="visual-ring ring-two" />
          <div className="visual-ring ring-three" />

          <div className="visual-core">
            <Brain size={40} />
          </div>

          <div className="floating-dot dot-one" />
          <div className="floating-dot dot-two" />
          <div className="floating-dot dot-three" />

        </div>

      </section>


      {/* ======================================================
          SEARCH + UPLOAD
      ====================================================== */}

      <section className="quick-actions">

        <form
          className="dashboard-search"
          onSubmit={handleSearch}
        >

          <Search size={19} />

          <input
            type="text"
            value={searchTerm}
            onChange={(event) =>
              setSearchTerm(
                event.target.value
              )
            }
            placeholder="Search your knowledge..."
          />

          {searchTerm && (
            <button
              type="button"
              className="clear-search"
              onClick={() =>
                setSearchTerm("")
              }
            >
              <X size={15} />
            </button>
          )}

          <button
            type="submit"
            className="search-submit"
          >
            Search
          </button>

        </form>


        <button
          type="button"
          className="upload-button"
          onClick={() =>
            goTo("/dashboard/upload")
          }
        >
          <Upload size={18} />
          <span>Upload Knowledge</span>
          <ArrowRight size={17} />
        </button>

      </section>


      {/* ======================================================
          STATISTICS
      ====================================================== */}

      <section className="stats-grid">

        {/* Documents */}

        <article className="stat-card">

          <div className="stat-top">

            <div className="stat-icon">
              <Database size={20} />
            </div>

            <span className="stat-label">
              KNOWLEDGE
            </span>

          </div>

          <div className="stat-value">
            {totalDocuments}
          </div>

          <div className="stat-description">
            Total documents
          </div>

          <div className="stat-footer">
            <Layers3 size={14} />
            Your teaching library
          </div>

        </article>


        {/* Weekly activity */}

        <article className="stat-card">

          <div className="stat-top">

            <div className="stat-icon">
              <Activity size={20} />
            </div>

            <span className="stat-label">
              ACTIVITY
            </span>

          </div>

          <div className="stat-value">
            {weeklyDocuments}
          </div>

          <div className="stat-description">
            Added this week
          </div>

          <div className="stat-footer positive">
            <CheckCircle2 size={14} />
            Recent knowledge growth
          </div>

        </article>


        {/* AI */}

        <article className="stat-card">

          <div className="stat-top">

            <div className="stat-icon">
              <Bot size={20} />
            </div>

            <span className="stat-label">
              INTELLIGENCE
            </span>

          </div>

          <div className="stat-value stat-ai">
            {aiOnline === true
              ? "ON"
              : aiOnline === false
              ? "OFF"
              : "—"}
          </div>

          <div className="stat-description">
            AI service status
          </div>

          <div
            className={`stat-footer ${
              aiOnline === true
                ? "positive"
                : aiOnline === false
                ? "negative"
                : ""
            }`}
          >
            {aiOnline === true ? (
              <>
                <CheckCircle2 size={14} />
                Ready for AI requests
              </>
            ) : aiOnline === false ? (
              <>
                <AlertCircle size={14} />
                Service unavailable
              </>
            ) : (
              <>
                <Clock3 size={14} />
                Checking service
              </>
            )}
          </div>

        </article>


        {/* Indexed */}

        <article className="stat-card">

          <div className="stat-top">

            <div className="stat-icon">
              <Layers3 size={20} />
            </div>

            <span className="stat-label">
              INDEX
            </span>

          </div>

          <div className="stat-value">
            {totalDocuments}
          </div>

          <div className="stat-description">
            Available knowledge
          </div>

          <div className="stat-footer">
            <Database size={14} />
            Connected document store
          </div>

        </article>

      </section>


      {/* ======================================================
          ANALYTICS
      ====================================================== */}

      <section className="analytics-grid">

        {/* Activity */}

        <article className="panel activity-panel">

          <div className="panel-header">

            <div>

              <span className="panel-eyebrow">
                KNOWLEDGE ACTIVITY
              </span>

              <h2>
                Document activity
              </h2>

              <p>
                Upload activity during the last
                seven days.
              </p>

            </div>

            <div className="panel-header-icon">
              <BarChart3 size={20} />
            </div>

          </div>


          <div className="activity-chart">

            {activity.map((item) => {

              const height =
                item.count === 0
                  ? 8
                  : Math.max(
                      12,
                      (item.count /
                        maxActivity) *
                        100
                    );

              return (
                <div
                  className="activity-day"
                  key={item.label}
                >

                  <div className="activity-bar-wrap">

                    <div
                      className="activity-bar"
                      style={{
                        height: `${height}%`,
                      }}
                      title={`${item.count} document${
                        item.count !== 1
                          ? "s"
                          : ""
                      }`}
                    >
                      {item.count > 0 && (
                        <span>
                          {item.count}
                        </span>
                      )}
                    </div>

                  </div>

                  <span className="activity-label">
                    {item.label}
                  </span>

                </div>
              );
            })}

          </div>

        </article>


        {/* Distribution */}

        <article className="panel distribution-panel">

          <div className="panel-header">

            <div>

              <span className="panel-eyebrow">
                KNOWLEDGE MIX
              </span>

              <h2>
                Content distribution
              </h2>

              <p>
                Your current document ecosystem.
              </p>

            </div>

            <div className="panel-header-icon">
              <Layers3 size={20} />
            </div>

          </div>


          {distribution.length === 0 ? (

            <div className="empty-distribution">

              <FileText size={30} />

              <span>
                No documents yet
              </span>

              <small>
                Upload your first knowledge file.
              </small>

            </div>

          ) : (

            <div className="distribution-list">

              {distribution.map(
                ([category, count]) => {

                  const percentage =
                    totalDocuments > 0
                      ? Math.round(
                          (count /
                            totalDocuments) *
                            100
                        )
                      : 0;

                  return (
                    <div
                      className="distribution-item"
                      key={category}
                    >

                      <div className="distribution-info">

                        <span>
                          {category}
                        </span>

                        <strong>
                          {count}
                        </strong>

                      </div>

                      <div className="distribution-track">

                        <div
                          className="distribution-fill"
                          style={{
                            width: `${percentage}%`,
                          }}
                        />

                      </div>

                      <span className="distribution-percent">
                        {percentage}%
                      </span>

                    </div>
                  );
                }
              )}

            </div>

          )}

        </article>

      </section>


      {/* ======================================================
          KNOWLEDGE GALAXY
      ====================================================== */}

      <section className="knowledge-galaxy">

        <div className="galaxy-header">

          <div>

            <div className="panel-eyebrow">
              <Sparkles size={14} />
              KNOWLEDGE GALAXY
            </div>

            <h2>
              Your teaching universe
            </h2>

            <p>
              Explore the different dimensions
              of your academic knowledge.
            </p>

          </div>

          <div className="galaxy-total">

            <Brain size={18} />

            <div>
              <strong>
                {totalDocuments}
              </strong>

              <span>
                knowledge nodes
              </span>
            </div>

          </div>

        </div>


        <div className="galaxy-container">

          <div className="galaxy-orbit orbit-large" />
          <div className="galaxy-orbit orbit-medium" />
          <div className="galaxy-orbit orbit-small" />


          <div className="galaxy-center">

            <div className="galaxy-center-glow" />

            <Brain size={34} />

            <strong>
              KNOWFLOW
            </strong>

            <span>
              AI
            </span>

          </div>


          <div className="galaxy-nodes">

            {galaxyItems.map(
              (item, index) => {

                const Icon =
                  item.icon;

                return (
                  <div
                    className={`galaxy-node node-${index + 1} ${item.className}`}
                    key={item.title}
                  >

                    <div className="node-icon">
                      <Icon size={22} />
                    </div>

                    <div className="node-content">

                      <strong>
                        {item.title}
                      </strong>

                      <span>
                        {item.subtitle}
                      </span>

                      <small>
                        {item.count} items
                      </small>

                    </div>

                  </div>
                );
              }
            )}

          </div>

        </div>

      </section>


      {/* ======================================================
          RECENT KNOWLEDGE
      ====================================================== */}

      <section className="recent-section">

        <div className="section-heading">

          <div>

            <span className="panel-eyebrow">
              KNOWLEDGE STREAM
            </span>

            <h2>
              Recent knowledge
            </h2>

            <p>
              The latest documents added to
              your workspace.
            </p>

          </div>


          <button
            type="button"
            className="view-all-button"
            onClick={() =>
              goTo("/dashboard/documents")
            }
          >
            View all
            <ArrowRight size={16} />
          </button>

        </div>


        <div className="recent-documents">

          {filteredDocuments.length === 0 ? (

            <div className="empty-documents">

              <div className="empty-icon">
                <BookOpen size={28} />
              </div>

              <h3>
                No knowledge found
              </h3>

              <p>
                Start building your teaching
                knowledge space by uploading
                documents.
              </p>

              <button
                type="button"
                onClick={() =>
                  goTo("/dashboard/upload")
                }
              >
                <Upload size={16} />
                Upload document
              </button>

            </div>

          ) : (

            filteredDocuments.map(
              (document) => {

                const Icon =
                  getFileIcon(document);

                const fileName =
                  getFileName(document);

                const category =
                  getFileCategory(document);

                return (
                  <div
                    className="recent-document"
                    key={
                      document.id ||
                      document.Id ||
                      fileName
                    }
                  >

                    <div className="document-icon">
                      <Icon size={21} />
                    </div>


                    <div className="document-main">

                      <strong
                        title={fileName}
                      >
                        {fileName}
                      </strong>

                      <div className="document-meta">

                        <span>
                          {category}
                        </span>

                        <span className="meta-separator">
                          •
                        </span>

                        <span>
                          {getRelativeDate(
                            getDocumentDate(
                              document
                            )
                          )}
                        </span>

                      </div>

                    </div>


                    <div className="document-status">

                      <CheckCircle2
                        size={15}
                      />

                      <span>
                        Available
                      </span>

                    </div>


                    <button
                      type="button"
                      className="document-arrow"
                      onClick={() => {
                        const id =
                          document.id ||
                          document.Id;

                        if (id) {
                          goTo(
                            `/dashboard/documents/${id}`
                          );
                        } else {
                          goTo(
                            "/dashboard/documents"
                          );
                        }
                      }}
                    >
                      <ArrowRight size={17} />
                    </button>

                  </div>
                );
              }
            )

          )}

        </div>

      </section>


      {/* ======================================================
          AI INTELLIGENCE PANEL
      ====================================================== */}

      <section className="intelligence-panel">

        <div className="intelligence-icon">
          <Bot size={28} />
        </div>


        <div className="intelligence-content">

          <span className="panel-eyebrow">
            AI INTELLIGENCE
          </span>

          <h2>
            Turn your documents into answers.
          </h2>

          <p>
            Use KnowFlow AI to search, understand
            and interact with the knowledge you
            have already built.
          </p>

        </div>


        <div className="intelligence-action">

          <div
            className={`intelligence-status ${
              aiOnline === true
                ? "ready"
                : aiOnline === false
                ? "offline"
                : ""
            }`}
          >

            <span />

            {aiOnline === true
              ? "AI READY"
              : aiOnline === false
              ? "AI OFFLINE"
              : "AI CHECKING"}

          </div>


          <button
            type="button"
            onClick={() =>
              goTo("/dashboard/assistant")
            }
          >
            Open AI Assistant
            <ArrowRight size={17} />
          </button>

        </div>

      </section>


      {/* ======================================================
          FOOTER
      ====================================================== */}

      <footer className="dashboard-footer">

        <div>
          <Brain size={16} />
          KNOWFLOW AI
        </div>

        <span>
          Teaching Intelligence Workspace
        </span>

      </footer>

    </div>
  );
}