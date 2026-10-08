import React, { useMemo, useState } from "react";
import {
  ArrowRight,
  BookOpen,
  Brain,
  CheckCircle2,
  Clock3,
  FileCode2,
  FileImage,
  FileSpreadsheet,
  FileText,
  Loader2,
  Search,
  Sparkles,
  Target,
  X,
  Zap,
} from "lucide-react";

import "./EtudiantSearch.css";

const SEARCH_API = "http://localhost:5035/api/Search";

export default function EtudiantSearch() {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const [searched, setSearched] = useState(false);
  const [error, setError] = useState("");
  const [selectedResult, setSelectedResult] = useState(null);

  // ============================================================
  // SEARCH SUGGESTIONS
  // ============================================================

  const suggestions = useMemo(
    () => [
      {
        icon: Brain,
        text: "Explain neural networks",
        category: "AI & Machine Learning",
      },
      {
        icon: Zap,
        text: "What is JWT authentication?",
        category: "Cybersecurity",
      },
      {
        icon: BookOpen,
        text: "Explain database normalization",
        category: "Databases",
      },
      {
        icon: Target,
        text: "How does routing work?",
        category: "Networking",
      },
    ],
    []
  );

  // ============================================================
  // GET JWT TOKEN
  // ============================================================

  const getAuthToken = () => {
    const token =
      localStorage.getItem("token") ||
      localStorage.getItem("accessToken") ||
      localStorage.getItem("access_token") ||
      localStorage.getItem("jwt") ||
      localStorage.getItem("authToken");

    if (!token) {
      throw new Error("Authentication token not found.");
    }

    return token.replace(/^Bearer\s+/i, "");
  };

  // ============================================================
  // SEARCH
  // ============================================================

  const handleSearch = async (e) => {
    if (e) {
      e.preventDefault();
    }

    const value = query.trim();

    if (!value || loading) {
      return;
    }

    setLoading(true);
    setError("");
    setSearched(true);
    setResults([]);

    try {
      // ----------------------------------------------------------
      // JWT
      // ----------------------------------------------------------

      const token = getAuthToken();

      console.log("======================================");
      console.log("KNOWFLOW STUDENT SEARCH");
      console.log("======================================");
      console.log("Query:", value);
      console.log("JWT found:", !!token);
      console.log("Search API:", SEARCH_API);
      console.log("======================================");

      // ----------------------------------------------------------
      // BUILD URL
      // ----------------------------------------------------------

      const searchUrl =
        SEARCH_API +
        "?query=" +
        encodeURIComponent(value) +
        "&limit=8";

      // ----------------------------------------------------------
      // REQUEST
      // ----------------------------------------------------------

      const response = await fetch(searchUrl, {
        method: "GET",
        headers: {
          Accept: "application/json",
          Authorization: "Bearer " + token,
        },
      });

      console.log("SearchService status:", response.status);

      // ----------------------------------------------------------
      // UNAUTHORIZED
      // ----------------------------------------------------------

      if (response.status === 401) {
        throw new Error(
          "Session expirée ou token JWT invalide. Veuillez vous reconnecter."
        );
      }

      // ----------------------------------------------------------
      // FORBIDDEN
      // ----------------------------------------------------------

      if (response.status === 403) {
        throw new Error(
          "Accès refusé par SearchService."
        );
      }

      // ----------------------------------------------------------
      // OTHER HTTP ERRORS
      // ----------------------------------------------------------

      if (!response.ok) {
        throw new Error(
          "SearchService returned HTTP " + response.status
        );
      }

      // ----------------------------------------------------------
      // JSON RESPONSE
      // ----------------------------------------------------------

      const data = await response.json();

      console.log("SearchService response:", data);

      // ----------------------------------------------------------
      // NORMALIZE RESULTS
      // ----------------------------------------------------------

      let normalizedResults = [];

      if (Array.isArray(data)) {
        normalizedResults = data;
      } else if (Array.isArray(data?.results)) {
        normalizedResults = data.results;
      } else if (Array.isArray(data?.items)) {
        normalizedResults = data.items;
      } else if (Array.isArray(data?.documents)) {
        normalizedResults = data.documents;
      } else if (Array.isArray(data?.data)) {
        normalizedResults = data.data;
      }

      setResults(normalizedResults);
    } catch (err) {
      console.error(
        "Student Search Error:",
        err
      );

      setResults([]);

      setError(
        err?.message ||
          "Impossible de contacter le SearchService."
      );
    } finally {
      setLoading(false);
    }
  };

  // ============================================================
  // CLEAR SEARCH
  // ============================================================

  const clearSearch = () => {
    setQuery("");
    setResults([]);
    setSearched(false);
    setError("");
    setSelectedResult(null);
  };

  // ============================================================
  // USE SUGGESTION
  // ============================================================

  const useSuggestion = (text) => {
    setQuery(text);

    setTimeout(() => {
      const form = document.getElementById(
        "student-search-form"
      );

      if (form) {
        form.requestSubmit();
      }
    }, 80);
  };

  // ============================================================
  // GET TITLE
  // ============================================================

  const getTitle = (item, index = 0) => {
    return (
      item?.title ||
      item?.name ||
      item?.fileName ||
      item?.filename ||
      item?.documentName ||
      item?.metadata?.title ||
      "Knowledge Result " + (index + 1)
    );
  };

  // ============================================================
  // GET CONTENT
  // ============================================================

  const getContent = (item) => {
    return (
      item?.content ||
      item?.text ||
      item?.snippet ||
      item?.description ||
      item?.chunk ||
      item?.metadata?.content ||
      "Relevant knowledge found in your learning materials."
    );
  };

  // ============================================================
  // GET SCORE
  // ============================================================

  const getScore = (item) => {
    const raw =
      item?.score ??
      item?.similarity ??
      item?.relevance ??
      item?.confidence;

    if (raw === undefined || raw === null) {
      return null;
    }

    const number = Number(raw);

    if (Number.isNaN(number)) {
      return null;
    }

    const percentage =
      number <= 1
        ? Math.round(number * 100)
        : Math.round(number);

    return Math.min(
      100,
      Math.max(0, percentage)
    );
  };

  // ============================================================
  // GET FILE TYPE
  // ============================================================

  const getFileType = (item) => {
    const name =
      item?.fileName ||
      item?.filename ||
      item?.name ||
      item?.title ||
      "";

    const extension = name
      .split(".")
      .pop()
      ?.toLowerCase();

    if (extension === "pdf") {
      return "PDF";
    }

    if (
      extension === "doc" ||
      extension === "docx"
    ) {
      return "DOC";
    }

    if (
      extension === "xls" ||
      extension === "xlsx" ||
      extension === "csv"
    ) {
      return "DATA";
    }

    if (
      extension === "jpg" ||
      extension === "jpeg" ||
      extension === "png" ||
      extension === "webp"
    ) {
      return "IMAGE";
    }

    if (
      extension === "js" ||
      extension === "jsx" ||
      extension === "ts" ||
      extension === "tsx" ||
      extension === "cs" ||
      extension === "cpp" ||
      extension === "java"
    ) {
      return "CODE";
    }

    return "DOCUMENT";
  };

  // ============================================================
  // GET FILE ICON
  // ============================================================

  const getFileIcon = (item) => {
    const type = getFileType(item);

    if (type === "IMAGE") {
      return FileImage;
    }

    if (type === "DATA") {
      return FileSpreadsheet;
    }

    if (type === "CODE") {
      return FileCode2;
    }

    return FileText;
  };

  // ============================================================
  // FORMAT CONTENT
  // ============================================================

  const formatContent = (content) => {
    if (!content) {
      return "";
    }

    const text = String(content)
      .replace(/\s+/g, " ")
      .trim();

    if (text.length <= 360) {
      return text;
    }

    return text.slice(0, 360) + "...";
  };

  // ============================================================
  // UI
  // ============================================================

  return (
    <div className="student-search-page">
      {/* ======================================================
          BACKGROUND
      ====================================================== */}

      <div className="student-search-background">
        <div className="search-grid" />

        <div className="search-orb search-orb-one" />

        <div className="search-orb search-orb-two" />

        <div className="search-orb search-orb-three" />
      </div>

      <main className="student-search-container">
        {/* ====================================================
            HERO
        ==================================================== */}

        <section className="student-search-hero">
          <div className="hero-copy">
            <div className="student-search-eyebrow">
              <span className="eyebrow-dot" />

              <Sparkles size={14} />

              KNOWFLOW AI

              <span className="eyebrow-divider">
                /
              </span>

              KNOWLEDGE EXPLORER
            </div>

            <h1>
              Search smarter.
              <span> Learn deeper.</span>
            </h1>

            <p>
              Explore your learning materials with
              AI-powered semantic search. Ask naturally
              and discover the knowledge that matters
              most.
            </p>

            <div className="hero-features">
              <div>
                <CheckCircle2 size={15} />
                Semantic understanding
              </div>

              <div>
                <CheckCircle2 size={15} />
                Relevant documents
              </div>

              <div>
                <CheckCircle2 size={15} />
                AI-powered discovery
              </div>
            </div>
          </div>

          {/* AI CARD */}

          <div className="hero-ai-card">
            <div className="hero-ai-glow" />

            <div className="hero-ai-icon">
              <Brain size={28} />
            </div>

            <div className="hero-ai-content">
              <span>
                KNOWFLOW INTELLIGENCE
              </span>

              <strong>
                Semantic Search
              </strong>

              <p>
                Understanding meaning, not just
                keywords.
              </p>
            </div>

            <div className="ai-status">
              <span />
              Ready
            </div>
          </div>
        </section>

        {/* ====================================================
            SEARCH
        ==================================================== */}

        <section className="student-search-main">
          <form
            id="student-search-form"
            onSubmit={handleSearch}
            className="student-search-form"
          >
            <div
              className={
                "student-search-input-wrapper " +
                (loading ? "is-loading" : "")
              }
            >
              <div className="search-leading-icon">
                {loading ? (
                  <Loader2
                    className="spin"
                    size={23}
                  />
                ) : (
                  <Search size={23} />
                )}
              </div>

              <input
                type="text"
                value={query}
                onChange={(e) =>
                  setQuery(e.target.value)
                }
                placeholder="Ask anything about your courses, documents or concepts..."
                autoComplete="off"
                aria-label="Search learning materials"
              />

              {query && (
                <button
                  type="button"
                  className="student-search-clear"
                  onClick={clearSearch}
                  aria-label="Clear search"
                >
                  <X size={17} />
                </button>
              )}

              <button
                type="submit"
                className="student-search-button"
                disabled={
                  loading ||
                  !query.trim()
                }
              >
                {loading ? (
                  <>
                    <Loader2
                      size={17}
                      className="spin"
                    />

                    Searching
                  </>
                ) : (
                  <>
                    Search

                    <ArrowRight size={17} />
                  </>
                )}
              </button>
            </div>
          </form>

          {/* SUGGESTIONS */}

          {!searched && (
            <div className="student-search-suggestions">
              <div className="suggestions-heading">
                <Sparkles size={14} />

                <span>
                  Try searching for
                </span>
              </div>

              <div className="suggestion-list">
                {suggestions.map(
                  (suggestion) => {
                    const Icon =
                      suggestion.icon;

                    return (
                      <button
                        key={suggestion.text}
                        type="button"
                        onClick={() =>
                          useSuggestion(
                            suggestion.text
                          )
                        }
                      >
                        <span className="suggestion-icon">
                          <Icon size={15} />
                        </span>

                        <span className="suggestion-text">
                          <strong>
                            {suggestion.text}
                          </strong>

                          <small>
                            {suggestion.category}
                          </small>
                        </span>

                        <ArrowRight size={15} />
                      </button>
                    );
                  }
                )}
              </div>
            </div>
          )}
        </section>

        {/* ====================================================
            ERROR
        ==================================================== */}

        {error && (
          <div className="student-search-error">
            <div className="error-symbol">
              !
            </div>

            <div className="error-content">
              <strong>
                Search service unavailable
              </strong>

              <p>{error}</p>
            </div>

            <button
              type="button"
              onClick={() =>
                handleSearch()
              }
            >
              Retry
            </button>
          </div>
        )}

        {/* ====================================================
            RESULTS HEADER
        ==================================================== */}

        {searched &&
          !loading &&
          !error && (
            <section className="student-results-header">
              <div>
                <span className="results-kicker">
                  KNOWLEDGE DISCOVERY
                </span>

                <h2>
                  Results for{" "}
                  <span>
                    "{query}"
                  </span>
                </h2>

                <p>
                  AI-ranked results based on
                  semantic relevance.
                </p>
              </div>

              <div className="result-summary">
                <div className="summary-icon">
                  <FileText size={17} />
                </div>

                <div>
                  <strong>
                    {results.length}
                  </strong>

                  <span>
                    {results.length === 1
                      ? "result found"
                      : "results found"}
                  </span>
                </div>
              </div>
            </section>
          )}

        {/* ====================================================
            LOADING
        ==================================================== */}

        {loading && (
          <section className="student-search-loading">
            <div className="loading-orbit">
              <div className="loading-core">
                <Brain size={27} />
              </div>
            </div>

            <h3>
              Exploring your knowledge base
            </h3>

            <p>
              KnowFlow AI is finding the most
              relevant information for your
              question.
            </p>

            <div className="loading-steps">
              <span>
                Understanding query
              </span>

              <i />

              <span>
                Searching knowledge
              </span>

              <i />

              <span>
                Ranking results
              </span>
            </div>
          </section>
        )}

        {/* ====================================================
            EMPTY
        ==================================================== */}

        {searched &&
          !loading &&
          !error &&
          results.length === 0 && (
            <section className="student-search-empty">
              <div className="empty-visual">
                <Search size={30} />
              </div>

              <span className="empty-kicker">
                NO MATCHES
              </span>

              <h3>
                We couldn't find that knowledge.
              </h3>

              <p>
                Try describing your question
                differently, using broader terms,
                or searching for another concept
                from your courses.
              </p>

              <button
                type="button"
                onClick={() => {
                  setQuery("");
                  setSearched(false);
                  setError("");
                }}
              >
                <Search size={16} />

                Start another search
              </button>
            </section>
          )}

        {/* ====================================================
            RESULTS
        ==================================================== */}

        {!loading &&
          results.length > 0 && (
            <section className="student-search-results">
              {results.map(
                (item, index) => {
                  const title =
                    getTitle(
                      item,
                      index
                    );

                  const content =
                    getContent(item);

                  const score =
                    getScore(item);

                  const type =
                    getFileType(item);

                  const Icon =
                    getFileIcon(item);

                  return (
                    <article
                      className="student-result-card"
                      key={
                        item?.id ||
                        item?._id ||
                        title +
                          "-" +
                          index
                      }
                    >
                      <div className="result-rank">
                        {String(
                          index + 1
                        ).padStart(
                          2,
                          "0"
                        )}
                      </div>

                      <div className="result-main">
                        <div className="result-card-top">
                          <div className="result-document-icon">
                            <Icon size={21} />
                          </div>

                          <div className="result-document-info">
                            <div className="document-label">
                              <span>
                                {type}
                              </span>

                              <i />

                              <small>
                                SEMANTIC RESULT
                              </small>
                            </div>

                            <h3>
                              {title}
                            </h3>
                          </div>

                          {score !== null && (
                            <div className="result-score">
                              <div className="score-ring">
                                <span>
                                  {score}
                                </span>
                              </div>

                              <div>
                                <strong>
                                  Relevance
                                </strong>

                                <small>
                                  AI match
                                </small>
                              </div>
                            </div>
                          )}
                        </div>

                        <div className="result-content">
                          {formatContent(
                            content
                          )}
                        </div>

                        <div className="result-card-footer">
                          <div className="result-meta">
                            <span>
                              <Brain size={14} />
                              Semantic match
                            </span>

                            <span>
                              <Clock3 size={14} />
                              Knowledge base
                            </span>
                          </div>

                          <button
                            type="button"
                            onClick={() =>
                              setSelectedResult(
                                item
                              )
                            }
                          >
                            Explore knowledge

                            <ArrowRight
                              size={16}
                            />
                          </button>
                        </div>
                      </div>
                    </article>
                  );
                }
              )}
            </section>
          )}

        {/* ====================================================
            LEARNING PROMO
        ==================================================== */}

        {!searched && (
          <section className="student-search-learning">
            <div className="learning-intro">
              <span>
                WHY SEMANTIC SEARCH?
              </span>

              <h2>
                Search for meaning,
                <br />
                not just keywords.
              </h2>
            </div>

            <div className="learning-grid">
              {/* CARD 1 */}

              <div className="learning-card">
                <div className="learning-card-icon">
                  <Brain size={21} />
                </div>

                <div>
                  <span>
                    UNDERSTAND
                  </span>

                  <h3>
                    Ask naturally
                  </h3>

                  <p>
                    You don't need the exact
                    words from your documents.
                    Describe what you want to
                    understand.
                  </p>
                </div>
              </div>

              {/* CARD 2 */}

              <div className="learning-card">
                <div className="learning-card-icon second">
                  <Target size={21} />
                </div>

                <div>
                  <span>
                    DISCOVER
                  </span>

                  <h3>
                    Find relevant knowledge
                  </h3>

                  <p>
                    AI compares meaning and
                    context to surface the most
                    useful learning content.
                  </p>
                </div>
              </div>

              {/* CARD 3 */}

              <div className="learning-card">
                <div className="learning-card-icon third">
                  <BookOpen size={21} />
                </div>

                <div>
                  <span>
                    LEARN
                  </span>

                  <h3>
                    Go deeper
                  </h3>

                  <p>
                    Explore the source material
                    and continue your learning
                    with KnowFlow AI.
                  </p>
                </div>
              </div>
            </div>
          </section>
        )}
      </main>

      {/* ======================================================
          RESULT MODAL
      ====================================================== */}

      {selectedResult && (
        <div
          className="student-result-modal-overlay"
          onClick={() =>
            setSelectedResult(null)
          }
        >
          <div
            className="student-result-modal"
            onClick={(e) =>
              e.stopPropagation()
            }
          >
            <button
              type="button"
              className="modal-close"
              onClick={() =>
                setSelectedResult(null)
              }
              aria-label="Close"
            >
              <X size={19} />
            </button>

            {/* MODAL HEADER */}

            <div className="modal-header">
              <div className="modal-icon">
                <FileText size={24} />
              </div>

              <div>
                <span>
                  KNOWLEDGE RESULT
                </span>

                <small>
                  Semantic search match
                </small>
              </div>
            </div>

            {/* TITLE */}

            <h2>
              {getTitle(
                selectedResult
              )}
            </h2>

            {/* RELEVANCE */}

            {getScore(
              selectedResult
            ) !== null && (
              <div className="modal-relevance">
                <div>
                  <Target size={15} />

                  AI relevance
                </div>

                <strong>
                  {getScore(
                    selectedResult
                  )}
                  %
                </strong>
              </div>
            )}

            {/* CONTENT */}

            <div className="modal-content">
              {getContent(
                selectedResult
              )}
            </div>

            {/* FOOTER */}

            <div className="modal-footer">
              <div>
                <Brain size={15} />

                Retrieved from KnowFlow
                knowledge base
              </div>

              <button
                type="button"
                onClick={() =>
                  setSelectedResult(null)
                }
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}