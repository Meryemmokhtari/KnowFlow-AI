
import React, { useEffect, useMemo, useState } from "react";
import {
  FileText,
  Search,
  RefreshCw,
  Eye,
  Trash2,
  Download,
  File,
  FileType2,
  FileSpreadsheet,
  AlertCircle,
  CheckCircle2,
  Filter,
  X,
  HardDrive,
  Clock3,
  Layers3,
  TrendingUp,
} from "lucide-react";

import "./ManagerDocuments.css";

const DOCUMENT_API = "http://localhost:5260/api/Document";

/* =========================================================
   TOKEN
========================================================= */

const getToken = () => {
  return (
    localStorage.getItem("token") ||
    localStorage.getItem("accessToken") ||
    sessionStorage.getItem("token") ||
    sessionStorage.getItem("accessToken") ||
    ""
  );
};

/* =========================================================
   HELPERS
========================================================= */

const getDocumentId = (document) =>
  document?.id ??
  document?.Id ??
  document?.documentId ??
  document?.DocumentId;

const getDocumentName = (document) =>
  document?.fileName ||
  document?.FileName ||
  document?.name ||
  document?.Name ||
  "Untitled document";

const getDocumentSize = (document) =>
  document?.fileSize ??
  document?.FileSize ??
  document?.size ??
  document?.Size ??
  0;

const getDocumentDate = (document) =>
  document?.uploadedAt ||
  document?.UploadedAt ||
  document?.createdAt ||
  document?.CreatedAt ||
  document?.uploadDate ||
  document?.UploadDate ||
  null;

const getUploadedBy = (document) =>
  document?.uploadedBy ||
  document?.UploadedBy ||
  document?.uploadedByName ||
  document?.UploadedByName ||
  document?.userName ||
  document?.UserName ||
  document?.ownerName ||
  document?.OwnerName ||
  "Workspace";

/* =========================================================
   COMPONENT
========================================================= */

export default function ManagerDocuments() {
  const [documents, setDocuments] = useState([]);

  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const [search, setSearch] = useState("");
  const [filterType, setFilterType] = useState("ALL");

  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const [deletingId, setDeletingId] = useState(null);

  /* =======================================================
     LOAD DOCUMENTS
  ======================================================= */

  const loadDocuments = async (refresh = false) => {
    try {
      if (refresh) {
        setRefreshing(true);
      } else {
        setLoading(true);
      }

      setError("");
      setSuccess("");

      const token = getToken();

      if (!token) {
        throw new Error("Authentication token not found.");
      }

      const response = await fetch(DOCUMENT_API, {
        method: "GET",
        headers: {
          Authorization: `Bearer ${token}`,
          Accept: "application/json",
        },
      });

      if (!response.ok) {
        let message = "Unable to load workspace documents.";

        try {
          const data = await response.json();

          message =
            data?.message ||
            data?.error ||
            data?.title ||
            message;
        } catch {
          // Ignore invalid response body.
        }

        throw new Error(message);
      }

      const data = await response.json();

      /*
       * Supports:
       * [
       *   {...}
       * ]
       *
       * OR
       *
       * {
       *   data: [...]
       * }
       *
       * OR
       *
       * {
       *   documents: [...]
       * }
       */

      const list = Array.isArray(data)
        ? data
        : Array.isArray(data?.data)
        ? data.data
        : Array.isArray(data?.documents)
        ? data.documents
        : Array.isArray(data?.items)
        ? data.items
        : [];

      setDocuments(list);

      if (refresh) {
        setSuccess("Documents refreshed successfully.");
      }
    } catch (err) {
      console.error("Manager documents error:", err);

      setError(
        err?.message ||
          "Unable to load workspace documents."
      );
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  /* =======================================================
     INITIAL LOAD
  ======================================================= */

  useEffect(() => {
    loadDocuments();
  }, []);

  /* =======================================================
     FILE TYPE
  ======================================================= */

  const getFileType = (document) => {
    const type = String(
      document?.fileType ||
        document?.FileType ||
        document?.contentType ||
        document?.ContentType ||
        ""
    ).toLowerCase();

    const name = getDocumentName(document).toLowerCase();

    if (
      type.includes("pdf") ||
      name.endsWith(".pdf")
    ) {
      return "PDF";
    }

    if (
      type.includes("word") ||
      type.includes("document") ||
      name.endsWith(".doc") ||
      name.endsWith(".docx")
    ) {
      return "DOCX";
    }

    if (
      type.includes("spreadsheet") ||
      type.includes("excel") ||
      name.endsWith(".xls") ||
      name.endsWith(".xlsx")
    ) {
      return "XLSX";
    }

    if (
      type.includes("text") ||
      name.endsWith(".txt")
    ) {
      return "TXT";
    }

    return "FILE";
  };

  /* =======================================================
     FILE ICON
  ======================================================= */

  const getFileIcon = (type) => {
    switch (type) {
      case "PDF":
        return <FileType2 size={20} />;

      case "XLSX":
        return <FileSpreadsheet size={20} />;

      case "TXT":
        return <File size={20} />;

      case "DOCX":
        return <FileText size={20} />;

      default:
        return <FileText size={20} />;
    }
  };

  /* =======================================================
     FORMAT SIZE
  ======================================================= */

  const formatFileSize = (size) => {
    const value = Number(size);

    if (!Number.isFinite(value) || value <= 0) {
      return "0 B";
    }

    if (value < 1024) {
      return `${value} B`;
    }

    if (value < 1024 * 1024) {
      return `${(value / 1024).toFixed(1)} KB`;
    }

    if (value < 1024 * 1024 * 1024) {
      return `${(value / (1024 * 1024)).toFixed(1)} MB`;
    }

    return `${(
      value /
      (1024 * 1024 * 1024)
    ).toFixed(1)} GB`;
  };

  /* =======================================================
     TOTAL STORAGE
  ======================================================= */

  const totalStorage = useMemo(() => {
    return documents.reduce((total, document) => {
      return total + Number(getDocumentSize(document) || 0);
    }, 0);
  }, [documents]);

  /* =======================================================
     DATE
  ======================================================= */

  const formatDate = (date) => {
    if (!date) {
      return "Unknown";
    }

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
    if (!date) {
      return "Recently";
    }

    const value = new Date(date);

    if (Number.isNaN(value.getTime())) {
      return "Recently";
    }

    const diff =
      Date.now() - value.getTime();

    const minutes = Math.floor(
      diff / 60000
    );

    if (minutes < 1) {
      return "Just now";
    }

    if (minutes < 60) {
      return `${minutes} min ago`;
    }

    const hours = Math.floor(
      minutes / 60
    );

    if (hours < 24) {
      return `${hours}h ago`;
    }

    const days = Math.floor(
      hours / 24
    );

    if (days < 7) {
      return `${days}d ago`;
    }

    return formatDate(date);
  };

  /* =======================================================
     FILTERED DOCUMENTS
  ======================================================= */

  const filteredDocuments = useMemo(() => {
    const query = search
      .trim()
      .toLowerCase();

    return documents.filter((document) => {
      const name =
        getDocumentName(document).toLowerCase();

      const uploader =
        getUploadedBy(document).toLowerCase();

      const type =
        getFileType(document);

      const matchesSearch =
        !query ||
        name.includes(query) ||
        uploader.includes(query) ||
        type.toLowerCase().includes(query);

      const matchesType =
        filterType === "ALL" ||
        type === filterType;

      return (
        matchesSearch &&
        matchesType
      );
    });
  }, [documents, search, filterType]);

  /* =======================================================
     TYPE COUNTS
  ======================================================= */

  const typeCounts = useMemo(() => {
    const counts = {
      PDF: 0,
      DOCX: 0,
      TXT: 0,
      XLSX: 0,
      FILE: 0,
    };

    documents.forEach((document) => {
      const type = getFileType(document);

      if (counts[type] !== undefined) {
        counts[type]++;
      }
    });

    return counts;
  }, [documents]);

  /* =======================================================
     RECENT DOCUMENTS
  ======================================================= */

  const recentDocuments = useMemo(() => {
    return [...documents]
      .sort((a, b) => {
        const dateA =
          new Date(
            getDocumentDate(a) || 0
          ).getTime();

        const dateB =
          new Date(
            getDocumentDate(b) || 0
          ).getTime();

        return dateB - dateA;
      })
      .slice(0, 4);
  }, [documents]);

  /* =======================================================
     VIEW
  ======================================================= */

  const getFileUrl = (document) => {
    const fileName = getDocumentName(document);

    return (
      DOCUMENT_API +
      "/file/" +
      encodeURIComponent(fileName)
    );
  };

  const handleView = (document) => {
    if (!getDocumentName(document)) {
      setError("Document file name is missing.");
      return;
    }

    window.open(
      getFileUrl(document),
      "_blank",
      "noopener,noreferrer"
    );
  };

  /* =======================================================
     DOWNLOAD
  ======================================================= */

  const handleDownload = async (document) => {
    try {
      const token = getToken();

      if (!token) {
        throw new Error(
          "Authentication token not found."
        );
      }

      const response = await fetch(
        getFileUrl(document),
        {
          method: "GET",
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      if (!response.ok) {
        throw new Error(
          "Unable to download document."
        );
      }

      const blob =
        await response.blob();

      const url =
        window.URL.createObjectURL(blob);

      const link =
        window.document.createElement("a");

      link.href = url;
      link.download =
        getDocumentName(document);

      window.document.body.appendChild(
        link
      );

      link.click();

      link.remove();

      window.URL.revokeObjectURL(url);
    } catch (err) {
      console.error(
        "Download document error:",
        err
      );

      setError(
        err?.message ||
          "Unable to download document."
      );
    }
  };

  /* =======================================================
     DELETE
  ======================================================= */

  const handleDelete = async (document) => {
    const id =
      getDocumentId(document);

    if (
      id === undefined ||
      id === null
    ) {
      setError(
        "Document ID is missing."
      );
      return;
    }

    const fileName =
      getDocumentName(document);

    const confirmed =
      window.confirm(
        `Delete "${fileName}"?`
      );

    if (!confirmed) {
      return;
    }

    try {
      setDeletingId(id);
      setError("");
      setSuccess("");

      const token = getToken();

      if (!token) {
        throw new Error(
          "Authentication token not found."
        );
      }

      const response = await fetch(
        `${DOCUMENT_API}/${id}`,
        {
          method: "DELETE",
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      if (!response.ok) {
        let message =
          "Unable to delete document.";

        try {
          const data =
            await response.json();

          message =
            data?.message ||
            data?.error ||
            data?.title ||
            message;
        } catch {
          // Ignore invalid response body.
        }

        throw new Error(message);
      }

      setDocuments((current) =>
        current.filter(
          (item) =>
            getDocumentId(item) !== id
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
          "Unable to delete document."
      );
    } finally {
      setDeletingId(null);
    }
  };

  /* =======================================================
     CLEAR FILTERS
  ======================================================= */

  const clearFilters = () => {
    setSearch("");
    setFilterType("ALL");
  };

  /* =======================================================
     LOADING
  ======================================================= */

  if (loading) {
    return (
      <div className="manager-documents-page">
        <div className="manager-documents-loading">
          <div className="manager-documents-spinner" />

          <h3>
            Loading workspace documents
          </h3>

          <p>
            Preparing your document workspace...
          </p>
        </div>
      </div>
    );
  }

  /* =======================================================
     RENDER
  ======================================================= */

  return (
    <div className="manager-documents-page">

      {/* ===================================================
          HEADER
      =================================================== */}

      <section className="manager-documents-header">

        <div className="manager-documents-heading">

          <span className="manager-documents-eyebrow">
            KNOWFLOW AI · MANAGER
          </span>

          <h1>
            Workspace Documents
          </h1>

          <p>
            Monitor, browse and manage the
            documents available in your workspace.
          </p>

        </div>

        <button
          type="button"
          className="manager-documents-refresh"
          onClick={() =>
            loadDocuments(true)
          }
          disabled={refreshing}
        >
          <RefreshCw
            size={17}
            className={
              refreshing
                ? "manager-documents-spin"
                : ""
            }
          />

          {refreshing
            ? "Refreshing..."
            : "Refresh"}
        </button>

      </section>

      {/* ===================================================
          MESSAGES
      =================================================== */}

      {error && (
        <div className="manager-documents-message error">

          <AlertCircle size={18} />

          <span>
            {error}
          </span>

          <button
            type="button"
            onClick={() =>
              setError("")
            }
            aria-label="Close error"
          >
            <X size={15} />
          </button>

        </div>
      )}

      {success && (
        <div className="manager-documents-message success">

          <CheckCircle2 size={18} />

          <span>
            {success}
          </span>

          <button
            type="button"
            onClick={() =>
              setSuccess("")
            }
            aria-label="Close success"
          >
            <X size={15} />
          </button>

        </div>
      )}

      {/* ===================================================
          STATISTICS
      =================================================== */}

      <section className="manager-documents-stats">

        <div className="manager-document-stat-card">

          <div className="manager-document-stat-icon blue">
            <FileText size={20} />
          </div>

          <div className="manager-document-stat-content">

            <span>
              Total documents
            </span>

            <strong>
              {documents.length}
            </strong>

            <small>
              Workspace library
            </small>

          </div>

        </div>

        <div className="manager-document-stat-card">

          <div className="manager-document-stat-icon purple">
            <HardDrive size={20} />
          </div>

          <div className="manager-document-stat-content">

            <span>
              Total storage
            </span>

            <strong>
              {formatFileSize(
                totalStorage
              )}
            </strong>

            <small>
              Documents storage
            </small>

          </div>

        </div>

        <div className="manager-document-stat-card">

          <div className="manager-document-stat-icon green">
            <Clock3 size={20} />
          </div>

          <div className="manager-document-stat-content">

            <span>
              Recent uploads
            </span>

            <strong>
              {recentDocuments.length}
            </strong>

            <small>
              Latest workspace files
            </small>

          </div>

        </div>

        <div className="manager-document-stat-card">

          <div className="manager-document-stat-icon orange">
            <Layers3 size={20} />
          </div>

          <div className="manager-document-stat-content">

            <span>
              File types
            </span>

            <strong>
              {
                [
                  typeCounts.PDF,
                  typeCounts.DOCX,
                  typeCounts.TXT,
                  typeCounts.XLSX,
                  typeCounts.FILE,
                ].filter(
                  (value) => value > 0
                ).length
              }
            </strong>

            <small>
              Formats in workspace
            </small>

          </div>

        </div>

      </section>

      {/* ===================================================
          OVERVIEW
      =================================================== */}

      <section className="manager-documents-overview">

        <div className="manager-documents-overview-card">

          <div className="manager-documents-overview-title">

            <div>
              <span>
                Document overview
              </span>

              <h2>
                Workspace library
              </h2>
            </div>

            <TrendingUp size={20} />

          </div>

          <div className="manager-document-type-bars">

            {[
              ["PDF", typeCounts.PDF],
              ["DOCX", typeCounts.DOCX],
              ["TXT", typeCounts.TXT],
              ["XLSX", typeCounts.XLSX],
            ].map(
              ([type, count]) => {

                const percentage =
                  documents.length
                    ? Math.round(
                        (count /
                          documents.length) *
                          100
                      )
                    : 0;

                return (
                  <div
                    className="manager-type-progress"
                    key={type}
                  >

                    <div className="manager-type-progress-top">

                      <span>
                        {type}
                      </span>

                      <strong>
                        {count}
                      </strong>

                    </div>

                    <div className="manager-type-progress-track">

                      <div
                        className={`manager-type-progress-fill ${type.toLowerCase()}`}
                        style={{
                          width: `${percentage}%`,
                        }}
                      />

                    </div>

                  </div>
                );
              }
            )}

          </div>

        </div>

        <div className="manager-documents-recent-card">

          <div className="manager-documents-recent-header">

            <div>
              <span>
                RECENT ACTIVITY
              </span>

              <h2>
                Latest documents
              </h2>
            </div>

            <Clock3 size={19} />

          </div>

          {recentDocuments.length === 0 ? (
            <div className="manager-recent-empty">
              No recent documents.
            </div>
          ) : (
            <div className="manager-recent-list">

              {recentDocuments.map(
                (document) => {

                  const type =
                    getFileType(
                      document
                    );

                  const id =
                    getDocumentId(
                      document
                    );

                  return (
                    <div
                      className="manager-recent-item"
                      key={id}
                    >

                      <div
                        className={`manager-recent-icon ${type.toLowerCase()}`}
                      >
                        {getFileIcon(type)}
                      </div>

                      <div className="manager-recent-info">

                        <strong
                          title={getDocumentName(
                            document
                          )}
                        >
                          {getDocumentName(
                            document
                          )}
                        </strong>

                        <span>
                          {formatRelativeDate(
                            getDocumentDate(
                              document
                            )
                          )}
                        </span>

                      </div>

                    </div>
                  );
                }
              )}

            </div>
          )}

        </div>

      </section>

      {/* ===================================================
          TOOLBAR
      =================================================== */}

      <section className="manager-documents-library">

        <div className="manager-documents-library-header">

          <div>
            <span>
              DOCUMENT LIBRARY
            </span>

            <h2>
              All workspace documents
            </h2>
          </div>

          <div className="manager-documents-result-count">
            {filteredDocuments.length}
            {" "}
            {filteredDocuments.length === 1
              ? "document"
              : "documents"}
          </div>

        </div>

        <div className="manager-documents-toolbar">

          <div className="manager-documents-search">

            <Search size={18} />

            <input
              type="text"
              placeholder="Search documents, types or users..."
              value={search}
              onChange={(event) =>
                setSearch(
                  event.target.value
                )
              }
            />

            {search && (
              <button
                type="button"
                onClick={() =>
                  setSearch("")
                }
                aria-label="Clear search"
              >
                <X size={16} />
              </button>
            )}

          </div>

          <div className="manager-documents-filter">

            <Filter size={16} />

            <select
              value={filterType}
              onChange={(event) =>
                setFilterType(
                  event.target.value
                )
              }
            >
              <option value="ALL">
                All types
              </option>

              <option value="PDF">
                PDF
              </option>

              <option value="DOCX">
                DOCX
              </option>

              <option value="TXT">
                TXT
              </option>

              <option value="XLSX">
                XLSX
              </option>
            </select>

          </div>

          {(search ||
            filterType !== "ALL") && (
            <button
              type="button"
              className="manager-documents-clear"
              onClick={clearFilters}
            >
              Clear
            </button>
          )}

        </div>

        {/* =================================================
            DOCUMENTS
        ================================================= */}

        {filteredDocuments.length === 0 ? (
          <div className="manager-documents-empty">

            <div className="manager-documents-empty-icon">
              <FileText size={30} />
            </div>

            <h2>
              {documents.length === 0
                ? "No documents yet"
                : "No matching documents"}
            </h2>

            <p>
              {documents.length === 0
                ? "Documents uploaded to the workspace will appear here."
                : "Try another search or remove the active filter."}
            </p>

            {(search ||
              filterType !== "ALL") && (
              <button
                type="button"
                onClick={clearFilters}
              >
                Clear filters
              </button>
            )}

          </div>
        ) : (
          <div className="manager-documents-table">

            {/* TABLE HEAD */}

            <div className="manager-documents-table-head">

              <span>
                DOCUMENT
              </span>

              <span>
                TYPE
              </span>

              <span>
                SIZE
              </span>

              <span>
                UPLOADED BY
              </span>

              <span>
                DATE
              </span>

              <span>
                ACTIONS
              </span>

            </div>

            {/* ROWS */}

            {filteredDocuments.map(
              (document) => {

                const id =
                  getDocumentId(
                    document
                  );

                const type =
                  getFileType(
                    document
                  );

                const isDeleting =
                  deletingId === id;

                return (
                  <div
                    className="manager-document-item"
                    key={id}
                  >

                    {/* DOCUMENT */}

                    <div className="manager-document-main">

                      <div
                        className={`manager-document-file-icon ${type.toLowerCase()}`}
                      >
                        {getFileIcon(
                          type
                        )}
                      </div>

                      <div className="manager-document-name">

                        <strong
                          title={getDocumentName(
                            document
                          )}
                        >
                          {getDocumentName(
                            document
                          )}
                        </strong>

                        <span>
                          Workspace document
                        </span>

                      </div>

                    </div>

                    {/* TYPE */}

                    <div className="manager-document-type">

                      <span
                        className={`manager-type-badge ${type.toLowerCase()}`}
                      >
                        {type}
                      </span>

                    </div>

                    {/* SIZE */}

                    <div className="manager-document-size">
                      {formatFileSize(
                        getDocumentSize(
                          document
                        )
                      )}
                    </div>

                    {/* UPLOADER */}

                    <div className="manager-document-uploader">

                      <div className="manager-uploader-avatar">
                        {getUploadedBy(
                          document
                        )
                          .charAt(0)
                          .toUpperCase()}
                      </div>

                      <span
                        title={getUploadedBy(
                          document
                        )}
                      >
                        {getUploadedBy(
                          document
                        )}
                      </span>

                    </div>

                    {/* DATE */}

                    <div className="manager-document-date">
                      {formatDate(
                        getDocumentDate(
                          document
                        )
                      )}
                    </div>

                    {/* ACTIONS */}

                    <div className="manager-document-actions">

                      <button
                        type="button"
                        className="document-action view"
                        onClick={() =>
                          handleView(
                            document
                          )
                        }
                        title="View document"
                      >
                        <Eye size={17} />
                      </button>

                      <button
                        type="button"
                        className="document-action download"
                        onClick={() =>
                          handleDownload(
                            document
                          )
                        }
                        title="Download document"
                      >
                        <Download size={17} />
                      </button>

                      <button
                        type="button"
                        className="document-action delete"
                        onClick={() =>
                          handleDelete(
                            document
                          )
                        }
                        disabled={isDeleting}
                        title="Delete document"
                      >
                        {isDeleting ? (
                          <span className="mini-spinner" />
                        ) : (
                          <Trash2 size={17} />
                        )}
                      </button>

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
