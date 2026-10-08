import React, {
  useCallback,
  useEffect,
  useMemo,
  useState,
} from "react";

import {
  Activity,
  AlertCircle,
  Calendar,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  Clock3,
  Eye,
  Filter,
  Lock,
  RefreshCw,
  RotateCcw,
  Search,
  Shield,
  X,
  XCircle,
  Download,
} from "lucide-react";

import { useAuth } from "../../context/AuthContext";
import "./AuditLogs.css";

const API_URL = "http://localhost:5282/api/AuditLogs";

const PAGE_SIZE = 8;


// =====================================================
// HELPERS
// =====================================================

function getToken() {
  return (
    localStorage.getItem("token") ||
    sessionStorage.getItem("token")
  );
}


function formatDate(dateValue) {
  if (!dateValue) {
    return "—";
  }

  const date = new Date(dateValue);

  if (Number.isNaN(date.getTime())) {
    return "—";
  }

  return new Intl.DateTimeFormat("fr-FR", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(date);
}


function formatShortDate(dateValue) {
  if (!dateValue) {
    return "—";
  }

  const date = new Date(dateValue);

  if (Number.isNaN(date.getTime())) {
    return "—";
  }

  return new Intl.DateTimeFormat("fr-FR", {
    day: "2-digit",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
  }).format(date);
}


function getInitials(name) {
  if (!name) {
    return "??";
  }

  return name
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((part) => part.charAt(0).toUpperCase())
    .join("");
}


function normalizeStatus(status) {
  const value = String(status || "").toLowerCase();

  if (
    value.includes("success") ||
    value.includes("successful") ||
    value.includes("réussi") ||
    value.includes("reussi")
  ) {
    return "success";
  }

  if (
    value.includes("warning") ||
    value.includes("pending") ||
    value.includes("avert")
  ) {
    return "warning";
  }

  if (
    value.includes("fail") ||
    value.includes("error") ||
    value.includes("denied") ||
    value.includes("échec") ||
    value.includes("echec")
  ) {
    return "failed";
  }

  return "warning";
}


function getActionIcon(status) {
  const type = normalizeStatus(status);

  if (type === "success") {
    return CheckCircle2;
  }

  if (type === "failed") {
    return XCircle;
  }

  return AlertCircle;
}


// =====================================================
// COMPONENT
// =====================================================

export default function AuditLogs() {

  const { user } = useAuth();

  const [logs, setLogs] = useState([]);

  const [loading, setLoading] = useState(true);

  const [refreshing, setRefreshing] = useState(false);

  const [error, setError] = useState("");

  const [search, setSearch] = useState("");

  const [filterOpen, setFilterOpen] = useState(false);

  const [selectedCategory, setSelectedCategory] =
    useState("All");

  const [selectedStatus, setSelectedStatus] =
    useState("All");

  const [selectedLog, setSelectedLog] =
    useState(null);

  const [currentPage, setCurrentPage] =
    useState(1);


  // ===================================================
  // FETCH LOGS
  // ===================================================

  const fetchLogs = useCallback(
    async (isRefresh = false) => {

      const token = getToken();

      if (!token) {

        setLogs([]);

        setError(
          "Session expirée ou token JWT introuvable. Veuillez vous reconnecter."
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


        const response = await fetch(
          API_URL,
          {
            method: "GET",

            headers: {
              Accept: "application/json",
              Authorization: `Bearer ${token}`,
            },
          }
        );


        // ===========================================
        // UNAUTHORIZED
        // ===========================================

        if (response.status === 401) {

          setLogs([]);

          setError(
            "Session expirée ou token JWT invalide. Veuillez vous reconnecter."
          );

          return;
        }


        // ===========================================
        // FORBIDDEN
        // ===========================================

        if (response.status === 403) {

          setLogs([]);

          setError(
            "Accès refusé. Votre compte ne possède pas les permissions nécessaires."
          );

          return;
        }


        // ===========================================
        // OTHER ERROR
        // ===========================================

        if (!response.ok) {

          const text =
            await response.text();

          throw new Error(
            text ||
              `Erreur HTTP ${response.status}`
          );
        }


        // ===========================================
        // JSON
        // ===========================================

        const data =
          await response.json();


        const normalizedLogs =
          Array.isArray(data)
            ? data
            : [];


        // Sort newest first
        normalizedLogs.sort(
          (a, b) =>
            new Date(b.timestamp || 0) -
            new Date(a.timestamp || 0)
        );


        setLogs(normalizedLogs);

      } catch (err) {

        console.error(
          "Audit Logs error:",
          err
        );

        setError(
          "Impossible de charger les logs. Vérifiez que le service AuditLogs est disponible."
        );

      } finally {

        setLoading(false);

        setRefreshing(false);
      }
    },
    []
  );


  // ===================================================
  // INITIAL LOAD
  // ===================================================

  useEffect(() => {

    fetchLogs();

  }, [fetchLogs]);


  // ===================================================
  // ESC CLOSE MODAL
  // ===================================================

  useEffect(() => {

    const handleKeyDown = (event) => {

      if (event.key === "Escape") {
        setSelectedLog(null);
      }
    };


    window.addEventListener(
      "keydown",
      handleKeyDown
    );


    return () => {

      window.removeEventListener(
        "keydown",
        handleKeyDown
      );

    };

  }, []);


  // ===================================================
  // CATEGORIES
  // ===================================================

  const categories = useMemo(() => {

    const values =
      logs
        .map((log) => log.category)
        .filter(Boolean);


    return [
      "All",
      ...Array.from(
        new Set(values)
      ),
    ];

  }, [logs]);


  // ===================================================
  // FILTERED LOGS
  // ===================================================

  const filteredLogs = useMemo(() => {

    const query =
      search
        .trim()
        .toLowerCase();


    return logs.filter((log) => {

      const matchesSearch =
        !query ||
        String(log.action || "")
          .toLowerCase()
          .includes(query) ||
        String(log.category || "")
          .toLowerCase()
          .includes(query) ||
        String(log.target || "")
          .toLowerCase()
          .includes(query) ||
        String(log.description || "")
          .toLowerCase()
          .includes(query) ||
        String(log.userName || "")
          .toLowerCase()
          .includes(query) ||
        String(log.ipAddress || "")
          .toLowerCase()
          .includes(query);


      const matchesCategory =
        selectedCategory === "All" ||
        log.category === selectedCategory;


      const matchesStatus =
        selectedStatus === "All" ||
        normalizeStatus(log.status) ===
          selectedStatus;


      return (
        matchesSearch &&
        matchesCategory &&
        matchesStatus
      );

    });

  }, [
    logs,
    search,
    selectedCategory,
    selectedStatus,
  ]);


  // ===================================================
  // PAGINATION
  // ===================================================

  const totalPages =
    Math.max(
      1,
      Math.ceil(
        filteredLogs.length /
          PAGE_SIZE
      )
    );


  useEffect(() => {

    if (currentPage > totalPages) {
      setCurrentPage(totalPages);
    }

  }, [
    currentPage,
    totalPages,
  ]);


  const paginatedLogs =
    useMemo(() => {

      const start =
        (currentPage - 1) *
        PAGE_SIZE;

      return filteredLogs.slice(
        start,
        start + PAGE_SIZE
      );

    }, [
      filteredLogs,
      currentPage,
    ]);


  // ===================================================
  // STATISTICS
  // ===================================================

  const statistics = useMemo(() => {

    const total =
      logs.length;


    const successful =
      logs.filter(
        (log) =>
          normalizeStatus(
            log.status
          ) === "success"
      ).length;


    const warnings =
      logs.filter(
        (log) =>
          normalizeStatus(
            log.status
          ) === "warning"
      ).length;


    const failed =
      logs.filter(
        (log) =>
          normalizeStatus(
            log.status
          ) === "failed"
      ).length;


    return {
      total,
      successful,
      warnings,
      failed,
    };

  }, [logs]);


  // ===================================================
  // RESET FILTERS
  // ===================================================

  const resetFilters = () => {

    setSearch("");

    setSelectedCategory("All");

    setSelectedStatus("All");

    setCurrentPage(1);
  };


  // ===================================================
  // EXPORT CSV
  // ===================================================

  const exportLogs = () => {

    if (!filteredLogs.length) {
      return;
    }


    const headers = [
      "ID",
      "User",
      "Action",
      "Category",
      "Target",
      "Description",
      "Status",
      "Timestamp",
      "IP Address",
      "User Agent",
    ];


    const rows =
      filteredLogs.map((log) => [
        log.id ?? "",
        log.userName ?? "",
        log.action ?? "",
        log.category ?? "",
        log.target ?? "",
        log.description ?? "",
        log.status ?? "",
        log.timestamp ?? "",
        log.ipAddress ?? "",
        log.userAgent ?? "",
      ]);


    const csv = [
      headers,
      ...rows,
    ]
      .map((row) =>
        row
          .map((value) =>
            `"${String(value)
              .replace(/"/g, '""')}"`
          )
          .join(",")
      )
      .join("\n");


    const blob =
      new Blob(
        [csv],
        {
          type:
            "text/csv;charset=utf-8;",
        }
      );


    const url =
      URL.createObjectURL(blob);


    const link =
      document.createElement("a");


    link.href = url;

    link.download =
      `knowflow-audit-logs-${new Date()
        .toISOString()
        .slice(0, 10)}.csv`;


    document.body.appendChild(link);

    link.click();

    link.remove();

    URL.revokeObjectURL(url);
  };


  // ===================================================
  // RENDER
  // ===================================================

  return (
    <div className="audit-page">

      {/* ==============================================
          HEADER
      =============================================== */}

      <header className="audit-header">

        <div className="audit-title-area">

          <div className="audit-title-icon">
            <Shield size={23} />
          </div>


          <div>

            <div className="audit-breadcrumb">
              <span>ADMIN</span>
              <span>/</span>
              <span>SECURITY</span>
            </div>


            <h1>
              Audit Logs
            </h1>


            <p>
              Surveillez et analysez les activités
              de votre plateforme KnowFlow AI.
            </p>

          </div>

        </div>


        <div className="audit-header-actions">

          <div className="live-indicator">
            <span />
            Live monitoring
          </div>


          <button
            type="button"
            className="refresh-button"
            onClick={() => fetchLogs(true)}
            disabled={refreshing}
            title="Actualiser"
          >

            <RefreshCw
              size={15}
              className={
                refreshing
                  ? "audit-spin"
                  : ""
              }
            />

          </button>

        </div>

      </header>


      {/* ==============================================
          ERROR
      =============================================== */}

      {error && (

        <div
          className="audit-error"
          role="alert"
        >

          <AlertCircle size={17} />

          <div>
            <strong>
              Impossible de charger les logs
            </strong>

            <span>
              {error}
            </span>
          </div>

          <button
            type="button"
            onClick={() =>
              fetchLogs(true)
            }
          >
            Réessayer
          </button>

        </div>

      )}


      {/* ==============================================
          STATS
      =============================================== */}

      <section className="audit-stats">

        <div className="audit-stat-card">

          <div className="audit-stat-icon purple">
            <Activity size={18} />
          </div>

          <div>
            <span>
              TOTAL EVENTS
            </span>

            <strong>
              {statistics.total}
            </strong>
          </div>

          <small>
            All recorded activities
          </small>

        </div>


        <div className="audit-stat-card">

          <div className="audit-stat-icon green">
            <CheckCircle2 size={18} />
          </div>

          <div>
            <span>
              SUCCESSFUL
            </span>

            <strong>
              {statistics.successful}
            </strong>
          </div>

          <small>
            Successfully completed
          </small>

        </div>


        <div className="audit-stat-card">

          <div className="audit-stat-icon amber">
            <AlertCircle size={18} />
          </div>

          <div>
            <span>
              WARNINGS
            </span>

            <strong>
              {statistics.warnings}
            </strong>
          </div>

          <small>
            Requires attention
          </small>

        </div>


        <div className="audit-stat-card">

          <div className="audit-stat-icon red">
            <XCircle size={18} />
          </div>

          <div>
            <span>
              FAILED
            </span>

            <strong>
              {statistics.failed}
            </strong>
          </div>

          <small>
            Failed activities
          </small>

        </div>

      </section>


      {/* ==============================================
          TOOLBAR
      =============================================== */}

      <div className="audit-toolbar">

        <div className="audit-search">

          <Search size={15} />

          <input
            type="text"
            value={search}
            onChange={(event) => {
              setSearch(event.target.value);
              setCurrentPage(1);
            }}
            placeholder="Rechercher une activité, utilisateur, cible..."
          />


          {search && (

            <button
              type="button"
              onClick={() => {
                setSearch("");
                setCurrentPage(1);
              }}
              title="Effacer"
            >
              <X size={13} />
            </button>

          )}

        </div>


        <div className="audit-toolbar-actions">

          <button
            type="button"
            className={
              `filter-button ${
                filterOpen ||
                selectedCategory !== "All" ||
                selectedStatus !== "All"
                  ? "active"
                  : ""
              }`
            }
            onClick={() =>
              setFilterOpen(
                (value) => !value
              )
            }
          >

            <Filter size={14} />

            Filtres

            {(selectedCategory !== "All" ||
              selectedStatus !== "All") && (

              <span className="filter-count">
                {
                  Number(
                    selectedCategory !==
                      "All"
                  ) +
                  Number(
                    selectedStatus !==
                      "All"
                  )
                }
              </span>

            )}

          </button>


          <button
            type="button"
            className="export-button"
            onClick={exportLogs}
            disabled={!filteredLogs.length}
          >

            <Download size={14} />

            Exporter

          </button>

        </div>

      </div>


      {/* ==============================================
          FILTERS
      =============================================== */}

      {filterOpen && (

        <div className="audit-filters">

          <div className="filter-group">

            <label>
              Catégorie
            </label>

            <div className="filter-options">

              {categories.map(
                (category) => (

                  <button
                    key={category}
                    type="button"
                    className={
                      selectedCategory ===
                      category
                        ? "selected"
                        : ""
                    }
                    onClick={() => {
                      setSelectedCategory(
                        category
                      );
                      setCurrentPage(1);
                    }}
                  >
                    {category}
                  </button>

                )
              )}

            </div>

          </div>


          <div className="filter-group">

            <label>
              Statut
            </label>

            <div className="filter-options">

              {[
                ["All", "Tous"],
                ["success", "Success"],
                ["warning", "Warning"],
                ["failed", "Failed"],
              ].map(
                ([value, label]) => (

                  <button
                    key={value}
                    type="button"
                    className={
                      selectedStatus ===
                      value
                        ? "selected"
                        : ""
                    }
                    onClick={() => {
                      setSelectedStatus(
                        value
                      );
                      setCurrentPage(1);
                    }}
                  >
                    {label}
                  </button>

                )
              )}

            </div>

          </div>


          <button
            type="button"
            className="reset-filters"
            onClick={resetFilters}
          >

            <RotateCcw size={12} />

            Réinitialiser

          </button>

        </div>

      )}


      {/* ==============================================
          RESULT BAR
      =============================================== */}

      <div className="audit-result-bar">

        <span>
          <strong>
            {filteredLogs.length}
          </strong>{" "}
          événement
          {filteredLogs.length !== 1
            ? "s"
            : ""}{" "}
          trouvé
          {filteredLogs.length !== 1
            ? "s"
            : ""}
        </span>


        <div className="secure-label">

          <Lock size={11} />

          Journal sécurisé

        </div>

      </div>


      {/* ==============================================
          TABLE
      =============================================== */}

      <div className="audit-table-wrapper">

        {loading ? (

          <div className="audit-loading">

            <RefreshCw
              size={24}
              className="audit-spin"
            />

            <span>
              Chargement des logs...
            </span>

          </div>

        ) : filteredLogs.length === 0 ? (

          <div className="audit-empty">

            <div className="audit-empty-icon">
              <Shield size={21} />
            </div>

            <h3>
              Aucun événement trouvé
            </h3>

            <p>
              Aucun log ne correspond
              aux critères actuels.
            </p>

            {(search ||
              selectedCategory !==
                "All" ||
              selectedStatus !==
                "All") && (

              <button
                type="button"
                onClick={resetFilters}
              >
                Réinitialiser les filtres
              </button>

            )}

          </div>

        ) : (

          <div className="audit-table">

            {/* HEADER */}

            <div className="audit-table-header">

              <span>
                Activité
              </span>

              <span>
                Utilisateur
              </span>

              <span>
                Catégorie
              </span>

              <span>
                Cible
              </span>

              <span>
                Date
              </span>

              <span>
                Statut
              </span>

              <span />

            </div>


            {/* ROWS */}

            {paginatedLogs.map(
              (log) => {

                const statusType =
                  normalizeStatus(
                    log.status
                  );

                const Icon =
                  getActionIcon(
                    log.status
                  );


                return (

                  <div
                    className="audit-row"
                    key={log.id}
                    onClick={() =>
                      setSelectedLog(log)
                    }
                  >

                    {/* ACTIVITY */}

                    <div className="audit-activity">

                      <div
                        className={
                          `activity-icon ${statusType}`
                        }
                      >
                        <Icon size={15} />
                      </div>


                      <div>

                        <strong>
                          {log.action ||
                            "Unknown action"}
                        </strong>

                        <span>
                          {log.description ||
                            "Aucune description"}
                        </span>

                      </div>

                    </div>


                    {/* USER */}

                    <div className="audit-user">

                      <div className="user-avatar">
                        {getInitials(
                          log.userName
                        )}
                      </div>

                      <span>
                        {log.userName ||
                          "Unknown user"}
                      </span>

                    </div>


                    {/* CATEGORY */}

                    <div className="audit-category">

                      <Activity size={11} />

                      {log.category ||
                        "—"}

                    </div>


                    {/* TARGET */}

                    <div className="audit-target">
                      {log.target || "—"}
                    </div>


                    {/* TIME */}

                    <div className="audit-time">

                      <Clock3 size={11} />

                      {formatShortDate(
                        log.timestamp
                      )}

                    </div>


                    {/* STATUS */}

                    <div>

                      <span
                        className={
                          `audit-status ${statusType}`
                        }
                      >

                        <span>
                          {log.status ||
                            "Unknown"}
                        </span>

                      </span>

                    </div>


                    {/* VIEW */}

                    <button
                      type="button"
                      className="audit-view-button"
                      onClick={(event) => {

                        event.stopPropagation();

                        setSelectedLog(log);

                      }}
                      title="Voir les détails"
                    >
                      <Eye size={14} />
                    </button>

                  </div>

                );
              }
            )}

          </div>

        )}

      </div>


      {/* ==============================================
          PAGINATION
      =============================================== */}

      {!loading &&
        filteredLogs.length > 0 && (

        <div className="audit-pagination">

          <span>
            Page{" "}
            <strong>
              {currentPage}
            </strong>{" "}
            sur{" "}
            <strong>
              {totalPages}
            </strong>
          </span>


          <div>

            <button
              type="button"
              disabled={
                currentPage === 1
              }
              onClick={() =>
                setCurrentPage(
                  (page) =>
                    Math.max(
                      1,
                      page - 1
                    )
                )
              }
            >
              <ChevronLeft size={13} />
            </button>


            {Array.from(
              {
                length: totalPages,
              },
              (_, index) =>
                index + 1
            )
              .slice(
                Math.max(
                  0,
                  currentPage - 3
                ),
                Math.min(
                  totalPages,
                  currentPage + 2
                )
              )
              .map((page) => (

                <button
                  type="button"
                  key={page}
                  className={
                    currentPage === page
                      ? "current"
                      : ""
                  }
                  onClick={() =>
                    setCurrentPage(page)
                  }
                >
                  {page}
                </button>

              ))}


            <button
              type="button"
              disabled={
                currentPage ===
                totalPages
              }
              onClick={() =>
                setCurrentPage(
                  (page) =>
                    Math.min(
                      totalPages,
                      page + 1
                    )
                )
              }
            >
              <ChevronRight size={13} />
            </button>

          </div>

        </div>

      )}


      {/* ==============================================
          MODAL
      =============================================== */}

      {selectedLog && (

        <div
          className="audit-modal-overlay"
          onMouseDown={(event) => {

            if (
              event.target ===
              event.currentTarget
            ) {
              setSelectedLog(null);
            }

          }}
        >

          <div className="audit-modal">

            <div className="audit-modal-header">

              <div>

                <span>
                  AUDIT EVENT
                </span>

                <h2>
                  Event details
                </h2>

              </div>


              <button
                type="button"
                onClick={() =>
                  setSelectedLog(null)
                }
                title="Fermer"
              >
                <X size={16} />
              </button>

            </div>


            {/* EVENT HEADING */}

            <div className="modal-event-heading">

              <div
                className={
                  `modal-event-icon ${normalizeStatus(
                    selectedLog.status
                  )}`
                }
              >

                {React.createElement(
                  getActionIcon(
                    selectedLog.status
                  ),
                  {
                    size: 19,
                  }
                )}

              </div>


              <div>

                <h3>
                  {selectedLog.action ||
                    "Unknown action"}
                </h3>

                <p>
                  {selectedLog.description ||
                    "Aucune description disponible"}
                </p>

              </div>

            </div>


            {/* DETAILS */}

            <div className="modal-details">

              <div>
                <span>
                  Utilisateur
                </span>

                <strong>
                  {selectedLog.userName ||
                    "—"}
                </strong>
              </div>


              <div>
                <span>
                  User ID
                </span>

                <strong>
                  {selectedLog.userId ||
                    "Non renseigné"}
                </strong>
              </div>


              <div>
                <span>
                  Catégorie
                </span>

                <strong>
                  {selectedLog.category ||
                    "—"}
                </strong>
              </div>


              <div>
                <span>
                  Cible
                </span>

                <strong>
                  {selectedLog.target ||
                    "—"}
                </strong>
              </div>


              <div>
                <span>
                  Statut
                </span>

                <strong
                  className={
                    `modal-status ${normalizeStatus(
                      selectedLog.status
                    )}`
                  }
                >
                  {selectedLog.status ||
                    "—"}
                </strong>
              </div>


              <div>
                <span>
                  Timestamp
                </span>

                <strong>
                  {formatDate(
                    selectedLog.timestamp
                  )}
                </strong>
              </div>


              <div>
                <span>
                  Adresse IP
                </span>

                <strong>
                  {selectedLog.ipAddress ||
                    "—"}
                </strong>
              </div>


              <div>
                <span>
                  Event ID
                </span>

                <strong>
                  #{selectedLog.id}
                </strong>
              </div>

            </div>


            {/* SECURITY */}

            <div className="modal-security">

              <Lock size={14} />

              <p>
                Cet événement est enregistré
                dans le journal d'audit sécurisé
                de KnowFlow AI.
              </p>

            </div>


            {/* USER AGENT */}

            {selectedLog.userAgent && (

              <div className="modal-user-agent">

                <span>
                  USER AGENT
                </span>

                <p>
                  {selectedLog.userAgent}
                </p>

              </div>

            )}


            <button
              type="button"
              className="modal-close-button"
              onClick={() =>
                setSelectedLog(null)
              }
            >
              Fermer

            </button>

          </div>

        </div>

      )}

    </div>
  );
}