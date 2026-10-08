import React, {
  useCallback,
  useEffect,
  useMemo,
  useState,
} from "react";

import {
  Activity,
  Brain,
  CalendarDays,
  CheckCircle2,
  ChevronRight,
  FileText,
  Flame,
  Loader2,
  RefreshCw,
  Search,
  Sparkles,
  Target,
  TrendingUp,
  Zap,
} from "lucide-react";

import "./EtudiantInsights.css";

// ============================================================
// CONFIG
// ============================================================

const AUTH_SERVICE_URL = "http://localhost:5282";

// ============================================================
// DEFAULT DATA
// ============================================================

const EMPTY_INSIGHTS = {
  learningScore: 0,
  activeDays: 0,
  activeDaysTotal: 7,
  aiInteractions: 0,
  learningStreak: 0,
  totalActivities: 0,
  documents: 0,
  documentActions: 0,
  searches: 0,
  weeklyActivities: [],
  topics: [],
  knowledgePulse:
    "Your learning journey is ready to begin.",
  knowledgeState: "Getting started",
  lastActivity: null,
};

// ============================================================
// TOKEN
// ============================================================

function getToken() {
  const keys = [
    "token",
    "accessToken",
    "access_token",
    "jwt",
    "authToken",
  ];

  for (const key of keys) {
    const value = localStorage.getItem(key);

    if (value) {
      return value.replace(/^Bearer\s+/i, "");
    }
  }

  return "";
}

// ============================================================
// NUMBER HELPER
// ============================================================

function safeNumber(value) {
  const number = Number(value);

  return Number.isFinite(number)
    ? number
    : 0;
}

// ============================================================
// DATE FORMAT
// ============================================================

function formatActivityDate(value) {
  if (!value) {
    return "";
  }

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return "";
  }

  return date.toLocaleString("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

// ============================================================
// NORMALIZE INSIGHTS
// ============================================================

function normalizeInsights(data) {
  if (!data || typeof data !== "object") {
    return EMPTY_INSIGHTS;
  }

  const weeklyActivities = Array.isArray(
    data.weeklyActivities
  )
    ? data.weeklyActivities.map((item) => ({
        date: item?.date || "",
        day: item?.day || "",
        activities: safeNumber(
          item?.activities
        ),
      }))
    : [];

  const topics = Array.isArray(data.topics)
    ? data.topics
        .filter(
          (topic) =>
            topic &&
            typeof topic === "object"
        )
        .map((topic) => ({
          name:
            topic.name ||
            "General Learning",
          activities: safeNumber(
            topic.activities
          ),
        }))
    : [];

  const lastActivity =
    data.lastActivity &&
    typeof data.lastActivity === "object"
      ? {
          action:
            data.lastActivity.action ||
            "Learning activity",
          category:
            data.lastActivity.category ||
            "",
          description:
            data.lastActivity.description ||
            "",
          createdAt:
            data.lastActivity.createdAt ||
            null,
        }
      : null;

  return {
    ...EMPTY_INSIGHTS,

    learningScore: safeNumber(
      data.learningScore
    ),

    activeDays: safeNumber(
      data.activeDays
    ),

    activeDaysTotal:
      safeNumber(data.activeDaysTotal) ||
      7,

    aiInteractions: safeNumber(
      data.aiInteractions
    ),

    learningStreak: safeNumber(
      data.learningStreak
    ),

    totalActivities: safeNumber(
      data.totalActivities
    ),

    documents: safeNumber(
      data.documents
    ),

    documentActions: safeNumber(
      data.documentActions
    ),

    searches: safeNumber(
      data.searches
    ),

    weeklyActivities,

    topics,

    knowledgePulse:
      data.knowledgePulse ||
      EMPTY_INSIGHTS.knowledgePulse,

    knowledgeState:
      data.knowledgeState ||
      EMPTY_INSIGHTS.knowledgeState,

    lastActivity,
  };
}

// ============================================================
// COMPONENT
// ============================================================

export default function EtudiantInsights() {
  const [insights, setInsights] =
    useState(EMPTY_INSIGHTS);

  const [loading, setLoading] =
    useState(true);

  const [refreshing, setRefreshing] =
    useState(false);

  const [error, setError] =
    useState("");

  // ==========================================================
  // LOAD INSIGHTS
  // ==========================================================

  const loadInsights = useCallback(
    async (isRefresh = false) => {
      try {
        if (isRefresh) {
          setRefreshing(true);
        } else {
          setLoading(true);
        }

        setError("");

        const token = getToken();

        if (!token) {
          throw new Error(
            "Authentication token not found. Please login again."
          );
        }

        const response = await fetch(
          `${AUTH_SERVICE_URL}/api/AuditLogs/insights`,
          {
            method: "GET",

            headers: {
              Accept: "application/json",
              Authorization: `Bearer ${token}`,
            },
          }
        );

        const text =
          await response.text();

        let data = null;

        if (text) {
          try {
            data = JSON.parse(text);
          } catch {
            throw new Error(
              "AuthService returned an invalid JSON response."
            );
          }
        }

        if (!response.ok) {
          throw new Error(
            data?.message ||
              `Learning Insights request failed (${response.status})`
          );
        }

        setInsights(
          normalizeInsights(data)
        );
      } catch (err) {
        console.error(
          "❌ LEARNING INSIGHTS ERROR:",
          err
        );

        setError(
          err?.message ||
            "Unable to load Learning Insights."
        );
      } finally {
        setLoading(false);
        setRefreshing(false);
      }
    },
    []
  );

  // ==========================================================
  // INITIAL LOAD
  // ==========================================================

  useEffect(() => {
    loadInsights();
  }, [loadInsights]);

  // ==========================================================
  // SCORE
  // ==========================================================

  const score = Math.min(
    Math.max(
      safeNumber(
        insights.learningScore
      ),
      0
    ),
    100
  );

  const scoreDash = `${score} 100`;

  // ==========================================================
  // MAX WEEKLY ACTIVITY
  // ==========================================================

  const maxWeeklyActivity = useMemo(() => {
    const values =
      insights.weeklyActivities.map(
        (item) =>
          safeNumber(item.activities)
      );

    return Math.max(
      ...values,
      1
    );
  }, [insights.weeklyActivities]);

  // ==========================================================
  // LOADING
  // ==========================================================

  if (loading) {
    return (
      <div className="insights-page">
        <div className="insights-loading">

          <div className="loading-orb">
            <Brain size={28} />
          </div>

          <Loader2
            className="loading-spinner"
            size={22}
          />

          <h3>
            Analyzing your learning journey
          </h3>

          <p>
            KnowFlow AI is preparing your
            insights...
          </p>

        </div>
      </div>
    );
  }

  // ==========================================================
  // ERROR
  // ==========================================================

  if (error) {
    return (
      <div className="insights-page">

        <div className="insights-error">

          <div className="error-icon">
            <Activity size={28} />
          </div>

          <h2>
            Unable to load Learning Insights
          </h2>

          <p>{error}</p>

          <button
            type="button"
            className="retry-btn"
            onClick={() =>
              loadInsights(false)
            }
          >
            <RefreshCw size={17} />
            Try again
          </button>

        </div>

      </div>
    );
  }

  // ==========================================================
  // MAIN
  // ==========================================================

  return (
    <div className="insights-page">

      {/* ======================================================
          HEADER
      ====================================================== */}

      <header className="insights-header">

        <div className="header-content">

          <div className="header-badge">
            <Sparkles size={14} />
            LEARNING INTELLIGENCE
          </div>

          <h1>
            Your Learning
            <span> Insights</span>
          </h1>

          <p>
            Understand your learning activity,
            discover your progress and grow your
            knowledge with KnowFlow AI.
          </p>

        </div>

        <button
          type="button"
          className="refresh-btn"
          onClick={() =>
            loadInsights(true)
          }
          disabled={refreshing}
        >
          <RefreshCw
            size={17}
            className={
              refreshing
                ? "refresh-spinning"
                : ""
            }
          />

          {refreshing
            ? "Refreshing..."
            : "Refresh"}
        </button>

      </header>

      {/* ======================================================
          HERO
      ====================================================== */}

      <section className="insights-hero-grid">

        {/* SCORE CARD */}

        <div className="score-card">

          <div className="score-glow" />

          <div className="score-card-top">

            <div>

              <span className="section-label">
                LEARNING SCORE
              </span>

              <h2>
                {insights.knowledgeState}
              </h2>

            </div>

            <div className="score-icon">
              <Target size={22} />
            </div>

          </div>

          <div className="score-main">

            <div className="score-ring">

              <svg
                viewBox="0 0 120 120"
                className="score-svg"
              >

                <circle
                  cx="60"
                  cy="60"
                  r="50"
                  className="score-track"
                />

                <circle
                  cx="60"
                  cy="60"
                  r="50"
                  className="score-progress"
                  pathLength="100"
                  strokeDasharray={
                    scoreDash
                  }
                />

              </svg>

              <div className="score-value">
                <strong>
                  {score}
                </strong>

                <span>%</span>
              </div>

            </div>

            <div className="score-description">

              <div className="score-status">

                <CheckCircle2 size={17} />

                <span>
                  {score >= 80
                    ? "Excellent progress"
                    : score >= 60
                    ? "Strong progress"
                    : score >= 40
                    ? "Good progress"
                    : "Keep building momentum"}
                </span>

              </div>

              <p>
                Your score combines your
                activity, active days, AI
                interactions and learning
                streak.
              </p>

            </div>

          </div>

          <div className="score-footer">

            <span>
              <TrendingUp size={15} />
              Knowledge growth
            </span>

            <span>
              {insights.totalActivities}{" "}
              activities
            </span>

          </div>

        </div>

        {/* KNOWLEDGE PULSE */}

        <div className="pulse-card">

          <div className="pulse-decoration pulse-one" />
          <div className="pulse-decoration pulse-two" />

          <div className="pulse-top">

            <div className="ai-orb">
              <Brain size={25} />
            </div>

            <div>

              <span className="section-label">
                KNOWLEDGE PULSE
              </span>

              <h2>
                Your learning signal
              </h2>

            </div>

          </div>

          <p className="pulse-message">
            {insights.knowledgePulse}
          </p>

          <div className="pulse-line">

            <span />
            <span />
            <span />
            <span />
            <span />
            <span />
            <span />

          </div>

          <div className="pulse-bottom">

            <span>
              <Zap size={15} />
              AI-powered insights
            </span>

            <ChevronRight size={17} />

          </div>

        </div>

      </section>

      {/* ======================================================
          STATS
      ====================================================== */}

      <section className="stats-grid">

        {/* ACTIVE DAYS */}

        <div className="stat-card">

          <div className="stat-icon blue">
            <CalendarDays size={20} />
          </div>

          <div className="stat-content">

            <span>
              Active Days
            </span>

            <strong>
              {insights.activeDays}

              <small>
                /{insights.activeDaysTotal}
              </small>
            </strong>

            <p>
              this week
            </p>

          </div>

        </div>

        {/* AI */}

        <div className="stat-card">

          <div className="stat-icon purple">
            <Brain size={20} />
          </div>

          <div className="stat-content">

            <span>
              AI Interactions
            </span>

            <strong>
              {insights.aiInteractions}
            </strong>

            <p>
              with your copilot
            </p>

          </div>

        </div>

        {/* STREAK */}

        <div className="stat-card">

          <div className="stat-icon orange">
            <Flame size={20} />
          </div>

          <div className="stat-content">

            <span>
              Learning Streak
            </span>

            <strong>
              {insights.learningStreak}

              <small>
                {" "}days
              </small>
            </strong>

            <p>
              consistency
            </p>

          </div>

        </div>

        {/* TOTAL */}

        <div className="stat-card">

          <div className="stat-icon green">
            <Activity size={20} />
          </div>

          <div className="stat-content">

            <span>
              Total Activities
            </span>

            <strong>
              {insights.totalActivities}
            </strong>

            <p>
              last 7 days
            </p>

          </div>

        </div>

      </section>

      {/* ======================================================
          CONTENT GRID
      ====================================================== */}

      <section className="insights-content-grid">

        {/* WEEKLY ACTIVITY */}

        <div className="insights-card activity-card">

          <div className="card-heading">

            <div>

              <span className="section-label">
                ACTIVITY
              </span>

              <h2>
                Weekly Activity
              </h2>

            </div>

            <div className="heading-total">

              <strong>
                {insights.totalActivities}
              </strong>

              <span>
                activities
              </span>

            </div>

          </div>

          <div className="weekly-chart">

            {insights.weeklyActivities
              .length > 0 ? (
              insights.weeklyActivities.map(
                (item, index) => {

                  const value =
                    safeNumber(
                      item.activities
                    );

                  const height =
                    value === 0
                      ? 5
                      : Math.max(
                          (value /
                            maxWeeklyActivity) *
                            100,
                          12
                        );

                  return (
                    <div
                      className="chart-day"
                      key={
                        item.date ||
                        `${item.day}-${index}`
                      }
                    >

                      <div className="bar-area">

                        <div
                          className={`activity-bar ${
                            value > 0
                              ? "has-activity"
                              : ""
                          }`}
                          style={{
                            height: `${height}%`,
                          }}
                        >

                          {value > 0 && (
                            <span>
                              {value}
                            </span>
                          )}

                        </div>

                      </div>

                      <span className="day-name">
                        {item.day}
                      </span>

                    </div>
                  );
                }
              )
            ) : (
              <div className="empty-state">

                <div className="empty-icon">
                  <Activity size={27} />
                </div>

                <h3>
                  No activity yet
                </h3>

                <p>
                  Your weekly learning
                  activity will appear here.
                </p>

              </div>
            )}

          </div>

          <div className="chart-footer">

            <span>
              <span className="legend-dot" />
              Learning activity
            </span>

            <span>
              Last 7 days
            </span>

          </div>

        </div>

        {/* LEARNING ACTIONS */}

        <div className="insights-card breakdown-card">

          <div className="card-heading">

            <div>

              <span className="section-label">
                BREAKDOWN
              </span>

              <h2>
                Learning Actions
              </h2>

            </div>

          </div>

          <div className="action-list">

            {/* SEARCHES */}

            <div className="action-row">

              <div className="action-left">

                <div className="action-icon search">
                  <Search size={18} />
                </div>

                <div>

                  <strong>
                    Knowledge Searches
                  </strong>

                  <span>
                    Semantic search activity
                  </span>

                </div>

              </div>

              <strong className="action-value">
                {insights.searches}
              </strong>

            </div>

            {/* AI */}

            <div className="action-row">

              <div className="action-left">

                <div className="action-icon ai">
                  <Sparkles size={18} />
                </div>

                <div>

                  <strong>
                    AI Interactions
                  </strong>

                  <span>
                    Assistant & Copilot
                  </span>

                </div>

              </div>

              <strong className="action-value">
                {insights.aiInteractions}
              </strong>

            </div>

            {/* DOCUMENTS */}

            <div className="action-row">

              <div className="action-left">

                <div className="action-icon docs">
                  <FileText size={18} />
                </div>

                <div>

                  <strong>
                    Document Actions
                  </strong>

                  <span>
                    Knowledge resources
                  </span>

                </div>

              </div>

              <strong className="action-value">
                {insights.documentActions}
              </strong>

            </div>

          </div>

        </div>

      </section>

      {/* ======================================================
          KNOWLEDGE MAP
      ====================================================== */}

      <section className="insights-card topics-card">

        <div className="card-heading">

          <div>

            <span className="section-label">
              KNOWLEDGE MAP
            </span>

            <h2>
              Learning Topics
            </h2>

            <p>
              Areas where your recent learning
              activity is concentrated.
            </p>

          </div>

          <div className="topics-count">

            <Sparkles size={16} />

            {insights.topics.length}

          </div>

        </div>

        {insights.topics.length > 0 ? (

          <div className="topics-grid">

            {insights.topics.map(
              (topic, index) => (

                <div
                  className="topic-card"
                  key={`${topic.name}-${index}`}
                >

                  <div className="topic-number">
                    {String(index + 1).padStart(
                      2,
                      "0"
                    )}
                  </div>

                  <div className="topic-info">

                    <strong>
                      {topic.name}
                    </strong>

                    <span>
                      {topic.activities}{" "}
                      {topic.activities === 1
                        ? "activity"
                        : "activities"}
                    </span>

                  </div>

                  <ChevronRight
                    size={17}
                    className="topic-arrow"
                  />

                </div>

              )
            )}

          </div>

        ) : (

          <div className="empty-state">

            <div className="empty-icon">
              <Brain size={27} />
            </div>

            <h3>
              Your Knowledge Map is empty
            </h3>

            <p>
              Start searching documents,
              reading resources or talking
              with the AI Assistant to build
              your learning map.
            </p>

          </div>

        )}

      </section>

      {/* ======================================================
          LAST ACTIVITY
      ====================================================== */}

      {insights.lastActivity && (

        <section className="last-activity">

          <div className="last-activity-icon">
            <CheckCircle2 size={19} />
          </div>

          <div className="last-activity-content">

            <span>
              LAST LEARNING ACTIVITY
            </span>

            <strong>
              {insights.lastActivity.action ||
                "Learning activity"}
            </strong>

            <p>
              {insights.lastActivity.description ||
                insights.lastActivity.category ||
                "Learning activity recorded successfully."}
            </p>

          </div>

          <div className="last-activity-time">

            {formatActivityDate(
              insights.lastActivity
                .createdAt
            )}

          </div>

        </section>

      )}

    </div>
  );
}