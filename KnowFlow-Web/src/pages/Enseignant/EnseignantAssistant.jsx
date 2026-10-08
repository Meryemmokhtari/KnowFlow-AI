import { useCallback, useEffect, useRef, useState } from "react";

import {
  Sparkles,
  Send,
  Paperclip,
  FileText,
  Database,
  Brain,
  CheckCircle,
  Zap,
  Search,
  Upload,
  User,
  LoaderCircle,
  BookOpen,
  Lightbulb,
  GraduationCap,
  HelpCircle,
  Copy,
  RefreshCw,
  Plus,
} from "lucide-react";

import "./EnseignantAssistant.css";

// =====================================================
// API CONFIG
// =====================================================

const AI_API_URL =
  "http://localhost:5057/api/AI/ask";

const DOCUMENT_API_URL =
  "http://localhost:5260/api/Document";

// =====================================================
// INITIAL MESSAGE
// =====================================================

const INITIAL_MESSAGE = {
  id: "welcome-message",
  role: "ai",
  content:
    "Bonjour 👋 Je suis KnowFlow AI, votre assistant pédagogique. Posez-moi une question sur vos cours, documents ou concepts pédagogiques.",
  source: "Knowledge Base",
  score: "AI",
};

// =====================================================
// TEACHER SUGGESTIONS
// =====================================================

const suggestions = [
  {
    label: "Explain this lesson in a simple way",
    prompt:
      "Explain the relevant lesson from my documents in a simple, clear and pedagogical way. Structure the explanation step by step and give a concrete example.",
  },
  {
    label: "Summarize my course",
    prompt:
      "Summarize the most relevant course content from my documents. Keep the important concepts, definitions, formulas and key ideas. Organize the answer clearly for a teacher.",
  },
  {
    label: "Generate quiz questions",
    prompt:
      "Generate a useful quiz based on the relevant course documents. Include different levels of difficulty and provide the correct answers with short explanations.",
  },
  {
    label: "Create exercises for students",
    prompt:
      "Create practical exercises based on the relevant course content. Include easy, medium and difficult exercises and provide solutions or correction guidelines.",
  },
  {
    label: "Give me teaching examples",
    prompt:
      "Give me concrete teaching examples based on the relevant documents. Suggest simple examples, analogies and classroom explanations that can help students understand the concepts.",
  },
  {
    label: "Compare two concepts",
    prompt:
      "Compare the most relevant concepts from my documents. Explain their similarities, differences, use cases and give a clear comparison table when useful.",
  },
];

// =====================================================
// TEACHER TOOLS
// =====================================================

const teacherTools = [
  {
    id: "lesson",
    title: "Lesson Support",
    icon: BookOpen,
    prompt:
      "Help me prepare and explain the relevant lesson from my documents. Give me the main objectives, important concepts, a clear explanation and practical examples that I can use with students.",
  },
  {
    id: "ideas",
    title: "Teaching Ideas",
    icon: Lightbulb,
    prompt:
      "Based on my course documents, give me creative teaching ideas, classroom activities, practical examples and simple ways to explain difficult concepts to students.",
  },
  {
    id: "learning",
    title: "Student Learning",
    icon: GraduationCap,
    prompt:
      "Based on my course documents, suggest strategies to help students understand and learn the relevant concepts. Identify difficult points and propose simple explanations and learning activities.",
  },
  {
    id: "questions",
    title: "Questions & Exercises",
    icon: HelpCircle,
    prompt:
      "Create questions and exercises based on the relevant course documents. Include comprehension questions, application exercises and more advanced questions, with answers or correction guidance.",
  },
];

// =====================================================
// COMPONENT
// =====================================================

export default function EnseignantAssistant() {
  const [messages, setMessages] = useState([INITIAL_MESSAGE]);

  const [question, setQuestion] = useState("");

  const [documents, setDocuments] = useState([]);

  const [loadingDocuments, setLoadingDocuments] =
    useState(true);

  const [isThinking, setIsThinking] =
    useState(false);

  const [error, setError] = useState("");

  const [copiedId, setCopiedId] =
    useState(null);

  const messagesEndRef = useRef(null);

  const inputRef = useRef(null);

  // ===================================================
  // SCROLL TO BOTTOM
  // ===================================================

  const scrollToBottom = useCallback(() => {
    setTimeout(() => {
      messagesEndRef.current?.scrollIntoView({
        behavior: "smooth",
      });
    }, 50);
  }, []);

  useEffect(() => {
    scrollToBottom();
  }, [messages, isThinking, scrollToBottom]);

  // ===================================================
  // LOAD DOCUMENTS
  // ===================================================

  const loadDocuments = useCallback(async () => {
    setLoadingDocuments(true);
    setError("");

    try {
      const response = await fetch(
        DOCUMENT_API_URL
      );

      if (!response.ok) {
        throw new Error(
          `DocumentService returned ${response.status}`
        );
      }

      const data = await response.json();

      let docs = [];

      if (Array.isArray(data)) {
        docs = data;
      } else if (Array.isArray(data?.documents)) {
        docs = data.documents;
      } else if (Array.isArray(data?.items)) {
        docs = data.items;
      } else if (Array.isArray(data?.data)) {
        docs = data.data;
      }

      const validDocuments = docs.filter(
        (doc) =>
          doc &&
          (
            doc.extractedText ||
            doc.ExtractedText ||
            doc.content ||
            doc.Content
          )
      );

      setDocuments(validDocuments);

      if (validDocuments.length === 0) {
        setError(
          "Aucun document avec contenu exploitable n'a été trouvé dans la Knowledge Base."
        );
      }
    } catch (err) {
      console.error(
        "DocumentService error:",
        err
      );

      setDocuments([]);

      setError(
        "Impossible de charger les documents depuis DocumentService. Vérifiez que le service est démarré."
      );
    } finally {
      setLoadingDocuments(false);
    }
  }, []);

  // ===================================================
  // INITIAL DOCUMENT LOADING
  // ===================================================

  useEffect(() => {
    loadDocuments();
  }, [loadDocuments]);

  // ===================================================
  // GET DOCUMENT NAME
  // ===================================================

  const getDocumentName = (doc) => {
    return (
      doc?.fileName ||
      doc?.FileName ||
      doc?.name ||
      doc?.Name ||
      "Document"
    );
  };

  // ===================================================
  // GET DOCUMENT CONTENT
  // ===================================================

  const getDocumentContent = (doc) => {
    return (
      doc?.extractedText ||
      doc?.ExtractedText ||
      doc?.content ||
      doc?.Content ||
      ""
    );
  };

  // ===================================================
  // BUILD KNOWLEDGE CONTEXT
  // ===================================================

  const buildKnowledgeContext = () => {
    if (!documents.length) {
      return "";
    }

    return documents
      .map((doc) => {
        const fileName =
          getDocumentName(doc);

        const content =
          getDocumentContent(doc);

        return `
DOCUMENT:
${fileName}

CONTENT:
${content}
`;
      })
      .join("\n\n-----------------------------\n\n");
  };

  // ===================================================
  // EXTRACT AI RESPONSE
  // ===================================================

  const extractAIResponse = async (
    response
  ) => {
    const contentType =
      response.headers.get(
        "content-type"
      ) || "";

    if (
      contentType.includes(
        "application/json"
      )
    ) {
      const data =
        await response.json();

      if (typeof data === "string") {
        return data;
      }

      return (
        data?.response ||
        data?.answer ||
        data?.message ||
        data?.result ||
        data?.content ||
        JSON.stringify(data)
      );
    }

    return await response.text();
  };

  // ===================================================
  // SEND MESSAGE
  // ===================================================

  const sendMessage = async (
    customQuestion = null
  ) => {
    const finalQuestion =
      typeof customQuestion === "string"
        ? customQuestion.trim()
        : question.trim();

    if (!finalQuestion) {
      return;
    }

    if (isThinking) {
      return;
    }

    setError("");

    // -----------------------------------------------
    // USER MESSAGE
    // -----------------------------------------------

    const userMessage = {
      id: `user-${Date.now()}`,
      role: "user",
      content: finalQuestion,
    };

    setMessages((prev) => [
      ...prev,
      userMessage,
    ]);

    setQuestion("");

    // -----------------------------------------------
    // CHECK DOCUMENTS
    // -----------------------------------------------

    if (!documents.length) {
      setError(
        "Aucun document exploitable n'est disponible dans la Knowledge Base."
      );

      setMessages((prev) => [
        ...prev,
        {
          id: `error-${Date.now()}`,
          role: "ai",
          content:
            "Je ne peux pas encore répondre car aucun document exploitable n'est disponible dans la Knowledge Base. Veuillez vérifier DocumentService et vos documents.",
          source:
            "Knowledge Base",
          score: "Error",
        },
      ]);

      return;
    }

    // -----------------------------------------------
    // START AI
    // -----------------------------------------------

    setIsThinking(true);

    try {
      const knowledgeContext =
        buildKnowledgeContext();

      const response = await fetch(
        AI_API_URL,
        {
          method: "POST",

          headers: {
            "Content-Type":
              "application/json",
          },

          body: JSON.stringify({
            text: knowledgeContext,
            question: finalQuestion,
          }),
        }
      );

      if (!response.ok) {
        let serverMessage = "";

        try {
          const errorData =
            await response.json();

          serverMessage =
            errorData?.message ||
            errorData?.error ||
            "";
        } catch {
          // Ignore invalid error JSON
        }

        throw new Error(
          serverMessage ||
            `AIService returned ${response.status}`
        );
      }

      const answer =
        await extractAIResponse(
          response
        );

      if (!answer || !answer.trim()) {
        throw new Error(
          "AIService returned an empty response."
        );
      }

      // ---------------------------------------------
      // AI MESSAGE
      // ---------------------------------------------

      const aiMessage = {
        id: `ai-${Date.now()}`,
        role: "ai",
        content: answer.trim(),
        source: `${documents.length} document(s) from Knowledge Base`,
        score: "AI",
      };

      setMessages((prev) => [
        ...prev,
        aiMessage,
      ]);
    } catch (err) {
      console.error(
        "AI Assistant error:",
        err
      );

      let message =
        "Impossible de contacter AIService.";

      if (
        err?.message
          ?.toLowerCase()
          .includes("fetch")
      ) {
        message =
          "AIService est inaccessible. Vérifiez que le service AI est démarré sur le port 5057.";
      } else if (
        err?.message
          ?.toLowerCase()
          .includes("ollama")
      ) {
        message =
          "Ollama ne répond pas. Vérifiez que Ollama est démarré et que le modèle AI est disponible.";
      } else if (err?.message) {
        message =
          `AIService error: ${err.message}`;
      }

      setError(message);

      setMessages((prev) => [
        ...prev,
        {
          id: `error-${Date.now()}`,
          role: "ai",
          content:
            "Désolé, une erreur est survenue pendant la génération de la réponse. Vérifiez AIService et Ollama.",
          source:
            "AI Service",
          score: "Error",
        },
      ]);
    } finally {
      setIsThinking(false);

      setTimeout(() => {
        inputRef.current?.focus();
      }, 100);
    }
  };

  // ===================================================
  // ENTER KEY
  // ===================================================

  const handleKeyDown = (event) => {
    if (
      event.key === "Enter" &&
      !event.shiftKey
    ) {
      event.preventDefault();

      sendMessage();
    }
  };

  // ===================================================
  // TEACHER TOOL CLICK
  // ===================================================

  const handleTeacherTool = (
    tool
  ) => {
    sendMessage(tool.prompt);
  };

  // ===================================================
  // SUGGESTION CLICK
  // ===================================================

  const handleSuggestion = (
    suggestion
  ) => {
    sendMessage(
      suggestion.prompt
    );
  };

  // ===================================================
  // NEW CONVERSATION
  // ===================================================

  const startNewConversation = () => {
    setMessages([
      {
        ...INITIAL_MESSAGE,
        id: `welcome-${Date.now()}`,
      },
    ]);

    setQuestion("");

    setError("");

    setIsThinking(false);

    setTimeout(() => {
      inputRef.current?.focus();
    }, 100);
  };

  // ===================================================
  // COPY AI RESPONSE
  // ===================================================

  const copyMessage = async (
    message
  ) => {
    try {
      await navigator.clipboard.writeText(
        message.content
      );

      setCopiedId(message.id);

      setTimeout(() => {
        setCopiedId(null);
      }, 1800);
    } catch (err) {
      console.error(
        "Copy error:",
        err
      );
    }
  };

  // ===================================================
  // RENDER
  // ===================================================

  return (
    <div className="assistant-page">

      {/* =================================================
          HEADER
      ================================================= */}

      <header className="assistant-header">

        <div className="header-main">

          <div className="header-eyebrow">
            <Sparkles size={16} />

            KNOWFLOW AI · TEACHER
          </div>

          <h1>
            AI Teaching Assistant
          </h1>

          <p>
            Transform your course knowledge
            into explanations, exercises and
            teaching ideas.
          </p>

        </div>

        <div className="ai-core">

          <span className="status-dot"></span>

          AI Core Online

        </div>

      </header>

      {/* =================================================
          AI PROFILE
      ================================================= */}

      <section className="ai-profile">

        <div className="ai-profile-main">

          <div className="ai-orb">
            <Brain size={30} />
          </div>

          <div className="ai-profile-text">

            <h2>
              Teaching Intelligence Engine
            </h2>

            <p>
              Your AI assistant for courses,
              lessons and educational content
            </p>

          </div>

        </div>

        <div className="engine-tags">

          <span>
            <Database size={14} />
            Knowledge Base Connected
          </span>

          <span>
            <Search size={14} />
            RAG Active
          </span>

          <span>
            <CheckCircle size={14} />
            AI Ready
          </span>

        </div>

      </section>

      {/* =================================================
          TEACHER TOOLS
      ================================================= */}

      <section className="teacher-tools">

        <button
          type="button"
          onClick={() =>
            handleTeacherTool(
              teacherTools[0]
            )
          }
          disabled={
            isThinking ||
            loadingDocuments
          }
        >
          <BookOpen size={20} />

          <span>
            <strong>
              Lesson Support
            </strong>

            <small>
              Explain & prepare lessons
            </small>
          </span>
        </button>

        <button
          type="button"
          onClick={() =>
            handleTeacherTool(
              teacherTools[1]
            )
          }
          disabled={
            isThinking ||
            loadingDocuments
          }
        >
          <Lightbulb size={20} />

          <span>
            <strong>
              Teaching Ideas
            </strong>

            <small>
              Activities & examples
            </small>
          </span>
        </button>

        <button
          type="button"
          onClick={() =>
            handleTeacherTool(
              teacherTools[2]
            )
          }
          disabled={
            isThinking ||
            loadingDocuments
          }
        >
          <GraduationCap size={20} />

          <span>
            <strong>
              Student Learning
            </strong>

            <small>
              Learning strategies
            </small>
          </span>
        </button>

        <button
          type="button"
          onClick={() =>
            handleTeacherTool(
              teacherTools[3]
            )
          }
          disabled={
            isThinking ||
            loadingDocuments
          }
        >
          <HelpCircle size={20} />

          <span>
            <strong>
              Questions & Exercises
            </strong>

            <small>
              Quizzes & practice
            </small>
          </span>
        </button>

      </section>

      {/* =================================================
          ERROR / STATUS
      ================================================= */}

      {error && (
        <div className="assistant-error">

          <Zap size={17} />

          <span>
            {error}
          </span>

          <button
            type="button"
            onClick={loadDocuments}
            title="Retry"
          >
            <RefreshCw size={16} />
          </button>

        </div>
      )}

      {/* =================================================
          KNOWLEDGE STATUS
      ================================================= */}

      <div className="knowledge-status">

        <div className="knowledge-status-item">

          <Database size={15} />

          <span>
            Knowledge Base
          </span>

          <strong>
            {loadingDocuments
              ? "Loading..."
              : `${documents.length} document(s)`}
          </strong>

        </div>

        <div className="knowledge-status-item">

          <CheckCircle size={15} />

          <span>
            AI Context
          </span>

          <strong>
            {documents.length > 0
              ? "Ready"
              : "Waiting"}
          </strong>

        </div>

      </div>

      {/* =================================================
          CHAT
      ================================================= */}

      <section className="chat-container">

        <div className="chat-messages">

          {messages.map(
            (message) => {

              const isAI =
                message.role === "ai";

              return (
                <div
                  key={message.id}
                  className={`message ${
                    isAI
                      ? "ai-message"
                      : "user-message"
                  }`}
                >

                  {/* AVATAR */}

                  <div className="avatar">

                    {isAI ? (
                      <div className="ai-avatar">
                        <Brain
                          size={18}
                        />
                      </div>
                    ) : (
                      <div className="user-avatar">
                        <User
                          size={18}
                        />
                      </div>
                    )}

                  </div>

                  {/* MESSAGE BODY */}

                  <div className="message-body">

                    <div className="message-top">

                      <span className="message-author">
                        {isAI
                          ? "KnowFlow AI"
                          : "You"}
                      </span>

                      {isAI &&
                        message.score ===
                          "AI" && (
                          <span className="ai-label">
                            AI
                          </span>
                        )}

                    </div>

                    <div className="message-content">
                      {message.content}
                    </div>

                    {/* SOURCE */}

                    {isAI &&
                      message.source && (
                        <div className="source-mini">

                          <FileText
                            size={14}
                          />

                          <span>
                            {message.source}
                          </span>

                          {message.score ===
                            "AI" && (
                            <span className="source-score">
                              <CheckCircle
                                size={13}
                              />
                              Context Used
                            </span>
                          )}

                        </div>
                      )}

                    {/* ACTIONS */}

                    {isAI &&
                      message.score ===
                        "AI" && (
                        <div className="message-actions">

                          <button
                            type="button"
                            onClick={() =>
                              copyMessage(
                                message
                              )
                            }
                            title="Copy answer"
                          >
                            {copiedId ===
                            message.id ? (
                              <CheckCircle
                                size={14}
                              />
                            ) : (
                              <Copy
                                size={14}
                              />
                            )}

                            <span>
                              {copiedId ===
                              message.id
                                ? "Copied"
                                : "Copy"}
                            </span>
                          </button>

                        </div>
                      )}

                  </div>

                </div>
              );
            }
          )}

          {/* =============================================
              THINKING
          ============================================= */}

          {isThinking && (
            <div className="message ai-message">

              <div className="avatar">

                <div className="ai-avatar">
                  <Brain size={18} />
                </div>

              </div>

              <div className="message-body">

                <div className="message-top">

                  <span className="message-author">
                    KnowFlow AI
                  </span>

                  <span className="ai-label">
                    AI
                  </span>

                </div>

                <div className="thinking">

                  <LoaderCircle
                    size={17}
                    className="thinking-spinner"
                  />

                  <span>
                    KnowFlow AI is preparing
                    your teaching answer...
                  </span>

                </div>

              </div>

            </div>
          )}

          <div
            ref={messagesEndRef}
          />

        </div>

        {/* =================================================
            SUGGESTIONS
        ================================================= */}

        {messages.length <= 1 &&
          !isThinking && (
            <div className="suggestions">

              <div className="suggestions-header">

                <Sparkles size={16} />

                <span>
                  Teacher shortcuts
                </span>

              </div>

              <div className="suggestions-grid">

                {suggestions.map(
                  (suggestion) => (
                    <button
                      type="button"
                      key={
                        suggestion.label
                      }
                      onClick={() =>
                        handleSuggestion(
                          suggestion
                        )
                      }
                      disabled={
                        loadingDocuments ||
                        documents.length ===
                          0 ||
                        isThinking
                      }
                    >
                      <Sparkles
                        size={15}
                      />

                      <span>
                        {suggestion.label}
                      </span>
                    </button>
                  )
                )}

              </div>

            </div>
          )}

        {/* =================================================
            INPUT
        ================================================= */}

        <div className="chat-input">

          <div className="input-icon">

            <Paperclip size={19} />

          </div>

          <textarea
            ref={inputRef}
            value={question}
            onChange={(event) =>
              setQuestion(
                event.target.value
              )
            }
            onKeyDown={
              handleKeyDown
            }
            placeholder="Ask about your course, lesson or students..."
            rows={1}
            disabled={isThinking}
          />

          <button
            type="button"
            className="send-button"
            onClick={() =>
              sendMessage()
            }
            disabled={
              !question.trim() ||
              isThinking ||
              loadingDocuments ||
              documents.length === 0
            }
            title="Send"
          >

            {isThinking ? (
              <LoaderCircle
                size={20}
                className="thinking-spinner"
              />
            ) : (
              <Send size={20} />
            )}

          </button>

        </div>

        {/* =================================================
            CHAT FOOTER
        ================================================= */}

        <div className="assistant-footer">

          <div>
            <Search size={14} />
            Semantic Understanding
          </div>

          <div>
            <FileText size={14} />
            Teaching Documents
          </div>

          <div>
            <Brain size={14} />
            AI Pedagogical Reasoning
          </div>

        </div>

      </section>

      {/* =================================================
          BOTTOM ACTIONS
      ================================================= */}

      <div className="assistant-bottom-actions">

        <button
          type="button"
          onClick={startNewConversation}
          disabled={isThinking}
        >
          <Plus size={16} />

          New Conversation
        </button>

        <button
          type="button"
          onClick={loadDocuments}
          disabled={loadingDocuments}
        >
          <RefreshCw
            size={16}
            className={
              loadingDocuments
                ? "thinking-spinner"
                : ""
            }
          />

          Refresh Knowledge Base
        </button>

      </div>

    </div>
  );
}