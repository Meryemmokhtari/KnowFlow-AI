import React, { useEffect, useMemo, useRef, useState } from "react";
import {
  ArrowUp,
  BrainCircuit,
  Check,
  CircleAlert,
  Database,
  FileText,
  Layers3,
  MessageSquare,
  Plus,
  RefreshCw,
  Sparkles,
  Trash2,
  X,
  Zap,
} from "lucide-react";

import "./EtudiantAssistant.css";

const API = {
  AI: "http://localhost:5057/api/AI",
  DOCUMENT: "http://localhost:5260/api/Document",
};

const MAX_CONTEXT = 3500;
const MAX_DOCUMENT_TEXT = 1500;
const MAX_DOCUMENTS = 2;

function getStoredToken() {
  return (
    localStorage.getItem("token") ||
    localStorage.getItem("accessToken") ||
    sessionStorage.getItem("token") ||
    sessionStorage.getItem("accessToken") ||
    ""
  );
}

function decodeJwt(token) {
  try {
    const payload = token.split(".")[1];

    if (!payload) return null;

    return JSON.parse(
      decodeURIComponent(
        atob(payload.replace(/-/g, "+").replace(/_/g, "/"))
          .split("")
          .map((char) => {
            return "%" + ("00" + char.charCodeAt(0).toString(16)).slice(-2);
          })
          .join("")
      )
    );
  } catch {
    try {
      return JSON.parse(atob(token.split(".")[1]));
    } catch {
      return null;
    }
  }
}

function getCurrentUser() {
  const token = getStoredToken();

  if (!token) {
    return {
      id: "",
      name: "Étudiant",
      email: "",
    };
  }

  const payload = decodeJwt(token);

  if (!payload) {
    return {
      id: "",
      name: "Étudiant",
      email: "",
    };
  }

  const id =
    payload.sub ||
    payload.userId ||
    payload.UserId ||
    payload[
      "http://schemas.xmlsoap.org/ws/2005/05/identity/claims/nameidentifier"
    ] ||
    "";

  const name =
    payload.name ||
    payload.unique_name ||
    payload.userName ||
    payload.UserName ||
    payload[
      "http://schemas.xmlsoap.org/ws/2005/05/identity/claims/name"
    ] ||
    payload[
      "http://schemas.xmlsoap.org/ws/2005/05/identity/claims/givenname"
    ] ||
    "Étudiant";

  const email =
    payload.email ||
    payload[
      "http://schemas.xmlsoap.org/ws/2005/05/identity/claims/emailaddress"
    ] ||
    "";

  return {
    id: String(id),
    name: String(name),
    email: String(email),
  };
}

function getAuthHeaders() {
  const token = getStoredToken();
  const user = getCurrentUser();

  return {
    Accept: "application/json",
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
    ...(user.id ? { "X-User-Id": user.id } : {}),
    ...(user.name ? { "X-User-Name": user.name } : {}),
  };
}

async function parseResponse(response) {
  const text = await response.text();

  if (!text) {
    return {};
  }

  try {
    return JSON.parse(text);
  } catch {
    return {
      message: text,
    };
  }
}

function extractTextFromDocument(document) {
  return (
    document?.extractedText ||
    document?.ExtractedText ||
    document?.content ||
    document?.Content ||
    document?.text ||
    document?.Text ||
    ""
  );
}

function extractDocumentId(document) {
  return (
    document?.id ||
    document?.Id ||
    document?.documentId ||
    document?.DocumentId ||
    ""
  );
}

function extractDocumentName(document) {
  return (
    document?.fileName ||
    document?.FileName ||
    document?.name ||
    document?.Name ||
    "Document sans nom"
  );
}

function extractAIAnswer(data) {
  if (!data) {
    return "";
  }

  if (typeof data === "string") {
    return data;
  }

  return (
    data.answer ||
    data.Answer ||
    data.response ||
    data.Response ||
    data.result ||
    data.Result ||
    data.message ||
    data.Message ||
    data.text ||
    data.Text ||
    ""
  );
}

function formatTime(date = new Date()) {
  return date.toLocaleTimeString("fr-FR", {
    hour: "2-digit",
    minute: "2-digit",
  });
}

function getInitials(name) {
  if (!name) return "ET";

  return name
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part.charAt(0).toUpperCase())
    .join("");
}

const suggestions = [
  {
    icon: BrainCircuit,
    label: "Understand",
    title: "Explain a concept",
    text: "Explique-moi clairement un concept important de mes documents.",
  },
  {
    icon: FileText,
    label: "Summarize",
    title: "Summarize my knowledge",
    text: "Résume les points essentiels de mes documents.",
  },
  {
    icon: Layers3,
    label: "Study",
    title: "Prepare for revision",
    text: "Prépare-moi une fiche de révision à partir de mes documents.",
  },
  {
    icon: Sparkles,
    label: "Explore",
    title: "Find connections",
    text: "Trouve les connexions importantes entre mes documents.",
  },
];

export default function EtudiantAssistant() {
  const [user, setUser] = useState(() => getCurrentUser());

  const [documents, setDocuments] = useState([]);
  const [messages, setMessages] = useState([]);

  const [question, setQuestion] = useState("");
  const [loadingDocuments, setLoadingDocuments] = useState(true);
  const [loading, setLoading] = useState(false);

  const [error, setError] = useState("");
  const [documentsError, setDocumentsError] = useState("");

  const textareaRef = useRef(null);
  const messagesEndRef = useRef(null);

  const documentCount = documents.length;

  const userInitials = useMemo(
    () => getInitials(user.name),
    [user.name]
  );

  const totalStorage = useMemo(() => {
    return documents.reduce((total, document) => {
      const size =
        Number(document?.fileSize) ||
        Number(document?.FileSize) ||
        0;

      return total + size;
    }, 0);
  }, [documents]);

  const storageLabel = useMemo(() => {
    if (!totalStorage) return "0 KB";

    if (totalStorage < 1024) {
      return `${totalStorage} B`;
    }

    if (totalStorage < 1024 * 1024) {
      return `${(totalStorage / 1024).toFixed(1)} KB`;
    }

    if (totalStorage < 1024 * 1024 * 1024) {
      return `${(totalStorage / (1024 * 1024)).toFixed(1)} MB`;
    }

    return `${(totalStorage / (1024 * 1024 * 1024)).toFixed(1)} GB`;
  }, [totalStorage]);

  useEffect(() => {
    const currentUser = getCurrentUser();
    setUser(currentUser);
  }, []);

  useEffect(() => {
    loadDocuments();
  }, []);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({
      behavior: "smooth",
      block: "end",
    });
  }, [messages, loading]);

  useEffect(() => {
    if (!textareaRef.current) return;

    textareaRef.current.style.height = "auto";

    const newHeight = Math.min(
      textareaRef.current.scrollHeight,
      180
    );

    textareaRef.current.style.height = `${newHeight}px`;
  }, [question]);

  async function loadDocuments() {
    setLoadingDocuments(true);
    setDocumentsError("");

    try {
      const currentUser = getCurrentUser();

      const response = await fetch(API.DOCUMENT, {
        method: "GET",
        headers: getAuthHeaders(),
      });

      const data = await parseResponse(response);

      if (!response.ok) {
        throw new Error(
          data?.message ||
            data?.Message ||
            `Erreur Documents (${response.status})`
        );
      }

      let list = Array.isArray(data)
        ? data
        : data?.data ||
          data?.documents ||
          data?.Documents ||
          [];

      if (!Array.isArray(list)) {
        list = [];
      }

      if (currentUser.id) {
        list = list.filter((document) => {
          const documentUserId =
            document?.userId ||
            document?.UserId ||
            "";

          return (
            !documentUserId ||
            String(documentUserId).toLowerCase() ===
              String(currentUser.id).toLowerCase()
          );
        });
      }

      setDocuments(list);
    } catch (err) {
      console.error("KnowFlow documents error:", err);

      setDocuments([]);
      setDocumentsError(
        err?.message ||
          "Impossible de charger vos documents."
      );
    } finally {
      setLoadingDocuments(false);
    }
  }

  async function getDocumentDetails(document) {
    const existingText = extractTextFromDocument(document);

    if (existingText.trim()) {
      return {
        ...document,
        extractedText: existingText,
      };
    }

    const id = extractDocumentId(document);

    if (!id) {
      return document;
    }

    try {
      const response = await fetch(
        `${API.DOCUMENT}/${encodeURIComponent(id)}`,
        {
          method: "GET",
          headers: getAuthHeaders(),
        }
      );

      if (!response.ok) {
        return document;
      }

      const data = await parseResponse(response);

      return {
        ...document,
        ...data,
        extractedText: extractTextFromDocument(data),
      };
    } catch (err) {
      console.warn(
        "Unable to enrich document:",
        extractDocumentName(document),
        err
      );

      return document;
    }
  }

  async function buildKnowledgeContext() {
    if (!documents.length) {
      return {
        context: "",
        sources: [],
      };
    }

    const selectedDocuments = documents.slice(
      0,
      MAX_DOCUMENTS
    );

    const detailedDocuments = await Promise.all(
      selectedDocuments.map(getDocumentDetails)
    );

    let context = "";
    const sources = [];

    for (const document of detailedDocuments) {
      const name = extractDocumentName(document);

      let text = extractTextFromDocument(document);

      if (!text) {
        continue;
      }

      text = String(text).trim();

      if (!text) {
        continue;
      }

      text = text.slice(0, MAX_DOCUMENT_TEXT);

      const block = `\n\n===== SOURCE: ${name} =====\n${text}\n`;

      if (
        context.length + block.length >
        MAX_CONTEXT
      ) {
        break;
      }

      context += block;

      sources.push({
        id: extractDocumentId(document) || name,
        name,
      });
    }

    return {
      context,
      sources,
    };
  }

  function handleTextareaKeyDown(event) {
    if (event.key === "Enter" && !event.shiftKey) {
      event.preventDefault();

      if (!loading) {
        handleAsk();
      }
    }
  }

  function handleSuggestion(text) {
    setQuestion(text);

    requestAnimationFrame(() => {
      textareaRef.current?.focus();
    });
  }

  async function handleAsk() {
    const finalQuestion = question.trim();

    if (!finalQuestion || loading) {
      return;
    }

    setError("");

    if (!documents.length) {
      setError(
        "Ajoutez au moins un document avant d'utiliser l'Assistant IA."
      );
      return;
    }

    const userMessage = {
      id: `user-${Date.now()}`,
      role: "user",
      content: finalQuestion,
      time: formatTime(),
    };

    setMessages((previous) => [
      ...previous,
      userMessage,
    ]);

    setQuestion("");
    setLoading(true);

    try {
      const { context, sources } =
        await buildKnowledgeContext();

      if (!context.trim()) {
        throw new Error(
          "Aucun contenu exploitable n'a été trouvé dans vos documents."
        );
      }

      const response = await fetch(
        `${API.AI}/ask`,
        {
          method: "POST",
          headers: {
            ...getAuthHeaders(),
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            text: context,
            question: finalQuestion,
          }),
        }
      );

      const data = await parseResponse(response);

      if (!response.ok) {
        throw new Error(
          data?.message ||
            data?.Message ||
            data?.error ||
            data?.Error ||
            `Erreur AI (${response.status})`
        );
      }

      const answer = extractAIAnswer(data);

      if (!answer.trim()) {
        throw new Error(
          "L'IA n'a retourné aucune réponse."
        );
      }

      const assistantMessage = {
        id: `assistant-${Date.now()}`,
        role: "assistant",
        content: answer,
        sources,
        time: formatTime(),
      };

      setMessages((previous) => [
        ...previous,
        assistantMessage,
      ]);
    } catch (err) {
      console.error("KnowFlow AI error:", err);

      const message =
        err?.message ||
        "Une erreur est survenue pendant la communication avec l'IA.";

      setError(message);

      setMessages((previous) => [
        ...previous,
        {
          id: `error-${Date.now()}`,
          role: "assistant",
          isError: true,
          content:
            "Je n'ai pas pu générer la réponse. Vérifiez que les services KnowFlow AI et Ollama sont actifs.",
          time: formatTime(),
        },
      ]);
    } finally {
      setLoading(false);

      requestAnimationFrame(() => {
        textareaRef.current?.focus();
      });
    }
  }

  function clearConversation() {
    setMessages([]);
    setError("");

    requestAnimationFrame(() => {
      textareaRef.current?.focus();
    });
  }

  function refreshDocuments() {
    loadDocuments();
  }

  const hasConversation = messages.length > 0;

  return (
    <div className="kf-assistant">
      <div className="kf-background-grid" />
      <div className="kf-background-glow kf-glow-one" />
      <div className="kf-background-glow kf-glow-two" />

      <header className="kf-topbar">
        <div className="kf-brand">
          <div className="kf-brand-mark">
            <BrainCircuit size={21} />
          </div>

          <div>
            <div className="kf-brand-name">
              KnowFlow
            </div>

            <div className="kf-brand-subtitle">
              Knowledge Intelligence
            </div>
          </div>
        </div>

        <div className="kf-system-status">
          <span className="kf-status-dot" />
          <span>CORE ONLINE</span>
        </div>

        <div className="kf-topbar-right">
          <div className="kf-model-pill">
            <Zap size={14} />
            OLLAMA
          </div>

          <div className="kf-user">
            <div className="kf-user-avatar">
              {userInitials}
            </div>

            <div className="kf-user-info">
              <strong>{user.name}</strong>
              <span>Étudiant</span>
            </div>
          </div>
        </div>
      </header>

      {!hasConversation ? (
        <main className="kf-home">
          <section className="kf-hero">
            <div className="kf-ai-core">
              <div className="kf-core-orbit kf-orbit-one" />
              <div className="kf-core-orbit kf-orbit-two" />
              <div className="kf-core-orbit kf-orbit-three" />

              <div className="kf-core-glow" />

              <div className="kf-core">
                <BrainCircuit size={42} strokeWidth={1.6} />
              </div>
            </div>

            <div className="kf-eyebrow">
              <span />
              KNOWFLOW INTELLIGENCE
              <span />
            </div>

            <h1>
              Your knowledge.
              <br />
              <span>Amplified.</span>
            </h1>

            <p className="kf-hero-description">
              Interrogez vos documents avec une intelligence
              artificielle connectée à votre espace de
              connaissances.
            </p>

            <div className="kf-capabilities">
              <div className="kf-capability">
                <Check size={13} />
                RAG ACTIVE
              </div>

              <div className="kf-capability">
                <Database size={13} />
                {loadingDocuments
                  ? "SYNC..."
                  : `${documentCount} DOCUMENT${
                      documentCount > 1 ? "S" : ""
                    }`}
              </div>

              <div className="kf-capability">
                <Check size={13} />
                PRIVATE CONTEXT
              </div>
            </div>
          </section>

          <section className="kf-composer-shell">
            <div className="kf-composer">
              <div className="kf-composer-icon">
                <Sparkles size={20} />
              </div>

              <textarea
                ref={textareaRef}
                value={question}
                onChange={(event) =>
                  setQuestion(event.target.value)
                }
                onKeyDown={handleTextareaKeyDown}
                placeholder="Ask anything about your knowledge..."
                rows={1}
                disabled={loading}
              />

              <button
                className="kf-send-button"
                type="button"
                onClick={handleAsk}
                disabled={
                  loading || !question.trim()
                }
                aria-label="Envoyer"
              >
                <ArrowUp size={19} />
              </button>
            </div>

            <div className="kf-composer-footer">
              <div className="kf-context-status">
                <span className="kf-live-dot" />

                {loadingDocuments
                  ? "Synchronisation des connaissances..."
                  : documents.length
                  ? `${documents.length} document${
                      documents.length > 1 ? "s" : ""
                    } disponible${
                      documents.length > 1 ? "s" : ""
                    }`
                  : "Aucun document disponible"}
              </div>

              <span className="kf-enter-hint">
                Enter ↵
              </span>
            </div>
          </section>

          {error && (
            <div className="kf-error-banner">
              <CircleAlert size={17} />
              <span>{error}</span>

              <button
                type="button"
                onClick={() => setError("")}
              >
                <X size={15} />
              </button>
            </div>
          )}

          {documentsError && (
            <div className="kf-warning-banner">
              <CircleAlert size={17} />
              <span>{documentsError}</span>

              <button
                type="button"
                onClick={refreshDocuments}
              >
                <RefreshCw size={15} />
              </button>
            </div>
          )}

          <section className="kf-suggestions">
            <div className="kf-section-heading">
              <span>START WITH AN IDEA</span>
              <div />
            </div>

            <div className="kf-suggestion-grid">
              {suggestions.map((suggestion) => {
                const Icon = suggestion.icon;

                return (
                  <button
                    key={suggestion.label}
                    type="button"
                    className="kf-suggestion-card"
                    onClick={() =>
                      handleSuggestion(
                        suggestion.text
                      )
                    }
                  >
                    <div className="kf-suggestion-icon">
                      <Icon size={18} />
                    </div>

                    <div className="kf-suggestion-content">
                      <span>
                        {suggestion.label}
                      </span>

                      <strong>
                        {suggestion.title}
                      </strong>
                    </div>

                    <ArrowUp
                      className="kf-suggestion-arrow"
                      size={16}
                    />
                  </button>
                );
              })}
            </div>
          </section>

          <section className="kf-knowledge-bar">
            <div className="kf-knowledge-icon">
              <Database size={18} />
            </div>

            <div className="kf-knowledge-copy">
              <strong>
                Your knowledge base
              </strong>

              <span>
                {loadingDocuments
                  ? "Indexation en cours..."
                  : `${documentCount} document${
                      documentCount > 1 ? "s" : ""
                    } • ${storageLabel}`}
              </span>
            </div>

            <div className="kf-knowledge-right">
              <div className="kf-index-status">
                <span />
                INDEXED
              </div>

              <button
                type="button"
                onClick={refreshDocuments}
                disabled={loadingDocuments}
                title="Actualiser"
              >
                <RefreshCw
                  size={16}
                  className={
                    loadingDocuments
                      ? "kf-spin"
                      : ""
                  }
                />
              </button>
            </div>
          </section>
        </main>
      ) : (
        <main className="kf-chat-page">
          <div className="kf-chat-header">
            <div>
              <div className="kf-chat-kicker">
                KNOWFLOW INTELLIGENCE
              </div>

              <h2>Knowledge session</h2>

              <p>
                Réponses générées à partir de vos
                documents.
              </p>
            </div>

            <div className="kf-chat-actions">
              <div className="kf-session-badge">
                <span />
                RAG ACTIVE
              </div>

              <button
                type="button"
                className="kf-clear-button"
                onClick={clearConversation}
              >
                <Trash2 size={16} />
                Clear
              </button>
            </div>
          </div>

          <div className="kf-chat-stream">
            {messages.map((message) => (
              <article
                key={message.id}
                className={`kf-message ${
                  message.role === "user"
                    ? "kf-message-user"
                    : "kf-message-ai"
                }`}
              >
                <div className="kf-message-avatar">
                  {message.role === "user" ? (
                    userInitials
                  ) : (
                    <BrainCircuit size={18} />
                  )}
                </div>

                <div className="kf-message-body">
                  <div className="kf-message-meta">
                    <strong>
                      {message.role === "user"
                        ? user.name
                        : "KnowFlow AI"}
                    </strong>

                    <span>
                      {message.time}
                    </span>
                  </div>

                  <div
                    className={`kf-message-content ${
                      message.isError
                        ? "kf-message-error"
                        : ""
                    }`}
                  >
                    {message.content}
                  </div>

                  {message.sources?.length > 0 && (
                    <div className="kf-sources">
                      <div className="kf-sources-title">
                        <Layers3 size={14} />
                        SOURCES
                      </div>

                      <div className="kf-source-list">
                        {message.sources.map(
                          (source) => (
                            <div
                              className="kf-source"
                              key={source.id}
                            >
                              <FileText
                                size={14}
                              />

                              <span>
                                {source.name}
                              </span>
                            </div>
                          )
                        )}
                      </div>
                    </div>
                  )}
                </div>
              </article>
            ))}

            {loading && (
              <article className="kf-message kf-message-ai">
                <div className="kf-message-avatar">
                  <BrainCircuit size={18} />
                </div>

                <div className="kf-message-body">
                  <div className="kf-message-meta">
                    <strong>
                      KnowFlow AI
                    </strong>

                    <span>thinking</span>
                  </div>

                  <div className="kf-thinking">
                    <span />
                    <span />
                    <span />
                    <em>
                      Analyse de votre
                      knowledge base...
                    </em>
                  </div>
                </div>
              </article>
            )}

            <div ref={messagesEndRef} />
          </div>

          {error && (
            <div className="kf-error-banner kf-chat-error">
              <CircleAlert size={17} />
              <span>{error}</span>

              <button
                type="button"
                onClick={() => setError("")}
              >
                <X size={15} />
              </button>
            </div>
          )}

          <div className="kf-chat-composer-wrap">
            <div className="kf-chat-composer">
              <button
                type="button"
                className="kf-plus-button"
                title="Ajouter"
                disabled
              >
                <Plus size={19} />
              </button>

              <textarea
                ref={textareaRef}
                value={question}
                onChange={(event) =>
                  setQuestion(event.target.value)
                }
                onKeyDown={handleTextareaKeyDown}
                placeholder="Continue the conversation..."
                rows={1}
                disabled={loading}
              />

              <button
                type="button"
                className="kf-send-button"
                onClick={handleAsk}
                disabled={
                  loading || !question.trim()
                }
                aria-label="Envoyer"
              >
                <ArrowUp size={19} />
              </button>
            </div>

            <div className="kf-chat-composer-info">
              <span>
                <MessageSquare size={13} />
                {documentCount} documents
                connectés
              </span>

              <span>
                AI responses are grounded in
                your private knowledge
              </span>
            </div>
          </div>
        </main>
      )}
    </div>
  );
}