import React, { useState } from "react";
import "./Search.css";

import {
  Search as SearchIcon,
  FileText,
  File,
  X,
  Loader2,
  AlertCircle,
  Sparkles,
  Eye,
  Filter,
  Database,
  Brain,
  Zap,
} from "lucide-react";

const SEARCH_API = "http://localhost:5035";
const AI_API = "http://localhost:5057";
const DOCUMENT_API = "http://localhost:5260/api/Document";

export default function Search() {
  const [query, setQuery] = useState("");
  const [activeFilter, setActiveFilter] = useState("all");

  const [results, setResults] = useState([]);
  const [selectedDocument, setSelectedDocument] = useState(null);

  const [answer, setAnswer] = useState("");
  const [loading, setLoading] = useState(false);
  const [answerLoading, setAnswerLoading] = useState(false);

  const [error, setError] = useState("");
  const [ragError, setRagError] = useState("");

  // ============================================================
  // TOKEN
  // ============================================================

  const getToken = () => {
    return (
      localStorage.getItem("token") ||
      localStorage.getItem("accessToken") ||
      sessionStorage.getItem("token") ||
      sessionStorage.getItem("accessToken")
    );
  };

  // ============================================================
  // HELPERS
  // ============================================================

  const normalizeValue = (value) => {
    if (value === null || value === undefined) {
      return "";
    }

    return String(value);
  };

  const getFileType = (item) => {
    const fileType =
      item?.fileType ||
      item?.FileType ||
      item?.type ||
      item?.Type ||
      "";

    if (fileType) {
      return normalizeValue(fileType).toLowerCase();
    }

    const fileName =
      item?.fileName ||
      item?.FileName ||
      item?.name ||
      item?.Name ||
      "";

    const extension = fileName.includes(".")
      ? fileName.split(".").pop()
      : "";

    return extension ? extension.toLowerCase() : "file";
  };

  const getCategory = (item) => {
    const type = getFileType(item);

    if (type.includes("pdf")) {
      return "pdf";
    }

    if (type.includes("doc") || type.includes("word")) {
      return "docx";
    }

    if (type.includes("txt")) {
      return "txt";
    }

    return "other";
  };

  const getDocumentId = (item) => {
    return (
      item?.documentId ||
      item?.DocumentId ||
      item?.id ||
      item?.Id ||
      null
    );
  };

  const getFileName = (item) => {
    return (
      item?.fileName ||
      item?.FileName ||
      item?.name ||
      item?.Name ||
      "Document"
    );
  };

  const getDocumentText = (document) => {
    return (
      document?.extractedText ||
      document?.ExtractedText ||
      document?.text ||
      document?.Text ||
      document?.content ||
      document?.Content ||
      ""
    );
  };

  // ============================================================
  // SEARCH
  // ============================================================

  const handleSearch = async () => {
    const searchText = query.trim();

    if (!searchText) {
      setError("Veuillez saisir une requête de recherche.");
      return;
    }

    const token = getToken();

    if (!token) {
      setError("Session expirée. Veuillez vous reconnecter.");
      return;
    }

    setLoading(true);
    setAnswerLoading(true);

    setError("");
    setRagError("");

    setResults([]);
    setAnswer("");
    setSelectedDocument(null);

    try {
      // ========================================================
      // 1. SEMANTIC SEARCH
      // ========================================================

      console.log("🔎 Semantic search:", searchText);

      const searchUrl =
        `${SEARCH_API}/api/Search?query=${encodeURIComponent(
          searchText
        )}&limit=5`;

      console.log("🌐 Search URL:", searchUrl);

      const searchResponse = await fetch(searchUrl, {
        method: "GET",
        headers: {
          Accept: "application/json",
          Authorization: `Bearer ${token}`,
        },
      });

      console.log(
        "📡 SearchService status:",
        searchResponse.status
      );

      if (searchResponse.status === 401) {
        throw new Error(
          "Unauthorized: votre session a expiré."
        );
      }

      if (!searchResponse.ok) {
        const errorText = await searchResponse.text();

        console.error(
          "❌ SearchService error:",
          searchResponse.status,
          errorText
        );

        throw new Error(
          `SearchService returned ${searchResponse.status}`
        );
      }

      const searchData = await searchResponse.json();

      console.log("📦 Search response:", searchData);

      const rawResults = Array.isArray(searchData)
        ? searchData
        : Array.isArray(searchData?.results)
        ? searchData.results
        : [];

      console.log(
        "📚 Semantic results:",
        rawResults.length
      );

      // ========================================================
      // FORMAT RESULTS
      // ========================================================

      const formattedResults = rawResults.map(
        (item, index) => {
          const documentId = getDocumentId(item);
          const fileName = getFileName(item);
          const category = getCategory(item);

          const score =
            item?.score ??
            item?.Score ??
            item?.similarity ??
            item?.Similarity ??
            0;

          return {
            ...item,

            id: documentId || `result-${index}`,

            documentId,

            fileName,

            category,

            type: getFileType(item),

            score,

            similarity: score,

            snippet:
              item?.snippet ||
              item?.Snippet ||
              item?.text ||
              item?.Text ||
              item?.content ||
              item?.Content ||
              "Aucun extrait disponible.",

            content:
              item?.content ||
              item?.Content ||
              item?.text ||
              item?.Text ||
              "",

            fileUrl:
              item?.fileUrl ||
              item?.FileUrl ||
              item?.url ||
              item?.Url ||
              null,
          };
        }
      );

      setResults(formattedResults);

      console.log(
        "✅ Formatted results:",
        formattedResults
      );

      // ========================================================
      // NO RESULTS
      // ========================================================

      if (formattedResults.length === 0) {
        setRagError(
          "Aucun document pertinent n'a été trouvé pour cette recherche."
        );

        return;
      }

      // ========================================================
      // DOCUMENT IDS
      // ========================================================

      const documentIds = formattedResults
        .map((item) => getDocumentId(item))
        .filter(Boolean);

      console.log(
        "📄 Document IDs:",
        documentIds
      );

      if (documentIds.length === 0) {
        setRagError(
          "Les résultats ne contiennent aucun identifiant de document."
        );

        return;
      }

      // ========================================================
      // LOAD DOCUMENTS
      // ========================================================

      console.log("📥 Loading documents...");

      const documentRequests = documentIds.map(
        async (documentId) => {
          try {
            const response = await fetch(
              `${DOCUMENT_API}/${documentId}`,
              {
                method: "GET",
                headers: {
                  Accept: "application/json",
                  Authorization: `Bearer ${token}`,
                },
              }
            );

            console.log(
              `📡 Document ${documentId}:`,
              response.status
            );

            if (response.status === 401) {
              throw new Error(
                "Session expirée ou token invalide."
              );
            }

            if (response.status === 403) {
              console.warn(
                `⚠️ Access denied for document ${documentId}`
              );

              return null;
            }

            if (!response.ok) {
              console.warn(
                `⚠️ DocumentService error for ${documentId}:`,
                response.status
              );

              return null;
            }

            const data = await response.json();

            console.log(
              `📄 Document data ${documentId}:`,
              data
            );

            return data;
          } catch (documentError) {
            console.error(
              `❌ Error loading document ${documentId}:`,
              documentError
            );

            return null;
          }
        }
      );

      const documents = (
        await Promise.all(documentRequests)
      ).filter(Boolean);

      console.log(
        "📚 Documents loaded:",
        documents.length
      );

      // ========================================================
      // BUILD RAG CONTEXT
      // ========================================================

      const contextParts = documents
        .map((document) => {
          const fileName = getFileName(document);
          const text = getDocumentText(document);

          if (!text || !String(text).trim()) {
            return "";
          }

          return `
DOCUMENT: ${fileName}

${String(text).trim()}

END DOCUMENT
`;
        })
        .filter(Boolean);

      let context = contextParts.join("\n\n");

      console.log(
        "🧠 RAG context length:",
        context.length
      );

      // ========================================================
      // FALLBACK
      // ========================================================

      if (!context.trim()) {
        const resultContext = formattedResults
          .map((item) => {
            const text =
              item?.content ||
              item?.snippet ||
              "";

            if (!text || !String(text).trim()) {
              return "";
            }

            return `
DOCUMENT: ${getFileName(item)}

${String(text).trim()}
`;
          })
          .filter(Boolean)
          .join("\n\n");

        context = resultContext;
      }

      // ========================================================
      // LIMIT CONTEXT
      // ========================================================

      if (context.length > 6000) {
        context = context.substring(0, 6000);
      }

      console.log(
        "🧠 Final RAG context length:",
        context.length
      );

      if (!context.trim()) {
        setRagError(
          "Le contenu textuel des documents est indisponible."
        );

        return;
      }

      // ========================================================
      // AI SERVICE
      // ========================================================

      console.log("🤖 Calling AIService...");
      console.log("❓ Question:", searchText);

      const askResponse = await fetch(
        `${AI_API}/api/AI/ask`,
        {
          method: "POST",

          headers: {
            "Content-Type": "application/json",
            Accept: "application/json",
            Authorization: `Bearer ${token}`,
          },

          body: JSON.stringify({
            text: context,
            question: searchText,
          }),
        }
      );

      console.log(
        "📡 AIService status:",
        askResponse.status
      );

      // ========================================================
      // AI ERRORS
      // ========================================================

      if (askResponse.status === 400) {
        const errorText =
          await askResponse.text();

        console.error(
          "❌ AIService 400:",
          errorText
        );

        throw new Error(
          "Le contenu du document ou la question est invalide."
        );
      }

      if (askResponse.status === 401) {
        throw new Error(
          "Unauthorized: token invalide ou expiré."
        );
      }

      if (askResponse.status === 404) {
        throw new Error(
          "AI endpoint /api/AI/ask introuvable."
        );
      }

      if (askResponse.status === 503) {
        throw new Error(
          "AIService ne peut pas se connecter à Ollama."
        );
      }

      if (askResponse.status === 504) {
        throw new Error(
          "Ollama request timed out. Essayez une question plus courte."
        );
      }

      if (!askResponse.ok) {
        const errorText =
          await askResponse.text();

        console.error(
          "❌ AIService error:",
          askResponse.status,
          errorText
        );

        throw new Error(
          `AIService returned ${askResponse.status}`
        );
      }

      // ========================================================
      // AI RESPONSE
      // ========================================================

      const askData =
        await askResponse.json();

      console.log(
        "🧠 AI response:",
        askData
      );

      const aiAnswer =
        askData?.answer ||
        askData?.response ||
        askData?.message ||
        askData?.content ||
        askData?.result ||
        "";

      if (aiAnswer) {
        setAnswer(aiAnswer);

        console.log(
          "✅ AI answer received successfully."
        );
      } else {
        setAnswer(
          "L'IA n'a retourné aucune réponse."
        );
      }
    } catch (searchError) {
      console.error(
        "❌ Search/RAG error:",
        searchError
      );

      setError(
        searchError?.message ||
          "Une erreur est survenue pendant la recherche."
      );
    } finally {
      setLoading(false);
      setAnswerLoading(false);
    }
  };

  // ============================================================
  // ENTER
  // ============================================================

  const handleKeyDown = (event) => {
    if (event.key === "Enter") {
      event.preventDefault();
      handleSearch();
    }
  };

  // ============================================================
  // FILTER
  // ============================================================

  const filteredResults = results.filter(
    (item) => {
      if (activeFilter === "all") {
        return true;
      }

      return item.category === activeFilter;
    }
  );

  // ============================================================
  // RESET
  // ============================================================

  const handleReset = () => {
    setQuery("");
    setResults([]);
    setAnswer("");
    setSelectedDocument(null);

    setError("");
    setRagError("");

    setActiveFilter("all");
  };

  // ============================================================
  // VIEW DOCUMENT
  // ============================================================

  const handleViewDocument = async (document) => {
    const token = getToken();

    if (!token) {
      setError(
        "Session expirée. Veuillez vous reconnecter."
      );

      return;
    }

    const documentId =
      getDocumentId(document);

    if (!documentId) {
      setError(
        "Impossible d'identifier le document."
      );

      return;
    }

    try {
      console.log(
        "📄 Opening document:",
        documentId
      );

      const response = await fetch(
        `${DOCUMENT_API}/${documentId}`,
        {
          method: "GET",

          headers: {
            Accept: "application/json",
            Authorization: `Bearer ${token}`,
          },
        }
      );

      if (response.status === 401) {
        throw new Error(
          "Session expirée ou token invalide."
        );
      }

      if (response.status === 403) {
        throw new Error(
          "Vous n'avez pas accès à ce document."
        );
      }

      if (!response.ok) {
        throw new Error(
          `DocumentService returned ${response.status}`
        );
      }

      const data = await response.json();

      console.log(
        "📄 Document data:",
        data
      );

      const fileName =
        data?.fileName ||
        data?.FileName ||
        getFileName(document);

      const fileUrl =
        data?.fileUrl ||
        data?.FileUrl ||
        data?.url ||
        data?.Url;

      if (fileUrl) {
        window.open(
          fileUrl,
          "_blank",
          "noopener,noreferrer"
        );

        return;
      }

      const directFileUrl =
        `${DOCUMENT_API}/file/${encodeURIComponent(
          fileName
        )}`;

      window.open(
        directFileUrl,
        "_blank",
        "noopener,noreferrer"
      );
    } catch (viewError) {
      console.error(
        "❌ View document error:",
        viewError
      );

      setError(
        viewError?.message ||
          "Impossible d'ouvrir le document."
      );
    }
  };

  // ============================================================
  // UI
  // ============================================================

  return (
    <div className="search-page">

      {/* ======================================================
          HEADER
      ====================================================== */}

      <header className="search-header">

        <div>
          <div className="search-title-row">

            <SearchIcon size={28} />

            <h1>
              Semantic Search
            </h1>

          </div>

          <p>
            Search your knowledge base using
            semantic understanding.
          </p>
        </div>

        <div className="search-status">

          <div className="status-item">
            <Database size={16} />

            <span>
              Vector Engine Online
            </span>
          </div>

          <div className="status-item">
            <Brain size={16} />

            <span>
              Embeddings Ready
            </span>
          </div>

          <div className="status-item">
            <Zap size={16} />

            <span>
              RAG Engine Active
            </span>
          </div>

        </div>

      </header>

      {/* ======================================================
          SEARCH BOX
      ====================================================== */}

      <div className="search-box">

        <div className="search-input-wrapper">

          <SearchIcon
            className="search-input-icon"
            size={22}
          />

          <input
            type="text"
            value={query}
            onChange={(event) =>
              setQuery(event.target.value)
            }
            onKeyDown={handleKeyDown}
            placeholder="Ask your knowledge base..."
            autoComplete="off"
          />

          {query && (
            <button
              type="button"
              className="clear-search"
              onClick={() => setQuery("")}
              aria-label="Clear search"
            >
              <X size={18} />
            </button>
          )}

        </div>

        <button
          type="button"
          className="search-button"
          onClick={handleSearch}
          disabled={loading}
        >

          {loading ? (
            <>
              <Loader2
                size={18}
                className="spin"
              />

              Searching...
            </>
          ) : (
            <>
              <SearchIcon size={18} />

              Search
            </>
          )}

        </button>

      </div>

      {/* ======================================================
          ERROR
      ====================================================== */}

      {error && (
        <div className="search-error">

          <AlertCircle size={20} />

          <span>
            {error}
          </span>

          <button
            type="button"
            onClick={() => setError("")}
            aria-label="Close error"
          >
            <X size={16} />
          </button>

        </div>
      )}

      {/* ======================================================
          FILTERS
      ====================================================== */}

      <div className="search-toolbar">

        <div className="filter-title">

          <Filter size={17} />

          <span>
            Filter
          </span>

        </div>

        <div className="filter-buttons">

          <button
            type="button"
            className={
              activeFilter === "all"
                ? "active"
                : ""
            }
            onClick={() =>
              setActiveFilter("all")
            }
          >
            All
          </button>

          <button
            type="button"
            className={
              activeFilter === "pdf"
                ? "active"
                : ""
            }
            onClick={() =>
              setActiveFilter("pdf")
            }
          >
            PDF
          </button>

          <button
            type="button"
            className={
              activeFilter === "docx"
                ? "active"
                : ""
            }
            onClick={() =>
              setActiveFilter("docx")
            }
          >
            DOCX
          </button>

          <button
            type="button"
            className={
              activeFilter === "txt"
                ? "active"
                : ""
            }
            onClick={() =>
              setActiveFilter("txt")
            }
          >
            TXT
          </button>

        </div>

        {(results.length > 0 ||
          answer ||
          error ||
          ragError) && (
          <button
            type="button"
            className="reset-button"
            onClick={handleReset}
          >
            <X size={16} />

            Clear
          </button>
        )}

      </div>

      {/* ======================================================
          AI ANSWER
      ====================================================== */}

      {(answerLoading ||
        answer ||
        ragError) && (
        <section className="ai-answer-section">

          <div className="section-header">

            <div className="section-title">

              <div className="ai-icon">
                <Sparkles size={20} />
              </div>

              <div>
                <h2>
                  AI Answer
                </h2>

                <span>
                  Generated by KnowFlow AI
                </span>
              </div>

            </div>

            <div className="rag-badge">

              <Sparkles size={14} />

              RAG

            </div>

          </div>

          {answerLoading && !answer && (
            <div className="ai-loading">

              <Loader2
                size={24}
                className="spin"
              />

              <div>

                <strong>
                  Generating answer...
                </strong>

                <span>
                  KnowFlow AI is processing
                  your question.
                </span>

              </div>

            </div>
          )}

          {ragError && (
            <div className="rag-error">

              <AlertCircle size={20} />

              <div>

                <strong>
                  AI response unavailable
                </strong>

                <p>
                  {ragError}
                </p>

              </div>

            </div>
          )}

          {answer && (
            <div className="ai-answer-content">
              {answer}
            </div>
          )}

        </section>
      )}

      {/* ======================================================
          RESULTS
      ====================================================== */}

      <section className="results-section">

        <div className="section-header">

          <div>
            <h2>
              Search Results
            </h2>

            <span>
              {filteredResults.length}{" "}
              document
              {filteredResults.length !== 1
                ? "s"
                : ""}{" "}
              found
            </span>
          </div>

        </div>

        {/* ====================================================
            NO RESULTS
        ==================================================== */}

        {!loading &&
          results.length === 0 &&
          !error && (
            <div className="empty-state">

              <div className="empty-icon">

                <SearchIcon size={32} />

              </div>

              <h3>
                No search results
              </h3>

              <p>
                Enter a question or keyword
                to search your knowledge base.
              </p>

            </div>
          )}

        {/* ====================================================
            FILTER EMPTY
        ==================================================== */}

        {!loading &&
          results.length > 0 &&
          filteredResults.length === 0 && (
            <div className="empty-state">

              <div className="empty-icon">

                <Filter size={32} />

              </div>

              <h3>
                No documents for this filter
              </h3>

              <p>
                Try another document type.
              </p>

            </div>
          )}

        {/* ====================================================
            RESULTS
        ==================================================== */}

        {filteredResults.length > 0 && (
          <div className="results-list">

            {filteredResults.map(
              (document, index) => {

                const score = Number(
                  document.score || 0
                );

                const percentage =
                  score <= 1
                    ? Math.round(score * 100)
                    : Math.round(score);

                return (
                  <article
                    className="result-card"
                    key={
                      document.id ||
                      document.documentId ||
                      index
                    }
                  >

                    <div className="result-icon">

                      {document.category ===
                      "pdf" ? (
                        <FileText size={25} />
                      ) : (
                        <File size={25} />
                      )}

                    </div>

                    <div className="result-content">

                      <div className="result-top">

                        <h3>
                          {document.fileName}
                        </h3>

                        <div className="result-score">

                          <Sparkles size={14} />

                          {percentage}%

                        </div>

                      </div>

                      <p className="result-snippet">
                        {document.snippet}
                      </p>

                      <div className="result-bottom">

                        <span className="result-type">
                          {document.type ||
                            document.category ||
                            "document"}
                        </span>

                        {document.documentId && (
                          <button
                            type="button"
                            className="view-button"
                            onClick={() =>
                              handleViewDocument(
                                document
                              )
                            }
                          >

                            <Eye size={16} />

                            View document

                          </button>
                        )}

                      </div>

                    </div>

                  </article>
                );
              }
            )}

          </div>
        )}

      </section>

      {/* ======================================================
          DOCUMENT MODAL
      ====================================================== */}

      {selectedDocument && (
        <div
          className="document-modal-overlay"
          onClick={() =>
            setSelectedDocument(null)
          }
        >

          <div
            className="document-modal"
            onClick={(event) =>
              event.stopPropagation()
            }
          >

            <div className="modal-header">

              <div>
                <h2>
                  {getFileName(
                    selectedDocument
                  )}
                </h2>
              </div>

              <button
                type="button"
                onClick={() =>
                  setSelectedDocument(null)
                }
                aria-label="Close document"
              >
                <X size={20} />
              </button>

            </div>

            <div className="modal-content">

              {selectedDocument.content ? (
                <pre>
                  {selectedDocument.content}
                </pre>
              ) : (
                <p>
                  Aucun contenu disponible.
                </p>
              )}

            </div>

          </div>

        </div>
      )}

    </div>
  );
}