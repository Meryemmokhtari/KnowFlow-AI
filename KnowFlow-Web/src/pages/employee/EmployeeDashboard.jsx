
import React, {
  useCallback,
  useEffect,
  useMemo,
  useState,
} from "react";

import {
  Activity,
  ArrowRight,
  Bot,
  CheckCircle2,
  Clock3,
  Eye,
  File,
  FileArchive,
  FileSpreadsheet,
  FileText,
  FileType2,
  HardDrive,
  RefreshCw,
  Search,
  Sparkles,
  Trash2,
  Upload,
  UserRound,
  X,
} from "lucide-react";

import { useNavigate } from "react-router-dom";
import { jwtDecode } from "jwt-decode";

import "./EmployeeDashboard.css";

// =====================================================
// API
// =====================================================

const AUTH_API = "http://localhost:5282";
const DOCUMENT_API = "http://localhost:5260";

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
// CLEAR AUTH
// =====================================================

function clearAuth() {
  localStorage.removeItem("token");
  localStorage.removeItem("accessToken");

  sessionStorage.removeItem("token");
  sessionStorage.removeItem("accessToken");
}

// =====================================================
// AUTH HEADERS
// =====================================================

function getAuthHeaders() {
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

// =====================================================
// NORMALIZE ROLE
// =====================================================

function normalizeRole(role) {
  const value = String(role || "")
    .trim()
    .toLowerCase();

  if (
    value === "admin" ||
    value === "administrator" ||
    value === "administrateur"
  ) {
    return "Admin";
  }

  if (
    value === "employee" ||
    value === "employe" ||
    value === "employé"
  ) {
    return "Employee";
  }

  if (
    value === "manager" ||
    value === "responsable"
  ) {
    return "Manager";
  }

  if (
    value === "enseignant" ||
    value === "teacher"
  ) {
    return "Enseignant";
  }

  if (
    value === "etudiant" ||
    value === "étudiant" ||
    value === "student"
  ) {
    return "Étudiant";
  }

  return role || "Employee";
}

// =====================================================
// JWT USER
// =====================================================

function getUserFromToken(token) {
  if (!token) {
    return null;
  }

  try {
    const decoded = jwtDecode(token);

    const id =
      decoded.sub ||
      decoded.id ||
      decoded.userId ||
      decoded.UserId ||
      decoded[
        "http://schemas.xmlsoap.org/ws/2005/05/identity/claims/nameidentifier"
      ];

    const name =
      decoded.name ||
      decoded.Name ||
      decoded.username ||
      decoded.userName ||
      decoded[
        "http://schemas.xmlsoap.org/ws/2005/05/identity/claims/name"
      ];

    const email =
      decoded.email ||
      decoded.Email ||
      decoded[
        "http://schemas.xmlsoap.org/ws/2005/05/identity/claims/emailaddress"
      ];

    const role =
      decoded.role ||
      decoded.Role ||
      decoded[
        "http://schemas.microsoft.com/ws/2008/06/identity/claims/role"
      ];

    return {
      id,
      name,
      email,
      role: normalizeRole(role),
    };
  } catch (error) {
    console.error("JWT decode error:", error);
    return null;
  }
}

// =====================================================
// EXTRACT ARRAY
// =====================================================

function extractArray(data) {
  if (Array.isArray(data)) {
    return data;
  }

  if (Array.isArray(data?.data)) {
    return data.data;
  }

  if (Array.isArray(data?.documents)) {
    return data.documents;
  }

  if (Array.isArray(data?.Documents)) {
    return data.Documents;
  }

  if (Array.isArray(data?.items)) {
    return data.items;
  }

  if (Array.isArray(data?.Items)) {
    return data.Items;
  }

  if (Array.isArray(data?.result)) {
    return data.result;
  }

  if (Array.isArray(data?.Result)) {
    return data.Result;
  }

  return [];
}

// =====================================================
// NORMALIZE DOCUMENT
// =====================================================

function normalizeDocument(document) {
  return {
    id:
      document?.id ??
      document?.Id ??
      document?.documentId ??
      document?.DocumentId ??
      "",

    userId:
      document?.userId ??
      document?.UserId ??
      document?.ownerId ??
      document?.OwnerId ??
      "",

    fileName:
      document?.fileName ??
      document?.FileName ??
      document?.name ??
      document?.Name ??
      "Untitled document",

    filePath:
      document?.filePath ??
      document?.FilePath ??
      "",

    fileType:
      document?.fileType ??
      document?.FileType ??
      document?.contentType ??
      document?.ContentType ??
      "",

    fileSize: Number(
      document?.fileSize ??
        document?.FileSize ??
        document?.size ??
        document?.Size ??
        0
    ),

    uploadedAt:
      document?.uploadedAt ??
      document?.UploadedAt ??
      document?.createdAt ??
      document?.CreatedAt ??
      document?.uploadDate ??
      document?.UploadDate ??
      null,

    extractedText:
      document?.extractedText ??
      document?.ExtractedText ??
      "",

    summary:
      document?.summary ??
      document?.Summary ??
      null,
  };
}

// =====================================================
// FILE SIZE
// =====================================================

function formatFileSize(bytes) {
  const value = Number(bytes || 0);

  if (value <= 0) {
    return "0 KB";
  }

  const units = [
    "Bytes",
    "KB",
    "MB",
    "GB",
  ];

  const index = Math.min(
    Math.floor(Math.log(value) / Math.log(1024)),
    units.length - 1
  );

  return `${(
    value / Math.pow(1024, index)
  ).toFixed(index === 0 ? 0 : 1)} ${units[index]}`;
}

// =====================================================
// DATE
// =====================================================

function formatDate(date) {
  if (!date) {
    return "Unknown";
  }

  const parsed = new Date(date);

  if (Number.isNaN(parsed.getTime())) {
    return "Unknown";
  }

  return parsed.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

// =====================================================
// EXTENSION
// =====================================================

function getExtension(fileName = "") {
  const cleanName = String(fileName)
    .split("/")
    .pop()
    .split("\\")
    .pop();

  const parts = cleanName.split(".");

  if (parts.length <= 1) {
    return "FILE";
  }

  return parts.pop().toUpperCase();
}

// =====================================================
// FILE ICON
// =====================================================

function getFileIcon(fileName = "", fileType = "") {
  const extension =
    getExtension(fileName).toLowerCase();

  const type =
    String(fileType).toLowerCase();

  if (
    extension === "pdf" ||
    type.includes("pdf")
  ) {
    return FileType2;
  }

  if (
    extension === "doc" ||
    extension === "docx" ||
    type.includes("word")
  ) {
    return FileText;
  }

  if (
    ["xls", "xlsx", "csv"].includes(extension) ||
    type.includes("excel") ||
    type.includes("spreadsheet")
  ) {
    return FileSpreadsheet;
  }

  if (
    ["zip", "rar", "7z"].includes(extension)
  ) {
    return FileArchive;
  }

  return File;
}

// =====================================================
// DOCUMENT TYPE
// =====================================================

function getDocumentType(document) {
  const extension =
    getExtension(document?.fileName).toLowerCase();

  const type =
    String(document?.fileType || "").toLowerCase();

  if (
    extension === "pdf" ||
    type.includes("pdf")
  ) {
    return "PDF";
  }

  if (
    extension === "doc" ||
    extension === "docx" ||
    type.includes("word")
  ) {
    return "DOCX";
  }

  if (
    extension === "txt" ||
    type.includes("text")
  ) {
    return "TXT";
  }

  if (
    ["xls", "xlsx", "csv"].includes(extension) ||
    type.includes("sheet") ||
    type.includes("excel")
  ) {
    return "Spreadsheet";
  }

  return "Other";
}

// =====================================================
// EMPLOYEE DASHBOARD
// =====================================================

export default function EmployeeDashboard() {
  const navigate = useNavigate();

  const [user, setUser] = useState(null);
  const [documents, setDocuments] = useState([]);

  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const [deletingId, setDeletingId] = useState(null);

  // ===================================================
  // LOAD USER
  // ===================================================

  const loadUser = useCallback(async () => {
    const token = getToken();

    if (!token) {
      clearAuth();
      navigate("/login", { replace: true });
      return null;
    }

    const tokenUser = getUserFromToken(token);

    try {
      const response = await fetch(
        `${AUTH_API}/api/Auth/me`,
        {
          method: "GET",
          headers: getAuthHeaders(),
        }
      );

      if (response.status === 401) {
        clearAuth();

        navigate("/login", {
          replace: true,
        });

        return null;
      }

      const contentType =
        response.headers.get("content-type") || "";

      let data = null;

      if (
        contentType.includes(
          "application/json"
        )
      ) {
        data = await response.json();
      }

      if (!response.ok) {
        if (tokenUser) {
          setUser(tokenUser);
          return tokenUser;
        }

        throw new Error(
          data?.message ||
            data?.title ||
            "Unable to load your profile."
        );
      }

      const apiUser =
        data?.data ||
        data?.user ||
        data?.User ||
        data;

      const finalUser = {
        id:
          apiUser?.id ??
          apiUser?.Id ??
          apiUser?.userId ??
          apiUser?.UserId ??
          tokenUser?.id ??
          "",

        name:
          apiUser?.name ??
          apiUser?.Name ??
          apiUser?.userName ??
          apiUser?.UserName ??
          apiUser?.firstName ??
          apiUser?.FirstName ??
          tokenUser?.name ??
          "Employee",

        email:
          apiUser?.email ??
          apiUser?.Email ??
          tokenUser?.email ??
          "",

        role: normalizeRole(
          apiUser?.role ??
            apiUser?.Role ??
            tokenUser?.role ??
            "Employee"
        ),
      };

      setUser(finalUser);

      return finalUser;
    } catch (err) {
      console.error(
        "Employee user error:",
        err
      );

      if (tokenUser) {
        setUser(tokenUser);
        return tokenUser;
      }

      setError(
        err?.message ||
          "Unable to load your profile."
      );

      return null;
    }
  }, [navigate]);

  // ===================================================
  // LOAD DOCUMENTS
  // ===================================================

  const loadDocuments = useCallback(
    async currentUser => {
      const token = getToken();

      if (!token) {
        clearAuth();

        navigate("/login", {
          replace: true,
        });

        return;
      }

      try {
        const response = await fetch(
          `${DOCUMENT_API}/api/Document`,
          {
            method: "GET",
            headers: getAuthHeaders(),
          }
        );

        if (response.status === 401) {
          clearAuth();

          navigate("/login", {
            replace: true,
          });

          return;
        }

        const contentType =
          response.headers.get("content-type") || "";

        let data = null;

        if (
          contentType.includes(
            "application/json"
          )
        ) {
          data = await response.json();
        } else {
          await response.text();
          data = [];
        }

        if (!response.ok) {
          throw new Error(
            data?.message ||
              data?.title ||
              `DocumentService error (${response.status})`
          );
        }

        const allDocuments = extractArray(data)
          .map(normalizeDocument)
          .filter(
            document =>
              document.id !== ""
          );

        setDocuments(allDocuments);
      } catch (err) {
        console.error(
          "Employee documents error:",
          err
        );

        setError(
          err?.message ||
            "Unable to load your documents."
        );

        setDocuments([]);
      }
    },
    [navigate]
  );

  // ===================================================
  // INITIALIZE
  // ===================================================

  const initialize = useCallback(async () => {
    setLoading(true);
    setError("");

    const currentUser =
      await loadUser();

    if (currentUser) {
      await loadDocuments(
        currentUser
      );
    }

    setLoading(false);
  }, [
    loadUser,
    loadDocuments,
  ]);

  useEffect(() => {
    initialize();
  }, [initialize]);

  // ===================================================
  // REFRESH
  // ===================================================

  const handleRefresh = async () => {
    setRefreshing(true);
    setError("");
    setSuccess("");

    const currentUser =
      await loadUser();

    if (currentUser) {
      await loadDocuments(
        currentUser
      );
    }

    setRefreshing(false);
  };

  // ===================================================
  // DELETE
  // ===================================================

  const handleDelete = async document => {
    if (!document?.id) {
      return;
    }

    const confirmed =
      window.confirm(
        `Are you sure you want to delete "${document.fileName}"?`
      );

    if (!confirmed) {
      return;
    }

    setDeletingId(document.id);
    setError("");
    setSuccess("");

    try {
      const response = await fetch(
        `${DOCUMENT_API}/api/Document/${document.id}`,
        {
          method: "DELETE",
          headers: getAuthHeaders(),
        }
      );

      if (response.status === 401) {
        clearAuth();

        navigate("/login", {
          replace: true,
        });

        return;
      }

      const contentType =
        response.headers.get("content-type") || "";

      let data = null;

      if (
        contentType.includes(
          "application/json"
        )
      ) {
        data = await response.json();
      }

      if (!response.ok) {
        throw new Error(
          data?.message ||
            data?.title ||
            "Unable to delete the document."
        );
      }

      setDocuments(previous =>
        previous.filter(
          item =>
            String(item.id) !==
            String(document.id)
        )
      );

      setSuccess(
        "Document deleted successfully."
      );
    } catch (err) {
      console.error(
        "Delete document error:",
        err
      );

      setError(
        err?.message ||
          "Unable to delete the document."
      );
    } finally {
      setDeletingId(null);
    }
  };

  // ===================================================
  // OPEN DOCUMENT
  // ===================================================

  const handleOpenDocument = document => {
    if (!document?.fileName) {
      return;
    }

    const safeFileName =
      String(document.fileName)
        .split("/")
        .pop()
        .split("\\")
        .pop();

    const url =
      `${DOCUMENT_API}/api/Document/file/` +
      encodeURIComponent(
        safeFileName
      );

    window.open(
      url,
      "_blank",
      "noopener,noreferrer"
    );
  };

  // ===================================================
  // USER INFO
  // ===================================================

  const displayName =
    user?.name ||
    user?.Name ||
    user?.userName ||
    user?.UserName ||
    user?.email ||
    user?.Email ||
    "Employee";

  const email =
    user?.email ||
    user?.Email ||
    "";

  const role =
    user?.role ||
    user?.Role ||
    "Employee";

  // ===================================================
  // STATISTICS
  // ===================================================

  const statistics = useMemo(() => {
    const total =
      documents.length;

    const storage =
      documents.reduce(
        (sum, document) =>
          sum +
          Number(
            document.fileSize || 0
          ),
        0
      );

    const pdf =
      documents.filter(
        document =>
          getDocumentType(
            document
          ) === "PDF"
      ).length;

    const last7Days =
      documents.filter(
        document => {
          if (!document.uploadedAt) {
            return false;
          }

          const date =
            new Date(
              document.uploadedAt
            );

          if (
            Number.isNaN(
              date.getTime()
            )
          ) {
            return false;
          }

          const diff =
            Date.now() -
            date.getTime();

          return (
            diff >= 0 &&
            diff <=
              7 *
                24 *
                60 *
                60 *
                1000
          );
        }
      ).length;

    return {
      total,
      storage,
      pdf,
      last7Days,
    };
  }, [documents]);

  // ===================================================
  // 7 DAY MINI SUMMARY
  // ===================================================

  const uploadSummary = useMemo(() => {
    const result = [];

    for (
      let index = 6;
      index >= 0;
      index--
    ) {
      const date = new Date();

      date.setHours(
        0,
        0,
        0,
        0
      );

      date.setDate(
        date.getDate() - index
      );

      const nextDay =
        new Date(date);

      nextDay.setDate(
        nextDay.getDate() + 1
      );

      const count =
        documents.filter(
          document => {
            if (
              !document.uploadedAt
            ) {
              return false;
            }

            const uploaded =
              new Date(
                document.uploadedAt
              );

            return (
              uploaded >= date &&
              uploaded < nextDay
            );
          }
        ).length;

      result.push({
        day: date.toLocaleDateString(
          "en-US",
          {
            weekday: "short",
          }
        ),
        date: date.toLocaleDateString(
          "en-US",
          {
            month: "short",
            day: "numeric",
          }
        ),
        count,
      });
    }

    return result;
  }, [documents]);

  const maxUploadCount =
    Math.max(
      ...uploadSummary.map(
        item => item.count
      ),
      1
    );

  const weeklyTotal =
    uploadSummary.reduce(
      (sum, item) =>
        sum + item.count,
      0
    );

  // ===================================================
  // TYPE SUMMARY
  // ===================================================

  const typeSummary = useMemo(() => {
    const counters = {
      PDF: 0,
      DOCX: 0,
      TXT: 0,
      Spreadsheet: 0,
      Other: 0,
    };

    documents.forEach(
      document => {
        const type =
          getDocumentType(
            document
          );

        if (
          Object.prototype.hasOwnProperty.call(
            counters,
            type
          )
        ) {
          counters[type]++;
        }
      }
    );

    return Object.entries(
      counters
    )
      .filter(
        ([, value]) =>
          value > 0
      )
      .map(
        ([name, value]) => ({
          name,
          value,
        })
      );
  }, [documents]);

  // ===================================================
  // RECENT DOCUMENTS
  // ===================================================

  const recentDocuments = useMemo(() => {
    return [...documents]
      .sort(
        (a, b) =>
          new Date(
            b.uploadedAt || 0
          ).getTime() -
          new Date(
            a.uploadedAt || 0
          ).getTime()
      )
      .slice(0, 6);
  }, [documents]);

  // ===================================================
  // STORAGE
  // ===================================================

  const storagePercentage =
    useMemo(() => {
      const maxStorage =
        1024 *
        1024 *
        1024;

      return Math.min(
        100,
        Math.round(
          (statistics.storage /
            maxStorage) *
            100
        )
      );
    }, [statistics.storage]);

  // ===================================================
  // LOADING
  // ===================================================

  if (loading) {
    return (
      <div className="employee-dashboard">
        <div className="employee-loading-screen">
          <div className="employee-loading-icon">
            <Sparkles size={25} />
          </div>

          <h2>
            Loading your workspace
          </h2>

          <p>
            Preparing KnowFlow AI...
          </p>
        </div>
      </div>
    );
  }

  // ===================================================
  // RENDER
  // ===================================================

  return (
    <div className="employee-dashboard">

      <div className="employee-bg-glow employee-bg-glow-one" />
      <div className="employee-bg-glow employee-bg-glow-two" />

      {/* HEADER */}

      <header className="employee-header">

        <div className="employee-header-content">

          <div className="employee-eyebrow">
            <span className="employee-live-dot" />
            KNOWFLOW AI · EMPLOYEE WORKSPACE
          </div>

          <h1>
            Welcome back,{" "}
            <span>{displayName}</span>
          </h1>

          <p>
            Your personal knowledge command
            center. Manage documents, explore
            insights and work with AI.
          </p>

        </div>

        <div className="employee-header-actions">

          <button
            type="button"
            className="employee-secondary-button"
            onClick={handleRefresh}
            disabled={refreshing}
          >
            <RefreshCw
              size={17}
              className={
                refreshing
                  ? "employee-spin"
                  : ""
              }
            />

            {refreshing
              ? "Refreshing..."
              : "Refresh"}
          </button>

          <button
            type="button"
            className="employee-primary-button"
            onClick={() =>
              navigate(
                "/dashboard/upload"
              )
            }
          >
            <Upload size={17} />
            Upload document
          </button>

        </div>

      </header>

      {/* ALERTS */}

      {error && (
        <div className="employee-alert employee-alert-error">

          <Activity size={18} />

          <div>
            <strong>
              Connection problem
            </strong>

            <span>
              {error}
            </span>
          </div>

          <button
            type="button"
            onClick={() =>
              setError("")
            }
          >
            <X size={17} />
          </button>

        </div>
      )}

      {success && (
        <div className="employee-alert employee-alert-success">

          <CheckCircle2 size={18} />

          <span>
            {success}
          </span>

          <button
            type="button"
            onClick={() =>
              setSuccess("")
            }
          >
            <X size={17} />
          </button>

        </div>
      )}

      {/* PROFILE */}

      <section className="employee-profile-card">

        <div className="employee-profile-main">

          <div className="employee-avatar">
            <UserRound size={23} />
          </div>

          <div className="employee-profile-info">

            <span>
              CURRENT ACCOUNT
            </span>

            <strong>
              {displayName}
            </strong>

            <small>
              {email ||
                "Authenticated employee"}
            </small>

          </div>

        </div>

        <div className="employee-role">
          <span />
          {role}
        </div>

      </section>

      {/* KPI */}

      <section className="employee-kpi-grid">

        <div className="employee-kpi-card">

          <div className="employee-kpi-top">

            <div className="employee-kpi-icon">
              <FileText size={21} />
            </div>

            <span className="employee-kpi-badge">
              LIVE
            </span>

          </div>

          <strong>
            {statistics.total}
          </strong>

          <span>
            Total documents
          </span>

          <small>
            Your complete knowledge library
          </small>

        </div>

        <div className="employee-kpi-card">

          <div className="employee-kpi-top">

            <div className="employee-kpi-icon">
              <HardDrive size={21} />
            </div>

          </div>

          <strong className="employee-kpi-small">
            {formatFileSize(
              statistics.storage
            )}
          </strong>

          <span>
            Storage used
          </span>

          <small>
            Across your workspace
          </small>

        </div>

        <div className="employee-kpi-card">

          <div className="employee-kpi-top">

            <div className="employee-kpi-icon">
              <FileType2 size={21} />
            </div>

          </div>

          <strong>
            {statistics.pdf}
          </strong>

          <span>
            PDF documents
          </span>

          <small>
            Structured knowledge files
          </small>

        </div>

        <div className="employee-kpi-card">

          <div className="employee-kpi-top">

            <div className="employee-kpi-icon">
              <Clock3 size={21} />
            </div>

          </div>

          <strong>
            {statistics.last7Days}
          </strong>

          <span>
            Added this week
          </span>

          <small>
            Last 7 days
          </small>

        </div>

      </section>

      {/* SUMMARY AREA */}

      <section className="employee-summary-grid">

        {/* 7 DAY SUMMARY */}

        <div className="employee-panel employee-activity-panel">

          <div className="employee-panel-header">

            <div>

              <span className="employee-panel-kicker">
                ACTIVITY SUMMARY
              </span>

              <h2>
                Document activity
              </h2>

              <p>
                Your upload activity over the
                last seven days.
              </p>

            </div>

            <div className="employee-panel-icon">
              <Activity size={20} />
            </div>

          </div>

          <div className="employee-week-summary">

            <div className="employee-week-total">

              <div>
                <span>
                  This week
                </span>

                <strong>
                  {weeklyTotal}
                </strong>

                <small>
                  documents uploaded
                </small>
              </div>

              <div className="employee-week-status">
                <CheckCircle2 size={15} />
                7 day overview
              </div>

            </div>

            <div className="employee-mini-bars">

              {uploadSummary.map(
                item => {
                  const height =
                    item.count === 0
                      ? 10
                      : Math.max(
                          18,
                          Math.round(
                            (item.count /
                              maxUploadCount) *
                              100
                          )
                        );

                  return (
                    <div
                      className={`employee-mini-bar-item ${
                        item.count > 0
                          ? "has-data"
                          : ""
                      }`}
                      key={`${item.day}-${item.date}`}
                    >

                      <div className="employee-mini-bar-value">
                        {item.count}
                      </div>

                      <div className="employee-mini-bar-track">

                        <div
                          className="employee-mini-bar-fill"
                          style={{
                            height: `${height}%`,
                          }}
                        />

                      </div>

                      <span className="employee-mini-bar-day">
                        {item.day}
                      </span>

                      <small>
                        {item.date}
                      </small>

                    </div>
                  );
                }
              )}

            </div>

          </div>

        </div>

        {/* DOCUMENT MIX */}

        <div className="employee-panel employee-type-summary-panel">

          <div className="employee-panel-header">

            <div>

              <span className="employee-panel-kicker">
                KNOWLEDGE MIX
              </span>

              <h2>
                Document types
              </h2>

              <p>
                A quick summary of your files.
              </p>

            </div>

            <div className="employee-panel-icon">
              <FileText size={20} />
            </div>

          </div>

          {typeSummary.length > 0 ? (
            <div className="employee-type-summary">

              {typeSummary.map(
                (item, index) => {

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
                      className="employee-type-row"
                      key={item.name}
                    >

                      <div className="employee-type-row-top">

                        <div className="employee-type-name">

                          <span
                            className={`employee-type-dot type-${index + 1}`}
                          />

                          <strong>
                            {item.name}
                          </strong>

                        </div>

                        <span>
                          {item.value}
                        </span>

                      </div>

                      <div className="employee-type-progress">

                        <span
                          className={`type-progress-${index + 1}`}
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
                }
              )}

            </div>
          ) : (
            <div className="employee-chart-empty">

              <FileText size={32} />

              <strong>
                No document data yet
              </strong>

              <span>
                Upload a document to see
                your knowledge summary.
              </span>

            </div>
          )}

        </div>

      </section>

      {/* STORAGE + QUICK ACTIONS */}

      <section className="employee-middle-grid">

        <div className="employee-panel employee-storage-panel">

          <div className="employee-panel-header">

            <div>

              <span className="employee-panel-kicker">
                STORAGE
              </span>

              <h2>
                Workspace capacity
              </h2>

              <p>
                Monitor your document storage.
              </p>

            </div>

            <HardDrive size={20} />

          </div>

          <div className="employee-storage-value">

            <strong>
              {formatFileSize(
                statistics.storage
              )}
            </strong>

            <span>
              of 1 GB
            </span>

          </div>

          <div className="employee-progress">

            <span
              style={{
                width: `${storagePercentage}%`,
              }}
            />

          </div>

          <div className="employee-storage-footer">

            <span>
              {storagePercentage}% used
            </span>

            <span>
              {formatFileSize(
                Math.max(
                  0,
                  1024 *
                    1024 *
                    1024 -
                    statistics.storage
                )
              )}{" "}
              available
            </span>

          </div>

        </div>

        <div className="employee-panel employee-actions-panel">

          <div className="employee-panel-header">

            <div>

              <span className="employee-panel-kicker">
                WORKSPACE
              </span>

              <h2>
                Quick actions
              </h2>

            </div>

            <Sparkles size={20} />

          </div>

          <div className="employee-quick-actions">

            <button
              type="button"
              onClick={() =>
                navigate(
                  "/dashboard/upload"
                )
              }
            >

              <span>
                <Upload size={18} />
              </span>

              <div>
                <strong>
                  Upload document
                </strong>

                <small>
                  Add new knowledge
                </small>
              </div>

              <ArrowRight size={17} />

            </button>

            <button
              type="button"
              onClick={() =>
                navigate(
                  "/dashboard/search"
                )
              }
            >

              <span>
                <Search size={18} />
              </span>

              <div>
                <strong>
                  Semantic search
                </strong>

                <small>
                  Find knowledge faster
                </small>
              </div>

              <ArrowRight size={17} />

            </button>

            <button
              type="button"
              onClick={() =>
                navigate(
                  "/dashboard/assistant"
                )
              }
            >

              <span>
                <Bot size={18} />
              </span>

              <div>
                <strong>
                  AI Assistant
                </strong>

                <small>
                  Ask your knowledge base
                </small>
              </div>

              <ArrowRight size={17} />

            </button>

          </div>

        </div>

      </section>

      {/* RECENT DOCUMENTS */}

      <section className="employee-panel employee-documents-panel">

        <div className="employee-documents-heading">

          <div>

            <span className="employee-panel-kicker">
              KNOWLEDGE LIBRARY
            </span>

            <h2>
              Recent documents
            </h2>

            <p>
              Your latest uploaded knowledge
              files.
            </p>

          </div>

          <button
            type="button"
            className="employee-view-all"
            onClick={() =>
              navigate(
                "/dashboard/documents"
              )
            }
          >
            View all
            <ArrowRight size={16} />
          </button>

        </div>

        {recentDocuments.length === 0 ? (
          <div className="employee-empty-state">

            <div className="employee-empty-icon">
              <FileText size={30} />
            </div>

            <h3>
              Your workspace is empty
            </h3>

            <p>
              Upload your first document to
              start building your knowledge
              workspace.
            </p>

            <button
              type="button"
              onClick={() =>
                navigate(
                  "/dashboard/upload"
                )
              }
            >
              <Upload size={17} />
              Upload first document
            </button>

          </div>
        ) : (
          <div className="employee-document-list">

            {recentDocuments.map(
              document => {

                const Icon =
                  getFileIcon(
                    document.fileName,
                    document.fileType
                  );

                return (
                  <article
                    className="employee-document-row"
                    key={document.id}
                  >

                    <div className="employee-document-main">

                      <div className="employee-document-icon">
                        <Icon size={21} />
                      </div>

                      <div className="employee-document-info">

                        <h3
                          title={
                            document.fileName
                          }
                        >
                          {document.fileName}
                        </h3>

                        <div className="employee-document-meta">

                          <span>
                            {getExtension(
                              document.fileName
                            )}
                          </span>

                          <i />

                          <span>
                            {formatFileSize(
                              document.fileSize
                            )}
                          </span>

                          <i />

                          <span>
                            {formatDate(
                              document.uploadedAt
                            )}
                          </span>

                        </div>

                      </div>

                    </div>

                    <div className="employee-document-actions">

                      <button
                        type="button"
                        className="employee-open-button"
                        onClick={() =>
                          handleOpenDocument(
                            document
                          )
                        }
                      >
                        <Eye size={16} />
                        Open
                      </button>

                      <button
                        type="button"
                        className="employee-delete-button"
                        onClick={() =>
                          handleDelete(
                            document
                          )
                        }
                        disabled={
                          deletingId ===
                          document.id
                        }
                      >
                        {deletingId ===
                        document.id ? (
                          <RefreshCw
                            size={16}
                            className="employee-spin"
                          />
                        ) : (
                          <Trash2 size={16} />
                        )}

                        {deletingId ===
                        document.id
                          ? "Deleting"
                          : "Delete"}
                      </button>

                    </div>

                  </article>
                );
              }
            )}

          </div>
        )}

      </section>

      {/* AI BANNER */}

      <section className="employee-ai-banner">

        <div className="employee-ai-decoration employee-ai-decoration-one" />
        <div className="employee-ai-decoration employee-ai-decoration-two" />

        <div className="employee-ai-banner-icon">
          <Sparkles size={25} />
        </div>

        <div className="employee-ai-banner-content">

          <span>
            KNOWFLOW AI INTELLIGENCE
          </span>

          <h2>
            Turn your documents into
            intelligent knowledge.
          </h2>

          <p>
            Search your workspace semantically
            or ask the AI Assistant questions
            about your documents.
          </p>

        </div>

        <button
          type="button"
          onClick={() =>
            navigate(
              "/dashboard/assistant"
            )
          }
        >
          Open AI Assistant
          <ArrowRight size={17} />
        </button>

      </section>

    </div>
  );
}
