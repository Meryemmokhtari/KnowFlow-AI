import React, { useEffect, useState } from "react";

import {
  User,
  Bell,
  Shield,
  Palette,
  Brain,
  Save,
  Lock,
  Mail,
  UserRound,
  CheckCircle2,
  AlertCircle,
  LoaderCircle,
  Eye,
  EyeOff,
  RefreshCw,
} from "lucide-react";

import "./Settings.css";

/* =========================================================
   AUTH SERVICE
========================================================= */

const AUTH_API = "http://localhost:5282/api/Auth";

/* =========================================================
   SETTINGS COMPONENT
========================================================= */

function Settings() {
  /* =======================================================
     TABS
  ======================================================= */

  const [activeTab, setActiveTab] = useState("profile");

  /* =======================================================
     LOADING STATES
  ======================================================= */

  const [loadingProfile, setLoadingProfile] = useState(true);
  const [savingProfile, setSavingProfile] = useState(false);
  const [changingPassword, setChangingPassword] = useState(false);

  /* =======================================================
     GLOBAL MESSAGE
  ======================================================= */

  const [message, setMessage] = useState({
    type: "",
    text: "",
  });

  /* =======================================================
     PROFILE
  ======================================================= */

  const [profile, setProfile] = useState({
    id: "",
    firstName: "",
    lastName: "",
    email: "",
    role: "",
  });

  /* =======================================================
     PASSWORD
  ======================================================= */

  const [password, setPassword] = useState({
    currentPassword: "",
    newPassword: "",
    confirmPassword: "",
  });

  const [showPasswords, setShowPasswords] = useState({
    current: false,
    new: false,
    confirm: false,
  });

  /* =======================================================
     NOTIFICATIONS
  ======================================================= */

  const [notifications, setNotifications] = useState(() => {
    try {
      const saved = localStorage.getItem(
        "knowflow-notifications"
      );

      return saved
        ? JSON.parse(saved)
        : {
            email: true,
            documents: true,
            security: true,
          };
    } catch {
      return {
        email: true,
        documents: true,
        security: true,
      };
    }
  });

  /* =======================================================
     APPEARANCE
  ======================================================= */

  const [appearance, setAppearance] = useState(() => {
    const savedTheme = localStorage.getItem(
      "knowflow-theme"
    );

    return {
      darkMode: savedTheme !== "light",
    };
  });

  /* =======================================================
     AI SETTINGS
  ======================================================= */

  const [aiSettings, setAiSettings] = useState(() => {
    try {
      const saved = localStorage.getItem(
        "knowflow-ai-settings"
      );

      return saved
        ? JSON.parse(saved)
        : {
            semanticSearch: true,
            rag: true,
            autoIndexing: true,
          };
    } catch {
      return {
        semanticSearch: true,
        rag: true,
        autoIndexing: true,
      };
    }
  });

  /* =======================================================
     TOKEN
  ======================================================= */

  const getToken = () => {
    return (
      localStorage.getItem("token") ||
      sessionStorage.getItem("token")
    );
  };

  /* =======================================================
     SHOW MESSAGE
  ======================================================= */

  const showMessage = (type, text) => {
    setMessage({
      type,
      text,
    });

    window.setTimeout(() => {
      setMessage({
        type: "",
        text: "",
      });
    }, 4500);
  };

  /* =======================================================
     UNAUTHORIZED
  ======================================================= */

  const handleUnauthorized = () => {
    localStorage.removeItem("token");
    sessionStorage.removeItem("token");

    showMessage(
      "error",
      "Your session has expired. Please login again."
    );
  };

  /* =======================================================
     APPLY GLOBAL THEME
  ======================================================= */

  useEffect(() => {
    const root = document.documentElement;

    if (appearance.darkMode) {
      root.classList.add("dark");
      root.classList.remove("light");

      localStorage.setItem(
        "knowflow-theme",
        "dark"
      );
    } else {
      root.classList.add("light");
      root.classList.remove("dark");

      localStorage.setItem(
        "knowflow-theme",
        "light"
      );
    }
  }, [appearance.darkMode]);

  /* =======================================================
     SAVE NOTIFICATIONS LOCALLY
  ======================================================= */

  useEffect(() => {
    localStorage.setItem(
      "knowflow-notifications",
      JSON.stringify(notifications)
    );
  }, [notifications]);

  /* =======================================================
     SAVE AI SETTINGS LOCALLY
  ======================================================= */

  useEffect(() => {
    localStorage.setItem(
      "knowflow-ai-settings",
      JSON.stringify(aiSettings)
    );
  }, [aiSettings]);

  /* =======================================================
     LOAD PROFILE
  ======================================================= */

  const loadProfile = async () => {
    const token = getToken();

    if (!token) {
      setLoadingProfile(false);

      showMessage(
        "error",
        "No authentication token found. Please login."
      );

      return;
    }

    try {
      setLoadingProfile(true);

      const response = await fetch(
        `${AUTH_API}/me`,
        {
          method: "GET",
          headers: {
            Authorization: `Bearer ${token}`,
            Accept: "application/json",
          },
        }
      );

      if (response.status === 401) {
        handleUnauthorized();
        return;
      }

      let data = {};

      try {
        data = await response.json();
      } catch {
        data = {};
      }

      if (!response.ok) {
        throw new Error(
          data?.message ||
            "Unable to load your profile."
        );
      }

      setProfile({
        id: data.id || data.userId || "",
        firstName: data.firstName || "",
        lastName: data.lastName || "",
        email: data.email || "",
        role: data.role || "User",
      });
    } catch (error) {
      console.error(
        "Settings profile error:",
        error
      );

      showMessage(
        "error",
        error.message ||
          "Unable to load your profile."
      );
    } finally {
      setLoadingProfile(false);
    }
  };

  /* =======================================================
     INITIAL LOAD
  ======================================================= */

  useEffect(() => {
    loadProfile();
  }, []);

  /* =======================================================
     PROFILE INPUT
  ======================================================= */

  const handleProfileChange = (event) => {
    const { name, value } = event.target;

    setProfile((previous) => ({
      ...previous,
      [name]: value,
    }));
  };

  /* =======================================================
     PASSWORD INPUT
  ======================================================= */

  const handlePasswordChange = (event) => {
    const { name, value } = event.target;

    setPassword((previous) => ({
      ...previous,
      [name]: value,
    }));
  };

  /* =======================================================
     VALIDATE PROFILE
  ======================================================= */

  const validateProfile = () => {
    if (!profile.firstName.trim()) {
      showMessage(
        "error",
        "First name is required."
      );

      return false;
    }

    if (!profile.lastName.trim()) {
      showMessage(
        "error",
        "Last name is required."
      );

      return false;
    }

    if (!profile.email.trim()) {
      showMessage(
        "error",
        "Email is required."
      );

      return false;
    }

    const emailRegex =
      /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

    if (!emailRegex.test(profile.email.trim())) {
      showMessage(
        "error",
        "Please enter a valid email address."
      );

      return false;
    }

    return true;
  };

  /* =======================================================
     SAVE PROFILE
  ======================================================= */

  const handleSaveProfile = async (event) => {
    event.preventDefault();

    if (!validateProfile()) {
      return;
    }

    const token = getToken();

    if (!token) {
      showMessage(
        "error",
        "You are not authenticated."
      );

      return;
    }

    try {
      setSavingProfile(true);

      const response = await fetch(
        `${AUTH_API}/profile`,
        {
          method: "PUT",

          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
            Accept: "application/json",
          },

          body: JSON.stringify({
            firstName: profile.firstName.trim(),
            lastName: profile.lastName.trim(),
            email: profile.email.trim(),
          }),
        }
      );

      if (response.status === 401) {
        handleUnauthorized();
        return;
      }

      let data = {};

      try {
        data = await response.json();
      } catch {
        data = {};
      }

      if (!response.ok) {
        throw new Error(
          data?.message ||
            "Unable to update your profile."
        );
      }

      setProfile((previous) => ({
        id: data.id || previous.id,
        firstName:
          data.firstName || previous.firstName,
        lastName:
          data.lastName || previous.lastName,
        email: data.email || previous.email,
        role: data.role || previous.role,
      }));

      showMessage(
        "success",
        "Profile updated successfully."
      );
    } catch (error) {
      console.error(
        "Update profile error:",
        error
      );

      showMessage(
        "error",
        error.message ||
          "Unable to update your profile."
      );
    } finally {
      setSavingProfile(false);
    }
  };

  /* =======================================================
     VALIDATE PASSWORD
  ======================================================= */

  const validatePassword = () => {
    if (!password.currentPassword) {
      showMessage(
        "error",
        "Current password is required."
      );

      return false;
    }

    if (!password.newPassword) {
      showMessage(
        "error",
        "New password is required."
      );

      return false;
    }

    if (password.newPassword.length < 6) {
      showMessage(
        "error",
        "New password must contain at least 6 characters."
      );

      return false;
    }

    if (
      password.newPassword !==
      password.confirmPassword
    ) {
      showMessage(
        "error",
        "Passwords do not match."
      );

      return false;
    }

    if (
      password.currentPassword ===
      password.newPassword
    ) {
      showMessage(
        "error",
        "New password must be different from your current password."
      );

      return false;
    }

    return true;
  };

  /* =======================================================
     CHANGE PASSWORD
  ======================================================= */

  const handleChangePassword = async (event) => {
    event.preventDefault();

    if (!validatePassword()) {
      return;
    }

    const token = getToken();

    if (!token) {
      showMessage(
        "error",
        "You are not authenticated."
      );

      return;
    }

    try {
      setChangingPassword(true);

      const response = await fetch(
        `${AUTH_API}/password`,
        {
          method: "PUT",

          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
            Accept: "application/json",
          },

          body: JSON.stringify({
            currentPassword:
              password.currentPassword,

            newPassword:
              password.newPassword,

            confirmPassword:
              password.confirmPassword,
          }),
        }
      );

      if (response.status === 401) {
        handleUnauthorized();
        return;
      }

      let data = {};

      try {
        data = await response.json();
      } catch {
        data = {};
      }

      if (!response.ok) {
        throw new Error(
          data?.message ||
            "Unable to change password."
        );
      }

      setPassword({
        currentPassword: "",
        newPassword: "",
        confirmPassword: "",
      });

      setShowPasswords({
        current: false,
        new: false,
        confirm: false,
      });

      showMessage(
        "success",
        "Password updated successfully."
      );
    } catch (error) {
      console.error(
        "Change password error:",
        error
      );

      showMessage(
        "error",
        error.message ||
          "Unable to change password."
      );
    } finally {
      setChangingPassword(false);
    }
  };

  /* =======================================================
     PASSWORD VISIBILITY
  ======================================================= */

  const togglePasswordVisibility = (field) => {
    setShowPasswords((previous) => ({
      ...previous,
      [field]: !previous[field],
    }));
  };

  /* =======================================================
     INITIALS
  ======================================================= */

  const getInitials = () => {
    const first =
      profile.firstName?.charAt(0) || "";

    const last =
      profile.lastName?.charAt(0) || "";

    const initials =
      `${first}${last}`.toUpperCase();

    return initials || "M";
  };

  /* =======================================================
     TOGGLE NOTIFICATION
  ======================================================= */

  const toggleNotification = (field) => {
    setNotifications((previous) => ({
      ...previous,
      [field]: !previous[field],
    }));
  };

  /* =======================================================
     TOGGLE AI SETTING
  ======================================================= */

  const toggleAISetting = (field) => {
    setAiSettings((previous) => ({
      ...previous,
      [field]: !previous[field],
    }));
  };

  /* =======================================================
     RENDER
  ======================================================= */

  return (
    <div className="settings-page">

      {/* =================================================
          HEADER
      ================================================= */}

      <div className="settings-header">

        <div>
          <div className="settings-eyebrow">
            KNOWFLOW AI
          </div>

          <h1>Settings</h1>

          <p>
            Manage your account, security,
            preferences and AI workspace.
          </p>
        </div>

        <button
          className="settings-refresh"
          onClick={loadProfile}
          disabled={loadingProfile}
          type="button"
        >
          <RefreshCw
            size={17}
            className={
              loadingProfile
                ? "settings-spin"
                : ""
            }
          />

          Refresh
        </button>
      </div>

      {/* =================================================
          GLOBAL MESSAGE
      ================================================= */}

      {message.text && (
        <div
          className={`settings-alert ${
            message.type === "success"
              ? "settings-alert-success"
              : "settings-alert-error"
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

      {/* =================================================
          MAIN
      ================================================= */}

      <div className="settings-container">

        {/* =================================================
            SIDEBAR
        ================================================= */}

        <aside className="settings-sidebar">

          <div className="settings-sidebar-title">
            ACCOUNT
          </div>

          <button
            type="button"
            className={`settings-tab ${
              activeTab === "profile"
                ? "active"
                : ""
            }`}
            onClick={() =>
              setActiveTab("profile")
            }
          >
            <User size={18} />
            <span>Profile</span>
          </button>

          <button
            type="button"
            className={`settings-tab ${
              activeTab === "security"
                ? "active"
                : ""
            }`}
            onClick={() =>
              setActiveTab("security")
            }
          >
            <Shield size={18} />
            <span>Security</span>
          </button>

          <div className="settings-sidebar-title settings-sidebar-title-space">
            PREFERENCES
          </div>

          <button
            type="button"
            className={`settings-tab ${
              activeTab === "notifications"
                ? "active"
                : ""
            }`}
            onClick={() =>
              setActiveTab("notifications")
            }
          >
            <Bell size={18} />
            <span>Notifications</span>
          </button>

          <button
            type="button"
            className={`settings-tab ${
              activeTab === "appearance"
                ? "active"
                : ""
            }`}
            onClick={() =>
              setActiveTab("appearance")
            }
          >
            <Palette size={18} />
            <span>Appearance</span>
          </button>

          <button
            type="button"
            className={`settings-tab ${
              activeTab === "ai"
                ? "active"
                : ""
            }`}
            onClick={() =>
              setActiveTab("ai")
            }
          >
            <Brain size={18} />
            <span>AI Settings</span>
          </button>

          <div className="settings-sidebar-footer">

            <div className="settings-status-dot" />

            <div>
              <strong>KnowFlow AI</strong>

              <span>
                Workspace active
              </span>
            </div>

          </div>
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

              <div className="settings-section-header">

                <div className="settings-section-icon">
                  <User size={22} />
                </div>

                <div>
                  <h2>Profile</h2>

                  <p>
                    Manage your personal
                    information and account
                    identity.
                  </p>
                </div>

              </div>

              {loadingProfile ? (
                <div className="settings-loading">

                  <LoaderCircle
                    size={28}
                    className="settings-spin"
                  />

                  <span>
                    Loading your profile...
                  </span>

                </div>
              ) : (
                <>
                  <div className="profile-card">

                    <div className="profile-avatar">
                      {getInitials()}
                    </div>

                    <div className="profile-info">

                      <h3>
                        {profile.firstName ||
                          "User"}{" "}
                        {profile.lastName}
                      </h3>

                      <span>
                        {profile.email}
                      </span>

                      <div className="profile-role">
                        {profile.role ||
                          "User"}
                      </div>

                    </div>

                  </div>

                  <form
                    className="settings-form"
                    onSubmit={handleSaveProfile}
                  >

                    <div className="settings-form-grid">

                      <div className="form-group">

                        <label>
                          First Name
                        </label>

                        <div className="input-wrapper">

                          <UserRound size={17} />

                          <input
                            type="text"
                            name="firstName"
                            value={
                              profile.firstName
                            }
                            onChange={
                              handleProfileChange
                            }
                            placeholder="First name"
                            maxLength={100}
                          />

                        </div>

                      </div>

                      <div className="form-group">

                        <label>
                          Last Name
                        </label>

                        <div className="input-wrapper">

                          <UserRound size={17} />

                          <input
                            type="text"
                            name="lastName"
                            value={
                              profile.lastName
                            }
                            onChange={
                              handleProfileChange
                            }
                            placeholder="Last name"
                            maxLength={100}
                          />

                        </div>

                      </div>

                    </div>

                    <div className="form-group">

                      <label>
                        Email Address
                      </label>

                      <div className="input-wrapper">

                        <Mail size={17} />

                        <input
                          type="email"
                          name="email"
                          value={
                            profile.email
                          }
                          onChange={
                            handleProfileChange
                          }
                          placeholder="you@example.com"
                        />

                      </div>

                    </div>

                    <div className="settings-actions">

                      <button
                        type="submit"
                        className="btn btn-primary"
                        disabled={savingProfile}
                      >

                        {savingProfile ? (
                          <LoaderCircle
                            size={17}
                            className="settings-spin"
                          />
                        ) : (
                          <Save size={17} />
                        )}

                        {savingProfile
                          ? "Saving..."
                          : "Save Changes"}

                      </button>

                    </div>

                  </form>
                </>
              )}

            </section>
          )}

          {/* =================================================
              SECURITY
          ================================================= */}

          {activeTab === "security" && (
            <section className="settings-section">

              <div className="settings-section-header">

                <div className="settings-section-icon">
                  <Shield size={22} />
                </div>

                <div>
                  <h2>Security</h2>

                  <p>
                    Protect your KnowFlow AI
                    account and credentials.
                  </p>
                </div>

              </div>

              <div className="security-banner">

                <div className="security-banner-icon">
                  <Lock size={20} />
                </div>

                <div>
                  <strong>
                    Secure account
                  </strong>

                  <span>
                    Your password is securely
                    protected.
                  </span>
                </div>

              </div>

              <form
                className="settings-form"
                onSubmit={handleChangePassword}
              >

                <div className="form-group">

                  <label>
                    Current Password
                  </label>

                  <div className="input-wrapper">

                    <Lock size={17} />

                    <input
                      type={
                        showPasswords.current
                          ? "text"
                          : "password"
                      }
                      name="currentPassword"
                      value={
                        password.currentPassword
                      }
                      onChange={
                        handlePasswordChange
                      }
                      placeholder="Enter current password"
                    />

                    <button
                      type="button"
                      className="password-toggle"
                      onClick={() =>
                        togglePasswordVisibility(
                          "current"
                        )
                      }
                    >
                      {showPasswords.current ? (
                        <EyeOff size={17} />
                      ) : (
                        <Eye size={17} />
                      )}
                    </button>

                  </div>

                </div>

                <div className="form-group">

                  <label>
                    New Password
                  </label>

                  <div className="input-wrapper">

                    <Lock size={17} />

                    <input
                      type={
                        showPasswords.new
                          ? "text"
                          : "password"
                      }
                      name="newPassword"
                      value={
                        password.newPassword
                      }
                      onChange={
                        handlePasswordChange
                      }
                      placeholder="Enter new password"
                    />

                    <button
                      type="button"
                      className="password-toggle"
                      onClick={() =>
                        togglePasswordVisibility(
                          "new"
                        )
                      }
                    >
                      {showPasswords.new ? (
                        <EyeOff size={17} />
                      ) : (
                        <Eye size={17} />
                      )}
                    </button>

                  </div>

                </div>

                <div className="form-group">

                  <label>
                    Confirm New Password
                  </label>

                  <div className="input-wrapper">

                    <Lock size={17} />

                    <input
                      type={
                        showPasswords.confirm
                          ? "text"
                          : "password"
                      }
                      name="confirmPassword"
                      value={
                        password.confirmPassword
                      }
                      onChange={
                        handlePasswordChange
                      }
                      placeholder="Confirm new password"
                    />

                    <button
                      type="button"
                      className="password-toggle"
                      onClick={() =>
                        togglePasswordVisibility(
                          "confirm"
                        )
                      }
                    >
                      {showPasswords.confirm ? (
                        <EyeOff size={17} />
                      ) : (
                        <Eye size={17} />
                      )}
                    </button>

                  </div>

                </div>

                <div className="password-hint">
                  Use at least 6 characters for
                  your new password.
                </div>

                <div className="settings-actions">

                  <button
                    type="submit"
                    className="btn btn-primary"
                    disabled={changingPassword}
                  >

                    {changingPassword ? (
                      <LoaderCircle
                        size={17}
                        className="settings-spin"
                      />
                    ) : (
                      <Shield size={17} />
                    )}

                    {changingPassword
                      ? "Updating..."
                      : "Update Password"}

                  </button>

                </div>

              </form>

            </section>
          )}

          {/* =================================================
              NOTIFICATIONS
          ================================================= */}

          {activeTab === "notifications" && (
            <section className="settings-section">

              <div className="settings-section-header">

                <div className="settings-section-icon">
                  <Bell size={22} />
                </div>

                <div>
                  <h2>Notifications</h2>

                  <p>
                    Control how KnowFlow AI
                    keeps you informed.
                  </p>
                </div>

              </div>

              <div className="settings-list">

                <div className="settings-row">

                  <div className="settings-row-icon">
                    <Mail size={19} />
                  </div>

                  <div className="settings-row-info">

                    <h3>
                      Email Notifications
                    </h3>

                    <p>
                      Receive important
                      account and workspace
                      updates by email.
                    </p>

                  </div>

                  <label className="toggle">

                    <input
                      type="checkbox"
                      checked={
                        notifications.email
                      }
                      onChange={() =>
                        toggleNotification(
                          "email"
                        )
                      }
                    />

                    <span className="toggle-slider" />

                  </label>

                </div>

                <div className="settings-row">

                  <div className="settings-row-icon">
                    <RefreshCw size={19} />
                  </div>

                  <div className="settings-row-info">

                    <h3>
                      Document Updates
                    </h3>

                    <p>
                      Get notified when your
                      documents are updated
                      or indexed.
                    </p>

                  </div>

                  <label className="toggle">

                    <input
                      type="checkbox"
                      checked={
                        notifications.documents
                      }
                      onChange={() =>
                        toggleNotification(
                          "documents"
                        )
                      }
                    />

                    <span className="toggle-slider" />

                  </label>

                </div>

                <div className="settings-row">

                  <div className="settings-row-icon">
                    <Shield size={19} />
                  </div>

                  <div className="settings-row-info">

                    <h3>
                      Security Alerts
                    </h3>

                    <p>
                      Receive alerts about
                      important security
                      events.
                    </p>

                  </div>

                  <label className="toggle">

                    <input
                      type="checkbox"
                      checked={
                        notifications.security
                      }
                      onChange={() =>
                        toggleNotification(
                          "security"
                        )
                      }
                    />

                    <span className="toggle-slider" />

                  </label>

                </div>

              </div>

              <div className="settings-info-box">

                <AlertCircle size={18} />

                <span>
                  Notification preferences
                  are stored locally on this
                  device.
                </span>

              </div>

            </section>
          )}

          {/* =================================================
              APPEARANCE
          ================================================= */}

          {activeTab === "appearance" && (
            <section className="settings-section">

              <div className="settings-section-header">

                <div className="settings-section-icon">
                  <Palette size={22} />
                </div>

                <div>
                  <h2>Appearance</h2>

                  <p>
                    Customize the visual
                    experience of KnowFlow AI.
                  </p>
                </div>

              </div>

              <div className="appearance-preview">

                <div className="appearance-preview-top">

                  <div className="preview-dot" />
                  <div className="preview-dot" />
                  <div className="preview-dot" />

                </div>

                <div className="preview-content">

                  <div className="preview-sidebar" />

                  <div className="preview-main">

                    <div className="preview-line large" />

                    <div className="preview-line" />

                    <div className="preview-card" />

                  </div>

                </div>

              </div>

              <div className="settings-row">

                <div className="settings-row-icon">
                  <Palette size={19} />
                </div>

                <div className="settings-row-info">

                  <h3>
                    Dark Mode
                  </h3>

                  <p>
                    Use the dark interface
                    for a focused AI workspace.
                  </p>

                </div>

                <label className="toggle">

                  <input
                    type="checkbox"
                    checked={
                      appearance.darkMode
                    }
                    onChange={(event) =>
                      setAppearance(
                        (previous) => ({
                          ...previous,
                          darkMode:
                            event.target.checked,
                        })
                      )
                    }
                  />

                  <span className="toggle-slider" />

                </label>

              </div>

              <div className="settings-info-box">

                <CheckCircle2 size={18} />

                <span>
                  This setting is applied
                  globally to KnowFlow AI and
                  remains active after refreshing
                  the application.
                </span>

              </div>

            </section>
          )}

          {/* =================================================
              AI SETTINGS
          ================================================= */}

          {activeTab === "ai" && (
            <section className="settings-section">

              <div className="settings-section-header">

                <div className="settings-section-icon ai-icon">
                  <Brain size={22} />
                </div>

                <div>
                  <h2>AI Settings</h2>

                  <p>
                    Configure the intelligence
                    features of your workspace.
                  </p>
                </div>

              </div>

              <div className="ai-engine-card">

                <div className="ai-engine-glow">
                  <Brain size={28} />
                </div>

                <div>

                  <span className="ai-label">
                    KNOWFLOW AI ENGINE
                  </span>

                  <h3>
                    Intelligent Knowledge
                    Workspace
                  </h3>

                  <p>
                    Semantic search, RAG and
                    document intelligence are
                    ready for your workspace.
                  </p>

                </div>

                <div className="ai-status">

                  <span />

                  Active

                </div>

              </div>

              <div className="settings-list">

                <div className="settings-row">

                  <div className="settings-row-icon">
                    <Brain size={19} />
                  </div>

                  <div className="settings-row-info">

                    <h3>
                      Semantic Search
                    </h3>

                    <p>
                      Find documents by meaning,
                      not only keywords.
                    </p>

                  </div>

                  <label className="toggle">

                    <input
                      type="checkbox"
                      checked={
                        aiSettings.semanticSearch
                      }
                      onChange={() =>
                        toggleAISetting(
                          "semanticSearch"
                        )
                      }
                    />

                    <span className="toggle-slider" />

                  </label>

                </div>

                <div className="settings-row">

                  <div className="settings-row-icon">
                    <Brain size={19} />
                  </div>

                  <div className="settings-row-info">

                    <h3>
                      RAG Assistant
                    </h3>

                    <p>
                      Generate answers using
                      your indexed knowledge.
                    </p>

                  </div>

                  <label className="toggle">

                    <input
                      type="checkbox"
                      checked={
                        aiSettings.rag
                      }
                      onChange={() =>
                        toggleAISetting("rag")
                      }
                    />

                    <span className="toggle-slider" />

                  </label>

                </div>

                <div className="settings-row">

                  <div className="settings-row-icon">
                    <RefreshCw size={19} />
                  </div>

                  <div className="settings-row-info">

                    <h3>
                      Automatic Indexing
                    </h3>

                    <p>
                      Automatically process
                      uploaded documents.
                    </p>

                  </div>

                  <label className="toggle">

                    <input
                      type="checkbox"
                      checked={
                        aiSettings.autoIndexing
                      }
                      onChange={() =>
                        toggleAISetting(
                          "autoIndexing"
                        )
                      }
                    />

                    <span className="toggle-slider" />

                  </label>

                </div>

              </div>

              <div className="settings-info-box ai-info">

                <Brain size={18} />

                <span>
                  AI preferences are stored
                  locally and control the
                  available AI workspace features.
                </span>

              </div>

            </section>
          )}

        </main>

      </div>

    </div>
  );
}

export default Settings;