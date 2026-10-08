import {
  Activity,
  AlertCircle,
  Brain,
  Calendar,
  CheckCircle,
  Database,
  FileText,
  FolderOpen,
  HardDrive,
  RefreshCw,
  Search,
  Server,
  ShieldCheck,
  Sparkles,
  Upload,
  Zap,
} from "lucide-react";

import {
  useEffect,
  useMemo,
  useState,
} from "react";

import {
  useNavigate,
} from "react-router-dom";

import {
  Area,
  AreaChart,
  CartesianGrid,
  Cell,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

import { useAuth } from "../context/AuthContext";

import "./Dashboard.css";


// =====================================================
// API
// =====================================================

const DOCUMENT_API =
  "http://localhost:5260/api/Document";


// =====================================================
// COMPONENT
// =====================================================

export default function Dashboard() {

  const navigate = useNavigate();

  const {
    user,
  } = useAuth();


  const [documents, setDocuments] =
    useState([]);

  const [loading, setLoading] =
    useState(true);

  const [error, setError] =
    useState("");

  const [lastUpdate, setLastUpdate] =
    useState(null);


  // ===================================================
  // USER
  // ===================================================

  const userName =
    user?.name ||
    `${user?.firstName || ""} ${user?.lastName || ""}`.trim() ||
    "User";

  const userRole =
    user?.role ||
    "Member";


  // ===================================================
  // LOAD DOCUMENTS
  // ===================================================

  const loadDocuments = async () => {

    try {

      setLoading(true);
      setError("");

      const token =
        localStorage.getItem("token") ||
        sessionStorage.getItem("token");


      const headers = {
        Accept: "application/json",
      };


      if (token) {
        headers.Authorization =
          `Bearer ${token}`;
      }


      const response =
        await fetch(
          DOCUMENT_API,
          {
            method: "GET",
            headers,
          }
        );


      if (!response.ok) {

        throw new Error(
          `DocumentService returned ${response.status}`
        );

      }


      const data =
        await response.json();


      const list =
        Array.isArray(data)
          ? data
          : Array.isArray(data?.data)
            ? data.data
            : Array.isArray(data?.documents)
              ? data.documents
              : [];


      setDocuments(list);

      setLastUpdate(
        new Date()
      );

    }
    catch (err) {

      console.error(
        "Dashboard loading error:",
        err
      );

      setError(
        "Unable to load dashboard data."
      );

    }
    finally {

      setLoading(false);

    }

  };


  // ===================================================
  // INITIAL LOAD
  // ===================================================

  useEffect(() => {

    loadDocuments();

  }, []);


  // ===================================================
  // FILE TYPE
  // ===================================================

  const getFileType =
    (fileName = "") => {

      if (!fileName) {
        return "OTHER";
      }

      const parts =
        fileName.split(".");


      if (parts.length < 2) {
        return "OTHER";
      }


      return parts
        .pop()
        .toUpperCase();

    };


  // ===================================================
  // FILE SIZE
  // ===================================================

  const formatFileSize =
    (bytes) => {

      const value =
        Number(bytes) || 0;


      if (value === 0) {
        return "0 KB";
      }


      const kb =
        value / 1024;


      if (kb < 1024) {

        return `${kb.toFixed(1)} KB`;

      }


      const mb =
        kb / 1024;


      if (mb < 1024) {

        return `${mb.toFixed(2)} MB`;

      }


      const gb =
        mb / 1024;


      return `${gb.toFixed(2)} GB`;

    };


  // ===================================================
  // DATE
  // ===================================================

  const formatDate =
    (date) => {

      if (!date) {
        return "Unknown";
      }


      const parsed =
        new Date(date);


      if (
        Number.isNaN(
          parsed.getTime()
        )
      ) {

        return "Unknown";

      }


      return parsed.toLocaleDateString(
        "en-US",
        {
          day: "2-digit",
          month: "short",
          year: "numeric",
        }
      );

    };


  // ===================================================
  // TOTAL STORAGE
  // ===================================================

  const totalSize =
    useMemo(() => {

      return documents.reduce(
        (
          total,
          document
        ) => {

          return (
            total +
            (
              Number(
                document.fileSize
              ) || 0
            )
          );

        },
        0
      );

    }, [documents]);


  // ===================================================
  // FILE DISTRIBUTION
  // ===================================================

  const fileDistribution =
    useMemo(() => {

      let pdf = 0;
      let docx = 0;
      let txt = 0;
      let other = 0;


      documents.forEach(
        (document) => {

          const type =
            getFileType(
              document.fileName
            );


          if (type === "PDF") {

            pdf++;

          }
          else if (
            type === "DOCX" ||
            type === "DOC"
          ) {

            docx++;

          }
          else if (
            type === "TXT"
          ) {

            txt++;

          }
          else {

            other++;

          }

        }
      );


      return [
        {
          name: "PDF",
          value: pdf,
          className: "pdf",
        },
        {
          name: "DOCX",
          value: docx,
          className: "docx",
        },
        {
          name: "TXT",
          value: txt,
          className: "txt",
        },
        {
          name: "Other",
          value: other,
          className: "other",
        },
      ].filter(
        item =>
          item.value > 0
      );

    }, [documents]);


  // ===================================================
  // GROWTH
  // ===================================================

  const growthData =
    useMemo(() => {

      const now =
        new Date();

      const result = [];


      for (
        let i = 6;
        i >= 0;
        i--
      ) {

        const date =
          new Date(now);


        date.setDate(
          now.getDate() - i
        );


        const key =
          date.toDateString();


        const count =
          documents.filter(
            (document) => {

              const value =
                document.uploadedAt ||
                document.createdAt ||
                document.createdDate;


              if (!value) {
                return false;
              }


              const uploadDate =
                new Date(value);


              return (
                uploadDate.toDateString()
                === key
              );

            }
          ).length;


        result.push({

          day:
            date.toLocaleDateString(
              "en-US",
              {
                weekday: "short",
              }
            ),

          documents:
            count,

        });

      }


      return result;

    }, [documents]);


  // ===================================================
  // RECENT DOCUMENTS
  // ===================================================

  const recentDocuments =
    useMemo(() => {

      return [
        ...documents,
      ]
        .sort(
          (a, b) => {

            const dateA =
              new Date(
                a.uploadedAt ||
                a.createdAt ||
                0
              );


            const dateB =
              new Date(
                b.uploadedAt ||
                b.createdAt ||
                0
              );


            return (
              dateB - dateA
            );

          }
        )
        .slice(
          0,
          5
        );

    }, [documents]);


  // ===================================================
  // PIE COLORS
  // ===================================================

  const pieColors = [
    "#f87171",
    "#60a5fa",
    "#4ade80",
    "#a855f7",
  ];


  // ===================================================
  // RENDER
  // ===================================================

  return (

    <div className="dashboard-page">


      {/* =============================================
          HEADER
      ============================================= */}

      <header className="dashboard-header">

        <div>

          <div className="dashboard-eyebrow">

            <Sparkles />

            KNOWFLOW AI · KNOWLEDGE ENGINE

          </div>


          <h1>

            Intelligent{" "}

            <span>
              Knowledge Dashboard
            </span>

          </h1>


          <p>

            Welcome back,{" "}
            <strong>
              {userName}
            </strong>
            . Monitor your documents,
            semantic intelligence and AI
            processing from one centralized workspace.

          </p>


          <div
            style={{
              marginTop: "10px",
              display: "inline-flex",
              alignItems: "center",
              gap: "8px",
              padding: "7px 12px",
              borderRadius: "999px",
              background: "rgba(56,189,248,.08)",
              border: "1px solid rgba(56,189,248,.18)",
              color: "#38bdf8",
              fontSize: "12px",
              fontWeight: 700,
            }}
          >

            <ShieldCheck size={15} />

            ROLE: {userRole}

          </div>

        </div>


        <div className="ai-online">

          <div className="online-dot" />

          <div>

            <strong>
              AI SYSTEM ONLINE
            </strong>

            <small>
              DocumentService connected
            </small>

          </div>

        </div>

      </header>


      {/* =============================================
          ERROR
      ============================================= */}

      {error && (

        <div className="dashboard-error">

          <AlertCircle />

          <span>
            {error}
          </span>


          <button
            onClick={loadDocuments}
          >

            <RefreshCw />

            Retry

          </button>

        </div>

      )}


      {/* =============================================
          KPI
      ============================================= */}

      <section className="kpi-grid">


        <div className="kpi-card cyan">

          <div className="kpi-icon">
            <FileText />
          </div>


          <div>

            <p>
              Total Documents
            </p>


            <h2>

              {loading
                ? "..."
                : documents.length}

            </h2>


            <span className="kpi-status">

              <CheckCircle />

              Knowledge indexed

            </span>

          </div>

        </div>


        <div className="kpi-card purple">

          <div className="kpi-icon">
            <Brain />
          </div>


          <div>

            <p>
              AI Accuracy
            </p>


            <h2>
              98.7%
            </h2>


            <span className="kpi-status">

              <CheckCircle />

              Semantic engine ready

            </span>

          </div>

        </div>


        <div className="kpi-card blue">

          <div className="kpi-icon">
            <HardDrive />
          </div>


          <div>

            <p>
              Knowledge Storage
            </p>


            <h2>

              {loading
                ? "..."
                : formatFileSize(
                    totalSize
                  )}

            </h2>


            <span className="kpi-status">

              <CheckCircle />

              Storage available

            </span>

          </div>

        </div>


        <div className="kpi-card green">

          <div className="kpi-icon">
            <Zap />
          </div>


          <div>

            <p>
              AI Processing
            </p>


            <h2>
              Ready
            </h2>


            <span className="kpi-status">

              <CheckCircle />

              All systems operational

            </span>

          </div>

        </div>

      </section>


      {/* =============================================
          ANALYTICS
      ============================================= */}

      <section className="analytics-section">


        {/* GROWTH */}

        <div className="chart-card">

          <div className="chart-header">

            <div>

              <span>
                KNOWLEDGE ACTIVITY
              </span>


              <h2>
                Document Growth
              </h2>


              <p>
                Upload activity during the last 7 days
              </p>

            </div>


            <div className="chart-icon">
              <Activity />
            </div>

          </div>


          <div className="chart-container">

            {documents.length === 0 ? (

              <div className="empty-chart">

                <FileText />

                <div>

                  <strong>
                    No activity yet
                  </strong>

                  <p>
                    Upload documents to populate analytics.
                  </p>

                </div>

              </div>

            ) : (

              <ResponsiveContainer
                width="100%"
                height="100%"
              >

                <AreaChart
                  data={growthData}
                >

                  <defs>

                    <linearGradient
                      id="growthGradient"
                      x1="0"
                      y1="0"
                      x2="0"
                      y2="1"
                    >

                      <stop
                        offset="0%"
                        stopColor="#38bdf8"
                        stopOpacity={0.35}
                      />

                      <stop
                        offset="100%"
                        stopColor="#38bdf8"
                        stopOpacity={0}
                      />

                    </linearGradient>

                  </defs>


                  <CartesianGrid
                    strokeDasharray="3 3"
                    stroke="rgba(255,255,255,.06)"
                  />


                  <XAxis
                    dataKey="day"
                    tick={{
                      fill: "#64748b",
                      fontSize: 11,
                    }}
                    axisLine={false}
                    tickLine={false}
                  />


                  <YAxis
                    allowDecimals={false}
                    tick={{
                      fill: "#64748b",
                      fontSize: 11,
                    }}
                    axisLine={false}
                    tickLine={false}
                  />


                  <Tooltip />


                  <Area
                    type="monotone"
                    dataKey="documents"
                    stroke="#38bdf8"
                    strokeWidth={3}
                    fill="url(#growthGradient)"
                  />

                </AreaChart>

              </ResponsiveContainer>

            )}

          </div>

        </div>


        {/* FILE DISTRIBUTION */}

        <div className="chart-card">

          <div className="chart-header">

            <div>

              <span>
                KNOWLEDGE STRUCTURE
              </span>


              <h2>
                File Distribution
              </h2>


              <p>
                Documents by format
              </p>

            </div>


            <div className="chart-icon purple-icon">

              <Database />

            </div>

          </div>


          <div className="mini-chart">

            {fileDistribution.length === 0 ? (

              <div className="empty-chart">

                <Database />

                <div>

                  <strong>
                    No documents
                  </strong>

                  <p>
                    Your knowledge base is empty.
                  </p>

                </div>

              </div>

            ) : (

              <ResponsiveContainer
                width="100%"
                height="100%"
              >

                <PieChart>

                  <Pie
                    data={fileDistribution}
                    dataKey="value"
                    nameKey="name"
                    cx="50%"
                    cy="50%"
                    innerRadius={55}
                    outerRadius={85}
                    paddingAngle={4}
                  >

                    {fileDistribution.map(
                      (
                        entry,
                        index
                      ) => (

                        <Cell
                          key={entry.name}
                          fill={
                            pieColors[
                              index %
                              pieColors.length
                            ]
                          }
                        />

                      )
                    )}

                  </Pie>


                  <Tooltip />

                </PieChart>

              </ResponsiveContainer>

            )}

          </div>


          <div className="file-summary">

            {fileDistribution.map(
              (
                item
              ) => (

                <div
                  key={item.name}
                >

                  <span
                    className={
                      `file-dot ${item.className}`
                    }
                  />

                  {item.name}

                  <strong>
                    {item.value}
                  </strong>

                </div>

              )
            )}

          </div>

        </div>

      </section>


      {/* =============================================
          RECENT UPLOADS
      ============================================= */}

      <section className="activity-card">

        <div className="section-heading">

          <div>

            <span>
              KNOWLEDGE STREAM
            </span>


            <h2>
              Recent Uploads
            </h2>

          </div>


          <button
            onClick={() =>
              navigate(
                "/dashboard/documents"
              )
            }
          >

            <FolderOpen />

            View all

          </button>

        </div>


        <div className="recent-list">

          {recentDocuments.length === 0 ? (

            <div className="empty-chart">

              <Upload />

              <div>

                <strong>
                  No recent uploads
                </strong>

                <p>
                  Start building your knowledge base.
                </p>

              </div>

            </div>

          ) : (

            recentDocuments.map(
              (
                document,
                index
              ) => (

                <div
                  className="recent-item"
                  key={
                    document.id ||
                    index
                  }
                >

                  <div className="recent-icon">
                    <FileText />
                  </div>


                  <div className="recent-info">

                    <strong>

                      {
                        document.fileName ||
                        "Unnamed document"
                      }

                    </strong>


                    <span>

                      {
                        getFileType(
                          document.fileName
                        )
                      }

                      {" · "}

                      {
                        formatFileSize(
                          document.fileSize
                        )
                      }

                    </span>

                  </div>


                  <div className="recent-date">

                    <Calendar />

                    {
                      formatDate(
                        document.uploadedAt ||
                        document.createdAt
                      )
                    }

                  </div>


                  <CheckCircle
                    className="recent-check"
                  />

                </div>

              )

            )

          )}

        </div>

      </section>


      {/* =============================================
          SYSTEM STATUS
      ============================================= */}

      <section className="performance-card">

        <div className="performance-circle">

          <div className="performance-ring">

            <ShieldCheck />

          </div>


          <h1>
            98%
          </h1>


          <p>
            SYSTEM HEALTH
          </p>

        </div>


        <div className="performance-info">

          <span>
            PLATFORM STATUS
          </span>


          <h2>
            KnowFlow AI is operational
          </h2>


          <p>

            <Server />

            DocumentService

            <strong>
              ONLINE
            </strong>

          </p>


          <p>

            <Database />

            Knowledge Database

            <strong>
              READY
            </strong>

          </p>


          <p>

            <Brain />

            AI Semantic Engine

            <strong>
              ACTIVE
            </strong>

          </p>


          <p>

            <Search />

            Semantic Search

            <strong>
              AVAILABLE
            </strong>

          </p>

        </div>

      </section>


      {/* =============================================
          QUICK ACTIONS
      ============================================= */}

      <section className="actions">

        <button
          onClick={() =>
            navigate(
              "/dashboard/upload"
            )
          }
        >

          <Upload />

          Upload Document

        </button>


        <button
          onClick={() =>
            navigate(
              "/dashboard/search"
            )
          }
        >

          <Search />

          Semantic Search

        </button>


        <button
          onClick={() =>
            navigate(
              "/dashboard/assistant"
            )
          }
        >

          <Brain />

          AI Assistant

        </button>

      </section>


      {/* =============================================
          FOOTER
      ============================================= */}

      <footer className="dashboard-footer">

        <span>

          <span className="footer-dot" />

          KnowFlow AI · All systems operational

        </span>


        <span>

          Logged in as{" "}

          <strong>
            {userRole}
          </strong>

          {" · "}

          Last synchronization:{" "}

          {
            lastUpdate
              ? lastUpdate.toLocaleTimeString(
                  "en-US",
                  {
                    hour: "2-digit",
                    minute: "2-digit",
                  }
                )
              : "—"
          }

        </span>

      </footer>

    </div>

  );
}