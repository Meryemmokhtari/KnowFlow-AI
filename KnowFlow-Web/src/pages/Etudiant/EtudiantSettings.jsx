import React, { useEffect, useState } from "react";
import {
  User,
  Lock,
  Brain,
  Bell,
  ShieldCheck,
  Save,
  Eye,
  EyeOff,
  CheckCircle2,
  AlertCircle,
  Sparkles,
  GraduationCap,
} from "lucide-react";
import { useAuth } from "../../context/AuthContext";
import "./EtudiantSettings.css";

const AUTH_API = "http://localhost:5282/api/Auth";

export default function EtudiantSettings() {
  const { user, getToken, refreshAuth } = useAuth();

  const [activeTab, setActiveTab] = useState("profile");

  const [profile, setProfile] = useState({
    name: "",
    email: "",
  });

  const [password, setPassword] = useState({
    currentPassword: "",
    newPassword: "",
    confirmPassword: "",
  });

  const [showPassword, setShowPassword] = useState({
    current: false,
    new: false,
    confirm: false,
  });

  const [preferences, setPreferences] = useState({
    aiEnabled: true,
    smartSuggestions: true,
    learningInsights: true,
    notifications: true,
  });

  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState({
    type: "",
    text: "",
  });

  useEffect(() => {
    if (user) {
      setProfile({
        name: user.name || "",
        email: user.email || "",
      });
    }
  }, [user]);

  const getAuthHeaders = () => {
    const token = getToken?.() || localStorage.getItem("token");

    return {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    };
  };

  const showMessage = (type, text) => {
    setMessage({ type, text });

    setTimeout(() => {
      setMessage({ type: "", text: "" });
    }, 4000);
  };

  const handleProfileChange = (e) => {
    setProfile((prev) => ({
      ...prev,
      [e.target.name]: e.target.value,
    }));
  };

  const handlePasswordChange = (e) => {
    setPassword((prev) => ({
      ...prev,
      [e.target.name]: e.target.value,
    }));
  };

  const saveProfile = async (e) => {
    e.preventDefault();

    if (!profile.name.trim() || !profile.email.trim()) {
      showMessage("error", "Please complete all profile fields.");
      return;
    }

    setLoading(true);
    setMessage({ type: "", text: "" });

    try {
      const response = await fetch(`${AUTH_API}/profile`, {
        method: "PUT",
        headers: getAuthHeaders(),
        body: JSON.stringify({
          name: profile.name.trim(),
          email: profile.email.trim(),
        }),
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(errorText || "Unable to update profile.");
      }

      await refreshAuth?.();

      showMessage("success", "Your profile has been updated successfully.");
    } catch (error) {
      console.error("Profile update error:", error);

      showMessage(
        "error",
        "Unable to update your profile. Please try again."
      );
    } finally {
      setLoading(false);
    }
  };

  const changePassword = async (e) => {
    e.preventDefault();

    if (
      !password.currentPassword ||
      !password.newPassword ||
      !password.confirmPassword
    ) {
      showMessage("error", "Please complete all password fields.");
      return;
    }

    if (password.newPassword.length < 6) {
      showMessage(
        "error",
        "Your new password must contain at least 6 characters."
      );
      return;
    }

    if (password.newPassword !== password.confirmPassword) {
      showMessage("error", "The passwords do not match.");
      return;
    }

    setLoading(true);
    setMessage({ type: "", text: "" });

    try {
      const response = await fetch(`${AUTH_API}/password`, {
        method: "PUT",
        headers: getAuthHeaders(),
        body: JSON.stringify({
          currentPassword: password.currentPassword,
          newPassword: password.newPassword,
        }),
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(errorText || "Unable to change password.");
      }

      setPassword({
        currentPassword: "",
        newPassword: "",
        confirmPassword: "",
      });

      showMessage("success", "Your password has been changed successfully.");
    } catch (error) {
      console.error("Password change error:", error);

      showMessage(
        "error",
        "Unable to change your password. Check your current password."
      );
    } finally {
      setLoading(false);
    }
  };

  const togglePreference = (key) => {
    setPreferences((prev) => ({
      ...prev,
      [key]: !prev[key],
    }));
  };

  return (
    <div className="student-settings-page">
      {/* BACKGROUND */}
      <div className="student-settings-glow glow-one" />
      <div className="student-settings-glow glow-two" />

      <div className="student-settings-container">
        {/* HEADER */}
        <header className="student-settings-header">
          <div>
            <div className="student-settings-eyebrow">
              <Sparkles size={15} />
              KNOWFLOW AI · LEARNING SETTINGS
            </div>

            <h1>
              Your learning
              <span> workspace.</span>
            </h1>

            <p>
              Personalize your profile, security and AI learning experience.
            </p>
          </div>

          <div className="student-settings-status">
            <div className="status-dot" />
            <div>
              <strong>Learning Space Active</strong>
              <span>Personalized for you</span>
            </div>
          </div>
        </header>

        {/* MESSAGE */}
        {message.text && (
          <div
            className={`student-settings-message ${
              message.type === "success" ? "success" : "error"
            }`}
          >
            {message.type === "success" ? (
              <CheckCircle2 size={19} />
            ) : (
              <AlertCircle size={19} />
            )}

            <span>{message.text}</span>
          </div>
        )}

        {/* CONTENT */}
        <div className="student-settings-layout">
          {/* SIDEBAR */}
          <aside className="student-settings-sidebar">
            <button
              className={activeTab === "profile" ? "active" : ""}
              onClick={() => setActiveTab("profile")}
            >
              <User size={18} />
              <div>
                <strong>My Profile</strong>
                <span>Personal information</span>
              </div>
            </button>

            <button
              className={activeTab === "security" ? "active" : ""}
              onClick={() => setActiveTab("security")}
            >
              <Lock size={18} />
              <div>
                <strong>Security</strong>
                <span>Password & protection</span>
              </div>
            </button>

            <button
              className={activeTab === "ai" ? "active" : ""}
              onClick={() => setActiveTab("ai")}
            >
              <Brain size={18} />
              <div>
                <strong>AI Learning</strong>
                <span>Study preferences</span>
              </div>
            </button>

            <button
              className={activeTab === "notifications" ? "active" : ""}
              onClick={() => setActiveTab("notifications")}
            >
              <Bell size={18} />
              <div>
                <strong>Notifications</strong>
                <span>Learning alerts</span>
              </div>
            </button>

            <div className="student-settings-role-card">
              <div className="role-card-icon">
                <GraduationCap size={20} />
              </div>

              <div>
                <span>ACCOUNT ROLE</span>
                <strong>Étudiant</strong>
              </div>
            </div>
          </aside>

          {/* MAIN */}
          <main className="student-settings-content">
            {/* PROFILE */}
            {activeTab === "profile" && (
              <section className="settings-section">
                <div className="section-heading">
                  <div className="section-heading-icon">
                    <User size={21} />
                  </div>

                  <div>
                    <h2>My Profile</h2>
                    <p>Manage your personal account information.</p>
                  </div>
                </div>

                <form onSubmit={saveProfile}>
                  <div className="profile-card">
                    <div className="profile-avatar">
                      {(profile.name || "S")
                        .charAt(0)
                        .toUpperCase()}
                    </div>

                    <div>
                      <strong>{profile.name || "Student"}</strong>
                      <span>{profile.email || "student@knowflow.ai"}</span>

                      <div className="profile-role">
                        <GraduationCap size={12} />
                        Étudiant
                      </div>
                    </div>
                  </div>

                  <div className="settings-form-grid">
                    <div className="settings-field">
                      <label>Full name</label>

                      <div className="field-wrapper">
                        <User size={17} />

                        <input
                          type="text"
                          name="name"
                          value={profile.name}
                          onChange={handleProfileChange}
                          placeholder="Your full name"
                        />
                      </div>
                    </div>

                    <div className="settings-field">
                      <label>Email address</label>

                      <div className="field-wrapper">
                        <span className="field-email">@</span>

                        <input
                          type="email"
                          name="email"
                          value={profile.email}
                          onChange={handleProfileChange}
                          placeholder="Your email address"
                        />
                      </div>
                    </div>
                  </div>

                  <div className="form-actions">
                    <button
                      type="submit"
                      className="save-button"
                      disabled={loading}
                    >
                      <Save size={17} />

                      {loading ? "Saving..." : "Save Changes"}
                    </button>
                  </div>
                </form>
              </section>
            )}

            {/* SECURITY */}
            {activeTab === "security" && (
              <section className="settings-section">
                <div className="section-heading">
                  <div className="section-heading-icon">
                    <Lock size={21} />
                  </div>

                  <div>
                    <h2>Security</h2>
                    <p>Keep your KnowFlow AI account protected.</p>
                  </div>
                </div>

                <form onSubmit={changePassword}>
                  <div className="password-form">
                    <PasswordField
                      label="Current password"
                      name="currentPassword"
                      value={password.currentPassword}
                      onChange={handlePasswordChange}
                      visible={showPassword.current}
                      toggle={() =>
                        setShowPassword((prev) => ({
                          ...prev,
                          current: !prev.current,
                        }))
                      }
                    />

                    <PasswordField
                      label="New password"
                      name="newPassword"
                      value={password.newPassword}
                      onChange={handlePasswordChange}
                      visible={showPassword.new}
                      toggle={() =>
                        setShowPassword((prev) => ({
                          ...prev,
                          new: !prev.new,
                        }))
                      }
                    />

                    <PasswordField
                      label="Confirm new password"
                      name="confirmPassword"
                      value={password.confirmPassword}
                      onChange={handlePasswordChange}
                      visible={showPassword.confirm}
                      toggle={() =>
                        setShowPassword((prev) => ({
                          ...prev,
                          confirm: !prev.confirm,
                        }))
                      }
                    />
                  </div>

                  <div className="security-info">
                    <ShieldCheck size={19} />

                    <div>
                      <strong>Password security</strong>
                      <p>
                        Use a strong password with letters, numbers and
                        special characters.
                      </p>
                    </div>
                  </div>

                  <div className="form-actions">
                    <button
                      type="submit"
                      className="save-button"
                      disabled={loading}
                    >
                      <Lock size={16} />

                      {loading ? "Updating..." : "Update Password"}
                    </button>
                  </div>
                </form>
              </section>
            )}

            {/* AI */}
            {activeTab === "ai" && (
              <section className="settings-section">
                <div className="section-heading">
                  <div className="section-heading-icon ai-icon">
                    <Brain size={21} />
                  </div>

                  <div>
                    <h2>AI Learning</h2>
                    <p>
                      Control how KnowFlow AI helps you study and understand.
                    </p>
                  </div>
                </div>

                <div className="ai-banner">
                  <div className="ai-banner-icon">
                    <Sparkles size={24} />
                  </div>

                  <div>
                    <strong>AI Study Copilot</strong>

                    <p>
                      Your intelligent learning companion can explain,
                      summarize, quiz and guide your study sessions.
                    </p>
                  </div>
                </div>

                <div className="preference-list">
                  <Preference
                    icon={<Brain size={18} />}
                    title="AI Study Copilot"
                    description="Enable AI assistance throughout your learning space."
                    enabled={preferences.aiEnabled}
                    onToggle={() => togglePreference("aiEnabled")}
                  />

                  <Preference
                    icon={<Sparkles size={18} />}
                    title="Smart Suggestions"
                    description="Receive personalized learning and document suggestions."
                    enabled={preferences.smartSuggestions}
                    onToggle={() => togglePreference("smartSuggestions")}
                  />

                  <Preference
                    icon={<TargetIcon />}
                    title="Learning Insights"
                    description="Analyze your activity and discover topics to improve."
                    enabled={preferences.learningInsights}
                    onToggle={() => togglePreference("learningInsights")}
                  />
                </div>
              </section>
            )}

            {/* NOTIFICATIONS */}
            {activeTab === "notifications" && (
              <section className="settings-section">
                <div className="section-heading">
                  <div className="section-heading-icon">
                    <Bell size={21} />
                  </div>

                  <div>
                    <h2>Notifications</h2>
                    <p>Choose how KnowFlow AI keeps you informed.</p>
                  </div>
                </div>

                <div className="preference-list">
                  <Preference
                    icon={<Bell size={18} />}
                    title="Learning Notifications"
                    description="Get notified about recommendations, study reminders and updates."
                    enabled={preferences.notifications}
                    onToggle={() => togglePreference("notifications")}
                  />
                </div>

                <div className="notification-preview">
                  <div className="preview-icon">
                    <Sparkles size={18} />
                  </div>

                  <div>
                    <span>EXAMPLE</span>
                    <strong>Time to review Neural Networks</strong>
                    <p>
                      KnowFlow AI noticed that this topic needs a little more
                      attention.
                    </p>
                  </div>
                </div>
              </section>
            )}
          </main>
        </div>
      </div>
    </div>
  );
}

/* =====================================================
   PASSWORD FIELD
===================================================== */

function PasswordField({
  label,
  name,
  value,
  onChange,
  visible,
  toggle,
}) {
  return (
    <div className="settings-field">
      <label>{label}</label>

      <div className="field-wrapper password-wrapper">
        <Lock size={17} />

        <input
          type={visible ? "text" : "password"}
          name={name}
          value={value}
          onChange={onChange}
          placeholder="••••••••"
        />

        <button type="button" onClick={toggle}>
          {visible ? <EyeOff size={17} /> : <Eye size={17} />}
        </button>
      </div>
    </div>
  );
}

/* =====================================================
   PREFERENCE
===================================================== */

function Preference({
  icon,
  title,
  description,
  enabled,
  onToggle,
}) {
  return (
    <div className="preference-row">
      <div className="preference-icon">{icon}</div>

      <div className="preference-info">
        <strong>{title}</strong>
        <span>{description}</span>
      </div>

      <button
        type="button"
        className={`toggle ${enabled ? "enabled" : ""}`}
        onClick={onToggle}
        aria-label={`Toggle ${title}`}
      >
        <span />
      </button>
    </div>
  );
}

function TargetIcon() {
  return (
    <svg
      width="18"
      height="18"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
    >
      <circle cx="12" cy="12" r="9" />
      <circle cx="12" cy="12" r="5" />
      <circle cx="12" cy="12" r="1" />
    </svg>
  );
}