import { useRef, useState } from "react";

import {
  UploadCloud,
  FileText,
  Sparkles,
  Database,
  Brain,
  CheckCircle,
  Loader,
  AlertCircle,
} from "lucide-react";

import "./Upload.css";

const DOCUMENT_SERVICE_URL = "http://localhost:5260";

export default function Upload() {
  const fileInputRef = useRef(null);

  const [selectedFile, setSelectedFile] = useState(null);
  const [files, setFiles] = useState([]);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  // ==========================
  // Select File
  // ==========================

  const handleFileChange = (event) => {
    const file = event.target.files?.[0];

    if (!file) {
      return;
    }

    setSelectedFile(file);
    setMessage("");
    setError("");
  };

  // ==========================
  // Get JWT Token
  // ==========================

  const getToken = () => {
    const token =
      localStorage.getItem("token") ||
      localStorage.getItem("accessToken");

    return token;
  };

  // ==========================
  // Upload File
  // ==========================

  const handleUpload = async () => {
    if (!selectedFile) {
      setError("Please select a document first.");
      return;
    }

    try {
      setLoading(true);
      setError("");
      setMessage("");

      // ==========================
      // Get JWT
      // ==========================

      const token = getToken();

      console.log(
        "🔑 Upload token found:",
        !!token
      );

      if (!token) {
        throw new Error(
          "Authentication required. Please login again."
        );
      }

      // ==========================
      // FormData
      // ==========================

      const formData = new FormData();

      formData.append(
        "file",
        selectedFile
      );

      /*
       * The backend gets the authenticated
       * user from JWT.
       *
       * We keep this userId because your
       * current backend may still expect it.
       */
      formData.append(
        "userId",
        "d5c123ff-0cc2-4063-9010-bf34c829b47e"
      );

      console.log(
        "📤 Uploading:",
        selectedFile.name
      );

      console.log(
        "🔐 Authorization header:",
        "Bearer token attached"
      );

      // ==========================
      // Send Request
      // ==========================

      const response = await fetch(
        `${DOCUMENT_SERVICE_URL}/api/Document/upload`,
        {
          method: "POST",

          headers: {
            Authorization: `Bearer ${token}`,
          },

          /*
           * IMPORTANT:
           * Do NOT manually set Content-Type here.
           *
           * Browser automatically creates:
           * multipart/form-data + boundary
           */
          body: formData,
        }
      );

      // ==========================
      // Read Response
      // ==========================

      const responseText =
        await response.text();

      console.log(
        "📡 DocumentService status:",
        response.status
      );

      console.log(
        "📡 DocumentService response:",
        responseText
      );

      // ==========================
      // Unauthorized
      // ==========================

      if (response.status === 401) {
        throw new Error(
          "Unauthorized (401). Your session may have expired. Please login again."
        );
      }

      // ==========================
      // Other Errors
      // ==========================

      if (!response.ok) {
        console.error(
          "❌ Upload failed:",
          response.status,
          responseText
        );

        throw new Error(
          responseText ||
            `Upload failed (${response.status})`
        );
      }

      // ==========================
      // Parse JSON
      // ==========================

      let uploadedDocument;

      try {
        uploadedDocument =
          JSON.parse(responseText);
      } catch (parseError) {
        console.error(
          "❌ JSON parse error:",
          parseError
        );

        throw new Error(
          "Invalid response from DocumentService."
        );
      }

      // ==========================
      // Save Uploaded File
      // ==========================

      setFiles((previousFiles) => [
        uploadedDocument,
        ...previousFiles,
      ]);

      setMessage(
        `${selectedFile.name} uploaded successfully!`
      );

      console.log(
        "✅ Upload successful:",
        uploadedDocument
      );

      // ==========================
      // Reset Selected File
      // ==========================

      setSelectedFile(null);

      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    } catch (err) {
      console.error(
        "❌ Document upload error:",
        err
      );

      setError(
        err?.message ||
          "Unable to upload the document. Check DocumentService."
      );
    } finally {
      setLoading(false);
    }
  };

  // ==========================
  // Format File Size
  // ==========================

  const formatFileSize = (bytes) => {
    if (!bytes) {
      return "0 KB";
    }

    const kb = bytes / 1024;

    if (kb < 1024) {
      return `${kb.toFixed(1)} KB`;
    }

    const mb = kb / 1024;

    return `${mb.toFixed(2)} MB`;
  };

  // ==========================
  // Render
  // ==========================

  return (
    <div className="upload-page">

      {/* ==========================
          HEADER
      ========================== */}

      <div className="upload-header">

        <div>
          <h1>
            Upload Documents 🚀
          </h1>

          <p>
            Upload your files and let AI
            understand your knowledge.
          </p>
        </div>

        <div className="ai-status">
          <Sparkles />
          AI Indexing Ready
        </div>

      </div>

      {/* ==========================
          DROP ZONE
      ========================== */}

      <div className="drop-zone">

        <UploadCloud />

        <h2>
          Drop your documents here
        </h2>

        <p>
          PDF • DOCX • TXT supported
        </p>

        {/* Hidden input */}

        <input
          ref={fileInputRef}
          type="file"
          accept=".pdf,.docx,.txt"
          onChange={handleFileChange}
          hidden
        />

        {/* Select File */}

        <button
          type="button"
          onClick={() =>
            fileInputRef.current?.click()
          }
          disabled={loading}
        >
          Select File
        </button>

        {/* ==========================
            Selected File
        ========================== */}

        {selectedFile && (
          <div className="selected-file">

            <FileText />

            <span>
              {selectedFile.name}
            </span>

            <strong>
              {formatFileSize(
                selectedFile.size
              )}
            </strong>

          </div>
        )}

        {/* ==========================
            Upload Button
        ========================== */}

        {selectedFile && (
          <button
            type="button"
            className="upload-button"
            onClick={handleUpload}
            disabled={loading}
          >

            {loading ? (
              <>
                <Loader className="spin" />
                Uploading...
              </>
            ) : (
              <>
                <UploadCloud />
                Upload Document
              </>
            )}

          </button>
        )}

        {/* ==========================
            Success Message
        ========================== */}

        {message && (
          <div className="success-message">

            <CheckCircle />

            {message}

          </div>
        )}

        {/* ==========================
            Error Message
        ========================== */}

        {error && (
          <div className="error-message">

            <AlertCircle />

            {error}

          </div>
        )}

      </div>

      {/* ==========================
          AI PIPELINE
      ========================== */}

      <div className="pipeline">

        <h2>
          🧠 AI Processing Pipeline
        </h2>

        <div className="pipeline-items">

          <div>
            <FileText />

            <span>
              Document
              <br />
              Upload
            </span>
          </div>

          <div>
            <Brain />

            <span>
              AI
              <br />
              Analysis
            </span>
          </div>

          <div>
            <Database />

            <span>
              Vector
              <br />
              Storage
            </span>
          </div>

          <div>
            <CheckCircle />

            <span>
              Ready
              <br />
              Search
            </span>
          </div>

        </div>

      </div>

      {/* ==========================
          RECENT UPLOADS
      ========================== */}

      <div className="files-box">

        <h2>
          Recent Uploads
        </h2>

        {files.length === 0 ? (
          <p className="empty-files">
            No documents uploaded in this session.
          </p>
        ) : (
          files.map((file) => (
            <div
              className="file-card"
              key={file.id}
            >

              <FileText />

              <div>

                <h3>
                  {file.fileName}
                </h3>

                <p>
                  {formatFileSize(
                    file.fileSize
                  )}
                </p>

              </div>

              <div className="file-status">

                <CheckCircle />

                Uploaded

              </div>

            </div>
          ))
        )}

      </div>

      {/* ==========================
          AI MESSAGE
      ========================== */}

      <div className="ai-message">

        <Sparkles />

        <div>

          <h3>
            AI Assistant
          </h3>

          <p>
            Your documents will be automatically
            indexed and available for semantic search.
          </p>

        </div>

      </div>

    </div>
  );
}