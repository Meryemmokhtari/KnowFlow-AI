
import React, { useEffect, useState } from "react";
import {
  User,
  Mail,
  ShieldCheck,
  Lock,
  Eye,
  EyeOff,
  Save,
  CheckCircle2,
  AlertCircle,
  Settings as SettingsIcon,
  Bell,
  Sparkles,
  X,
} from "lucide-react";

import { useAuth } from "../../context/AuthContext";

import "./Settings.css";

const AUTH_API = "http://localhost:5282/api/Auth";

const getToken = () => {
  return (
    localStorage.getItem("token") ||
    localStorage.getItem("accessToken") ||
    sessionStorage.getItem("token") ||
    sessionStorage.getItem("accessToken") ||
    ""
  );
};

export default function Settings() {
  const { user } = useAuth();

  const [activeTab, setActiveTab] = useState("profile");

  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [email, setEmail] = useState("");

  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  const [showCurrent, setShowCurrent] = useState(false);
  const [showNew, setShowNew] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);

  const [emailNotifications, setEmailNotifications] =
    useState(true);

  const [activityNotifications, setActivityNotifications] =
    useState(true);

  const [aiSuggestions, setAiSuggestions] =
    useState(true);

  const [saving, setSaving] = useState(false);
  const [savingPassword, setSavingPassword] =
    useState(false);

  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    const first =
      user?.firstName ||
      user?.FirstName ||
      "";

    const last =
      user?.lastName ||
      user?.LastName ||
      "";

    const mail =
      user?.email ||
      user?.Email ||
      "";

    setFirstName(first);
    setLastName(last);
    setEmail(mail);
  }, [user]);

  const role =
    user?.role ||
    user?.Role ||
    localStorage.getItem("role") ||
    "Manager";

  const displayName =
    `${firstName} ${lastName}`.trim() ||
    user?.name ||
    user?.Name ||
    email ||
    "Manager";

  const avatarLetter =
    displayName.charAt(0).toUpperCase();

  const showMessage = (text) => {
    setMessage(text);
    setError("");

    setTimeout(() => {
      setMessage("");
    }, 3500);
  };

  const showError = (text) => {
    setError(text);
    setMessage("");

    setTimeout(() => {
      setError("");
    }, 4000);
  };

  const handleProfileSave = async (event) => {
    event.preventDefault();

    if (!firstName.trim() || !lastName.trim()) {
      showError("First name and last name are required.");
      return;
    }

    try {
      setSaving(true);

      const token = getToken();

      if (!token) {
        throw new Error("Authentication token not found.");
      }

      /*
       * ----------------------------------------------------
       * PROFILE UPDATE
       * ----------------------------------------------------
       *
       * On essaie l'endpoint backend.
       * Si ton AuthService utilise une autre route,
       * on pourra la remplacer sans toucher au design.
       */

      const response = await fetch(
        `${AUTH_API}/profile`,
        {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            firstName: firstName.trim(),
            lastName: lastName.trim(),
            email: email.trim(),
          }),
        }
      );

      if (!response.ok) {
        throw new Error(
          "Unable to update your profile."
        );
      }

      showMessage("Profile updated successfully.");
    } catch (err) {
      console.error("Profile update:", err);

      /*
       * UI feedback reste propre même si l'endpoint
       * n'est pas encore disponible.
       */
      showError(
        err?.message ||
          "Unable to update your profile."
      );
    } finally {
      setSaving(false);
    }
  };

  const handlePasswordChange = async (event) => {
    event.preventDefault();

    if (!currentPassword || !newPassword || !confirmPassword) {
      showError("Please complete all password fields.");
      return;
    }

    if (newPassword.length < 6) {
      showError(
        "New password must contain at least 6 characters."
      );
      return;
    }

    if (newPassword !== confirmPassword) {
      showError("Passwords do not match.");
      return;
    }

    try {
      setSavingPassword(true);

      const token = getToken();

      if (!token) {
        throw new Error("Authentication token not found.");
      }

      const response = await fetch(
        `${AUTH_API}/change-password`,
        {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            currentPassword,
            newPassword,
          }),
        }
      );

      if (!response.ok) {
        throw new Error(
          "Unable to change your password."
        );
      }

      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");

      showMessage(
        "Password changed successfully."
      );
    } catch (err) {
      console.error("Password change:", err);

      showError(
        err?.message ||
          "Unable to change your password."
      );
    } finally {
      setSavingPassword(false);
    }
  };

  return (
    <div className="manager-settings-page">

      {/* =================================================
          HEADER
      ================================================= */}

      <div className="settings-header">

        <div>
          <span className="settings-eyebrow">
            KNOWFLOW AI · MANAGER
          </span>

          <h1>Settings</h1>

          <p>
            Manage your profile, security and workspace
            preferences.
          </p>
        </div>

        <div className="settings-header-icon">
          <SettingsIcon size={22} />
        </div>

      </div>

      {/* =================================================
          MESSAGES
      ================================================= */}

      {message && (
        <div className="settings-message success">

          <CheckCircle2 size={18} />

          <span>{message}</span>

          <button
            type="button"
            onClick={() => setMessage("")}
          >
            <X size={15} />
          </button>

        </div>
      )}

      {error && (
        <div className="settings-message error">

          <AlertCircle size={18} />

          <span>{error}</span>

          <button
            type="button"
            onClick={() => setError("")}
          >
            <X size={15} />
          </button>

        </div>
      )}

      <div className="settings-layout">

        {/* =================================================
            SIDEBAR
        ================================================= */}

        <aside className="settings-sidebar">

          <div className="settings-profile-mini">

            <div className="settings-avatar">
              {avatarLetter}
            </div>

            <div>
              <strong>{displayName}</strong>

              <span>{role}</span>
            </div>

          </div>

          <button
            type="button"
            className={
              activeTab === "profile"
                ? "settings-nav active"
                : "settings-nav"
            }
            onClick={() => setActiveTab("profile")}
          >
            <User size={17} />
            Profile
          </button>

          <button
            type="button"
            className={
              activeTab === "security"
                ? "settings-nav active"
                : "settings-nav"
            }
            onClick={() => setActiveTab("security")}
          >
            <Lock size={17} />
            Security
          </button>

          <button
            type="button"
            className={
              activeTab === "preferences"
                ? "settings-nav active"
                : "settings-nav"
            }
            onClick={() => setActiveTab("preferences")}
          >
            <Bell size={17} />
            Preferences
          </button>

        </aside>

        {/* =================================================
            CONTENT
        ================================================= */}

        <main className="settings-content">

          {/* =================================================
              PROFILE
          ================================================= */}

          {activeTab === "profile" && (

            <section className="settings-section">

              <div className="settings-section-title">

                <div>
                  <h2>Profile Information</h2>

                  <p>
                    Update the information associated
                    with your workspace account.
                  </p>
                </div>

                <User size={20} />

              </div>

              <form
                className="settings-form"
                onSubmit={handleProfileSave}
              >

                <div className="settings-form-grid">

                  <div className="settings-field">

                    <label>First Name</label>

                    <div className="settings-input">

                      <User size={16} />

                      <input
                        value={firstName}
                        onChange={(e) =>
                          setFirstName(e.target.value)
                        }
                        placeholder="First name"
                      />

                    </div>

                  </div>

                  <div className="settings-field">

                    <label>Last Name</label>

                    <div className="settings-input">

                      <User size={16} />

                      <input
                        value={lastName}
                        onChange={(e) =>
                          setLastName(e.target.value)
                        }
                        placeholder="Last name"
                      />

                    </div>

                  </div>

                </div>

                <div className="settings-field">

                  <label>Email Address</label>

                  <div className="settings-input disabled">

                    <Mail size={16} />

                    <input
                      value={email}
                      readOnly
                    />

                  </div>

                  <small>
                    Your email address is managed by
                    your authentication account.
                  </small>

                </div>

                <div className="settings-account-card">

                  <div className="settings-account-icon">
                    <ShieldCheck size={19} />
                  </div>

                  <div>

                    <strong>Manager Account</strong>

                    <span>
                      You have access to workspace
                      management features.
                    </span>

                  </div>

                  <span className="settings-role-badge">
                    {role}
                  </span>

                </div>

                <button
                  type="submit"
                  className="settings-save-btn"
                  disabled={saving}
                >
                  <Save size={17} />

                  {saving
                    ? "Saving..."
                    : "Save Changes"}
                </button>

              </form>

            </section>
          )}

          {/* =================================================
              SECURITY
          ================================================= */}

          {activeTab === "security" && (

            <section className="settings-section">

              <div className="settings-section-title">

                <div>
                  <h2>Security</h2>

                  <p>
                    Keep your account secure by using
                    a strong password.
                  </p>
                </div>

                <Lock size={20} />

              </div>

              <form
                className="settings-form"
                onSubmit={handlePasswordChange}
              >

                <div className="settings-field">

                  <label>Current Password</label>

                  <div className="settings-input">

                    <Lock size={16} />

                    <input
                      type={
                        showCurrent
                          ? "text"
                          : "password"
                      }
                      value={currentPassword}
                      onChange={(e) =>
                        setCurrentPassword(
                          e.target.value
                        )
                      }
                      placeholder="Current password"
                    />

                    <button
                      type="button"
                      onClick={() =>
                        setShowCurrent(
                          !showCurrent
                        )
                      }
                    >
                      {showCurrent ? (
                        <EyeOff size={16} />
                      ) : (
                        <Eye size={16} />
                      )}
                    </button>

                  </div>

                </div>

                <div className="settings-field">

                  <label>New Password</label>

                  <div className="settings-input">

                    <Lock size={16} />

                    <input
                      type={
                        showNew
                          ? "text"
                          : "password"
                      }
                      value={newPassword}
                      onChange={(e) =>
                        setNewPassword(
                          e.target.value
                        )
                      }
                      placeholder="New password"
                    />

                    <button
                      type="button"
                      onClick={() =>
                        setShowNew(!showNew)
                      }
                    >
                      {showNew ? (
                        <EyeOff size={16} />
                      ) : (
                        <Eye size={16} />
                      )}
                    </button>

                  </div>

                </div>

                <div className="settings-field">

                  <label>Confirm New Password</label>

                  <div className="settings-input">

                    <Lock size={16} />

                    <input
                      type={
                        showConfirm
                          ? "text"
                          : "password"
                      }
                      value={confirmPassword}
                      onChange={(e) =>
                        setConfirmPassword(
                          e.target.value
                        )
                      }
                      placeholder="Confirm new password"
                    />

                    <button
                      type="button"
                      onClick={() =>
                        setShowConfirm(
                          !showConfirm
                        )
                      }
                    >
                      {showConfirm ? (
                        <EyeOff size={16} />
                      ) : (
                        <Eye size={16} />
                      )}
                    </button>

                  </div>

                </div>

                <div className="settings-security-note">
                  <ShieldCheck size={18} />

                  <div>
                    <strong>Password security</strong>

                    <span>
                      Use at least 6 characters and
                      avoid using easily guessed
                      information.
                    </span>
                  </div>

                </div>

                <button
                  type="submit"
                  className="settings-save-btn"
                  disabled={savingPassword}
                >
                  <Lock size={17} />

                  {savingPassword
                    ? "Changing..."
                    : "Change Password"}
                </button>

              </form>

            </section>
          )}

          {/* =================================================
              PREFERENCES
          ================================================= */}

          {activeTab === "preferences" && (

            <section className="settings-section">

              <div className="settings-section-title">

                <div>
                  <h2>Workspace Preferences</h2>

                  <p>
                    Choose how KnowFlow AI keeps you
                    informed.
                  </p>
                </div>

                <Bell size={20} />

              </div>

              <div className="settings-preferences">

                <div className="settings-preference">

                  <div className="settings-preference-icon">
                    <Mail size={18} />
                  </div>

                  <div className="settings-preference-info">

                    <strong>Email Notifications</strong>

                    <span>
                      Receive important workspace
                      notifications by email.
                    </span>

                  </div>

                  <button
                    type="button"
                    className={
                      emailNotifications
                        ? "settings-toggle active"
                        : "settings-toggle"
                    }
                    onClick={() =>
                      setEmailNotifications(
                        !emailNotifications
                      )
                    }
                  >
                    <span />
                  </button>

                </div>

                <div className="settings-preference">

                  <div className="settings-preference-icon">
                    <ActivityIcon />
                  </div>

                  <div className="settings-preference-info">

                    <strong>
                      Activity Notifications
                    </strong>

                    <span>
                      Stay informed about important
                      team activity.
                    </span>

                  </div>

                  <button
                    type="button"
                    className={
                      activityNotifications
                        ? "settings-toggle active"
                        : "settings-toggle"
                    }
                    onClick={() =>
                      setActivityNotifications(
                        !activityNotifications
                      )
                    }
                  >
                    <span />
                  </button>

                </div>

                <div className="settings-preference">

                  <div className="settings-preference-icon ai">
                    <Sparkles size={18} />
                  </div>

                  <div className="settings-preference-info">

                    <strong>
                      AI Suggestions
                    </strong>

                    <span>
                      Show intelligent suggestions
                      while working with documents.
                    </span>

                  </div>

                  <button
                    type="button"
                    className={
                      aiSuggestions
                        ? "settings-toggle active"
                        : "settings-toggle"
                    }
                    onClick={() =>
                      setAiSuggestions(
                        !aiSuggestions
                      )
                    }
                  >
                    <span />
                  </button>

                </div>

              </div>

              <div className="settings-preferences-footer">

                <CheckCircle2 size={17} />

                <span>
                  Your preferences are saved
                  automatically.
                </span>

              </div>

            </section>
          )}

        </main>

      </div>

    </div>
  );
}
