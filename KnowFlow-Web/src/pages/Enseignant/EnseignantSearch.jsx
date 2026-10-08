import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  Search,
  Sparkles,
  FileText,
  File,
  FileCode2,
  FileImage,
  FileSpreadsheet,
  FileType2,
  ArrowUpRight,
  X,
  Send,
  Loader2,
  SlidersHorizontal,
  ArrowDownAZ,
  Target,
  BrainCircuit,
  Database,
  RefreshCw,
  AlertCircle,
  CheckCircle2,
  ChevronDown,
  MessageSquare,
  Clock3,
  Zap,
} from "lucide-react";

import "./EnseignantSearch.css";

const SEARCH_API = "https://localhost:7014/api/Search";
const DOCUMENT_API = "https://localhost:7288/api/Document";

const SUGGESTIONS = [
  {
    title: "Artificial Intelligence",
    query: "Find documents about artificial intelligence",
    icon: BrainCircuit,
  },
  {
    title: "Database",
    query: "Find database teaching materials",
    icon: Database,
  },
  {
    title: "Machine Learning",
    query: "Find machine learning resources",
    icon: Sparkles,
  },
  {
    title: "Research",
    query: "Find research documents",
    icon: FileText,
  },
];

function getToken() {
  return (
    localStorage.getItem("token") ||
    localStorage.getItem("accessToken") ||
    sessionStorage.getItem("token") ||
    sessionStorage.getItem("accessToken") ||
    ""
  );
}

function getFileExtension(fileName = "") {
  const cleanName = fileName.split("?")[0];
  const parts = cleanName.split(".");
  return parts.length > 1 ? parts.pop().toLowerCase() : "";
}

function getFileIcon(fileName = "") {
  const extension = getFileExtension(fileName);

  if (["pdf"].includes(extension)) {
    return FileType2;
  }

  if (["doc", "docx"].includes(extension)) {
    return FileText;
  }

  if (["xls", "xlsx", "csv"].includes(extension)) {
    return FileSpreadsheet;
  }

  if (["jpg", "jpeg", "png", "gif", "webp", "svg"].includes(extension)) {
    return FileImage;
  }

  if (["js", "jsx", "ts", "tsx", "css", "html", "json", "cs", "cpp", "java", "py"].includes(extension)) {
    return FileCode2;
  }

  return File;
}

function formatFileType(fileName = "") {
  const extension = getFileExtension(fileName);

  if (!extension) return "DOCUMENT";

  return extension.toUpperCase();
}

function normalizeScore(score) {
  const numericScore = Number(score);

  if (!Number.isFinite(numericScore)) return 0;

  if (numericScore > 1) {
    return Math.min(numericScore / 100, 1);
  }

  return Math.max(numericScore, 0);
}

function getRelevanceLabel(score) {
  if (score >= 0.8) return "Highly relevant";
  if (score >= 0.6) return "Relevant";
  if (score >= 0.4) return "Related";

  return "Low relevance";
}

function getRelevanceClass(score) {
  if (score >= 0.8) return "high";
  if (score >= 0.6) return "medium";
  if (score >= 0.4) return "related";

  return "low";
}

function getPreview(content = "") {
  if (!content) {
    return "No preview available for this document.";
  }

  const cleanContent = content
    .replace(/\s+/g, " ")
    .replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F]/g, "")
    .trim();

  if (!cleanContent) {
    return "No preview available for this document.";
  }

  return cleanContent.length > 240
    ? `${cleanContent.substring(0, 240)}...`
    : cleanContent;
}

function getDisplayFileName(fileName = "") {
  try {
    return decodeURIComponent(fileName);
  } catch {
    return fileName;
  }
}

function normalizeResults(data) {
  if (Array.isArray(data)) {
    return data;
  }

  if (Array.isArray(data?.results)) {
    return data.results;
  }

  if (Array.isArray(data?.data)) {
    return data.data;
  }

  return [];
}

function getErrorMessage(error, fallback = "Something went wrong.") {
  if (error?.name === "AbortError") {
    return "Request cancelled.";
  }

  return error?.message || fallback;
}

export default function EnseignantSearch() {
  const searchInputRef = useRef(null);
  const aiInputRef = useRef(null);

  const [query, setQuery] = useState("");
  const [searchQuery, setSearchQuery] = useState("");

  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const [sortBy, setSortBy] = useState("relevance");
  const [showSortMenu, setShowSortMenu] = useState(false);

  const [aiOpen, setAiOpen] = useState(false);
  const [aiQuestion, setAiQuestion] = useState("");
  const [aiAnswer, setAiAnswer] = useState("");
  const [aiLoading, setAiLoading] = useState(false);
  const [aiError, setAiError] = useState("");

  const [lastSearchTime, setLastSearchTime] = useState(null);

  const searchDocuments = useCallback(async (searchText, options = {}) => {
    const cleanQuery = String(searchText || "").trim();

    if (!cleanQuery) {
      setError("Please enter a question or topic to search.");
      searchInputRef.current?.focus();
      return;
    }

    const controller = new AbortController();

    try {
      setLoading(true);
      setError("");
      setResults([]);

      const response = await fetch(
        `${SEARCH_API}?query=${encodeURIComponent(cleanQuery)}&limit=8`,
        {
          method: "GET",
          headers: {
            Accept: "application/json",
            ...(getToken()
              ? {
                  Authorization: `Bearer ${getToken()}`,
                }
              : {}),
          },
          signal: controller.signal,
        }
      );

      if (!response.ok) {
        let message = "Semantic search failed.";

        try {
          const errorData = await response.json();
          message = errorData?.message || message;
        } catch {
          // Keep default message.
        }

        throw new Error(message);
      }

      const data = await response.json();
      const normalized = normalizeResults(data);

      setResults(normalized);
      setSearchQuery(cleanQuery);
      setLastSearchTime(new Date());

      if (options.openAI) {
        setAiQuestion(cleanQuery);
        setAiOpen(true);
      }
    } catch (err) {
      if (err?.name !== "AbortError") {
        setError(
          getErrorMessage(
            err,
            "Unable to contact SearchService. Make sure the service is running."
          )
        );
        setResults([]);
      }
    } finally {
      setLoading(false);
    }

    return () => controller.abort();
  }, []);

  const handleSubmit = async (event) => {
    event.preventDefault();
    await searchDocuments(query);
  };

  const handleSuggestion = async (suggestionQuery) => {
    setQuery(suggestionQuery);
    await searchDocuments(suggestionQuery);
  };

  const handleClear = () => {
    setQuery("");
    setSearchQuery("");
    setResults([]);
    setError("");
    setLastSearchTime(null);
    setShowSortMenu(false);

    requestAnimationFrame(() => {
      searchInputRef.current?.focus();
    });
  };

  const handleOpenDocument = (result) => {
    if (!result?.FileName && !result?.fileName) {
      setError("This search result does not contain a valid file name.");
      return;
    }

    const fileName = result.FileName || result.fileName;

    const url = `${DOCUMENT_API}/file/${encodeURIComponent(fileName)}`;

    window.open(url, "_blank", "noopener,noreferrer");
  };

  const openAI = (question = "") => {
    setAiQuestion(question || searchQuery || "");
    setAiAnswer("");
    setAiError("");
    setAiOpen(true);

    setTimeout(() => {
      aiInputRef.current?.focus();
    }, 100);
  };

  const closeAI = () => {
    if (aiLoading) return;

    setAiOpen(false);
    setAiQuestion("");
    setAiAnswer("");
    setAiError("");
  };

  const askAI = async (event) => {
    event?.preventDefault();

    const cleanQuestion = aiQuestion.trim();

    if (!cleanQuestion) {
      setAiError("Please enter a question.");
      aiInputRef.current?.focus();
      return;
    }

    try {
      setAiLoading(true);
      setAiError("");
      setAiAnswer("");

      const response = await fetch(`${SEARCH_API}/ask`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Accept: "application/json",
          ...(getToken()
            ? {
                Authorization: `Bearer ${getToken()}`,
              }
            : {}),
        },
        body: JSON.stringify({
          query: cleanQuestion,
        }),
      });

      if (!response.ok) {
        let message = "AI request failed.";

        try {
          const errorData = await response.json();
          message = errorData?.message || message;
        } catch {
          // Keep default.
        }

        throw new Error(message);
      }

      const data = await response.json();

      const answer =
        data?.answer ||
        data?.response ||
        data?.message ||
        "The AI did not return an answer.";

      setAiAnswer(String(answer));
    } catch (err) {
      setAiError(
        getErrorMessage(
          err,
          "Unable to contact the RAG service. Please verify SearchService and AI dependencies."
        )
      );
    } finally {
      setAiLoading(false);
    }
  };

  const sortedResults = useMemo(() => {
    const copied = [...results];

    if (sortBy === "name") {
      return copied.sort((a, b) => {
        const nameA = String(a?.FileName || a?.fileName || "").toLowerCase();
        const nameB = String(b?.FileName || b?.fileName || "").toLowerCase();

        return nameA.localeCompare(nameB);
      });
    }

    return copied.sort((a, b) => {
      return (
        normalizeScore(b?.Score ?? b?.score) -
        normalizeScore(a?.Score ?? a?.score)
      );
    });
  }, [results, sortBy]);

  const statistics = useMemo(() => {
    const total = results.length;

    if (!total) {
      return {
        total: 0,
        high: 0,
        average: 0,
      };
    }

    const scores = results.map((item) =>
      normalizeScore(item?.Score ?? item?.score)
    );

    const high = scores.filter((score) => score >= 0.7).length;

    const average =
      scores.reduce((sum, score) => sum + score, 0) / scores.length;

    return {
      total,
      high,
      average: Math.round(average * 100),
    };
  }, [results]);

  useEffect(() => {
    const handleKeyboard = (event) => {
      if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === "k") {
        event.preventDefault();
        searchInputRef.current?.focus();
      }

      if (event.key === "Escape") {
        if (showSortMenu) {
          setShowSortMenu(false);
        } else if (aiOpen && !aiLoading) {
          closeAI();
        }
      }
    };

    window.addEventListener("keydown", handleKeyboard);

    return () => {
      window.removeEventListener("keydown", handleKeyboard);
    };
  }, [aiOpen, aiLoading, showSortMenu]);

  useEffect(() => {
    if (!showSortMenu) return;

    const closeMenu = (event) => {
      if (!event.target.closest(".search-sort-wrapper")) {
        setShowSortMenu(false);
      }
    };

    document.addEventListener("mousedown", closeMenu);

    return () => {
      document.removeEventListener("mousedown", closeMenu);
    };
  }, [showSortMenu]);

  const hasResults = sortedResults.length > 0;
  const hasSearched = Boolean(searchQuery);

  return (
    <div className="enseignant-search-page">
      <div className="search-background-grid" />

      <div className="search-page-inner">
        {/* HEADER */}
        <header className="enseignant-search-header">
          <div className="search-header-left">
            <div className="search-orb">
              <Search size={25} strokeWidth={2.2} />
            </div>

            <div>
              <div className="search-eyebrow">
                <span className="eyebrow-dot" />
                KNOWFLOW AI
                <span className="eyebrow-separator">/</span>
                KNOWLEDGE DISCOVERY
              </div>

              <h1>Semantic Search</h1>

              <p>
                Find the right knowledge by meaning, not just keywords.
              </p>
            </div>
          </div>

          <div className="search-status">
            <span className="status-pulse" />
            Semantic engine online
          </div>
        </header>

        {/* SEARCH AREA */}
        <section className="semantic-search-panel">
          <div className="panel-glow" />

          <div className="search-panel-top">
            <div>
              <span className="panel-kicker">
                <Sparkles size={14} />
                AI-POWERED KNOWLEDGE SEARCH
              </span>

              <h2>What are you looking for?</h2>

              <p>
                Ask a question naturally. KnowFlow AI will retrieve the most
                semantically relevant documents.
              </p>
            </div>

            <div className="search-shortcut">
              <span>CTRL</span>
              <span>+</span>
              <span>K</span>
            </div>
          </div>

          <form className="main-search-form" onSubmit={handleSubmit}>
            <div className="main-search-input-wrapper">
              <Search className="main-search-icon" size={22} />

              <input
                ref={searchInputRef}
                type="text"
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                placeholder="Example: Find documents about artificial intelligence..."
                aria-label="Semantic search"
                autoComplete="off"
              />

              {query && (
                <button
                  type="button"
                  className="input-clear-button"
                  onClick={() => setQuery("")}
                  aria-label="Clear search input"
                  title="Clear"
                >
                  <X size={17} />
                </button>
              )}

              <button
                type="submit"
                className="main-search-button"
                disabled={loading}
              >
                {loading ? (
                  <>
                    <Loader2 size={18} className="spin" />
                    Searching
                  </>
                ) : (
                  <>
                    Search
                    <ArrowUpRight size={18} />
                  </>
                )}
              </button>
            </div>
          </form>

          <div className="search-helper-row">
            <div className="search-helper">
              <Zap size={14} />
              Search by meaning across your knowledge base
            </div>

            {(query || results.length > 0 || error) && (
              <button
                type="button"
                className="clear-all-button"
                onClick={handleClear}
              >
                <RefreshCw size={14} />
                Clear
              </button>
            )}
          </div>
        </section>

        {/* ERROR */}
        {error && (
          <div className="search-error">
            <div className="error-icon">
              <AlertCircle size={18} />
            </div>

            <div>
              <strong>Search unavailable</strong>
              <span>{error}</span>
            </div>

            <button
              type="button"
              onClick={() => searchDocuments(searchQuery || query)}
            >
              <RefreshCw size={15} />
              Retry
            </button>
          </div>
        )}

        {/* INITIAL DISCOVERY */}
        {!hasSearched && !loading && !error && (
          <section className="discovery-section">
            <div className="section-heading">
              <div>
                <span className="section-label">START EXPLORING</span>
                <h3>Search your knowledge base</h3>
              </div>

              <div className="discovery-icon">
                <Target size={20} />
              </div>
            </div>

            <div className="suggestions-grid">
              {SUGGESTIONS.map((suggestion) => {
                const Icon = suggestion.icon;

                return (
                  <button
                    type="button"
                    className="suggestion-card"
                    key={suggestion.title}
                    onClick={() => handleSuggestion(suggestion.query)}
                  >
                    <div className="suggestion-icon">
                      <Icon size={19} />
                    </div>

                    <div className="suggestion-content">
                      <strong>{suggestion.title}</strong>
                      <span>{suggestion.query}</span>
                    </div>

                    <ArrowUpRight
                      className="suggestion-arrow"
                      size={17}
                    />
                  </button>
                );
              })}
            </div>

            <div className="how-search-works">
              <div className="how-item">
                <div className="how-number">01</div>
                <div>
                  <strong>Ask naturally</strong>
                  <span>Use your own words</span>
                </div>
              </div>

              <div className="how-line" />

              <div className="how-item">
                <div className="how-number">02</div>
                <div>
                  <strong>Semantic matching</strong>
                  <span>Meaning is analyzed</span>
                </div>
              </div>

              <div className="how-line" />

              <div className="how-item">
                <div className="how-number">03</div>
                <div>
                  <strong>Relevant sources</strong>
                  <span>Best documents appear first</span>
                </div>
              </div>
            </div>
          </section>
        )}

        {/* LOADING */}
        {loading && (
          <section className="loading-state">
            <div className="loading-orb">
              <Loader2 size={25} className="spin" />
            </div>

            <h3>Searching your knowledge base</h3>

            <p>
              Understanding your question and finding semantically relevant
              documents...
            </p>

            <div className="loading-bar">
              <span />
            </div>
          </section>
        )}

        {/* RESULTS */}
        {!loading && hasSearched && !error && (
          <section className="results-section">
            <div className="results-header">
              <div>
                <span className="section-label">SEARCH RESULTS</span>

                <h3>
                  Results for{" "}
                  <span className="results-query">
                    “{searchQuery}”
                  </span>
                </h3>

                <div className="results-meta">
                  <span>
                    <CheckCircle2 size={14} />
                    {statistics.total} document
                    {statistics.total !== 1 ? "s" : ""} found
                  </span>

                  {lastSearchTime && (
                    <span>
                      <Clock3 size={14} />
                      Just now
                    </span>
                  )}
                </div>
              </div>

              <div className="results-actions">
                <div className="search-sort-wrapper">
                  <button
                    type="button"
                    className="sort-button"
                    onClick={() => setShowSortMenu((value) => !value)}
                  >
                    <SlidersHorizontal size={16} />
                    {sortBy === "relevance" ? "Relevance" : "Name"}
                    <ChevronDown size={15} />
                  </button>

                  {showSortMenu && (
                    <div className="sort-menu">
                      <button
                        type="button"
                        className={sortBy === "relevance" ? "active" : ""}
                        onClick={() => {
                          setSortBy("relevance");
                          setShowSortMenu(false);
                        }}
                      >
                        <Target size={15} />
                        Relevance
                        {sortBy === "relevance" && (
                          <CheckCircle2 size={14} />
                        )}
                      </button>

                      <button
                        type="button"
                        className={sortBy === "name" ? "active" : ""}
                        onClick={() => {
                          setSortBy("name");
                          setShowSortMenu(false);
                        }}
                      >
                        <ArrowDownAZ size={15} />
                        Name
                        {sortBy === "name" && (
                          <CheckCircle2 size={14} />
                        )}
                      </button>
                    </div>
                  )}
                </div>

                <button
                  type="button"
                  className="ask-results-button"
                  onClick={() => openAI(searchQuery)}
                >
                  <Sparkles size={16} />
                  Ask AI
                </button>
              </div>
            </div>

            {/* STATISTICS */}
            <div className="result-statistics">
              <div className="result-stat-card">
                <div className="stat-icon purple">
                  <FileText size={17} />
                </div>

                <div>
                  <span>Documents found</span>
                  <strong>{statistics.total}</strong>
                </div>
              </div>

              <div className="result-stat-card">
                <div className="stat-icon cyan">
                  <Target size={17} />
                </div>

                <div>
                  <span>Highly relevant</span>
                  <strong>{statistics.high}</strong>
                </div>
              </div>

              <div className="result-stat-card">
                <div className="stat-icon green">
                  <Zap size={17} />
                </div>

                <div>
                  <span>Average relevance</span>
                  <strong>{statistics.average}%</strong>
                </div>
              </div>
            </div>

            {/* NO RESULTS */}
            {!hasResults && (
              <div className="empty-results">
                <div className="empty-results-icon">
                  <Search size={25} />
                </div>

                <h3>No relevant documents found</h3>

                <p>
                  Try asking the question differently or use another topic.
                </p>

                <button
                  type="button"
                  onClick={handleClear}
                  className="empty-action"
                >
                  <Search size={16} />
                  Try another search
                </button>
              </div>
            )}

            {/* RESULT CARDS */}
            {hasResults && (
              <div className="results-list">
                {sortedResults.map((result, index) => {
                  const fileName =
                    result?.FileName || result?.fileName || "Untitled document";

                  const content =
                    result?.Content || result?.content || "";

                  const score = normalizeScore(
                    result?.Score ?? result?.score
                  );

                  const FileIcon = getFileIcon(fileName);

                  const relevanceClass = getRelevanceClass(score);

                  return (
                    <article
                      className="document-result-card"
                      key={
                        result?.DocumentId ||
                        result?.documentId ||
                        `${fileName}-${index}`
                      }
                    >
                      <div className="result-rank">
                        <span>#{String(index + 1).padStart(2, "0")}</span>
                      </div>

                      <div className="result-file-icon">
                        <FileIcon size={22} />
                      </div>

                      <div className="result-main">
                        <div className="result-title-row">
                          <div className="result-title-block">
                            <h4 title={getDisplayFileName(fileName)}>
                              {getDisplayFileName(fileName)}
                            </h4>

                            <div className="result-file-meta">
                              <span className="file-type">
                                {formatFileType(fileName)}
                              </span>

                              {result?.DocumentId && (
                                <>
                                  <span className="meta-dot" />
                                  <span>
                                    ID:{" "}
                                    {String(result.DocumentId).substring(0, 8)}
                                    ...
                                  </span>
                                </>
                              )}
                            </div>
                          </div>

                          <div
                            className={`relevance-badge ${relevanceClass}`}
                          >
                            <span className="relevance-dot" />
                            {Math.round(score * 100)}%
                            <span className="relevance-label">
                              {getRelevanceLabel(score)}
                            </span>
                          </div>
                        </div>

                        <p className="result-preview">
                          {getPreview(content)}
                        </p>

                        <div className="result-footer">
                          <div className="semantic-match">
                            <div className="semantic-match-bar">
                              <span
                                style={{
                                  width: `${Math.max(
                                    4,
                                    Math.round(score * 100)
                                  )}%`,
                                }}
                              />
                            </div>

                            <span>
                              Semantic match {Math.round(score * 100)}%
                            </span>
                          </div>

                          <button
                            type="button"
                            className="open-document-button"
                            onClick={() => handleOpenDocument(result)}
                          >
                            <FileText size={16} />
                            Open document
                            <ArrowUpRight size={15} />
                          </button>
                        </div>
                      </div>
                    </article>
                  );
                })}
              </div>
            )}

            {hasResults && (
              <div className="results-bottom-note">
                <BrainCircuit size={16} />
                Results are ranked according to semantic similarity.
              </div>
            )}
          </section>
        )}
      </div>

      {/* AI MODAL */}
      {aiOpen && (
        <div
          className="ai-modal-overlay"
          onMouseDown={(event) => {
            if (event.target === event.currentTarget && !aiLoading) {
              closeAI();
            }
          }}
        >
          <div className="ai-modal">
            <div className="ai-modal-glow" />

            <div className="ai-modal-header">
              <div className="ai-modal-title">
                <div className="ai-modal-icon">
                  <Sparkles size={21} />
                </div>

                <div>
                  <span>KNOWFLOW AI</span>
                  <h3>Ask AI</h3>
                </div>
              </div>

              <button
                type="button"
                className="ai-close-button"
                onClick={closeAI}
                disabled={aiLoading}
                aria-label="Close AI assistant"
              >
                <X size={19} />
              </button>
            </div>

            <div className="ai-context">
              <MessageSquare size={15} />

              <span>
                RAG search will retrieve relevant knowledge for your question.
              </span>
            </div>

            <form className="ai-question-form" onSubmit={askAI}>
              <label htmlFor="ai-question">Your question</label>

              <div className="ai-input-wrapper">
                <input
                  ref={aiInputRef}
                  id="ai-question"
                  type="text"
                  value={aiQuestion}
                  onChange={(event) => setAiQuestion(event.target.value)}
                  placeholder="Ask something about your knowledge base..."
                  disabled={aiLoading}
                  autoComplete="off"
                />

                <button
                  type="submit"
                  disabled={aiLoading || !aiQuestion.trim()}
                  aria-label="Send question"
                  title="Ask AI"
                >
                  {aiLoading ? (
                    <Loader2 size={18} className="spin" />
                  ) : (
                    <Send size={18} />
                  )}
                </button>
              </div>
            </form>

            {aiError && (
              <div className="ai-error">
                <AlertCircle size={17} />
                <span>{aiError}</span>
              </div>
            )}

            {aiLoading && (
              <div className="ai-loading">
                <div className="ai-loading-icon">
                  <BrainCircuit size={20} />
                </div>

                <div>
                  <strong>Thinking...</strong>
                  <span>
                    Searching relevant knowledge and generating an answer.
                  </span>
                </div>
              </div>
            )}

            {aiAnswer && !aiLoading && (
              <div className="ai-answer">
                <div className="ai-answer-header">
                  <div className="ai-answer-label">
                    <CheckCircle2 size={16} />
                    AI RESPONSE
                  </div>

                  <span>RAG</span>
                </div>

                <div className="ai-answer-content">
                  {aiAnswer}
                </div>
              </div>
            )}

            {!aiAnswer && !aiLoading && !aiError && (
              <div className="ai-empty">
                <div className="ai-empty-icon">
                  <Sparkles size={22} />
                </div>

                <h4>Ask your knowledge base</h4>

                <p>
                  Ask a question and KnowFlow AI will use semantic retrieval
                  to find relevant information before generating the answer.
                </p>
              </div>
            )}

            <div className="ai-modal-footer">
              <span>
                <span className="footer-online-dot" />
                SearchService / RAG
              </span>

              <span>Press ESC to close</span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}