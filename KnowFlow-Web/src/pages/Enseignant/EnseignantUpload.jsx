
import React, { useRef, useState } from "react";
import {
  UploadCloud,
  FileText,
  File,
  X,
  CheckCircle2,
  AlertCircle,
  Loader2,
  Sparkles,
  Brain,
  Database,
  ShieldCheck,
  BookOpen,
  ArrowRight,
  Zap,
  ScanText,
  Network,
  RotateCcw,
} from "lucide-react";
import { useAuth } from "../../context/AuthContext";
import "./EnseignantUpload.css";

const DOCUMENT_SERVICE_URL = "http://localhost:5260";

const ACCEPTED_TYPES = [
  "application/pdf",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  "text/plain",
];

const MAX_FILE_SIZE = 50 * 1024 * 1024;

function getToken() {
  return (
    localStorage.getItem("token") ||
    localStorage.getItem("accessToken") ||
    sessionStorage.getItem("token") ||
    sessionStorage.getItem("accessToken") ||
    ""
  );
}

function formatFileSize(bytes) {
  if (!bytes) return "0 KB";

  const mb = bytes / (1024 * 1024);

  if (mb >= 1) {
    return `${mb.toFixed(1)} MB`;
  }

  return `${Math.max(1, Math.round(bytes / 1024))} KB`;
}

function getFileType(file) {
  const extension = file?.name?.split(".").pop()?.toLowerCase();

  if (extension === "pdf") return "PDF";
  if (extension === "docx") return "DOCX";
  if (extension === "txt") return "TXT";

  return "FILE";
}

function getFileIcon(file) {
  const type = getFileType(file);

  if (type === "PDF" || type === "DOCX") {
    return <FileText size={30} />;
  }

  return <File size={30} />;
}

export default function EnseignantUpload() {
  const inputRef = useRef(null);

  const { user, loading: authLoading } = useAuth();

  const [selectedFile, setSelectedFile] = useState(null);
  const [isDragging, setIsDragging] = useState(false);

  const [uploading, setUploading] = useState(false);
  const [success, setSuccess] = useState(false);

  const [error, setError] = useState("");
  const [message, setMessage] = useState("");

  const [uploadedDocument, setUploadedDocument] = useState(null);

  const validateFile = (file) => {
    if (!file) {
      return "Please select a teaching resource.";
    }

    const extension = file.name
      ?.split(".")
      .pop()
      ?.toLowerCase();

    if (
      !ACCEPTED_TYPES.includes(file.type) &&
      !["pdf", "docx", "txt"].includes(extension)
    ) {
      return "Only PDF, DOCX and TXT files are supported.";
    }

    if (file.size > MAX_FILE_SIZE) {
      return "File size must not exceed 50 MB.";
    }

    return "";
  };

  const handleFile = (file) => {
    setError("");
    setMessage("");
    setSuccess(false);
    setUploadedDocument(null);

    const validationError = validateFile(file);

    if (validationError) {
      setSelectedFile(null);
      setError(validationError);
      return;
    }

    setSelectedFile(file);
  };

  const handleInputChange = (event) => {
    const file = event.target.files?.[0];

    if (file) {
      handleFile(file);
    }

    event.target.value = "";
  };

  const handleDrop = (event) => {
    event.preventDefault();
    setIsDragging(false);

    const file = event.dataTransfer.files?.[0];

    if (file) {
      handleFile(file);
    }
  };

  const removeFile = () => {
    setSelectedFile(null);
    setError("");
    setMessage("");
    setSuccess(false);
    setUploadedDocument(null);
  };

  const uploadDocument = async () => {
    if (!selectedFile) {
      setError("Please select a teaching resource first.");
      return;
    }

    if (authLoading) {
      setError("Authentication is still loading. Please wait.");
      return;
    }

    const token = getToken();

    const userId =
      user?.id ||
      user?.Id ||
      user?.userId ||
      user?.UserId ||
      "";

    if (!userId) {
      setError(
        "Unable to identify the current teacher. Please log in again."
      );
      return;
    }

    if (!token) {
      setError(
        "Authentication token not found. Please log in again."
      );
      return;
    }

    setUploading(true);
    setError("");
    setMessage("");
    setSuccess(false);
    setUploadedDocument(null);

    try {
      const formData = new FormData();

      formData.append("file", selectedFile);
      formData.append("userId", String(userId));

      const response = await fetch(
        `${DOCUMENT_SERVICE_URL}/api/Document/upload`,
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${token}`,
          },
          body: formData,
        }
      );

      const responseText = await response.text();

      let data = null;

      try {
        data = responseText
          ? JSON.parse(responseText)
          : null;
      } catch {
        data = null;
      }

      if (!response.ok) {
        throw new Error(
          data?.message ||
            data?.Message ||
            data?.error ||
            data?.Error ||
            responseText ||
            `Upload failed (${response.status}).`
        );
      }

      setUploadedDocument(data);
      setSuccess(true);

      setMessage(
        "Your teaching resource is now part of the Knowledge Workspace."
      );
    } catch (err) {
      console.error("Enseignant upload error:", err);

      setError(
        err?.message ||
          "Unable to upload the document. Please check the DocumentService."
      );
    } finally {
      setUploading(false);
    }
  };

  const chooseNewFile = () => {
    setError("");
    setMessage("");
    setSuccess(false);
    setUploadedDocument(null);
    inputRef.current?.click();
  };

  return (
    <div className="eu-page">

      {/* =====================================================
          BACKGROUND PARTICLES
      ====================================================== */}

      <div className="eu-background">
        <span className="eu-particle eu-p1" />
        <span className="eu-particle eu-p2" />
        <span className="eu-particle eu-p3" />
        <span className="eu-particle eu-p4" />
        <span className="eu-particle eu-p5" />
        <span className="eu-particle eu-p6" />
      </div>

      {/* =====================================================
          TOP BAR
      ====================================================== */}

      <header className="eu-topbar">

        <div className="eu-brand">
          <div className="eu-brand-symbol">
            <BookOpen size={21} />
          </div>

          <div>
            <span>KNOWFLOW AI</span>
            <strong>TEACHING INTELLIGENCE</strong>
          </div>
        </div>

        <div className="eu-engine-status">
          <span className="eu-live-dot" />
          <span>Knowledge Engine</span>
          <strong>ONLINE</strong>
        </div>

      </header>

      {/* =====================================================
          HERO
      ====================================================== */}

      <section className="eu-hero">

        <div className="eu-hero-content">

          <div className="eu-hero-badge">
            <Sparkles size={14} />
            AI KNOWLEDGE WORKSPACE
          </div>

          <h1>
            Feed your
            <span>knowledge.</span>
          </h1>

          <p>
            Transform your courses, TDs, TPs, exercises and
            research papers into intelligent, searchable
            academic knowledge.
          </p>

          <div className="eu-feature-strip">

            <div>
              <ShieldCheck size={16} />
              <span>Secure</span>
            </div>

            <div>
              <Brain size={16} />
              <span>AI Ready</span>
            </div>

            <div>
              <Database size={16} />
              <span>Indexed</span>
            </div>

          </div>

        </div>

        {/* KNOWLEDGE CORE */}

        <div className="eu-knowledge-core">

          <div className="eu-core-orbit eu-core-orbit-1" />
          <div className="eu-core-orbit eu-core-orbit-2" />
          <div className="eu-core-orbit eu-core-orbit-3" />

          <div className="eu-core-glow" />

          <div className="eu-core">
            {success ? (
              <CheckCircle2 size={42} />
            ) : (
              <Brain size={42} />
            )}
          </div>

          <div className="eu-core-label">
            <span>{success ? "RESOURCE" : "KNOWLEDGE"}</span>
            <strong>{success ? "READY" : "ENGINE"}</strong>
          </div>

        </div>

      </section>

      {/* =====================================================
          MAIN
      ====================================================== */}

      <main className="eu-content">

        {/* LEFT UPLOAD */}
        <section className="eu-upload-panel">

          <div className="eu-panel-top">

            <div>
              <span className="eu-section-label">
                KNOWLEDGE INGESTION
              </span>

              <h2>
                Add teaching material
              </h2>

              <p>
                Give your knowledge engine a new source.
              </p>
            </div>

            <div className="eu-panel-icon">
              <Zap size={20} />
            </div>

          </div>

          {/* DROP AREA */}

          <div
            className={`eu-dropzone ${
              isDragging ? "is-dragging" : ""
            } ${selectedFile ? "has-file" : ""} ${
              success ? "is-success" : ""
            }`}
            onDragOver={(event) => {
              event.preventDefault();
              setIsDragging(true);
            }}
            onDragLeave={() => setIsDragging(false)}
            onDrop={handleDrop}
            onClick={() =>
              !selectedFile &&
              inputRef.current?.click()
            }
          >

            <input
              ref={inputRef}
              type="file"
              hidden
              accept=".pdf,.docx,.txt"
              onChange={handleInputChange}
            />

            {!selectedFile ? (
              <div className="eu-drop-content">

                <div className="eu-upload-visual">

                  <div className="eu-upload-ring" />

                  <div className="eu-upload-center">
                    <UploadCloud size={34} />
                  </div>

                </div>

                <h3>
                  Drop your knowledge here
                </h3>

                <p>
                  Drag & drop your teaching resource
                  <br />
                  or <span>browse your computer</span>
                </p>

                <div className="eu-file-formats">

                  <span className="format-pdf">
                    PDF
                  </span>

                  <span className="format-docx">
                    DOCX
                  </span>

                  <span className="format-txt">
                    TXT
                  </span>

                  <small>
                    MAX 50 MB
                  </small>

                </div>

              </div>
            ) : (
              <div className="eu-selected">

                <div className="eu-selected-top">

                  <div className="eu-file-type">
                    {getFileIcon(selectedFile)}
                  </div>

                  <div className="eu-file-details">

                    <span className="eu-file-badge">
                      {getFileType(selectedFile)}
                    </span>

                    <strong>
                      {selectedFile.name}
                    </strong>

                    <small>
                      {formatFileSize(selectedFile.size)}
                      <span>•</span>
                      Teaching Resource
                    </small>

                  </div>

                  <button
                    type="button"
                    className="eu-delete"
                    onClick={(event) => {
                      event.stopPropagation();
                      removeFile();
                    }}
                  >
                    <X size={17} />
                  </button>

                </div>

                <div className="eu-file-ready">

                  <div className="eu-ready-line">
                    <span />
                  </div>

                  <div className="eu-ready-info">
                    <CheckCircle2 size={15} />
                    <span>Resource validated</span>
                    <strong>READY TO INDEX</strong>
                  </div>

                </div>

              </div>
            )}

          </div>

          {/* ERROR */}

          {error && (
            <div className="eu-alert eu-error">
              <AlertCircle size={18} />
              <span>{error}</span>
            </div>
          )}

          {/* SUCCESS */}

          {success && (
            <div className="eu-alert eu-success">
              <CheckCircle2 size={18} />
              <div>
                <strong>Knowledge successfully added</strong>
                <span>{message}</span>
              </div>
            </div>
          )}

          {/* ACTIONS */}

          <div className="eu-actions">

            <button
              type="button"
              className="eu-ghost-button"
              onClick={chooseNewFile}
              disabled={uploading}
            >
              <RotateCcw size={16} />
              Choose another
            </button>

            <button
              type="button"
              className="eu-upload-button"
              onClick={uploadDocument}
              disabled={
                !selectedFile ||
                uploading ||
                authLoading
              }
            >

              {uploading ? (
                <>
                  <Loader2
                    size={18}
                    className="eu-loader"
                  />
                  Processing knowledge...
                </>
              ) : success ? (
                <>
                  <CheckCircle2 size={18} />
                  Resource indexed
                </>
              ) : (
                <>
                  <UploadCloud size={18} />
                  Upload to Knowledge Engine
                  <ArrowRight size={16} />
                </>
              )}

            </button>

          </div>

        </section>

        {/* RIGHT PIPELINE */}

        <aside className="eu-intelligence-panel">

          <div className="eu-panel-top">

            <div>
              <span className="eu-section-label">
                AI PIPELINE
              </span>

              <h2>
                From file to intelligence
              </h2>
            </div>

            <div className="eu-ai-badge">
              <Sparkles size={14} />
              AI
            </div>

          </div>

          <div className="eu-pipeline">

            <div className="eu-pipeline-step active">

              <div className="eu-pipeline-icon">
                <UploadCloud size={17} />
              </div>

              <div className="eu-pipeline-line" />

              <div>
                <span>01</span>
                <strong>Secure Upload</strong>
                <p>
                  Your academic resource enters
                  the Knowledge Engine.
                </p>
              </div>

            </div>

            <div className="eu-pipeline-step">

              <div className="eu-pipeline-icon purple">
                <ScanText size={17} />
              </div>

              <div className="eu-pipeline-line" />

              <div>
                <span>02</span>
                <strong>Content Extraction</strong>
                <p>
                  Useful text and document content
                  are extracted automatically.
                </p>
              </div>

            </div>

            <div className="eu-pipeline-step">

              <div className="eu-pipeline-icon pink">
                <Brain size={17} />
              </div>

              <div className="eu-pipeline-line" />

              <div>
                <span>03</span>
                <strong>AI Understanding</strong>
                <p>
                  KnowFlow prepares your resource
                  for intelligent search.
                </p>
              </div>

            </div>

            <div className="eu-pipeline-step">

              <div className="eu-pipeline-icon green">
                <Network size={17} />
              </div>

              <div>
                <span>04</span>
                <strong>Knowledge Indexing</strong>
                <p>
                  Your material becomes part of
                  your searchable knowledge ecosystem.
                </p>
              </div>

            </div>

          </div>

          <div className="eu-pipeline-footer">

            <div className="eu-mini-orb">
              <Database size={17} />
            </div>

            <div>
              <span>KNOWLEDGE STATUS</span>
              <strong>
                {success
                  ? "Resource ready for AI"
                  : "Waiting for new resource"}
              </strong>
            </div>

            <div className="eu-status-check">
              <CheckCircle2 size={15} />
            </div>

          </div>

        </aside>

      </main>

      {/* =====================================================
          SUPPORTED CONTENT
      ====================================================== */}

      <section className="eu-supported">

        <div className="eu-supported-title">

          <span className="eu-section-label">
            YOUR ACADEMIC ECOSYSTEM
          </span>

          <h2>
            Everything your teaching needs.
          </h2>

        </div>

        <div className="eu-resource-grid">

          <div className="eu-resource-card resource-cyan">
            <div className="eu-resource-icon">
              <BookOpen size={19} />
            </div>

            <div>
              <strong>Courses</strong>
              <span>Lectures & chapters</span>
            </div>
          </div>

          <div className="eu-resource-card resource-blue">
            <div className="eu-resource-icon">
              <FileText size={19} />
            </div>

            <div>
              <strong>TD / TP</strong>
              <span>Practical resources</span>
            </div>
          </div>

          <div className="eu-resource-card resource-purple">
            <div className="eu-resource-icon">
              <Brain size={19} />
            </div>

            <div>
              <strong>Exercises</strong>
              <span>Problems & solutions</span>
            </div>
          </div>

          <div className="eu-resource-card resource-pink">
            <div className="eu-resource-icon">
              <Network size={19} />
            </div>

            <div>
              <strong>Research</strong>
              <span>Papers & references</span>
            </div>
          </div>

        </div>

      </section>

      {/* =====================================================
          SUCCESS RESULT
      ====================================================== */}

      {uploadedDocument && success && (
        <section className="eu-result">

          <div className="eu-result-glow" />

          <div className="eu-result-icon">
            <CheckCircle2 size={24} />
          </div>

          <div className="eu-result-content">

            <span>KNOWLEDGE RESOURCE ADDED</span>

            <strong>
              {uploadedDocument?.FileName ||
                uploadedDocument?.fileName ||
                selectedFile?.name ||
                "Teaching resource"}
            </strong>

          </div>

          <div className="eu-result-status">
            <Sparkles size={15} />
            AI READY
          </div>

        </section>
      )}

      {/* FOOTER */}

      <footer className="eu-footer">
        <span>KNOWFLOW AI</span>
        <i />
        <span>Teaching Intelligence</span>
        <i />
        <span>Knowledge Engine v1.0</span>
      </footer>

    </div>
  );
}