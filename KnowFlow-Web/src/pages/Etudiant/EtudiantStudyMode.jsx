import React, {
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";

import {
  BookOpen,
  Brain,
  Check,
  ChevronLeft,
  ChevronRight,
  FileText,
  Lightbulb,
  Loader2,
  RotateCcw,
  Sparkles,
  Trophy,
  X,
} from "lucide-react";

import "./EtudiantStudyMode.css";

/* =========================================================
   API CONFIGURATION
========================================================= */

const DOCUMENT_API = "http://localhost:5260/api/Document";
const AI_QUIZ_API = "http://localhost:5057/api/AI/quiz";

/*
  Important:
  llama3.2:1b can be slow when the prompt is large.
  Keep the quiz request small.
*/
const MAX_QUIZ_CONTENT = 1800;
const QUIZ_COUNT = 3;
const QUIZ_DIFFICULTY = "easy";

/* =========================================================
   AUTH
========================================================= */

const getAuthToken = () => {
  const possibleKeys = [
    "token",
    "accessToken",
    "access_token",
    "jwt",
    "authToken",
  ];

  for (const key of possibleKeys) {
    const value = localStorage.getItem(key);

    if (value) {
      return value.replace(/^Bearer\s+/i, "").trim();
    }
  }

  return null;
};

/* =========================================================
   DOCUMENT HELPERS
========================================================= */

const normalizeDocuments = (data) => {
  if (Array.isArray(data)) {
    return data;
  }

  if (Array.isArray(data?.documents)) {
    return data.documents;
  }

  if (Array.isArray(data?.Documents)) {
    return data.Documents;
  }

  if (Array.isArray(data?.data)) {
    return data.data;
  }

  if (Array.isArray(data?.items)) {
    return data.items;
  }

  return [];
};

const getDocumentId = (document) => {
  return (
    document?.id ??
    document?.Id ??
    document?.documentId ??
    document?.DocumentId
  );
};

const getDocumentTitle = (document) => {
  return (
    document?.fileName ??
    document?.FileName ??
    document?.name ??
    document?.Name ??
    "Document sans titre"
  );
};

const getDocumentContent = (document) => {
  return (
    document?.extractedText ??
    document?.ExtractedText ??
    document?.content ??
    document?.Content ??
    document?.text ??
    document?.Text ??
    ""
  );
};

/* =========================================================
   AI RESPONSE HELPERS
========================================================= */

const extractAIAnswer = (data) => {
  if (!data) {
    return "";
  }

  if (typeof data === "string") {
    return data;
  }

  return (
    data?.answer ??
    data?.Answer ??
    data?.response ??
    data?.Response ??
    data?.content ??
    data?.Content ??
    data?.result ??
    data?.Result ??
    data?.text ??
    data?.Text ??
    ""
  );
};

/* =========================================================
   JSON EXTRACTION
========================================================= */

const extractJSON = (raw) => {
  if (!raw) {
    return null;
  }

  if (typeof raw === "object") {
    return raw;
  }

  const text = String(raw).trim();

  /* Direct JSON */
  try {
    return JSON.parse(text);
  } catch {
    // Continue
  }

  /* Remove markdown code fences */
  const cleaned = text
    .replace(/^```json\s*/i, "")
    .replace(/^```\s*/i, "")
    .replace(/\s*```$/i, "")
    .trim();

  try {
    return JSON.parse(cleaned);
  } catch {
    // Continue
  }

  /* Try to extract JSON object */
  const objectStart = cleaned.indexOf("{");
  const objectEnd = cleaned.lastIndexOf("}");

  if (objectStart !== -1 && objectEnd !== -1) {
    try {
      return JSON.parse(
        cleaned.slice(objectStart, objectEnd + 1)
      );
    } catch {
      // Continue
    }
  }

  /* Try to extract JSON array */
  const arrayStart = cleaned.indexOf("[");
  const arrayEnd = cleaned.lastIndexOf("]");

  if (arrayStart !== -1 && arrayEnd !== -1) {
    try {
      return JSON.parse(
        cleaned.slice(arrayStart, arrayEnd + 1)
      );
    } catch {
      // Continue
    }
  }

  return null;
};

/* =========================================================
   QUIZ NORMALIZATION
========================================================= */

const normalizeQuiz = (rawQuiz) => {
  const parsed = extractJSON(rawQuiz);

  if (!parsed) {
    return [];
  }

  let source = [];

  if (Array.isArray(parsed)) {
    source = parsed;
  } else if (Array.isArray(parsed.questions)) {
    source = parsed.questions;
  } else if (Array.isArray(parsed.Questions)) {
    source = parsed.Questions;
  } else if (Array.isArray(parsed.quiz)) {
    source = parsed.quiz;
  } else if (Array.isArray(parsed.Quiz)) {
    source = parsed.Quiz;
  } else if (Array.isArray(parsed.data)) {
    source = parsed.data;
  } else if (Array.isArray(parsed.data?.questions)) {
    source = parsed.data.questions;
  } else {
    return [];
  }

  return source
    .map((item, index) => {
      const question =
        item?.question ??
        item?.Question ??
        item?.text ??
        item?.Text ??
        item?.prompt ??
        item?.Prompt ??
        "";

      const options =
        item?.options ??
        item?.Options ??
        item?.choices ??
        item?.Choices ??
        item?.answers ??
        item?.Answers ??
        [];

      const normalizedOptions = Array.isArray(options)
        ? options
            .map((option) => {
              if (typeof option === "string") {
                return option;
              }

              return (
                option?.text ??
                option?.Text ??
                option?.label ??
                option?.Label ??
                String(option ?? "")
              );
            })
            .map((option) => String(option).trim())
            .filter(Boolean)
            .slice(0, 4)
        : [];

      const correctAnswer =
        item?.correctIndex ??
        item?.CorrectIndex ??
        item?.correctAnswer ??
        item?.CorrectAnswer ??
        item?.correctOption ??
        item?.CorrectOption;

      let correctIndex = -1;

      /* Numeric answer */
      if (typeof correctAnswer === "number") {
        correctIndex = correctAnswer;

        /*
          Support both:
          0,1,2,3
          and
          1,2,3,4
        */
        if (
          correctIndex >= 1 &&
          correctIndex <= normalizedOptions.length
        ) {
          correctIndex -= 1;
        }
      }

      /* String answer */
      else if (typeof correctAnswer === "string") {
        const answer = correctAnswer.trim();

        /* A / B / C / D */
        const letterMatch = answer.match(/^([A-D])$/i);

        if (letterMatch) {
          correctIndex =
            letterMatch[1].toUpperCase().charCodeAt(0) -
            "A".charCodeAt(0);
        }

        /* 1 / 2 / 3 / 4 */
        if (
          correctIndex === -1 &&
          /^[1-4]$/.test(answer)
        ) {
          correctIndex = Number(answer) - 1;
        }

        /* Option A / Choice B / Answer C / Réponse D */
        if (correctIndex === -1) {
          const optionLetterMatch = answer.match(
            /(?:option|choice|réponse|answer)\s*([A-D])/i
          );

          if (optionLetterMatch) {
            correctIndex =
              optionLetterMatch[1]
                .toUpperCase()
                .charCodeAt(0) -
              "A".charCodeAt(0);
          }
        }

        /* Exact option text */
        if (correctIndex === -1) {
          const foundIndex =
            normalizedOptions.findIndex(
              (option) =>
                option.toLowerCase() ===
                answer.toLowerCase()
            );

          if (foundIndex !== -1) {
            correctIndex = foundIndex;
          }
        }
      }

      /*
        If AI gives an invalid answer,
        use the first option instead of breaking the quiz.
      */
      if (
        correctIndex < 0 ||
        correctIndex >= normalizedOptions.length
      ) {
        correctIndex = 0;
      }

      const explanation =
        item?.explanation ??
        item?.Explanation ??
        item?.reason ??
        item?.Reason ??
        "";

      return {
        id:
          item?.id ??
          item?.Id ??
          index + 1,

        question: String(question).trim(),

        options: normalizedOptions,

        correctIndex,

        explanation: String(
          explanation ?? ""
        ).trim(),
      };
    })
    .filter(
      (item) =>
        item.question &&
        item.options.length >= 2 &&
        item.correctIndex >= 0 &&
        item.correctIndex < item.options.length
    );
};

/* =========================================================
   COMPONENT
========================================================= */

export default function EtudiantStudyMode() {
  /* =======================================================
     STATES
  ======================================================= */

  const [documents, setDocuments] = useState([]);

  const [selectedDocument, setSelectedDocument] =
    useState(null);

  const [documentContent, setDocumentContent] =
    useState("");

  const [questions, setQuestions] = useState([]);

  const [currentQuestion, setCurrentQuestion] =
    useState(0);

  const [selectedAnswer, setSelectedAnswer] =
    useState(null);

  const [score, setScore] = useState(0);

  const [answered, setAnswered] =
    useState(false);

  const [completed, setCompleted] =
    useState(false);

  const [loadingDocuments, setLoadingDocuments] =
    useState(true);

  const [loadingDocument, setLoadingDocument] =
    useState(false);

  const [generatingQuiz, setGeneratingQuiz] =
    useState(false);

  const [error, setError] =
    useState("");

  /*
    Prevent duplicate initialization in development.
  */
  const initializationRef = useRef(false);

  /* =======================================================
     LOAD DOCUMENTS
  ======================================================= */

  const loadDocuments = async () => {
    try {
      setLoadingDocuments(true);
      setError("");

      const token = getAuthToken();

      if (!token) {
        throw new Error(
          "Session expirée. Veuillez vous reconnecter."
        );
      }

      const response = await fetch(DOCUMENT_API, {
        method: "GET",
        headers: {
          Authorization: `Bearer ${token}`,
          Accept: "application/json",
        },
      });

      console.log(
        "DocumentService status:",
        response.status
      );

      if (!response.ok) {
        const text = await response.text();

        console.error(
          "DocumentService response:",
          text
        );

        throw new Error(
          `Erreur DocumentService (${response.status})`
        );
      }

      const data = await response.json();

      const normalized =
        normalizeDocuments(data);

      console.log(
        "Study Mode documents:",
        normalized
      );

      setDocuments(normalized);

      if (normalized.length > 0) {
        await changeDocument(normalized[0]);
      } else {
        setError(
          "Aucun document disponible pour le Study Mode."
        );
      }
    } catch (err) {
      console.error(
        "Study Mode documents error:",
        err
      );

      setError(
        err?.message ||
          "Impossible de charger les documents."
      );
    } finally {
      setLoadingDocuments(false);
    }
  };

  /* =======================================================
     LOAD DOCUMENT CONTENT
  ======================================================= */

  const loadDocumentContent = async (
    document
  ) => {
    try {
      setLoadingDocument(true);
      setError("");

      const token = getAuthToken();

      if (!token) {
        throw new Error(
          "Session expirée. Veuillez vous reconnecter."
        );
      }

      const id = getDocumentId(document);

      if (!id) {
        throw new Error(
          "ID du document introuvable."
        );
      }

      const response = await fetch(
        `${DOCUMENT_API}/${id}`,
        {
          method: "GET",
          headers: {
            Authorization: `Bearer ${token}`,
            Accept: "application/json",
          },
        }
      );

      console.log(
        "Document details status:",
        response.status
      );

      if (!response.ok) {
        const text = await response.text();

        console.error(
          "Document details response:",
          text
        );

        throw new Error(
          `Erreur chargement document (${response.status})`
        );
      }

      const data = await response.json();

      const content =
        getDocumentContent(data) ||
        getDocumentContent(document);

      const title =
        getDocumentTitle(data) ||
        getDocumentTitle(document);

      console.log(
        "Selected document:",
        data
      );

      setSelectedDocument({
        ...document,
        ...data,
      });

      setDocumentContent(content);

      await generateQuiz(
        content,
        title
      );
    } catch (err) {
      console.error(
        "Document content error:",
        err
      );

      setError(
        err?.message ||
          "Impossible de charger le contenu du document."
      );
    } finally {
      setLoadingDocument(false);
    }
  };

  /* =======================================================
     GENERATE QUIZ
  ======================================================= */

  const generateQuiz = async (
    content,
    title
  ) => {
    try {
      setGeneratingQuiz(true);
      setError("");

      console.log(
        "======================================"
      );

      console.log(
        "KNOWFLOW AI - STUDY QUIZ"
      );

      console.log(
        "======================================"
      );

      console.log(
        "Document:",
        title
      );

      console.log(
        "Original content length:",
        String(content || "").length
      );

      /*
        Reduce content before sending it to Ollama.
      */
      const safeContent = String(
        content || ""
      )
        .replace(/\s+/g, " ")
        .trim()
        .slice(0, MAX_QUIZ_CONTENT);

      console.log(
        "Quiz content length:",
        safeContent.length
      );

      if (safeContent.length < 50) {
        throw new Error(
          "Le document ne contient pas assez de texte pour générer un quiz."
        );
      }

      const token = getAuthToken();

      if (!token) {
        throw new Error(
          "Session expirée. Veuillez vous reconnecter."
        );
      }

      console.log(
        "Quiz API:",
        AI_QUIZ_API
      );

      const response = await fetch(
        AI_QUIZ_API,
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

          body: JSON.stringify({
            text: safeContent,

            count: QUIZ_COUNT,

            difficulty:
              QUIZ_DIFFICULTY,
          }),
        }
      );

      console.log(
        "AIService quiz status:",
        response.status
      );

      const responseText =
        await response.text();

      console.log(
        "AIService quiz response:",
        responseText
      );

      if (!response.ok) {
        let errorMessage =
          `Erreur AIService (${response.status})`;

        try {
          const errorData =
            JSON.parse(responseText);

          if (
            errorData?.message
          ) {
            errorMessage =
              errorData.message;
          }
        } catch {
          // Ignore invalid JSON
        }

        if (
          response.status === 504
        ) {
          errorMessage =
            "Ollama prend trop de temps pour générer le quiz. Essayez avec un document plus court.";
        }

        throw new Error(
          errorMessage
        );
      }

      let rawQuiz =
        responseText;

      try {
        rawQuiz =
          JSON.parse(responseText);
      } catch {
        // Response can already be plain text
      }

      const extractedAnswer =
        extractAIAnswer(rawQuiz);

      const normalized =
        normalizeQuiz(
          extractedAnswer ||
            rawQuiz
        );

      console.log(
        "Generated quiz:",
        normalized
      );

      if (!normalized.length) {
        throw new Error(
          "L'IA a répondu, mais le format du quiz est invalide."
        );
      }

      setQuestions(
        normalized.slice(
          0,
          QUIZ_COUNT
        )
      );

      setCurrentQuestion(0);
      setSelectedAnswer(null);
      setScore(0);
      setAnswered(false);
      setCompleted(false);
    } catch (err) {
      console.error(
        "Quiz generation error:",
        err
      );

      setQuestions([]);

      setError(
        err?.message ||
          "Impossible de générer le quiz."
      );
    } finally {
      setGeneratingQuiz(false);
    }
  };

  /* =======================================================
     CHANGE DOCUMENT
  ======================================================= */

  const changeDocument = async (
    document
  ) => {
    if (!document) {
      return;
    }

    setSelectedDocument(document);

    setQuestions([]);

    setCurrentQuestion(0);

    setSelectedAnswer(null);

    setScore(0);

    setAnswered(false);

    setCompleted(false);

    setDocumentContent("");

    await loadDocumentContent(
      document
    );
  };

  /* =======================================================
     HANDLE ANSWER
  ======================================================= */

  const handleAnswer = (
    answerIndex
  ) => {
    if (
      answered ||
      !questions.length
    ) {
      return;
    }

    const question =
      questions[currentQuestion];

    if (!question) {
      return;
    }

    setSelectedAnswer(
      answerIndex
    );

    setAnswered(true);

    if (
      answerIndex ===
      question.correctIndex
    ) {
      setScore(
        (previous) =>
          previous + 1
      );
    }
  };

  /* =======================================================
     NEXT QUESTION
  ======================================================= */

  const handleNext = () => {
    if (!answered) {
      return;
    }

    if (
      currentQuestion <
      questions.length - 1
    ) {
      setCurrentQuestion(
        (previous) =>
          previous + 1
      );

      setSelectedAnswer(null);

      setAnswered(false);

      return;
    }

    setCompleted(true);
  };

  /* =======================================================
     RESET QUIZ
  ======================================================= */

  const resetQuiz = () => {
    setQuestions([]);

    setCurrentQuestion(0);

    setSelectedAnswer(null);

    setScore(0);

    setAnswered(false);

    setCompleted(false);

    if (selectedDocument) {
      const content =
        documentContent;

      generateQuiz(
        content,
        getDocumentTitle(
          selectedDocument
        )
      );
    }
  };

  /* =======================================================
     GENERATE NEW QUIZ
  ======================================================= */

  const generateNewQuiz = () => {
    if (!selectedDocument) {
      return;
    }

    const content =
      documentContent;

    generateQuiz(
      content,
      getDocumentTitle(
        selectedDocument
      )
    );
  };

  /* =======================================================
     INITIALIZATION
  ======================================================= */

  useEffect(() => {
    /*
      React StrictMode can execute effects twice
      during development.

      This prevents two DocumentService calls and
      two Ollama quiz generations.
    */
    if (
      initializationRef.current
    ) {
      return;
    }

    initializationRef.current =
      true;

    loadDocuments();
  }, []);

  /* =======================================================
     MEMOS
  ======================================================= */

  const currentQuizQuestion =
    questions[currentQuestion];

  const scorePercentage =
    questions.length > 0
      ? Math.round(
          (score /
            questions.length) *
            100
        )
      : 0;

  const progressPercentage =
    questions.length > 0
      ? Math.round(
          ((currentQuestion + 1) /
            questions.length) *
            100
        )
      : 0;

  const scoreLabel =
    useMemo(() => {
      if (
        scorePercentage >= 90
      ) {
        return "Excellent";
      }

      if (
        scorePercentage >= 70
      ) {
        return "Très bien";
      }

      if (
        scorePercentage >= 50
      ) {
        return "Bon travail";
      }

      return "Continue à apprendre";
    }, [scorePercentage]);

  /* =======================================================
     LOADING DOCUMENTS
  ======================================================= */

  if (loadingDocuments) {
    return (
      <div className="study-mode-page">
        <div className="study-loading-screen">
          <div className="study-loading-icon">
            <Loader2
              size={34}
              className="spin"
            />
          </div>

          <h2>
            Chargement de votre espace
            d'apprentissage...
          </h2>

          <p>
            Préparation de vos documents.
          </p>
        </div>
      </div>
    );
  }

  /* =======================================================
     MAIN UI
  ======================================================= */

  return (
    <div className="study-mode-page">

      {/* =================================================
          HEADER
      ================================================= */}

      <header className="study-header">

        <div className="study-header-left">

          <div className="study-brand-icon">
            <Brain size={25} />
          </div>

          <div>
            <h1>
              Study Mode
            </h1>

            <p>
              Apprenez intelligemment
              avec KnowFlow AI
            </p>
          </div>

        </div>

        <div className="study-header-right">

          <div className="ai-badge">
            <Sparkles size={15} />
            AI Powered
          </div>

        </div>

      </header>

      {/* =================================================
          ERROR
      ================================================= */}

      {error && (
        <div className="study-error">

          <div className="study-error-icon">
            <X size={18} />
          </div>

          <div>
            <strong>
              Une erreur est survenue
            </strong>

            <p>
              {error}
            </p>
          </div>

        </div>
      )}

      {/* =================================================
          DOCUMENT SELECTOR
      ================================================= */}

      <section className="document-selector-section">

        <div className="section-title-row">

          <div>
            <span className="section-kicker">
              KNOWLEDGE BASE
            </span>

            <h2>
              Choisissez votre document
            </h2>

            <p>
              Sélectionnez un document
              pour générer un quiz personnalisé.
            </p>
          </div>

          <BookOpen
            size={28}
            className="section-title-icon"
          />

        </div>

        <div className="documents-grid">

          {documents.map(
            (document, index) => {
              const id =
                getDocumentId(
                  document
                );

              const title =
                getDocumentTitle(
                  document
                );

              const isSelected =
                getDocumentId(
                  selectedDocument
                ) === id;

              return (
                <button
                  type="button"
                  key={
                    id ??
                    `${title}-${index}`
                  }
                  className={`document-card ${
                    isSelected
                      ? "selected"
                      : ""
                  }`}
                  onClick={() =>
                    changeDocument(
                      document
                    )
                  }
                  disabled={
                    loadingDocument ||
                    generatingQuiz
                  }
                >

                  <div className="document-card-icon">
                    <FileText
                      size={23}
                    />
                  </div>

                  <div className="document-card-content">

                    <h3>
                      {title}
                    </h3>

                    <span>
                      Document
                    </span>

                  </div>

                  {isSelected && (
                    <div className="document-selected-check">
                      <Check size={16} />
                    </div>
                  )}

                </button>
              );
            }
          )}

        </div>

      </section>

      {/* =================================================
          GENERATING
      ================================================= */}

      {(loadingDocument ||
        generatingQuiz) && (
        <div className="quiz-generating-card">

          <div className="generating-animation">
            <Sparkles size={28} />
          </div>

          <div>

            <h3>
              Génération de votre quiz
            </h3>

            <p>
              KnowFlow AI analyse votre
              document et prépare des
              questions personnalisées...
            </p>

          </div>

          <Loader2
            size={24}
            className="spin"
          />

        </div>
      )}

      {/* =================================================
          QUIZ
      ================================================= */}

      {!generatingQuiz &&
        !loadingDocument &&
        questions.length > 0 &&
        !completed && (
          <div className="study-content-grid">

            {/* ==============================
                MAIN QUIZ
            ============================== */}

            <main className="quiz-main-card">

              {/* Progress */}

              <div className="quiz-progress-area">

                <div className="quiz-progress-top">

                  <span>
                    Question{" "}
                    {currentQuestion + 1}{" "}
                    sur{" "}
                    {questions.length}
                  </span>

                  <span>
                    {progressPercentage}%
                  </span>

                </div>

                <div className="quiz-progress-bar">
                  <div
                    className="quiz-progress-fill"
                    style={{
                      width: `${progressPercentage}%`,
                    }}
                  />
                </div>

              </div>

              {/* Question */}

              {currentQuizQuestion && (
                <div className="question-area">

                  <div className="question-number">
                    Q
                    {currentQuestion + 1}
                  </div>

                  <h2 className="quiz-question">
                    {
                      currentQuizQuestion.question
                    }
                  </h2>

                  {/* Answers */}

                  <div className="answers-list">

                    {currentQuizQuestion.options.map(
                      (
                        option,
                        index
                      ) => {

                        const isSelected =
                          selectedAnswer ===
                          index;

                        const isCorrect =
                          index ===
                          currentQuizQuestion.correctIndex;

                        let answerClass =
                          "answer-option";

                        if (
                          answered &&
                          isCorrect
                        ) {
                          answerClass +=
                            " correct";
                        }

                        if (
                          answered &&
                          isSelected &&
                          !isCorrect
                        ) {
                          answerClass +=
                            " incorrect";
                        }

                        if (
                          !answered &&
                          isSelected
                        ) {
                          answerClass +=
                            " selected";
                        }

                        return (
                          <button
                            type="button"
                            key={index}
                            className={
                              answerClass
                            }
                            onClick={() =>
                              handleAnswer(
                                index
                              )
                            }
                            disabled={
                              answered
                            }
                          >

                            <span className="answer-letter">
                              {String.fromCharCode(
                                65 + index
                              )}
                            </span>

                            <span className="answer-text">
                              {option}
                            </span>

                            {answered &&
                              isCorrect && (
                                <Check
                                  size={20}
                                  className="answer-result-icon"
                                />
                              )}

                            {answered &&
                              isSelected &&
                              !isCorrect && (
                                <X
                                  size={20}
                                  className="answer-result-icon"
                                />
                              )}

                          </button>
                        );
                      }
                    )}

                  </div>

                  {/* Feedback */}

                  {answered && (
                    <div
                      className={`answer-feedback ${
                        selectedAnswer ===
                        currentQuizQuestion.correctIndex
                          ? "success"
                          : "error"
                      }`}
                    >

                      <div className="feedback-icon">

                        {selectedAnswer ===
                        currentQuizQuestion.correctIndex ? (
                          <Check size={20} />
                        ) : (
                          <X size={20} />
                        )}

                      </div>

                      <div>

                        <strong>
                          {selectedAnswer ===
                          currentQuizQuestion.correctIndex
                            ? "Bonne réponse !"
                            : "Réponse incorrecte"}
                        </strong>

                        {currentQuizQuestion.explanation && (
                          <p>
                            {
                              currentQuizQuestion.explanation
                            }
                          </p>
                        )}

                      </div>

                    </div>
                  )}

                </div>
              )}

              {/* Bottom controls */}

              <div className="quiz-controls">

                <button
                  type="button"
                  className="secondary-study-btn"
                  onClick={resetQuiz}
                  disabled={
                    generatingQuiz
                  }
                >
                  <RotateCcw
                    size={17}
                  />
                  Recommencer
                </button>

                <button
                  type="button"
                  className="primary-study-btn"
                  onClick={handleNext}
                  disabled={
                    !answered
                  }
                >

                  {currentQuestion <
                  questions.length - 1 ? (
                    <>
                      Question suivante
                      <ChevronRight
                        size={18}
                      />
                    </>
                  ) : (
                    <>
                      Voir le résultat
                      <Trophy
                        size={18}
                      />
                    </>
                  )}

                </button>

              </div>

            </main>

            {/* ==============================
                SIDEBAR
            ============================== */}

            <aside className="study-sidebar">

              {/* Score */}

              <div className="sidebar-card score-card">

                <div className="sidebar-card-header">

                  <span>
                    SCORE ACTUEL
                  </span>

                  <Trophy
                    size={18}
                  />

                </div>

                <div className="score-circle-wrapper">

                  <div
                    className="score-circle"
                    style={{
                      "--score":
                        scorePercentage,
                    }}
                  >
                    <div className="score-circle-inner">
                      <strong>
                        {score}
                      </strong>

                      <span>
                        /{" "}
                        {
                          questions.length
                        }
                      </span>
                    </div>
                  </div>

                </div>

                <h3>
                  {scoreLabel}
                </h3>

                <p>
                  Continuez pour améliorer
                  votre maîtrise.
                </p>

              </div>

              {/* Knowledge Map */}

              <div className="sidebar-card">

                <div className="sidebar-card-header">

                  <span>
                    KNOWLEDGE MAP
                  </span>

                  <Brain
                    size={18}
                  />

                </div>

                <div className="knowledge-map">

                  <div className="knowledge-node active">
                    <span />
                    Document
                  </div>

                  <div className="knowledge-line" />

                  <div className="knowledge-node">
                    <span />
                    Compréhension
                  </div>

                  <div className="knowledge-line" />

                  <div className="knowledge-node">
                    <span />
                    Maîtrise
                  </div>

                </div>

              </div>

              {/* AI Tip */}

              <div className="sidebar-card ai-tip-card">

                <div className="ai-tip-icon">
                  <Lightbulb
                    size={19}
                  />
                </div>

                <div>

                  <strong>
                    AI Tip
                  </strong>

                  <p>
                    Prenez le temps de
                    comprendre chaque
                    réponse avant de passer
                    à la question suivante.
                  </p>

                </div>

              </div>

            </aside>

          </div>
        )}

      {/* =================================================
          EMPTY STATE
      ================================================= */}

      {!generatingQuiz &&
        !loadingDocument &&
        questions.length === 0 &&
        selectedDocument &&
        !error && (
          <div className="study-empty-state">

            <div className="empty-state-icon">
              <Brain size={30} />
            </div>

            <h2>
              Préparez-vous à apprendre
            </h2>

            <p>
              Le quiz sera généré à partir
              de votre document.
            </p>

            <button
              type="button"
              className="primary-study-btn"
              onClick={generateNewQuiz}
            >
              <Sparkles size={18} />
              Générer le quiz
            </button>

          </div>
        )}

      {/* =================================================
          COMPLETED
      ================================================= */}

      {completed && (
        <div className="quiz-completed-card">

          <div className="completion-icon">
            <Trophy size={42} />
          </div>

          <span className="completion-kicker">
            QUIZ TERMINÉ
          </span>

          <h2>
            Félicitations !
          </h2>

          <p>
            Vous avez terminé le quiz
            sur{" "}
            <strong>
              {getDocumentTitle(
                selectedDocument
              )}
            </strong>
            .
          </p>

          <div className="final-score">

            <strong>
              {score}
            </strong>

            <span>
              /{" "}
              {questions.length}
            </span>

          </div>

          <div className="completion-percentage">
            {scorePercentage}%
          </div>

          <div className="completion-actions">

            <button
              type="button"
              className="secondary-study-btn"
              onClick={resetQuiz}
            >
              <RotateCcw
                size={18}
              />
              Refaire le quiz
            </button>

            <button
              type="button"
              className="primary-study-btn"
              onClick={generateNewQuiz}
            >
              <Sparkles
                size={18}
              />
              Nouveau quiz
            </button>

          </div>

        </div>
      )}

    </div>
  );
}