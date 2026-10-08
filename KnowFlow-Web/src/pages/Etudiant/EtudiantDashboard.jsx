import React, {
  useCallback,
  useEffect,
  useMemo,
  useState,
} from "react";

import {
  Activity,
  ArrowRight,
  BookOpen,
  Brain,
  CheckCircle2,
  ChevronRight,
  Clock3,
  Download,
  Eye,
  FileArchive,
  FileCode2,
  FileImage,
  FileSpreadsheet,
  FileText,
  GraduationCap,
  Loader2,
  RefreshCw,
  Search,
  Sparkles,
  Target,
  TrendingUp,
  X,
} from "lucide-react";

import { useNavigate } from "react-router-dom";
import "./EtudiantDashboard.css";

const AUTH_API = "http://localhost:5282";
const DOCUMENT_API = "http://localhost:5260";

function getToken() {
  const keys = [
    "token",
    "accessToken",
    "access_token",
    "jwt",
    "authToken",
  ];

  for (const key of keys) {
    const value = localStorage.getItem(key);
    if (value) {
      return value.replace(/^Bearer\s+/i, "");
    }
  }

  return "";
}

function getAuthHeaders() {
  const token = getToken();

  return token
    ? {
        Authorization: `Bearer ${token}`,
      }
    : {};
}

async function parseResponse(response) {
  const text = await response.text();

  if (!text) return null;

  try {
    return JSON.parse(text);
  } catch {
    return text;
  }
}

function getDocumentId(doc) {
  return (
    doc?.id ||
    doc?.documentId ||
    doc?.Id ||
    doc?.DocumentId ||
    crypto.randomUUID()
  );
}

function getDocumentTitle(doc) {
  return (
    doc?.fileName ||
    doc?.FileName ||
    doc?.title ||
    doc?.Title ||
    "Untitled document"
  );
}

function getDocumentType(doc) {
  const type =
    doc?.fileType ||
    doc?.FileType ||
    doc?.contentType ||
    doc?.ContentType ||
    "";

  if (type.includes("/")) {
    return type.split("/").pop().toUpperCase();
  }

  const title = getDocumentTitle(doc);

  if (title.includes(".")) {
    return title.split(".").pop().toUpperCase();
  }

  return "FILE";
}

function getDocumentDate(doc) {
  return (
    doc?.uploadedAt ||
    doc?.UploadedAt ||
    doc?.createdAt ||
    doc?.CreatedAt ||
    null
  );
}

function getDocumentSize(doc) {
  return (
    doc?.fileSize ||
    doc?.FileSize ||
    doc?.size ||
    doc?.Size ||
    0
  );
}

function getDocumentFilePath(doc) {
  return (
    doc?.filePath ||
    doc?.FilePath ||
    doc?.path ||
    doc?.Path ||
    ""
  );
}

function getPhysicalFileName(doc) {
  const path = getDocumentFilePath(doc);

  if (path) {
    return path.split(/[\\/]/).pop();
  }

  return getDocumentTitle(doc);
}

function getFileIcon(type) {
  const value = String(type).toLowerCase();

  if (value.includes("pdf")) return FileText;
  if (value.includes("doc")) return FileText;
  if (value.includes("xls")) return FileSpreadsheet;
  if (value.includes("sheet")) return FileSpreadsheet;
  if (value.includes("image")) return FileImage;
  if (value.includes("png")) return FileImage;
  if (value.includes("jpg")) return FileImage;
  if (value.includes("zip")) return FileArchive;
  if (value.includes("rar")) return FileArchive;
  if (value.includes("code")) return FileCode2;

  return FileText;
}

function isPdf(doc) {
  const title = getDocumentTitle(doc).toLowerCase();
  const type = String(getDocumentType(doc)).toLowerCase();

  return (
    title.endsWith(".pdf") ||
    type === "pdf" ||
    type.includes("pdf")
  );
}

function isTextFile(doc) {
  const title = getDocumentTitle(doc).toLowerCase();
  const type = String(getDocumentType(doc)).toLowerCase();

  return (
    title.endsWith(".txt") ||
    title.endsWith(".md") ||
    type === "txt" ||
    type === "text"
  );
}

function formatDate(date) {
  if (!date) return "Recently added";

  const parsed = new Date(date);

  if (Number.isNaN(parsed.getTime())) {
    return "Recently added";
  }

  return parsed.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

function formatSize(size) {
  if (!size || Number(size) <= 0) return "—";

  const bytes = Number(size);

  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) {
    return `${(bytes / 1024).toFixed(1)} KB`;
  }

  if (bytes < 1024 * 1024 * 1024) {
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  }

  return `${(bytes / (1024 * 1024 * 1024)).toFixed(1)} GB`;
}

function getCourseName(doc) {
  return (
    doc?.courseName ||
    doc?.CourseName ||
    doc?.course ||
    doc?.Course ||
    doc?.category ||
    doc?.Category ||
    "General Learning"
  );
}

function getProgress(doc) {
  const value = Number(
    doc?.progress ??
      doc?.Progress ??
      doc?.completion ??
      doc?.Completion ??
      0
  );

  return Math.min(100, Math.max(0, value));
}

function getStudyStatus(doc) {
  const progress = getProgress(doc);

  if (progress >= 100) return "completed";
  if (progress > 0) return "progress";

  return "todo";
}

function getStatusLabel(status) {
  if (status === "completed") return "Completed";
  if (status === "progress") return "In progress";

  return "To study";
}

function normalizeDocuments(data) {
  const list = Array.isArray(data)
    ? data
    : data?.documents ||
      data?.Documents ||
      data?.items ||
      data?.Items ||
      data?.data ||
      [];

  return list.map((doc) => ({
    ...doc,
    _id: getDocumentId(doc),
    _title: getDocumentTitle(doc),
    _type: getDocumentType(doc),
    _date: getDocumentDate(doc),
    _size: getDocumentSize(doc),
    _course: getCourseName(doc),
    _progress: getProgress(doc),
    _status: getStudyStatus(doc),
  }));
}

export default function EtudiantDashboard() {
  const navigate = useNavigate();

  const [documents, setDocuments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState("");

  const [selectedDocument, setSelectedDocument] = useState(null);
  const [readerLoading, setReaderLoading] = useState(false);
  const [readerUrl, setReaderUrl] = useState("");
  const [readerError, setReaderError] = useState("");
  const [readerType, setReaderType] = useState("");
  const [readerText, setReaderText] = useState("");

  const [downloadLoadingId, setDownloadLoadingId] = useState(null);

  const loadDocuments = useCallback(
    async (isRefresh = false) => {
      try {
        if (isRefresh) {
          setRefreshing(true);
        } else {
          setLoading(true);
        }

        setError("");

        const response = await fetch(
          `${DOCUMENT_API}/api/Document`,
          {
            method: "GET",
            headers: {
              Accept: "application/json",
              ...getAuthHeaders(),
            },
          }
        );

        if (!response.ok) {
          throw new Error(
            `DocumentService returned ${response.status}`
          );
        }

        const data = await parseResponse(response);
        setDocuments(normalizeDocuments(data));
      } catch (err) {
        console.error(
          "Unable to load student documents:",
          err
        );

        setError(
          "Unable to load your learning materials. Please check that DocumentService is running."
        );

        setDocuments([]);
      } finally {
        setLoading(false);
        setRefreshing(false);
      }
    },
    []
  );

  useEffect(() => {
    loadDocuments();
  }, [loadDocuments]);

  const totalDocuments = documents.length;

  const pdfMaterials = useMemo(
    () => documents.filter(isPdf).length,
    [documents]
  );

  const completed = useMemo(
    () =>
      documents.filter(
        (doc) => doc._status === "completed"
      ).length,
    [documents]
  );

  const inProgress = useMemo(
    () =>
      documents.filter(
        (doc) => doc._status === "progress"
      ).length,
    [documents]
  );

  const toStudy = useMemo(
    () =>
      documents.filter(
        (doc) => doc._status === "todo"
      ).length,
    [documents]
  );

  const overallProgress = useMemo(() => {
    if (!documents.length) return 0;

    const total = documents.reduce(
      (sum, doc) => sum + doc._progress,
      0
    );

    return Math.round(total / documents.length);
  }, [documents]);

  const courses = useMemo(() => {
    const groups = {};

    documents.forEach((doc) => {
      const name = doc._course;

      if (!groups[name]) {
        groups[name] = {
          name,
          count: 0,
          progress: 0,
        };
      }

      groups[name].count += 1;
      groups[name].progress += doc._progress;
    });

    return Object.values(groups)
      .map((course) => ({
        ...course,
        progress: Math.round(
          course.progress / course.count
        ),
      }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 4);
  }, [documents]);

  const recentDocuments = useMemo(() => {
    return [...documents]
      .sort((a, b) => {
        const first = new Date(a._date || 0).getTime();
        const second = new Date(b._date || 0).getTime();

        return second - first;
      })
      .slice(0, 6);
  }, [documents]);

  const continueLearning = useMemo(() => {
    return (
      documents.find(
        (doc) => doc._status !== "completed"
      ) || documents[0] || null
    );
  }, [documents]);

  const activityData = useMemo(() => {
    const days = [];

    for (let i = 6; i >= 0; i--) {
      const date = new Date();
      date.setHours(0, 0, 0, 0);
      date.setDate(date.getDate() - i);

      const count = documents.filter((doc) => {
        if (!doc._date) return false;

        const uploaded = new Date(doc._date);

        return (
          uploaded.getFullYear() === date.getFullYear() &&
          uploaded.getMonth() === date.getMonth() &&
          uploaded.getDate() === date.getDate()
        );
      }).length;

      days.push({
        label: date.toLocaleDateString("en-US", {
          weekday: "short",
        }),
        count,
      });
    }

    return days;
  }, [documents]);

  const maxActivity = Math.max(
    ...activityData.map((item) => item.count),
    1
  );

  const goToSearch = useCallback(() => {
    navigate("/dashboard/employee/search");
  }, [navigate]);

  const goToAssistant = useCallback(() => {
    navigate("/dashboard/employee/assistant");
  }, [navigate]);

  const goToStudyMode = useCallback(() => {
    navigate("/dashboard/employee/study-mode");
  }, [navigate]);

  const openDocument = useCallback(async (doc) => {
    try {
      setSelectedDocument(doc);
      setReaderLoading(true);
      setReaderError("");
      setReaderUrl("");
      setReaderText("");

      const fileName = getPhysicalFileName(doc);

      if (!fileName) {
        throw new Error("No file name available.");
      }

      const response = await fetch(
        `${DOCUMENT_API}/api/Document/file/${encodeURIComponent(
          fileName
        )}`,
        {
          headers: {
            ...getAuthHeaders(),
          },
        }
      );

      if (!response.ok) {
        throw new Error(
          `Unable to open file (${response.status})`
        );
      }

      const contentType =
        response.headers.get("content-type") || "";

      setReaderType(contentType);

      if (
        isTextFile(doc) ||
        contentType.includes("text/")
      ) {
        const text = await response.text();
        setReaderText(text);
      } else {
        const blob = await response.blob();
        const url = URL.createObjectURL(blob);

        setReaderUrl(url);
      }
    } catch (err) {
      console.error("Reader error:", err);
      setReaderError(
        "This document could not be opened."
      );
    } finally {
      setReaderLoading(false);
    }
  }, []);

  const closeReader = useCallback(() => {
    if (readerUrl) {
      URL.revokeObjectURL(readerUrl);
    }

    setSelectedDocument(null);
    setReaderUrl("");
    setReaderText("");
    setReaderError("");
    setReaderType("");
  }, [readerUrl]);

  const downloadDocument = useCallback(
    async (doc) => {
      try {
        setDownloadLoadingId(doc._id);

        const fileName = getPhysicalFileName(doc);

        const response = await fetch(
          `${DOCUMENT_API}/api/Document/file/${encodeURIComponent(
            fileName
          )}`,
          {
            headers: {
              ...getAuthHeaders(),
            },
          }
        );

        if (!response.ok) {
          throw new Error(
            `Download failed (${response.status})`
          );
        }

        const blob = await response.blob();
        const url = URL.createObjectURL(blob);

        const link = document.createElement("a");
        link.href = url;
        link.download = doc._title || fileName;

        document.body.appendChild(link);
        link.click();
        link.remove();

        URL.revokeObjectURL(url);
      } catch (err) {
        console.error("Download error:", err);
      } finally {
        setDownloadLoadingId(null);
      }
    },
    []
  );

  useEffect(() => {
    const handleEscape = (event) => {
      if (event.key === "Escape" && selectedDocument) {
        closeReader();
      }
    };

    window.addEventListener("keydown", handleEscape);

    return () =>
      window.removeEventListener(
        "keydown",
        handleEscape
      );
  }, [selectedDocument, closeReader]);

  useEffect(() => {
    return () => {
      if (readerUrl) {
        URL.revokeObjectURL(readerUrl);
      }
    };
  }, [readerUrl]);

  return (
    <div className="etudiant-dashboard">
      <div className="student-bg-grid" />
      <div className="student-bg-glow student-bg-glow-one" />
      <div className="student-bg-glow student-bg-glow-two" />

      <header className="student-header">
        <div className="student-header-left">
          <div className="student-badge">
            <div className="student-badge-icon">
              <GraduationCap size={18} />
            </div>

            <div>
              <span>KNOWFLOW AI</span>
              <strong>Student Workspace</strong>
            </div>
          </div>
        </div>

        <div className="student-header-actions">
          <button
            className="student-header-btn"
            onClick={goToSearch}
          >
            <Search size={17} />
            <span>Explore</span>
          </button>

          <button
            className="student-header-btn primary"
            onClick={goToAssistant}
          >
            <Sparkles size={17} />
            <span>Ask AI</span>
          </button>

          <button
            className={`student-refresh-btn ${
              refreshing ? "spin" : ""
            }`}
            onClick={() => loadDocuments(true)}
            title="Refresh"
          >
            <RefreshCw size={17} />
          </button>
        </div>
      </header>

      {error && (
        <div className="student-alert">
          <div className="student-alert-icon">
            <Activity size={18} />
          </div>

          <div className="student-alert-content">
            <strong>Learning materials unavailable</strong>
            <span>{error}</span>
          </div>
        </div>
      )}

      <main className="student-content">
        <section className="learning-hero">
          <div className="learning-hero-content">
            <div className="hero-kicker">
              <span className="hero-kicker-dot" />
              PERSONAL LEARNING SPACE
            </div>

            <h1>
              Learn smarter.
              <br />
              <span>Understand faster.</span>
            </h1>

            <p>
              Your courses, documents and AI study tools
              are organized in one intelligent workspace.
            </p>

            <div className="hero-actions">
              <button
                className="hero-primary-btn"
                onClick={goToStudyMode}
              >
                <BookOpen size={18} />
                Continue learning
                <ArrowRight size={17} />
              </button>

              <button
                className="hero-secondary-btn"
                onClick={goToAssistant}
              >
                <Brain size={18} />
                Study with AI
              </button>
            </div>
          </div>

          <div className="hero-progress-card">
            <div className="hero-progress-top">
              <div>
                <span>LEARNING PROGRESS</span>
                <strong>Your journey</strong>
              </div>

              <TrendingUp size={20} />
            </div>

            <div className="circular-progress">
              <svg
                className="progress-ring"
                viewBox="0 0 120 120"
              >
                <circle
                  className="progress-ring-bg"
                  cx="60"
                  cy="60"
                  r="50"
                />

                <circle
                  className="progress-ring-value"
                  cx="60"
                  cy="60"
                  r="50"
                  style={{
                    strokeDasharray: `${
                      overallProgress * 3.14
                    } 314`,
                  }}
                />
              </svg>

              <div className="circular-progress-value">
                <strong>{overallProgress}%</strong>
                <span>overall</span>
              </div>
            </div>

            <div className="hero-progress-footer">
              <span>
                <CheckCircle2 size={15} />
                {completed} completed
              </span>

              <span>
                <Clock3 size={15} />
                {inProgress} active
              </span>
            </div>
          </div>
        </section>

        <section className="student-stats-grid">
          <div className="student-stat-card blue">
            <div className="student-stat-icon">
              <BookOpen size={21} />
            </div>

            <div className="student-stat-content">
              <span>COURSES</span>
              <strong>{courses.length}</strong>
              <small>Learning paths</small>
            </div>

            <ChevronRight size={17} />
          </div>

          <div className="student-stat-card violet">
            <div className="student-stat-icon">
              <FileText size={21} />
            </div>

            <div className="student-stat-content">
              <span>PDF MATERIALS</span>
              <strong>{pdfMaterials}</strong>
              <small>Ready to study</small>
            </div>

            <ChevronRight size={17} />
          </div>

          <div className="student-stat-card rose">
            <div className="student-stat-icon">
              <Target size={21} />
            </div>

            <div className="student-stat-content">
              <span>TO STUDY</span>
              <strong>{toStudy}</strong>
              <small>Waiting for you</small>
            </div>

            <ChevronRight size={17} />
          </div>

          <div className="student-stat-card green">
            <div className="student-stat-icon">
              <CheckCircle2 size={21} />
            </div>

            <div className="student-stat-content">
              <span>COMPLETED</span>
              <strong>{completed}</strong>
              <small>Keep going</small>
            </div>

            <ChevronRight size={17} />
          </div>
        </section>

        <section className="student-main-grid">
          <div className="student-panel continue-panel">
            <div className="panel-header">
              <div>
                <span className="panel-eyebrow">
                  NEXT STEP
                </span>
                <h2>Continue learning</h2>
              </div>

              <button
                className="panel-action"
                onClick={goToStudyMode}
              >
                Study mode
                <ArrowRight size={15} />
              </button>
            </div>

            {continueLearning ? (
              <div className="continue-card">
                <div className="continue-icon">
                  {React.createElement(
                    getFileIcon(
                      continueLearning._type
                    ),
                    { size: 25 }
                  )}
                </div>

                <div className="continue-info">
                  <span className="continue-course">
                    {continueLearning._course}
                  </span>

                  <h3>{continueLearning._title}</h3>

                  <div className="continue-meta">
                    <span>
                      <FileText size={14} />
                      {continueLearning._type}
                    </span>

                    <span>
                      <Clock3 size={14} />
                      {formatDate(
                        continueLearning._date
                      )}
                    </span>

                    <span>
                      {formatSize(
                        continueLearning._size
                      )}
                    </span>
                  </div>

                  <div className="continue-progress">
                    <div className="continue-progress-top">
                      <span>Progress</span>
                      <strong>
                        {continueLearning._progress}%
                      </strong>
                    </div>

                    <div className="progress-track">
                      <div
                        className="progress-value"
                        style={{
                          width: `${continueLearning._progress}%`,
                        }}
                      />
                    </div>
                  </div>
                </div>

                <button
                  className="continue-open-btn"
                  onClick={() =>
                    openDocument(continueLearning)
                  }
                >
                  <Eye size={18} />
                  Open
                </button>
              </div>
            ) : (
              <div className="student-empty-state">
                <BookOpen size={28} />
                <strong>No learning material yet</strong>
                <span>
                  Your study documents will appear here.
                </span>
              </div>
            )}
          </div>

          <div className="student-panel copilot-panel">
            <div className="copilot-glow" />

            <div className="copilot-header">
              <div className="copilot-icon">
                <Sparkles size={23} />
              </div>

              <div>
                <span>AI STUDY COPILOT</span>
                <h2>Need help?</h2>
              </div>
            </div>

            <p className="copilot-description">
              Ask questions about your learning material
              and get clear, contextual explanations.
            </p>

            <div className="copilot-features">
              <span>
                <CheckCircle2 size={14} />
                Explain concepts
              </span>

              <span>
                <CheckCircle2 size={14} />
                Summarize documents
              </span>

              <span>
                <CheckCircle2 size={14} />
                Answer questions
              </span>
            </div>

            <button
              className="copilot-button"
              onClick={goToAssistant}
            >
              <Brain size={18} />
              Open Study Copilot
              <ArrowRight size={16} />
            </button>
          </div>
        </section>

        <section className="student-panel courses-panel">
          <div className="panel-header">
            <div>
              <span className="panel-eyebrow">
                KNOWLEDGE PATHS
              </span>
              <h2>Your courses</h2>
            </div>

            <span className="panel-subtitle">
              {courses.length} active paths
            </span>
          </div>

          {courses.length ? (
            <div className="courses-grid">
              {courses.map((course, index) => (
                <div
                  className={`course-card course-${index + 1}`}
                  key={course.name}
                >
                  <div className="course-card-top">
                    <div className="course-icon">
                      <BookOpen size={19} />
                    </div>

                    <span>
                      {course.count} documents
                    </span>
                  </div>

                  <h3>{course.name}</h3>

                  <div className="course-progress">
                    <div className="course-progress-top">
                      <span>Progress</span>
                      <strong>{course.progress}%</strong>
                    </div>

                    <div className="progress-track">
                      <div
                        className="progress-value"
                        style={{
                          width: `${course.progress}%`,
                        }}
                      />
                    </div>
                  </div>

                  <button
                    className="course-open-btn"
                    onClick={goToSearch}
                  >
                    Explore course
                    <ArrowRight size={15} />
                  </button>
                </div>
              ))}
            </div>
          ) : (
            <div className="student-empty-state">
              <BookOpen size={28} />
              <strong>No courses detected</strong>
              <span>
                Upload or receive learning materials to
                start.
              </span>
            </div>
          )}
        </section>

        <section className="lower-grid">
          <div className="student-panel activity-panel">
            <div className="panel-header">
              <div>
                <span className="panel-eyebrow">
                  LAST 7 DAYS
                </span>
                <h2>Learning activity</h2>
              </div>

              <div className="activity-total">
                <Activity size={15} />
                {documents.length} materials
              </div>
            </div>

            <div className="activity-chart">
              {activityData.map((day) => (
                <div
                  className="activity-day"
                  key={day.label}
                >
                  <div className="activity-bar-area">
                    <div
                      className="activity-bar"
                      style={{
                        height: `${
                          day.count === 0
                            ? 8
                            : Math.max(
                                18,
                                (day.count /
                                  maxActivity) *
                                  100
                              )
                        }%`,
                      }}
                    >
                      {day.count > 0 && (
                        <span>{day.count}</span>
                      )}
                    </div>
                  </div>

                  <small>{day.label}</small>
                </div>
              ))}
            </div>

            <div className="activity-footer">
              <span>
                <span className="activity-dot" />
                Document activity
              </span>

              <span>
                Stay consistent to improve your learning
                rhythm.
              </span>
            </div>
          </div>

          <div className="student-panel quick-panel">
            <div className="panel-header">
              <div>
                <span className="panel-eyebrow">
                  SHORTCUTS
                </span>
                <h2>Quick actions</h2>
              </div>
            </div>

            <div className="quick-actions">
              <button
                className="quick-action blue"
                onClick={goToSearch}
              >
                <div>
                  <Search size={20} />
                </div>

                <span>
                  <strong>Smart Search</strong>
                  <small>
                    Find knowledge instantly
                  </small>
                </span>

                <ArrowRight size={16} />
              </button>

              <button
                className="quick-action violet"
                onClick={goToAssistant}
              >
                <div>
                  <Sparkles size={20} />
                </div>

                <span>
                  <strong>Ask AI</strong>
                  <small>
                    Understand difficult topics
                  </small>
                </span>

                <ArrowRight size={16} />
              </button>

              <button
                className="quick-action green"
                onClick={goToStudyMode}
              >
                <div>
                  <GraduationCap size={20} />
                </div>

                <span>
                  <strong>Study Mode</strong>
                  <small>
                    Focus on your learning
                  </small>
                </span>

                <ArrowRight size={16} />
              </button>
            </div>
          </div>
        </section>

        <section className="student-panel documents-panel">
          <div className="panel-header">
            <div>
              <span className="panel-eyebrow">
                KNOWLEDGE LIBRARY
              </span>
              <h2>Your documents</h2>
            </div>

            <div className="documents-header-right">
              <span className="panel-subtitle">
                {totalDocuments} total
              </span>

              <button
                className="documents-explore-btn"
                onClick={goToSearch}
              >
                Explore all
                <ArrowRight size={15} />
              </button>
            </div>
          </div>

          {loading ? (
            <div className="student-loading">
              <Loader2
                size={25}
                className="spin"
              />
              <span>Loading your library...</span>
            </div>
          ) : recentDocuments.length ? (
            <div className="documents-table">
              {recentDocuments.map((doc) => {
                const Icon = getFileIcon(doc._type);

                return (
                  <div
                    className="document-row"
                    key={doc._id}
                  >
                    <div className="document-main">
                      <div className="document-file-icon">
                        <Icon size={20} />
                      </div>

                      <div className="document-info">
                        <strong>{doc._title}</strong>

                        <div className="document-meta">
                          <span>{doc._course}</span>
                          <span>•</span>
                          <span>{doc._type}</span>
                          <span>•</span>
                          <span>
                            {formatSize(doc._size)}
                          </span>
                        </div>
                      </div>
                    </div>

                    <div className="document-status">
                      <span
                        className={`status-pill ${doc._status}`}
                      >
                        {doc._status ===
                          "completed" && (
                          <CheckCircle2 size={13} />
                        )}

                        {getStatusLabel(doc._status)}
                      </span>
                    </div>

                    <div className="document-actions">
                      <button
                        className="document-action open"
                        onClick={() =>
                          openDocument(doc)
                        }
                        title="Open document"
                      >
                        <Eye size={16} />
                        <span>Open</span>
                      </button>

                      <button
                        className="document-action download"
                        onClick={() =>
                          downloadDocument(doc)
                        }
                        title="Download document"
                      >
                        {downloadLoadingId ===
                        doc._id ? (
                          <Loader2
                            size={16}
                            className="spin"
                          />
                        ) : (
                          <Download size={16} />
                        )}

                        <span>Download</span>
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="student-empty-state large">
              <div className="empty-icon">
                <FileText size={30} />
              </div>

              <strong>Your library is empty</strong>

              <span>
                Learning documents assigned to you will
                appear here.
              </span>

              <button
                className="empty-action"
                onClick={goToSearch}
              >
                Explore knowledge
                <ArrowRight size={16} />
              </button>
            </div>
          )}
        </section>
      </main>

      <footer className="student-footer">
        <span>
          <Sparkles size={14} />
          KnowFlow AI
        </span>

        <span>
          Learn · Discover · Understand
        </span>
      </footer>

      {selectedDocument && (
        <div
          className="document-reader-backdrop"
          onMouseDown={(event) => {
            if (
              event.target === event.currentTarget
            ) {
              closeReader();
            }
          }}
        >
          <div className="document-reader">
            <div className="document-reader-header">
              <div className="document-reader-title">
                <div className="document-reader-icon">
                  {React.createElement(
                    getFileIcon(
                      selectedDocument._type
                    ),
                    { size: 19 }
                  )}
                </div>

                <div>
                  <strong>
                    {selectedDocument._title}
                  </strong>

                  <span>
                    {selectedDocument._course} ·{" "}
                    {selectedDocument._type}
                  </span>
                </div>
              </div>

              <div className="document-reader-actions">
                <button
                  onClick={() =>
                    downloadDocument(
                      selectedDocument
                    )
                  }
                >
                  <Download size={16} />
                  Download
                </button>

                <button
                  className="reader-close-btn"
                  onClick={closeReader}
                >
                  <X size={18} />
                </button>
              </div>
            </div>

            <div className="document-reader-body">
              {readerLoading && (
                <div className="reader-loading">
                  <Loader2
                    size={28}
                    className="spin"
                  />

                  <span>
                    Preparing your document...
                  </span>
                </div>
              )}

              {!readerLoading && readerError && (
                <div className="reader-error">
                  <div className="reader-error-icon">
                    <FileText size={25} />
                  </div>

                  <strong>
                    Unable to preview document
                  </strong>

                  <span>{readerError}</span>

                  <button
                    onClick={() =>
                      downloadDocument(
                        selectedDocument
                      )
                    }
                  >
                    <Download size={16} />
                    Download instead
                  </button>
                </div>
              )}

              {!readerLoading &&
                !readerError &&
                readerText && (
                  <div className="document-text-reader">
                    <pre>{readerText}</pre>
                  </div>
                )}

              {!readerLoading &&
                !readerError &&
                readerUrl && (
                  <iframe
                    title={selectedDocument._title}
                    src={readerUrl}
                    className="document-reader-frame"
                  />
                )}
            </div>

            <div className="document-reader-footer">
              <span>
                <Eye size={14} />
                Read-only preview
              </span>

              <span>
                {formatSize(
                  selectedDocument._size
                )}
              </span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}