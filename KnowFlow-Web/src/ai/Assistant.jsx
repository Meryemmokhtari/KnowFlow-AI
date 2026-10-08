import { useState } from "react";

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
} from "lucide-react";

import "./Assistant.css";

// =========================================================
// API CONFIGURATION
// =========================================================

const AI_API_URL = "http://localhost:5057/api/AI/ask";

const DOCUMENT_API_URL =
  "http://localhost:5260/api/Document";

// =========================================================
// RAG CONFIGURATION
// =========================================================

// Maximum total amount of document text sent to AIService.
const MAX_CONTEXT_LENGTH = 3500;

// Maximum characters taken from one document.
const MAX_DOCUMENT_LENGTH = 1500;

// Maximum number of documents used for the AI context.
const MAX_DOCUMENTS = 2;

// =========================================================
// ASSISTANT
// =========================================================

export default function Assistant() {
  const [question, setQuestion] = useState("");

  const [messages, setMessages] = useState([
    {
      id: 1,
      sender: "ai",
      text:
        "Hello 👋 I am KnowFlow AI. Ask me anything about your knowledge base.",
      sources: [],
    },
  ]);

  const [isLoading, setIsLoading] = useState(false);

  const [error, setError] = useState("");

  // =========================================================
  // GET JWT TOKEN
  // =========================================================

  const getToken = () => {
    return (
      localStorage.getItem("token") ||
      localStorage.getItem("accessToken") ||
      sessionStorage.getItem("token") ||
      sessionStorage.getItem("accessToken") ||
      ""
    );
  };

  // =========================================================
  // SUGGESTIONS
  // =========================================================

  const suggestions = [
    "What is KnowFlow AI?",
    "Explain the system architecture",
    "What security technologies are used?",
    "Summarize KnowFlow AI",
  ];

  // =========================================================
  // NORMALIZE TEXT
  // =========================================================

  const normalizeText = (text) => {
    return String(text || "")
      .toLowerCase()
      .replace(/[^\p{L}\p{N}\s]/gu, " ")
      .replace(/\s+/g, " ")
      .trim();
  };

  // =========================================================
  // CALCULATE DOCUMENT RELEVANCE
  // =========================================================

  const calculateRelevance = (
    document,
    searchQuestion
  ) => {
    const fileName = normalizeText(
      document.fileName ||
        document.FileName ||
        ""
    );

    const text = normalizeText(
      document.extractedText ||
        document.ExtractedText ||
        ""
    );

    const questionText =
      normalizeText(searchQuestion);

    if (!questionText) {
      return 0;
    }

    const questionWords = questionText
      .split(" ")
      .filter(
        (word) => word.length >= 3
      );

    if (questionWords.length === 0) {
      return 0;
    }

    let score = 0;

    for (const word of questionWords) {
      // Filename matches are highly relevant.
      if (fileName.includes(word)) {
        score += 10;
      }

      // Count occurrences inside document.
      const occurrences =
        text.split(word).length - 1;

      if (occurrences > 0) {
        score += Math.min(
          occurrences,
          10
        );
      }
    }

    return score;
  };

  // =========================================================
  // BUILD SMART KNOWLEDGE CONTEXT
  // =========================================================

  const buildKnowledgeContext = (
    documents,
    searchQuestion
  ) => {
    // -------------------------------------------------------
    // Keep only documents with extracted text
    // -------------------------------------------------------

    const validDocuments =
      documents.filter(
        (document) => {
          if (!document) {
            return false;
          }

          const extractedText =
            document.extractedText ||
            document.ExtractedText ||
            "";

          return (
            typeof extractedText ===
              "string" &&
            extractedText.trim().length > 0
          );
        }
      );

    if (validDocuments.length === 0) {
      return {
        context: "",
        selectedDocuments: [],
      };
    }

    // -------------------------------------------------------
    // Score documents according to question
    // -------------------------------------------------------

    const rankedDocuments =
      validDocuments
        .map((document) => ({
          document,
          relevance:
            calculateRelevance(
              document,
              searchQuestion
            ),
        }))
        .sort(
          (a, b) =>
            b.relevance -
            a.relevance
        );

    // -------------------------------------------------------
    // Select best documents
    // -------------------------------------------------------

    const selected =
      rankedDocuments.slice(
        0,
        MAX_DOCUMENTS
      );

    // -------------------------------------------------------
    // Build context
    // -------------------------------------------------------

    let totalLength = 0;

    const contextParts = [];

    const actuallySelectedDocuments = [];

    for (const item of selected) {
      const document =
        item.document;

      const fileName =
        document.fileName ||
        document.FileName ||
        "Unknown document";

      const extractedText =
        document.extractedText ||
        document.ExtractedText ||
        "";

      if (!extractedText.trim()) {
        continue;
      }

      // -----------------------------------------------------
      // Remaining available space
      // -----------------------------------------------------

      const remainingSpace =
        MAX_CONTEXT_LENGTH -
        totalLength;

      if (remainingSpace <= 0) {
        break;
      }

      // -----------------------------------------------------
      // Limit one document
      // -----------------------------------------------------

      const allowedLength =
        Math.min(
          MAX_DOCUMENT_LENGTH,
          remainingSpace
        );

      const limitedText =
        extractedText
          .trim()
          .substring(
            0,
            allowedLength
          );

      // -----------------------------------------------------
      // Create document block
      // -----------------------------------------------------

      const documentBlock = `
DOCUMENT:
${fileName}

CONTENT:
${limitedText}
`.trim();

      // -----------------------------------------------------
      // Final protection against context overflow
      // -----------------------------------------------------

      if (
        totalLength +
          documentBlock.length >
        MAX_CONTEXT_LENGTH
      ) {
        const available =
          MAX_CONTEXT_LENGTH -
          totalLength;

        if (available <= 0) {
          break;
        }

        const shortenedBlock =
          documentBlock.substring(
            0,
            available
          );

        contextParts.push(
          shortenedBlock
        );

        totalLength +=
          shortenedBlock.length;

        actuallySelectedDocuments.push(
          document
        );

        break;
      }

      contextParts.push(
        documentBlock
      );

      totalLength +=
        documentBlock.length;

      actuallySelectedDocuments.push(
        document
      );

      if (
        totalLength >=
        MAX_CONTEXT_LENGTH
      ) {
        break;
      }
    }

    return {
      context:
        contextParts.join("\n\n"),

      selectedDocuments:
        actuallySelectedDocuments,
    };
  };

  // =========================================================
  // SEND MESSAGE
  // =========================================================

  const sendMessage = async (
    customQuestion = null
  ) => {
    const finalQuestion = (
      customQuestion ?? question
    ).trim();

    // -------------------------------------------------------
    // VALIDATION
    // -------------------------------------------------------

    if (
      !finalQuestion ||
      isLoading
    ) {
      return;
    }

    // -------------------------------------------------------
    // JWT
    // -------------------------------------------------------

    const token = getToken();

    console.log(
      "=============================================="
    );

    console.log(
      "KnowFlow AI Assistant"
    );

    console.log(
      "JWT token found:",
      token ? "YES" : "NO"
    );

    console.log(
      "=============================================="
    );

    if (!token) {
      setError(
        "Authentication token not found. Please login again."
      );

      return;
    }

    // -------------------------------------------------------
    // USER MESSAGE
    // -------------------------------------------------------

    const userMessage = {
      id: Date.now(),
      sender: "user",
      text: finalQuestion,
    };

    setMessages(
      (previousMessages) => [
        ...previousMessages,
        userMessage,
      ]
    );

    setQuestion("");

    setError("");

    setIsLoading(true);

    try {
      // =====================================================
      // STEP 1 — GET USER DOCUMENTS
      // =====================================================

      console.log(
        "Loading documents from DocumentService..."
      );

      const documentsResponse =
        await fetch(
          DOCUMENT_API_URL,
          {
            method: "GET",

            headers: {
              Accept:
                "application/json",

              Authorization:
                `Bearer ${token}`,
            },
          }
        );

      // -----------------------------------------------------
      // DOCUMENT SERVICE 401
      // -----------------------------------------------------

      if (
        documentsResponse.status ===
        401
      ) {
        throw new Error(
          "DocumentService returned 401 Unauthorized. Your JWT was rejected."
        );
      }

      // -----------------------------------------------------
      // DOCUMENT SERVICE 403
      // -----------------------------------------------------

      if (
        documentsResponse.status ===
        403
      ) {
        throw new Error(
          "You are not allowed to access these documents."
        );
      }

      // -----------------------------------------------------
      // OTHER ERRORS
      // -----------------------------------------------------

      if (
        !documentsResponse.ok
      ) {
        throw new Error(
          `DocumentService error: ${documentsResponse.status}`
        );
      }

      const documents =
        await documentsResponse.json();

      if (
        !Array.isArray(documents)
      ) {
        throw new Error(
          "DocumentService returned invalid data."
        );
      }

      console.log(
        "Documents loaded:",
        documents.length
      );

      // =====================================================
      // STEP 2 — BUILD SMART RAG CONTEXT
      // =====================================================

      console.log(
        "Building relevant knowledge context..."
      );

      const {
        context: documentText,
        selectedDocuments,
      } =
        buildKnowledgeContext(
          documents,
          finalQuestion
        );

      if (
        !documentText.trim()
      ) {
        throw new Error(
          "No extracted text found in the knowledge base."
        );
      }

      console.log(
        "Knowledge context prepared:",
        documentText.length,
        "characters"
      );

      console.log(
        "Documents selected for RAG:",
        selectedDocuments.length
      );

      selectedDocuments.forEach(
        (document, index) => {
          console.log(
            `RAG document ${index + 1}:`,
            document.fileName ||
              document.FileName ||
              "Unknown"
          );
        }
      );

      // =====================================================
      // STEP 3 — ASK AI SERVICE
      // =====================================================

      console.log(
        "Sending question to AIService..."
      );

      const response =
        await fetch(
          AI_API_URL,
          {
            method: "POST",

            headers: {
              "Content-Type":
                "application/json",

              Accept:
                "application/json",

              Authorization:
                `Bearer ${token}`,
            },

            body:
              JSON.stringify({
                text:
                  documentText,

                question:
                  finalQuestion,
              }),
          }
        );

      // =====================================================
      // AI SERVICE 401
      // =====================================================

      if (
        response.status === 401
      ) {
        throw new Error(
          "AIService returned 401 Unauthorized. Your JWT was rejected."
        );
      }

      // =====================================================
      // AI SERVICE 403
      // =====================================================

      if (
        response.status === 403
      ) {
        throw new Error(
          "You are not authorized to use the AI Service."
        );
      }

      // =====================================================
      // AI SERVICE 504
      // =====================================================

      if (
        response.status === 504
      ) {
        throw new Error(
          "Ollama request timed out. Please try again with a shorter question."
        );
      }

      // =====================================================
      // AI SERVICE OTHER ERRORS
      // =====================================================

      if (
        !response.ok
      ) {
        let errorMessage =
          `AI Service error: ${response.status}`;

        try {
          const errorData =
            await response.json();

          if (
            errorData?.message
          ) {
            errorMessage =
              errorData.message;
          }
        } catch {
          // Response is not JSON.
        }

        throw new Error(
          errorMessage
        );
      }

      // =====================================================
      // STEP 4 — READ AI RESPONSE
      // =====================================================

      let answer = "";

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

        if (
          typeof data ===
          "string"
        ) {
          answer = data;
        } else if (
          data?.response
        ) {
          answer =
            data.response;
        } else if (
          data?.answer
        ) {
          answer =
            data.answer;
        } else if (
          data?.message
        ) {
          answer =
            data.message;
        } else {
          answer =
            JSON.stringify(data);
        }
      } else {
        answer =
          await response.text();
      }

      answer =
        answer?.trim();

      if (!answer) {
        answer =
          "The AI service did not return an answer.";
      }

      console.log(
        "AI answer received successfully."
      );

      // =====================================================
      // STEP 5 — ADD AI MESSAGE
      // =====================================================

      const aiMessage = {
        id:
          Date.now() + 1,

        sender: "ai",

        text: answer,

        sources: [
          {
            name:
              `${selectedDocuments.length} relevant document${
                selectedDocuments.length >
                1
                  ? "s"
                  : ""
              } from Knowledge Base`,

            score: "RAG",
          },
        ],
      };

      setMessages(
        (previousMessages) => [
          ...previousMessages,
          aiMessage,
        ]
      );
    } catch (err) {
      // =====================================================
      // ERROR HANDLING
      // =====================================================

      console.error(
        "AI Assistant error:",
        err
      );

      let userError =
        "Unable to connect to the AI Service.";

      if (
        err.message?.includes(
          "Failed to fetch"
        )
      ) {
        userError =
          "Cannot connect to the backend. Make sure DocumentService and AIService are running.";
      }

      else if (
        err.message?.includes(
          "DocumentService returned 401"
        )
      ) {
        userError =
          "DocumentService rejected your JWT (401). Please login again or check DocumentService JWT configuration.";
      }

      else if (
        err.message?.includes(
          "AIService returned 401"
        )
      ) {
        userError =
          "AIService rejected your JWT (401). Check AIService JWT configuration.";
      }

      else if (
        err.message?.includes(
          "Ollama request timed out"
        )
      ) {
        userError =
          "The AI request took too long. Please try again.";
      }

      else if (
        err.message?.includes(
          "DocumentService"
        )
      ) {
        userError =
          "Cannot load documents from DocumentService. Check that DocumentService is running on port 5260.";
      }

      else if (
        err.message?.includes(
          "No extracted text"
        )
      ) {
        userError =
          "No document with extracted text was found in the knowledge base.";
      }

      else if (
        err.message
      ) {
        userError =
          err.message;
      }

      setError(
        userError
      );

      // =====================================================
      // AI ERROR MESSAGE
      // =====================================================

      setMessages(
        (previousMessages) => [
          ...previousMessages,

          {
            id:
              Date.now() + 1,

            sender: "ai",

            text:
              "⚠️ I couldn't generate an answer. Please check the AIService and Ollama connection.",

            sources: [],
          },
        ]
      );
    }

    finally {
      setIsLoading(false);
    }
  };

  // =========================================================
  // ENTER KEY
  // =========================================================

  const handleKeyDown = (
    event
  ) => {
    if (
      event.key === "Enter" &&
      !event.shiftKey
    ) {
      event.preventDefault();

      sendMessage();
    }
  };

  // =========================================================
  // RENDER
  // =========================================================

  return (
    <div className="assistant-page">

      {/* =====================================================
          HEADER
      ===================================================== */}

      <div className="assistant-header">

        <div>

          <h1>
            ✨ KnowFlow AI Copilot
          </h1>

          <p>
            Your intelligent assistant connected
            to the knowledge base
          </p>

        </div>

        <div className="ai-core">

          <Sparkles />

          AI Core Online

        </div>

      </div>

      {/* =====================================================
          AI PROFILE
      ===================================================== */}

      <div className="ai-profile">

        <div className="ai-orb">

          <Brain />

        </div>

        <div>

          <h2>
            Knowledge Intelligence Engine
          </h2>

          <p>
            Connected to your knowledge base
          </p>

          <div className="engine-tags">

            <span>
              <Database />
              Vector DB Connected
            </span>

            <span>
              <CheckCircle />
              RAG Active
            </span>

            <span>
              <Zap />
              AI Ready
            </span>

          </div>

        </div>

      </div>

      {/* =====================================================
          ERROR
      ===================================================== */}

      {error && (
        <div className="assistant-error">
          {error}
        </div>
      )}

      {/* =====================================================
          CHAT
      ===================================================== */}

      <div className="chat-container">

        {messages.map(
          (message) => (

            <div
              className={
                message.sender === "user"
                  ? "message user-message"
                  : "message ai-message"
              }
              key={message.id}
            >

              {/* AI AVATAR */}

              {message.sender === "ai" && (
                <div className="avatar">
                  🤖
                </div>
              )}

              <div className="message-body">

                <h3>
                  {message.sender === "user"
                    ? "You"
                    : "KnowFlow AI"}
                </h3>

                <p>
                  {message.text}
                </p>

                {/* SOURCES */}

                {message.sender === "ai" &&
                  message.sources &&
                  message.sources.length >
                    0 && (

                    <div className="source-mini">

                      {message.sources.map(
                        (
                          source,
                          index
                        ) => (

                          <div
                            key={index}
                          >

                            <FileText />

                            <span>
                              {source.name}
                            </span>

                            <strong>
                              {source.score}
                            </strong>

                          </div>

                        )
                      )}

                    </div>

                  )}

              </div>

              {/* USER AVATAR */}

              {message.sender === "user" && (
                <div className="user-avatar">
                  <User />
                </div>
              )}

            </div>

          )
        )}

        {/* =================================================
            THINKING
        ================================================= */}

        {isLoading && (

          <div className="message ai-message">

            <div className="avatar">
              🤖
            </div>

            <div className="thinking">

              <LoaderCircle />

              KnowFlow AI is thinking...

            </div>

          </div>

        )}

      </div>

      {/* =====================================================
          SUGGESTIONS
      ===================================================== */}

      <div className="suggestions">

        {suggestions.map(
          (item, index) => (

            <button
              key={index}
              onClick={() =>
                sendMessage(item)
              }
              disabled={isLoading}
            >

              <Sparkles />

              {item}

            </button>

          )
        )}

      </div>

      {/* =====================================================
          INPUT
      ===================================================== */}

      <div className="chat-input">

        <Paperclip />

        <input
          value={question}
          onChange={(event) =>
            setQuestion(
              event.target.value
            )
          }
          onKeyDown={
            handleKeyDown
          }
          placeholder=
            "Ask anything about your knowledge..."
          disabled={isLoading}
        />

        <button
          onClick={() =>
            sendMessage()
          }
          disabled={
            !question.trim() ||
            isLoading
          }
        >

          {isLoading ? (
            <LoaderCircle />
          ) : (
            <Send />
          )}

        </button>

      </div>

      {/* =====================================================
          FOOTER
      ===================================================== */}

      <div className="assistant-footer">

        <div>
          <Search />
          Semantic Understanding
        </div>

        <div>
          <Upload />
          Document Context
        </div>

        <div>
          <Brain />
          AI Reasoning
        </div>

      </div>

    </div>
  );
}