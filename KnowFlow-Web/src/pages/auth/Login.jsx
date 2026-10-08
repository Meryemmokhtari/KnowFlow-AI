import React, { useState } from "react";
import {
  Mail,
  Lock,
  Eye,
  EyeOff,
  ArrowRight,
  ShieldCheck,
  Sparkles,
  Brain,
  Search,
  FileText,
  Network,
  Database,
  Zap,
  CheckCircle2,
  Cpu,
} from "lucide-react";

import { motion } from "framer-motion";
import { useNavigate } from "react-router-dom";

import { useAuth } from "../../context/AuthContext";

import Logo from "../../components/ui/Logo";

import "./Login.css";

// =====================================================
// KNOWLEDGE NODE
// =====================================================

function KnowledgeNode({
  icon: Icon,
  title,
  subtitle,
  className = "",
  delay = 0,
}) {
  return (
    <motion.div
      className={`knowledge-node ${className}`}
      initial={{
        opacity: 0,
        scale: 0.7,
        y: 15,
      }}
      animate={{
        opacity: 1,
        scale: 1,
        y: 0,
      }}
      transition={{
        duration: 0.7,
        delay,
        ease: "easeOut",
      }}
    >
      <div className="node-icon">
        <Icon size={15} />
      </div>

      <div className="node-content">
        <span>{title}</span>
        <small>{subtitle}</small>
      </div>

      <span className="node-status" />
    </motion.div>
  );
}

// =====================================================
// LOGIN
// =====================================================

export default function Login() {
  const navigate = useNavigate();

  const { login, loginUser } = useAuth();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const [showPassword, setShowPassword] = useState(false);
  const [remember, setRemember] = useState(true);

  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  // ===================================================
  // SUBMIT
  // ===================================================

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (loading) return;

    setError("");

    // -------------------------------------------------
    // VALIDATION
    // -------------------------------------------------

    const cleanEmail = email.trim();

    if (!cleanEmail) {
      setError("Please enter your email address.");
      return;
    }

    if (!password) {
      setError("Please enter your password.");
      return;
    }

    try {
      setLoading(true);

      console.log(
        "🔐 KnowFlow AI - starting authentication..."
      );

      // ------------------------------------------------
      // LOGIN THROUGH AUTH CONTEXT
      // ------------------------------------------------

      const response = await login(
        cleanEmail,
        password
      );

      console.log(
        "🧠 KnowFlow AI - login response:",
        response
      );

      // ------------------------------------------------
      // TOKEN EXTRACTION
      // ------------------------------------------------

      let token = null;

      if (typeof response === "string") {
        token = response;
      } else if (response) {
        token =
          response.token ||
          response.Token ||
          response.accessToken ||
          response.AccessToken ||
          response.jwt ||
          response.JWT ||
          response.access_token ||
          response.data?.token ||
          response.data?.Token ||
          response.data?.accessToken ||
          response.data?.AccessToken ||
          response.data?.jwt ||
          response.result?.token ||
          response.result?.accessToken;
      }

      if (typeof token === "string") {
        token = token.trim();
      }

      console.log(
        "🔑 KnowFlow Auth - token found:",
        Boolean(token)
      );

      // ------------------------------------------------
      // TOKEN REQUIRED
      // ------------------------------------------------

      if (!token) {
        console.error(
          "❌ KnowFlow Auth - complete response:",
          response
        );

        throw new Error(
          "Authentication token not received."
        );
      }

      // ------------------------------------------------
      // SAVE AUTH SESSION
      // ------------------------------------------------

      const authenticated = loginUser(
        token,
        remember
      );

      if (!authenticated) {
        throw new Error(
          "Authentication token is invalid or expired."
        );
      }

      console.log(
        "✅ KnowFlow AI - authentication successful."
      );

      // ------------------------------------------------
      // GET STORED USER
      // ------------------------------------------------

      let storedUser = null;

      try {
        const rawUser =
          localStorage.getItem("user") ||
          sessionStorage.getItem("user");

        if (rawUser) {
          storedUser = JSON.parse(rawUser);
        }
      } catch (userError) {
        console.warn(
          "⚠️ Unable to read stored user:",
          userError
        );

        storedUser = null;
      }

      // ------------------------------------------------
      // GET ROLE
      // ------------------------------------------------

      const role =
        storedUser?.role ||
        storedUser?.Role ||
        localStorage.getItem("role") ||
        localStorage.getItem("Role") ||
        sessionStorage.getItem("role") ||
        sessionStorage.getItem("Role") ||
        "";

      const normalizedRole = role
        .toString()
        .trim()
        .toLowerCase();

      console.log(
        "🎭 KnowFlow AI - authenticated role:",
        normalizedRole
      );

      // ------------------------------------------------
      // ROLE REDIRECTION
      // ------------------------------------------------

      // ADMIN
      if (normalizedRole === "admin") {
        navigate("/dashboard/admin", {
          replace: true,
        });

        return;
      }

      // MANAGER / RESPONSABLE
      if (
        normalizedRole === "manager" ||
        normalizedRole === "responsable"
      ) {
        navigate("/dashboard/manager", {
          replace: true,
        });

        return;
      }

      // ENSEIGNANT / TEACHER
      if (
        normalizedRole === "enseignant" ||
        normalizedRole === "teacher"
      ) {
        navigate("/dashboard/enseignant", {
          replace: true,
        });

        return;
      }

      // ÉTUDIANT / STUDENT
      if (
        normalizedRole === "étudiant" ||
        normalizedRole === "etudiant" ||
        normalizedRole === "student"
      ) {
        navigate("/dashboard/employee", {
          replace: true,
        });

        return;
      }

      // EMPLOYEE
      if (normalizedRole === "employee") {
        navigate("/dashboard", {
          replace: true,
        });

        return;
      }

      // DEFAULT
      navigate("/dashboard", {
        replace: true,
      });
    } catch (err) {
      console.error(
        "❌ KnowFlow Login error:",
        err
      );

      const message =
        err?.response?.data?.message ||
        err?.response?.data?.error ||
        err?.response?.data?.title ||
        err?.message ||
        "Unable to sign in. Please check your credentials.";

      setError(message);
    } finally {
      setLoading(false);
    }
  };

  // ===================================================
  // JSX
  // ===================================================

  return (
    <main className="login-page">

      {/* =================================================
          BACKGROUND
      ================================================= */}

      <div className="login-grid" />

      <div className="login-noise" />

      <div className="ambient ambient-one" />
      <div className="ambient ambient-two" />
      <div className="ambient ambient-three" />

      {/* DATA STREAMS */}

      <div className="data-stream stream-one" />
      <div className="data-stream stream-two" />
      <div className="data-stream stream-three" />

      {/* =================================================
          MAIN SHELL
      ================================================= */}

      <div className="login-shell">

        {/* =================================================
            LEFT — KNOWLEDGE UNIVERSE
        ================================================= */}

        <section className="login-visual">

          {/* BRAND */}

          <motion.div
            className="brand-area"
            initial={{
              opacity: 0,
              y: -15,
            }}
            animate={{
              opacity: 1,
              y: 0,
            }}
            transition={{
              duration: 0.7,
            }}
          >
            <Logo />

            <div className="brand-meta">
              <span>
                INTELLIGENT KNOWLEDGE SYSTEM
              </span>

              <small>
                v2.0 · AI CORE ONLINE
              </small>
            </div>
          </motion.div>

          {/* SYSTEM STATUS */}

          <motion.div
            className="system-status"
            initial={{
              opacity: 0,
              x: -15,
            }}
            animate={{
              opacity: 1,
              x: 0,
            }}
            transition={{
              delay: 0.2,
              duration: 0.6,
            }}
          >
            <span className="status-dot" />

            <span>
              ALL SYSTEMS OPERATIONAL
            </span>

            <span className="status-line" />

            <span className="status-live">
              LIVE
            </span>
          </motion.div>

          {/* HERO */}

          <div className="visual-hero">

            <motion.div
              className="hero-eyebrow"
              initial={{
                opacity: 0,
                y: 10,
              }}
              animate={{
                opacity: 1,
                y: 0,
              }}
              transition={{
                delay: 0.25,
              }}
            >
              <Sparkles size={14} />

              KNOWLEDGE, CONNECTED.
            </motion.div>

            <motion.h1
              initial={{
                opacity: 0,
                y: 20,
              }}
              animate={{
                opacity: 1,
                y: 0,
              }}
              transition={{
                delay: 0.35,
                duration: 0.7,
              }}
            >
              Turn your knowledge
              <br />

              <span>
                into intelligence.
              </span>
            </motion.h1>

            <motion.p
              initial={{
                opacity: 0,
                y: 15,
              }}
              animate={{
                opacity: 1,
                y: 0,
              }}
              transition={{
                delay: 0.45,
              }}
            >
              One intelligent workspace for documents,
              semantic search, contextual retrieval and
              AI-powered knowledge.
            </motion.p>

          </div>

          {/* =================================================
              KNOWLEDGE UNIVERSE
          ================================================= */}

          <motion.div
            className="knowledge-universe"
            initial={{
              opacity: 0,
              scale: 0.9,
            }}
            animate={{
              opacity: 1,
              scale: 1,
            }}
            transition={{
              delay: 0.5,
              duration: 0.9,
            }}
          >

            {/* ORBITS */}

            <div className="orbit orbit-one" />
            <div className="orbit orbit-two" />
            <div className="orbit orbit-three" />

            {/* CONNECTIONS */}

            <svg
              className="knowledge-connections"
              viewBox="0 0 600 360"
              preserveAspectRatio="none"
            >
              <line
                x1="300"
                y1="180"
                x2="95"
                y2="70"
              />

              <line
                x1="300"
                y1="180"
                x2="505"
                y2="70"
              />

              <line
                x1="300"
                y1="180"
                x2="85"
                y2="275"
              />

              <line
                x1="300"
                y1="180"
                x2="515"
                y2="275"
              />

              <line
                x1="95"
                y1="70"
                x2="505"
                y2="70"
              />

              <line
                x1="85"
                y1="275"
                x2="515"
                y2="275"
              />
            </svg>

            {/* CENTER AI CORE */}

            <motion.div
              className="ai-core"
              animate={{
                scale: [1, 1.04, 1],
              }}
              transition={{
                duration: 3,
                repeat: Infinity,
                ease: "easeInOut",
              }}
            >

              <div className="ai-core-ring ring-a" />
              <div className="ai-core-ring ring-b" />

              <div className="ai-core-icon">
                <Cpu size={28} />
              </div>

              <span>
                AI CORE
              </span>

            </motion.div>

            {/* NODES */}

            <KnowledgeNode
              icon={FileText}
              title="Documents"
              subtitle="Centralized"
              className="node-documents"
              delay={0.65}
            />

            <KnowledgeNode
              icon={Search}
              title="Semantic Search"
              subtitle="Context-aware"
              className="node-search"
              delay={0.75}
            />

            <KnowledgeNode
              icon={Brain}
              title="RAG Engine"
              subtitle="Grounded AI"
              className="node-rag"
              delay={0.85}
            />

            <KnowledgeNode
              icon={Sparkles}
              title="AI Copilot"
              subtitle="Intelligent"
              className="node-copilot"
              delay={0.95}
            />

            <KnowledgeNode
              icon={Network}
              title="Knowledge Graph"
              subtitle="Connected"
              className="node-graph"
              delay={1.05}
            />

            {/* FLOATING PARTICLES */}

            <span className="particle p-one" />
            <span className="particle p-two" />
            <span className="particle p-three" />
            <span className="particle p-four" />
            <span className="particle p-five" />
            <span className="particle p-six" />

          </motion.div>

          {/* =================================================
              PIPELINE
          ================================================= */}

          <div className="intelligence-pipeline">

            <div className="pipeline-step">
              <span>01</span>
              <strong>CAPTURE</strong>
            </div>

            <div className="pipeline-arrow">
              →
            </div>

            <div className="pipeline-step">
              <span>02</span>
              <strong>UNDERSTAND</strong>
            </div>

            <div className="pipeline-arrow">
              →
            </div>

            <div className="pipeline-step">
              <span>03</span>
              <strong>RETRIEVE</strong>
            </div>

            <div className="pipeline-arrow">
              →
            </div>

            <div className="pipeline-step">
              <span>04</span>
              <strong>REASON</strong>
            </div>

            <div className="pipeline-arrow">
              →
            </div>

            <div className="pipeline-step">
              <span>05</span>
              <strong>ASSIST</strong>
            </div>

          </div>

          {/* FOOTER */}

          <div className="visual-footer">
            KNOWFLOW AI

            <span>•</span>

            INTELLIGENT KNOWLEDGE INFRASTRUCTURE

            <span>•</span>

            2027
          </div>

        </section>

        {/* =================================================
            RIGHT — LOGIN
        ================================================= */}

        <section className="login-panel">

          <motion.div
            className="login-card"
            initial={{
              opacity: 0,
              x: 35,
            }}
            animate={{
              opacity: 1,
              x: 0,
            }}
            transition={{
              duration: 0.8,
              ease: "easeOut",
            }}
          >

            {/* CARD TOP */}

            <div className="card-top">

              <div className="secure-badge">
                <ShieldCheck size={15} />

                <span>
                  SECURE WORKSPACE
                </span>

                <i />
              </div>

              <div className="card-version">
                KF / 2027
              </div>

            </div>

            {/* TITLE */}

            <div className="login-heading">

              <span className="heading-label">
                KNOWFLOW AI
              </span>

              <h2>
                Welcome back.
              </h2>

              <p>
                Sign in to continue to your
                intelligent workspace.
              </p>

            </div>

            {/* ERROR */}

            {error && (
              <motion.div
                className="login-error"
                initial={{
                  opacity: 0,
                  y: -8,
                }}
                animate={{
                  opacity: 1,
                  y: 0,
                }}
              >
                <span className="error-icon">
                  !
                </span>

                <span>
                  {error}
                </span>
              </motion.div>
            )}

            {/* FORM */}

            <form
              className="login-form"
              onSubmit={handleSubmit}
            >

              {/* EMAIL */}

              <div className="field-group">

                <label htmlFor="email">
                  EMAIL ADDRESS
                </label>

                <div className="input-shell">

                  <Mail size={17} />

                  <input
                    id="email"
                    type="email"
                    value={email}
                    onChange={(e) =>
                      setEmail(e.target.value)
                    }
                    placeholder="you@knowflow.ai"
                    autoComplete="email"
                    disabled={loading}
                  />

                </div>

              </div>

              {/* PASSWORD */}

              <div className="field-group">

                <div className="field-label-row">

                  <label htmlFor="password">
                    PASSWORD
                  </label>

                  <button
                    type="button"
                    className="forgot-password"
                    onClick={() =>
                      setError(
                        "Password recovery will be available soon."
                      )
                    }
                    disabled={loading}
                  >
                    Forgot password?
                  </button>

                </div>

                <div className="input-shell">

                  <Lock size={17} />

                  <input
                    id="password"
                    type={
                      showPassword
                        ? "text"
                        : "password"
                    }
                    value={password}
                    onChange={(e) =>
                      setPassword(e.target.value)
                    }
                    placeholder="Enter your password"
                    autoComplete="current-password"
                    disabled={loading}
                  />

                  <button
                    type="button"
                    className="password-toggle"
                    onClick={() =>
                      setShowPassword(
                        (current) => !current
                      )
                    }
                    aria-label={
                      showPassword
                        ? "Hide password"
                        : "Show password"
                    }
                    disabled={loading}
                  >
                    {showPassword ? (
                      <EyeOff size={17} />
                    ) : (
                      <Eye size={17} />
                    )}
                  </button>

                </div>

              </div>

              {/* OPTIONS */}

              <div className="form-options">

                <label className="remember-option">

                  <input
                    type="checkbox"
                    checked={remember}
                    onChange={(e) =>
                      setRemember(
                        e.target.checked
                      )
                    }
                    disabled={loading}
                  />

                  <span className="custom-checkbox">
                    <CheckCircle2 size={11} />
                  </span>

                  <span>
                    Remember this device
                  </span>

                </label>

                <div className="session-info">
                  <Database size={12} />
                  JWT SESSION
                </div>

              </div>

              {/* SUBMIT */}

              <motion.button
                type="submit"
                className="login-button"
                disabled={loading}
                whileHover={
                  !loading
                    ? {
                        scale: 1.01,
                      }
                    : {}
                }
                whileTap={
                  !loading
                    ? {
                        scale: 0.99,
                      }
                    : {}
                }
              >

                {loading ? (
                  <>
                    <span className="button-spinner" />

                    AUTHENTICATING...
                  </>
                ) : (
                  <>
                    <Zap size={16} />

                    ENTER KNOWLEDGE WORKSPACE

                    <ArrowRight size={18} />
                  </>
                )}

              </motion.button>

            </form>

            {/* SECURITY STRIP */}

            <div className="security-strip">

              <div className="security-icon">
                <ShieldCheck size={18} />
              </div>

              <div className="security-content">
                <strong>
                  Protected workspace
                </strong>

                <span>
                  JWT authentication · Role-based access
                </span>
              </div>

              <div className="security-live">
                <Zap size={12} />
                LIVE
              </div>

            </div>

            {/* CARD FOOTER */}

            <div className="login-card-footer">

              <div>
                <span className="footer-core-dot" />

                KNOWFLOW AI CORE
              </div>

              <span>
                Encrypted session
              </span>

            </div>

          </motion.div>

        </section>

      </div>

    </main>
  );
}