
import { useEffect, useMemo, useState } from "react";

import {
  Search,
  FileText,
  File,
  FileType2,
  CalendarDays,
  HardDrive,
  Eye,
  Trash2,
  RefreshCw,
  Sparkles,
  Brain,
  Database,
  CheckCircle2,
  AlertCircle,
  X,
  Loader2,
  ChevronRight,
} from "lucide-react";

import "./Documents.css";

// ⚠️ بدلي المسار إذا AuthContext موجود في مكان آخر
import { useAuth } from "../context/AuthContext";

const DOCUMENT_SERVICE_URL = "http://localhost:5260";

export default function Documents() {
  // =========================================================
  // AUTH
  // =========================================================

  const { getToken } = useAuth();

  // =========================================================
  // STATE
  // =========================================================

  const [documents, setDocuments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const [searchQuery, setSearchQuery] = useState("");
  const [filterType, setFilterType] = useState("all");

  const [selectedDocument, setSelectedDocument] = useState(null);

  const [deletingId, setDeletingId] = useState(null);

  const [error, setError] = useState("");

  // =========================================================
  // LOAD DOCUMENTS
  // =========================================================

  const loadDocuments = async (isRefresh = false) => {
    try {
      if (isRefresh) {
        setRefreshing(true);
      } else {
        setLoading(true);
      }

      setError("");

      // -----------------------------------------------------
      // GET JWT
      // -----------------------------------------------------

      const token = getToken();

      console.log(
        "🔐 Documents - Token:",
        token ? "FOUND" : "NOT FOUND"
      );

      if (!token) {
        throw new Error(
          "Authentication token not found. Please login again."
        );
      }

      // -----------------------------------------------------
      // REQUEST
      // -----------------------------------------------------

      const response = await fetch(
        `${DOCUMENT_SERVICE_URL}/api/Document`,
        {
          method: "GET",

          headers: {
            Accept: "application/json",
            Authorization: `Bearer ${token}`,
          },
        }
      );

      console.log(
        "📡 DocumentService status:",
        response.status
      );

      // -----------------------------------------------------
      // ERROR
      // -----------------------------------------------------

      if (!response.ok) {
        const responseText = await response.text();

        console.error(
          "❌ DocumentService response:",
          responseText
        );

        if (response.status === 401) {
          throw new Error(
            "Unauthorized (401). Your authentication token was rejected by DocumentService."
          );
        }

        throw new Error(
          responseText ||
            `Unable to load documents (${response.status})`
        );
      }

      // -----------------------------------------------------
      // JSON
      // -----------------------------------------------------

      const data = await response.json();

      console.log(
        "📄 Documents loaded:",
        data
      );

      setDocuments(
        Array.isArray(data)
          ? data
          : []
      );
    } catch (err) {
      console.error(
        "❌ Documents loading error:",
        err
      );

      setError(
        err.message ||
          "Unable to load documents. Check DocumentService."
      );
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  // =========================================================
  // INITIAL LOAD
  // =========================================================

  useEffect(() => {
    loadDocuments();
  }, []);

  // =========================================================
  // FORMAT SIZE
  // =========================================================

  const formatFileSize = (bytes) => {
    if (!bytes || bytes <= 0) {
      return "0 KB";
    }

    const kb = bytes / 1024;

    if (kb < 1024) {
      return `${kb.toFixed(1)} KB`;
    }

    const mb = kb / 1024;

    if (mb < 1024) {
      return `${mb.toFixed(2)} MB`;
    }

    const gb = mb / 1024;

    return `${gb.toFixed(2)} GB`;
  };

  // =========================================================
  // FORMAT DATE
  // =========================================================

  const formatDate = (date) => {
    if (!date) {
      return "Unknown date";
    }

    try {
      return new Date(date).toLocaleDateString(
        "en-US",
        {
          day: "2-digit",
          month: "short",
          year: "numeric",
        }
      );
    } catch {
      return "Unknown date";
    }
  };

  // =========================================================
  // GET EXTENSION
  // =========================================================

  const getExtension = (fileName = "") => {
    const parts = fileName.split(".");

    if (parts.length < 2) {
      return "FILE";
    }

    return parts.pop().toUpperCase();
  };

  // =========================================================
  // GET FILE ICON
  // =========================================================

  const getFileIcon = (fileName = "") => {
    const extension = getExtension(fileName);

    if (extension === "PDF") {
      return <FileText />;
    }

    if (
      extension === "DOCX" ||
      extension === "DOC"
    ) {
      return <FileType2 />;
    }

    if (extension === "TXT") {
      return <File />;
    }

    return <FileText />;
  };

  // =========================================================
  // FILTER DOCUMENTS
  // =========================================================

  const filteredDocuments = useMemo(() => {
    return documents.filter((document) => {
      const name =
        document.fileName?.toLowerCase() || "";

      const extension =
        getExtension(
          document.fileName
        ).toLowerCase();

      const query =
        searchQuery
          .toLowerCase()
          .trim();

      const matchesSearch =
        !query ||
        name.includes(query);

      const matchesType =
        filterType === "all" ||
        extension ===
          filterType.toLowerCase();

      return (
        matchesSearch &&
        matchesType
      );
    });
  }, [
    documents,
    searchQuery,
    filterType,
  ]);

  // =========================================================
  // STATISTICS
  // =========================================================

  const totalDocuments =
    documents.length;

  const pdfDocuments =
    documents.filter(
      (document) =>
        getExtension(
          document.fileName
        ) === "PDF"
    ).length;

  const wordDocuments =
    documents.filter(
      (document) => {
        const extension =
          getExtension(
            document.fileName
          );

        return (
          extension === "DOCX" ||
          extension === "DOC"
        );
      }
    ).length;

  const totalSize =
    documents.reduce(
      (total, document) =>
        total +
        (document.fileSize || 0),
      0
    );

  // =========================================================
  // OPEN DOCUMENT
  // =========================================================

  const handleOpenDocument = async (
    document
  ) => {
    if (!document?.fileName) {
      return;
    }

    try {
      const token = getToken();

      if (!token) {
        throw new Error(
          "Authentication token not found. Please login again."
        );
      }

      const fileUrl =
        `${DOCUMENT_SERVICE_URL}/api/Document/file/` +
        encodeURIComponent(
          document.fileName
        );

      const response = await fetch(
        fileUrl,
        {
          method: "GET",
          headers: {
            Authorization:
              `Bearer ${token}`,
          },
        }
      );

      if (!response.ok) {
        if (
          response.status === 401
        ) {
          throw new Error(
            "Unauthorized (401). DocumentService rejected your token."
          );
        }

        throw new Error(
          `Unable to open document (${response.status})`
        );
      }

      const blob =
        await response.blob();

      const blobUrl =
        URL.createObjectURL(blob);

      window.open(
        blobUrl,
        "_blank",
        "noopener,noreferrer"
      );

      // Cleanup after a while
      setTimeout(() => {
        URL.revokeObjectURL(
          blobUrl
        );
      }, 60000);
    } catch (err) {
      console.error(
        "❌ Open document error:",
        err
      );

      setError(
        err.message ||
          "Unable to open document."
      );
    }
  };

  // =========================================================
  // DELETE DOCUMENT
  // =========================================================

  const handleDelete = async (
    document
  ) => {
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

    try {
      setDeletingId(
        document.id
      );

      setError("");

      const token =
        getToken();

      if (!token) {
        throw new Error(
          "Authentication token not found. Please login again."
        );
      }

      const response =
        await fetch(
          `${DOCUMENT_SERVICE_URL}/api/Document/${document.id}`,
          {
            method: "DELETE",

            headers: {
              Accept:
                "application/json",

              Authorization:
                `Bearer ${token}`,
            },
          }
        );

      const responseText =
        await response.text();

      if (!response.ok) {
        if (
          response.status === 401
        ) {
          throw new Error(
            "Unauthorized (401). DocumentService rejected your token."
          );
        }

        throw new Error(
          responseText ||
            `Delete failed (${response.status})`
        );
      }

      setDocuments(
        (previousDocuments) =>
          previousDocuments.filter(
            (item) =>
              item.id !==
              document.id
          )
      );

      if (
        selectedDocument?.id ===
        document.id
      ) {
        setSelectedDocument(
          null
        );
      }
    } catch (err) {
      console.error(
        "❌ Delete document error:",
        err
      );

      setError(
        err.message ||
          "Unable to delete the document."
      );
    } finally {
      setDeletingId(null);
    }
  };

  // =========================================================
  // LOADING
  // =========================================================

  if (loading) {
    return (
      <div className="documents-page">
        <div className="documents-loading">

          <div className="loading-orb">
            <Brain />
          </div>

          <h2>
            Loading your knowledge...
          </h2>

          <p>
            KnowFlow AI is retrieving
            your documents.
          </p>

          <Loader2
            className="loading-spinner"
          />

        </div>
      </div>
    );
  }

  // =========================================================
  // RENDER
  // =========================================================

  return (
    <div className="documents-page">

      {/* =====================================================
          HEADER
      ===================================================== */}

      <header className="documents-header">

        <div className="documents-title-area">

          <div className="documents-title-icon">
            <Brain />
          </div>

          <div>

            <div className="title-label">
              <Sparkles />
              KNOWLEDGE CENTER
            </div>

            <h1>
              Your Documents
            </h1>

            <p>
              Manage, explore and interact
              with your intelligent knowledge base.
            </p>

          </div>

        </div>

        <button
          className="refresh-button"
          onClick={() =>
            loadDocuments(true)
          }
          disabled={refreshing}
        >
          <RefreshCw
            className={
              refreshing
                ? "refresh-spin"
                : ""
            }
          />

          {refreshing
            ? "Refreshing..."
            : "Refresh"}
        </button>

      </header>

      {/* =====================================================
          AI STATUS
      ===================================================== */}

      <div className="ai-banner">

        <div className="ai-banner-icon">
          <Sparkles />
        </div>

        <div className="ai-banner-content">

          <strong>
            AI Knowledge Base
          </strong>

          <span>
            Your documents are ready for
            semantic search and AI-powered
            understanding.
          </span>

        </div>

        <div className="ai-ready">
          <span className="status-dot" />
          AI READY
        </div>

      </div>

      {/* =====================================================
          STATS
      ===================================================== */}

      <section className="documents-stats">

        <div className="stat-card">

          <div className="stat-icon purple">
            <Database />
          </div>

          <div>
            <span>
              Total Documents
            </span>

            <strong>
              {totalDocuments}
            </strong>

            <small>
              Knowledge items
            </small>
          </div>

        </div>

        <div className="stat-card">

          <div className="stat-icon blue">
            <FileText />
          </div>

          <div>
            <span>
              PDF Documents
            </span>

            <strong>
              {pdfDocuments}
            </strong>

            <small>
              PDF knowledge files
            </small>
          </div>

        </div>

        <div className="stat-card">

          <div className="stat-icon cyan">
            <FileType2 />
          </div>

          <div>
            <span>
              Word Documents
            </span>

            <strong>
              {wordDocuments}
            </strong>

            <small>
              DOCX files
            </small>
          </div>

        </div>

        <div className="stat-card">

          <div className="stat-icon green">
            <HardDrive />
          </div>

          <div>
            <span>
              Storage Used
            </span>

            <strong>
              {formatFileSize(
                totalSize
              )}
            </strong>

            <small>
              Uploaded content
            </small>
          </div>

        </div>

      </section>

      {/* =====================================================
          SEARCH + FILTER
      ===================================================== */}

      <section className="documents-toolbar">

        <div className="documents-search">

          <Search />

          <input
            type="text"
            placeholder="Search your knowledge..."
            value={searchQuery}
            onChange={(event) =>
              setSearchQuery(
                event.target.value
              )
            }
          />

          {searchQuery && (
            <button
              className="clear-search"
              onClick={() =>
                setSearchQuery("")
              }
            >
              <X />
            </button>
          )}

        </div>

        <div className="document-filters">

          <button
            className={
              filterType === "all"
                ? "active"
                : ""
            }
            onClick={() =>
              setFilterType("all")
            }
          >
            All
          </button>

          <button
            className={
              filterType === "pdf"
                ? "active"
                : ""
            }
            onClick={() =>
              setFilterType("pdf")
            }
          >
            PDF
          </button>

          <button
            className={
              filterType === "docx"
                ? "active"
                : ""
            }
            onClick={() =>
              setFilterType("docx")
            }
          >
            DOCX
          </button>

          <button
            className={
              filterType === "txt"
                ? "active"
                : ""
            }
            onClick={() =>
              setFilterType("txt")
            }
          >
            TXT
          </button>

        </div>

      </section>

      {/* =====================================================
          ERROR
      ===================================================== */}

      {error && (
        <div className="documents-error">

          <AlertCircle />

          <span>
            {error}
          </span>

          <button
            onClick={() =>
              setError("")
            }
          >
            <X />
          </button>

        </div>
      )}

      {/* =====================================================
          RESULTS HEADER
      ===================================================== */}

      <div className="results-header">

        <div>

          <span className="results-eyebrow">
            DOCUMENT LIBRARY
          </span>

          <h2>
            {filteredDocuments.length}{" "}
            {filteredDocuments.length === 1
              ? "document"
              : "documents"}
          </h2>

        </div>

        <div className="results-info">
          <CheckCircle2 />
          Secure knowledge storage
        </div>

      </div>

      {/* =====================================================
          EMPTY STATE
      ===================================================== */}

      {filteredDocuments.length === 0 ? (

        <div className="documents-empty">

          <div className="empty-icon">
            <Database />
          </div>

          <h2>
            {documents.length === 0
              ? "Your knowledge base is empty"
              : "No documents found"}
          </h2>

          <p>
            {documents.length === 0
              ? "Upload your first document to start building your AI-powered knowledge base."
              : "Try another search term or change the document filter."}
          </p>

        </div>

      ) : (

        /* ===================================================
           DOCUMENT GRID
        =================================================== */

        <section className="documents-grid">

          {filteredDocuments.map(
            (document) => {

              const extension =
                getExtension(
                  document.fileName
                );

              return (

                <article
                  className="document-card"
                  key={document.id}
                >

                  {/* CARD TOP */}

                  <div className="document-card-top">

                    <div className="file-icon">

                      {getFileIcon(
                        document.fileName
                      )}

                      <span>
                        {extension}
                      </span>

                    </div>

                    <div className="document-card-actions">

                      <button
                        title="Open document"
                        onClick={() =>
                          handleOpenDocument(
                            document
                          )
                        }
                      >
                        <Eye />
                      </button>

                      <button
                        className="delete-action"
                        title="Delete document"
                        disabled={
                          deletingId ===
                          document.id
                        }
                        onClick={() =>
                          handleDelete(
                            document
                          )
                        }
                      >

                        {deletingId ===
                        document.id ? (

                          <Loader2
                            className="loading-spinner"
                          />

                        ) : (

                          <Trash2 />

                        )}

                      </button>

                    </div>

                  </div>

                  {/* FILE NAME */}

                  <div className="document-card-body">

                    <h3
                      title={
                        document.fileName
                      }
                    >
                      {document.fileName}
                    </h3>

                    <p>
                      {document.summary
                        ? document.summary
                        : "No AI summary available yet."}
                    </p>

                  </div>

                  {/* META */}

                  <div className="document-meta">

                    <div>
                      <HardDrive />

                      {formatFileSize(
                        document.fileSize
                      )}
                    </div>

                    <div>
                      <CalendarDays />

                      {formatDate(
                        document.uploadedAt
                      )}
                    </div>

                  </div>

                  {/* AI STATUS */}

                  <div className="document-ai-status">

                    <div className="ai-status-left">

                      <Sparkles />

                      <span>
                        AI Indexed
                      </span>

                    </div>

                    <ChevronRight />

                  </div>

                  {/* OPEN */}

                  <button
                    className="open-document-button"
                    onClick={() =>
                      setSelectedDocument(
                        document
                      )
                    }
                  >
                    <Eye />

                    View Details

                    <ChevronRight />

                  </button>

                </article>
              );
            }
          )}

        </section>
      )}

      {/* =====================================================
          DOCUMENT DETAILS MODAL
      ===================================================== */}

      {selectedDocument && (

        <div
          className="document-modal-overlay"
          onClick={(event) => {

            if (
              event.target ===
              event.currentTarget
            ) {
              setSelectedDocument(
                null
              );
            }

          }}
        >

          <div className="document-modal">

            <div className="modal-header">

              <div className="modal-title">

                <div className="modal-file-icon">
                  {getFileIcon(
                    selectedDocument.fileName
                  )}
                </div>

                <div>

                  <span>
                    {getExtension(
                      selectedDocument.fileName
                    )}
                  </span>

                  <h2>
                    {selectedDocument.fileName}
                  </h2>

                </div>

              </div>

              <button
                className="modal-close"
                onClick={() =>
                  setSelectedDocument(
                    null
                  )
                }
              >
                <X />
              </button>

            </div>

            <div className="modal-content">

              <div className="detail-grid">

                <div className="detail-item">

                  <span>
                    File size
                  </span>

                  <strong>
                    {formatFileSize(
                      selectedDocument.fileSize
                    )}
                  </strong>

                </div>

                <div className="detail-item">

                  <span>
                    File type
                  </span>

                  <strong>
                    {selectedDocument.fileType ||
                      "Unknown"}
                  </strong>

                </div>

                <div className="detail-item">

                  <span>
                    Uploaded
                  </span>

                  <strong>
                    {formatDate(
                      selectedDocument.uploadedAt
                    )}
                  </strong>

                </div>

                <div className="detail-item">

                  <span>
                    Status
                  </span>

                  <strong className="detail-success">

                    <CheckCircle2 />

                    AI Indexed

                  </strong>

                </div>

              </div>

              <div className="summary-box">

                <div className="summary-title">

                  <Sparkles />

                  <span>
                    AI Summary
                  </span>

                </div>

                <p>
                  {selectedDocument.summary ||
                    "No summary available for this document yet."}
                </p>

              </div>

              <div className="extracted-box">

                <div className="summary-title">

                  <Brain />

                  <span>
                    Extracted Knowledge
                  </span>

                </div>

                <p>
                  {selectedDocument.extractedText ||
                    "No extracted text available."}
                </p>

              </div>

            </div>

            <div className="modal-footer">

              <button
                className="modal-secondary"
                onClick={() =>
                  setSelectedDocument(
                    null
                  )
                }
              >
                Close
              </button>

              <button
                className="modal-primary"
                onClick={() =>
                  handleOpenDocument(
                    selectedDocument
                  )
                }
              >
                <Eye />
                Open Document
              </button>

            </div>

          </div>

        </div>

      )}

      {/* =====================================================
          BOTTOM AI CARD
      ===================================================== */}

      <div className="knowledge-footer">

        <div className="footer-ai-icon">
          <Brain />
        </div>

        <div>

          <strong>
            KnowFlow AI Knowledge Engine
          </strong>

          <p>
            Your documents are organized,
            indexed and ready to power
            semantic search and intelligent answers.
          </p>

        </div>

        <div className="footer-pipeline">

          <span>
            Upload
          </span>

          <ChevronRight />

          <span>
            Extract
          </span>

          <ChevronRight />

          <span>
            Embed
          </span>

          <ChevronRight />

          <span>
            Understand
          </span>

        </div>

      </div>

    </div>
  );
}