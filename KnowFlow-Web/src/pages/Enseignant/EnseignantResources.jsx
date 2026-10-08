import React, { useCallback, useEffect, useMemo, useState } from "react";
import {
  RefreshCw,
  Search,
  FileText,
  File,
  FileType,
  Download,
  Trash2,
  Upload,
  AlertCircle,
  CheckCircle2,
  HardDrive,
  Database,
  X,
  Loader2,
} from "lucide-react";

import { useNavigate } from "react-router-dom";

import "./EnseignantResources.css";


// =====================================================
// CONFIG
// =====================================================

const DOCUMENT_API = "http://localhost:5260";

const DOCUMENT_ENDPOINT = `${DOCUMENT_API}/api/Document`;


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
// NORMALIZE DOCUMENT
// =====================================================

function normalizeDocument(item, index = 0) {
  if (!item || typeof item !== "object") {
    return null;
  }

  const id =
    item.id ??
    item.Id ??
    item.documentId ??
    item.DocumentId ??
    item.documentID ??
    item.DocumentID ??
    item.fileId ??
    item.FileId ??
    index;

  const name =
    item.fileName ??
    item.FileName ??
    item.name ??
    item.Name ??
    item.title ??
    item.Title ??
    item.originalFileName ??
    item.OriginalFileName ??
    `Document ${index + 1}`;

  const extensionFromName =
    String(name).includes(".")
      ? String(name).split(".").pop().toLowerCase()
      : "";

  const rawType =
    item.fileType ??
    item.FileType ??
    item.contentType ??
    item.ContentType ??
    item.mimeType ??
    item.MimeType ??
    item.type ??
    item.Type ??
    extensionFromName;

  const type = String(rawType || "")
    .toLowerCase()
    .replace(".", "");

  let normalizedType = "OTHER";

  if (
    type.includes("pdf") ||
    type === "application/pdf"
  ) {
    normalizedType = "PDF";
  } else if (
    type.includes("doc") ||
    type.includes("word") ||
    type === "docx" ||
    type === "application/msword" ||
    type ===
      "application/vnd.openxmlformats-officedocument.wordprocessingml.document"
  ) {
    normalizedType = "DOCX";
  } else if (
    type.includes("txt") ||
    type.includes("text/plain")
  ) {
    normalizedType = "TXT";
  }

  const size =
    item.fileSize ??
    item.FileSize ??
    item.size ??
    item.Size ??
    item.length ??
    item.Length ??
    0;

  const createdAt =
    item.createdAt ??
    item.CreatedAt ??
    item.uploadedAt ??
    item.UploadedAt ??
    item.createdDate ??
    item.CreatedDate ??
    item.dateCreated ??
    item.DateCreated ??
    null;

  const downloadUrl =
    item.downloadUrl ??
    item.DownloadUrl ??
    item.url ??
    item.Url ??
    item.fileUrl ??
    item.FileUrl ??
    null;

  return {
    id,
    name: String(name),
    type: normalizedType,
    size: Number(size) || 0,
    createdAt,
    downloadUrl,
    raw: item,
  };
}


// =====================================================
// RESPONSE EXTRACTION
// =====================================================

function extractDocuments(data) {
  if (Array.isArray(data)) {
    return data;
  }

  if (!data || typeof data !== "object") {
    return [];
  }

  const candidates = [
    data.documents,
    data.Documents,
    data.items,
    data.Items,
    data.data,
    data.Data,
    data.results,
    data.Results,
  ];

  for (const candidate of candidates) {
    if (Array.isArray(candidate)) {
      return candidate;
    }
  }

  // Single document response
  if (
    data.id ||
    data.Id ||
    data.documentId ||
    data.DocumentId
  ) {
    return [data];
  }

  return [];
}


// =====================================================
// FORMAT SIZE
// =====================================================

function formatSize(bytes) {
  const value = Number(bytes) || 0;

  if (value <= 0) {
    return "0 KB";
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

  return `${(value / (1024 * 1024 * 1024)).toFixed(1)} GB`;
}


// =====================================================
// FORMAT DATE
// =====================================================

function formatDate(value) {
  if (!value) {
    return "Unknown date";
  }

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return "Unknown date";
  }

  return date.toLocaleDateString("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}


// =====================================================
// DOCUMENT ICON
// =====================================================

function DocumentIcon({ type }) {
  if (type === "PDF") {
    return (
      <div className="resource-icon resource-icon-pdf">
        <FileText size={23} />
      </div>
    );
  }

  if (type === "DOCX") {
    return (
      <div className="resource-icon resource-icon-docx">
        <FileType size={23} />
      </div>
    );
  }

  if (type === "TXT") {
    return (
      <div className="resource-icon resource-icon-txt">
        <File size={23} />
      </div>
    );
  }

  return (
    <div className="resource-icon resource-icon-other">
      <File size={23} />
    </div>
  );
}


// =====================================================
// MAIN COMPONENT
// =====================================================

export default function EnseignantResources() {
  const navigate = useNavigate();

  const [documents, setDocuments] = useState([]);

  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const [error, setError] = useState("");

  const [search, setSearch] = useState("");

  const [filter, setFilter] = useState("ALL");

  const [deletingId, setDeletingId] = useState(null);

  const [downloadingId, setDownloadingId] = useState(null);

  const [deleteTarget, setDeleteTarget] = useState(null);

  const [successMessage, setSuccessMessage] =
    useState("");


  // ===================================================
  // FETCH DOCUMENTS
  // ===================================================

  const fetchDocuments = useCallback(
    async (isRefresh = false) => {
      const token = getToken();

      if (!token) {
        setDocuments([]);
        setError(
          "Your session has expired. Please log in again."
        );
        setLoading(false);
        setRefreshing(false);
        return;
      }

      if (isRefresh) {
        setRefreshing(true);
      } else {
        setLoading(true);
      }

      setError("");

      try {
        const response = await fetch(
          DOCUMENT_ENDPOINT,
          {
            method: "GET",
            headers: {
              Authorization: `Bearer ${token}`,
              Accept: "application/json",
            },
          }
        );

        // -----------------------------------------------
        // AUTH ERROR
        // -----------------------------------------------

        if (response.status === 401) {
          throw new Error(
            "Your session has expired. Please log in again."
          );
        }

        if (response.status === 403) {
          throw new Error(
            "You do not have permission to access these resources."
          );
        }

        // -----------------------------------------------
        // SERVER ERROR
        // -----------------------------------------------

        if (!response.ok) {
          let serverMessage = "";

          try {
            const errorData =
              await response.json();

            serverMessage =
              errorData?.message ||
              errorData?.Message ||
              errorData?.error ||
              errorData?.Error ||
              "";
          } catch {
            // Ignore invalid JSON
          }

          throw new Error(
            serverMessage ||
              `DocumentService returned ${response.status}.`
          );
        }

        // -----------------------------------------------
        // EMPTY RESPONSE
        // -----------------------------------------------

        const data = await response.json();

        const rawDocuments =
          extractDocuments(data);

        const normalized =
          rawDocuments
            .map((item, index) =>
              normalizeDocument(item, index)
            )
            .filter(Boolean);

        setDocuments(normalized);

        console.log(
          "KnowFlow - documents loaded:",
          normalized
        );
      } catch (err) {
        console.error(
          "KnowFlow - DocumentService error:",
          err
        );

        setDocuments([]);

        if (
          err?.message?.includes(
            "Failed to fetch"
          )
        ) {
          setError(
            "Unable to connect to DocumentService. Make sure it is running on http://localhost:7288."
          );
        } else {
          setError(
            err?.message ||
              "Unable to load your teaching resources."
          );
        }
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
    fetchDocuments(false);
  }, [fetchDocuments]);


  // ===================================================
  // SUCCESS MESSAGE
  // ===================================================

  useEffect(() => {
    if (!successMessage) {
      return;
    }

    const timer = setTimeout(() => {
      setSuccessMessage("");
    }, 3500);

    return () => clearTimeout(timer);
  }, [successMessage]);


  // ===================================================
  // FILTER DOCUMENTS
  // ===================================================

  const filteredDocuments = useMemo(() => {
    const query = search.trim().toLowerCase();

    return documents.filter((document) => {
      const matchesFilter =
        filter === "ALL" ||
        document.type === filter;

      const matchesSearch =
        !query ||
        document.name
          .toLowerCase()
          .includes(query);

      return (
        matchesFilter &&
        matchesSearch
      );
    });
  }, [documents, filter, search]);


  // ===================================================
  // STATISTICS
  // ===================================================

  const statistics = useMemo(() => {
    const pdf = documents.filter(
      (item) => item.type === "PDF"
    ).length;

    const docx = documents.filter(
      (item) => item.type === "DOCX"
    ).length;

    const txt = documents.filter(
      (item) => item.type === "TXT"
    ).length;

    const totalBytes = documents.reduce(
      (sum, item) => sum + item.size,
      0
    );

    return {
      total: documents.length,
      pdf,
      docx,
      txt,
      totalBytes,
    };
  }, [documents]);


  // ===================================================
  // DOWNLOAD
  // ===================================================

  const handleDownload = async (document) => {
    const token = getToken();

    if (!token) {
      setError(
        "Your session has expired. Please log in again."
      );
      return;
    }

    try {
      setDownloadingId(document.id);
      setError("");

      // -----------------------------------------------
      // If backend gives a direct URL
      // -----------------------------------------------

      if (document.downloadUrl) {
        const response = await fetch(
          document.downloadUrl,
          {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          }
        );

        if (!response.ok) {
          throw new Error(
            `Download failed (${response.status}).`
          );
        }

        const blob =
          await response.blob();

        const url =
          window.URL.createObjectURL(blob);

        const anchor =
          document.createElement("a");

        anchor.href = url;
        anchor.download = document.name;

        document.body.appendChild(anchor);
        anchor.click();
        anchor.remove();

        window.URL.revokeObjectURL(url);

        return;
      }

      // -----------------------------------------------
      // Default download endpoint
      // -----------------------------------------------

      const response = await fetch(
        `${DOCUMENT_ENDPOINT}/${encodeURIComponent(
          document.id
        )}/download`,
        {
          method: "GET",
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      if (response.status === 401) {
        throw new Error(
          "Your session has expired. Please log in again."
        );
      }

      if (!response.ok) {
        throw new Error(
          `Download failed (${response.status}).`
        );
      }

      const blob =
        await response.blob();

      const url =
        window.URL.createObjectURL(blob);

      const anchor =
        window.document.createElement("a");

      anchor.href = url;
      anchor.download = document.name;

      window.document.body.appendChild(
        anchor
      );

      anchor.click();

      anchor.remove();

      window.URL.revokeObjectURL(url);
    } catch (err) {
      console.error(
        "Download error:",
        err
      );

      setError(
        err?.message ||
          "Unable to download this document."
      );
    } finally {
      setDownloadingId(null);
    }
  };


  // ===================================================
  // DELETE
  // ===================================================

  const handleDelete = async () => {
    if (!deleteTarget) {
      return;
    }

    const token = getToken();

    if (!token) {
      setError(
        "Your session has expired. Please log in again."
      );
      setDeleteTarget(null);
      return;
    }

    try {
      setDeletingId(deleteTarget.id);
      setError("");

      const response = await fetch(
        `${DOCUMENT_ENDPOINT}/${encodeURIComponent(
          deleteTarget.id
        )}`,
        {
          method: "DELETE",
          headers: {
            Authorization: `Bearer ${token}`,
            Accept: "application/json",
          },
        }
      );

      if (response.status === 401) {
        throw new Error(
          "Your session has expired. Please log in again."
        );
      }

      if (response.status === 403) {
        throw new Error(
          "You do not have permission to delete this document."
        );
      }

      if (!response.ok) {
        throw new Error(
          `Delete failed (${response.status}).`
        );
      }

      setDocuments((current) =>
        current.filter(
          (item) =>
            item.id !== deleteTarget.id
        )
      );

      setSuccessMessage(
        `"${deleteTarget.name}" was deleted successfully.`
      );

      setDeleteTarget(null);
    } catch (err) {
      console.error(
        "Delete error:",
        err
      );

      setError(
        err?.message ||
          "Unable to delete this document."
      );
    } finally {
      setDeletingId(null);
    }
  };


  // ===================================================
  // UPLOAD
  // ===================================================

  const goToUpload = () => {
    navigate(
      "/dashboard/enseignant/upload"
    );
  };


  // ===================================================
  // RENDER
  // ===================================================

  return (
    <div className="enseignant-resources-page">

      {/* =================================================
          HEADER
      ================================================= */}

      <div className="resources-header">

        <div>
          <div className="eyebrow">
            <span className="eyebrow-dot" />
            TEACHING KNOWLEDGE
          </div>

          <h1>
            My Resources
          </h1>

          <p>
            Manage and explore your teaching
            knowledge in one intelligent workspace.
          </p>
        </div>

        <div className="header-actions">

          <button
            type="button"
            className="refresh-btn"
            onClick={() =>
              fetchDocuments(true)
            }
            disabled={
              loading || refreshing
            }
          >
            <RefreshCw
              size={18}
              className={
                refreshing
                  ? "spin"
                  : ""
              }
            />

            {refreshing
              ? "Refreshing..."
              : "Refresh"}
          </button>

          <button
            type="button"
            className="upload-btn"
            onClick={goToUpload}
          >
            <Upload size={18} />
            Upload Material
          </button>

        </div>
      </div>


      {/* =================================================
          SUCCESS
      ================================================= */}

      {successMessage && (
        <div className="status-message success-message">
          <CheckCircle2 size={18} />
          <span>{successMessage}</span>

          <button
            type="button"
            onClick={() =>
              setSuccessMessage("")
            }
          >
            <X size={16} />
          </button>
        </div>
      )}


      {/* =================================================
          ERROR
      ================================================= */}

      {error && (
        <div className="status-message error-message">

          <AlertCircle size={18} />

          <div>
            <strong>
              Unable to load resources
            </strong>

            <span>
              {error}
            </span>
          </div>

          <button
            type="button"
            onClick={() => setError("")}
          >
            <X size={16} />
          </button>

        </div>
      )}


      {/* =================================================
          KNOWFLOW BANNER
      ================================================= */}

      <div className="knowledge-banner">

        <div className="knowledge-banner-icon">
          <Database size={25} />
        </div>

        <div className="knowledge-banner-content">

          <div className="knowledge-label">
            KNOWFLOW AI
          </div>

          <h2>
            Your teaching knowledge,
            intelligently organized.
          </h2>

          <p>
            Your documents can be explored through
            semantic search and AI-powered questions.
          </p>

        </div>

        <div className="engine-status">
          <span className="status-pulse" />
          AI Engine Online
        </div>

      </div>


      {/* =================================================
          STATISTICS
      ================================================= */}

      <div className="resource-stats">

        <div className="stat-card">

          <div className="stat-icon total">
            <Database size={20} />
          </div>

          <div>
            <span className="stat-label">
              Total resources
            </span>

            <strong>
              {loading
                ? "—"
                : statistics.total}
            </strong>
          </div>

        </div>


        <div className="stat-card">

          <div className="stat-icon pdf">
            <FileText size={20} />
          </div>

          <div>
            <span className="stat-label">
              PDF documents
            </span>

            <strong>
              {loading
                ? "—"
                : statistics.pdf}
            </strong>
          </div>

        </div>


        <div className="stat-card">

          <div className="stat-icon docx">
            <FileType size={20} />
          </div>

          <div>
            <span className="stat-label">
              DOCX / TXT
            </span>

            <strong>
              {loading
                ? "—"
                : statistics.docx +
                  statistics.txt}
            </strong>
          </div>

        </div>


        <div className="stat-card">

          <div className="stat-icon size">
            <HardDrive size={20} />
          </div>

          <div>
            <span className="stat-label">
              Knowledge size
            </span>

            <strong>
              {loading
                ? "—"
                : formatSize(
                    statistics.totalBytes
                  )}
            </strong>
          </div>

        </div>

      </div>


      {/* =================================================
          TOOLBAR
      ================================================= */}

      <div className="library-section">

        <div className="library-toolbar">

          <div className="library-title">

            <div>
              <span className="section-kicker">
                YOUR KNOWLEDGE LIBRARY
              </span>

              <h2>
                Teaching Resources
              </h2>

              <p>
                {loading
                  ? "Loading resources..."
                  : `${filteredDocuments.length} ${
                      filteredDocuments.length === 1
                        ? "resource"
                        : "resources"
                    }`}
              </p>
            </div>

          </div>


          <div className="toolbar-controls">

            {/* SEARCH */}

            <div className="resource-search">

              <Search size={17} />

              <input
                type="text"
                placeholder="Search resources..."
                value={search}
                onChange={(e) =>
                  setSearch(
                    e.target.value
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
                  <X size={15} />
                </button>
              )}

            </div>


            {/* FILTERS */}

            <div className="filters">

              {[
                ["ALL", "All"],
                ["PDF", "PDF"],
                ["DOCX", "DOCX"],
                ["TXT", "TXT"],
              ].map(([value, label]) => (
                <button
                  key={value}
                  type="button"
                  className={
                    filter === value
                      ? "active"
                      : ""
                  }
                  onClick={() =>
                    setFilter(value)
                  }
                >
                  {label}
                </button>
              ))}

            </div>

          </div>
        </div>


        {/* =================================================
            LOADING
        ================================================= */}

        {loading && (
          <div className="resources-loading">

            <div className="loading-spinner">
              <Loader2
                size={27}
                className="spin"
              />
            </div>

            <h3>
              Loading your knowledge...
            </h3>

            <p>
              Connecting to the KnowFlow document
              service.
            </p>

            <div className="skeleton-list">

              <div className="skeleton-row" />
              <div className="skeleton-row" />
              <div className="skeleton-row" />

            </div>

          </div>
        )}


        {/* =================================================
            EMPTY
        ================================================= */}

        {!loading &&
          !error &&
          documents.length === 0 && (
            <div className="empty-state">

              <div className="empty-icon">
                <Database size={32} />
              </div>

              <h3>
                No teaching resources yet
              </h3>

              <p>
                Upload your first teaching material
                to start building your intelligent
                knowledge library.
              </p>

              <button
                type="button"
                className="empty-upload-btn"
                onClick={goToUpload}
              >
                <Upload size={18} />
                Upload teaching material
              </button>

            </div>
          )}


        {/* =================================================
            NO SEARCH RESULTS
        ================================================= */}

        {!loading &&
          !error &&
          documents.length > 0 &&
          filteredDocuments.length === 0 && (
            <div className="empty-state compact">

              <div className="empty-icon">
                <Search size={29} />
              </div>

              <h3>
                No matching resources
              </h3>

              <p>
                Try another search term or
                change the selected file type.
              </p>

              <button
                type="button"
                className="clear-filter-btn"
                onClick={() => {
                  setSearch("");
                  setFilter("ALL");
                }}
              >
                Clear filters
              </button>

            </div>
          )}


        {/* =================================================
            RESOURCE LIST
        ================================================= */}

        {!loading &&
          !error &&
          filteredDocuments.length > 0 && (
            <div className="resource-list">

              {filteredDocuments.map(
                (document) => (
                  <div
                    className="resource-row"
                    key={String(
                      document.id
                    )}
                  >

                    <DocumentIcon
                      type={document.type}
                    />

                    <div className="resource-main">

                      <div className="resource-name">
                        {document.name}
                      </div>

                      <div className="resource-meta">

                        <span
                          className={`file-badge ${document.type.toLowerCase()}`}
                        >
                          {document.type}
                        </span>

                        <span>
                          {formatSize(
                            document.size
                          )}
                        </span>

                        <span className="meta-dot">
                          •
                        </span>

                        <span>
                          {formatDate(
                            document.createdAt
                          )}
                        </span>

                      </div>

                    </div>


                    <div className="resource-actions">

                      <button
                        type="button"
                        className="icon-action download"
                        title="Download"
                        onClick={() =>
                          handleDownload(
                            document
                          )
                        }
                        disabled={
                          downloadingId ===
                          document.id
                        }
                      >

                        {downloadingId ===
                        document.id ? (
                          <Loader2
                            size={18}
                            className="spin"
                          />
                        ) : (
                          <Download
                            size={18}
                          />
                        )}

                      </button>


                      <button
                        type="button"
                        className="icon-action delete"
                        title="Delete"
                        onClick={() =>
                          setDeleteTarget(
                            document
                          )
                        }
                        disabled={
                          deletingId ===
                          document.id
                        }
                      >
                        <Trash2 size={18} />
                      </button>

                    </div>

                  </div>
                )
              )}

            </div>
          )}

      </div>


      {/* =================================================
          DELETE MODAL
      ================================================= */}

      {deleteTarget && (
        <div
          className="modal-overlay"
          onMouseDown={() =>
            setDeleteTarget(null)
          }
        >

          <div
            className="delete-modal"
            onMouseDown={(e) =>
              e.stopPropagation()
            }
          >

            <div className="delete-modal-icon">
              <Trash2 size={23} />
            </div>

            <h3>
              Delete resource?
            </h3>

            <p>
              Are you sure you want to delete
              <strong>
                {" "}
                {deleteTarget.name}
              </strong>
              ?
              <br />
              This action cannot be undone.
            </p>

            <div className="modal-actions">

              <button
                type="button"
                className="cancel-btn"
                onClick={() =>
                  setDeleteTarget(null)
                }
                disabled={Boolean(
                  deletingId
                )}
              >
                Cancel
              </button>

              <button
                type="button"
                className="confirm-delete-btn"
                onClick={handleDelete}
                disabled={Boolean(
                  deletingId
                )}
              >

                {deletingId ? (
                  <>
                    <Loader2
                      size={17}
                      className="spin"
                    />

                    Deleting...
                  </>
                ) : (
                  <>
                    <Trash2 size={17} />
                    Delete
                  </>
                )}

              </button>

            </div>

          </div>

        </div>
      )}

    </div>
  );
}