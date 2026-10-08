import React, { useEffect, useMemo, useState } from "react";
import {
  User,
  Mail,
  ShieldCheck,
  LockKeyhole,
  Eye,
  EyeOff,
  Save,
  RefreshCw,
  CheckCircle2,
  AlertCircle,
  Sparkles,
  BrainCircuit,
  Bell,
  Database,
  GraduationCap,
  KeyRound,
  LogOut,
} from "lucide-react";
import "./EnseignantSettings.css";

const AUTH_API = "http://localhost:5282/api/Auth";

const getToken = () =>
  localStorage.getItem("token") ||
  localStorage.getItem("accessToken") ||
  "";

const readUserId = (user) =>
  user?.id ||
  user?.Id ||
  user?.userId ||
  user?.UserId ||
  localStorage.getItem("userId") ||
  localStorage.getItem("userID") ||
  "";

export default function EnseignantSettings() {
  const [activeTab, setActiveTab] = useState("profile");

  const [profile, setProfile] = useState({
    firstName: "",
    lastName: "",
    email: "",
  });

  const [originalProfile, setOriginalProfile] = useState({
    firstName: "",
    lastName: "",
    email: "",
  });

  const [passwords, setPasswords] = useState({
    currentPassword: "",
    newPassword: "",
    confirmPassword: "",
  });

  const [showPasswords, setShowPasswords] = useState({
    current: false,
    new: false,
    confirm: false,
  });

  const [user, setUser] = useState(null);

  const [loading, setLoading] = useState(true);
  const [savingProfile, setSavingProfile] = useState(false);
  const [savingPassword, setSavingPassword] = useState(false);

  const [message, setMessage] = useState({
    type: "",
    text: "",
  });

  const [aiPreferences, setAiPreferences] = useState({
    smartSuggestions: true,
    semanticContext: true,
    learningInsights: true,
    activityNotifications: true,
  });

  // =========================================================
  // LOAD CURRENT USER
  // =========================================================

  useEffect(() => {
    loadProfile();
  }, []);

  const loadProfile = async () => {
    const token = getToken();

    if (!token) {
      setLoading(false);
      showMessage("error", "Your session has expired. Please log in again.");
      return;
    }

    try {
      setLoading(true);
      setMessage({ type: "", text: "" });

      const response = await fetch(`${AUTH_API}/me`, {
        method: "GET",
        headers: {
          Authorization: `Bearer ${token}`,
          Accept: "application/json",
        },
      });

      const data = await response.json().catch(() => null);

      if (!response.ok) {
        throw new Error(
          data?.message || "Unable to load your profile."
        );
      }

      setUser(data);

      const mappedProfile = {
        firstName:
          data?.firstName ??
          data?.FirstName ??
          "",
        lastName:
          data?.lastName ??
          data?.LastName ??
          "",
        email:
          data?.email ??
          data?.Email ??
          "",
      };

      setProfile(mappedProfile);
      setOriginalProfile(mappedProfile);

      // Keep user id locally if available
      const id = readUserId(data);

      if (id) {
        localStorage.setItem("userId", id);
      }
    } catch (error) {
      console.error("Profile loading error:", error);

      showMessage(
        "error",
        error.message || "Unable to load your profile."
      );
    } finally {
      setLoading(false);
    }
  };

  // =========================================================
  // MESSAGE
  // =========================================================

  const showMessage = (type, text) => {
    setMessage({
      type,
      text,
    });

    window.clearTimeout(window.__knowflowSettingsTimer);

    window.__knowflowSettingsTimer = window.setTimeout(() => {
      setMessage({
        type: "",
        text: "",
      });
    }, 4500);
  };

  // =========================================================
  // PROFILE CHANGE
  // =========================================================

  const handleProfileChange = (event) => {
    const { name, value } = event.target;

    setProfile((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const profileChanged = useMemo(() => {
    return (
      profile.firstName !== originalProfile.firstName ||
      profile.lastName !== originalProfile.lastName ||
      profile.email !== originalProfile.email
    );
  }, [profile, originalProfile]);

  // =========================================================
  // UPDATE PROFILE
  // PUT /api/Auth/profile
  // =========================================================

  const handleSaveProfile = async (event) => {
    event.preventDefault();

    if (
      !profile.firstName.trim() ||
      !profile.lastName.trim() ||
      !profile.email.trim()
    ) {
      showMessage(
        "error",
        "Please complete all profile fields."
      );
      return;
    }

    const token = getToken();

    if (!token) {
      showMessage(
        "error",
        "Your session has expired. Please log in again."
      );
      return;
    }

    try {
      setSavingProfile(true);
      setMessage({ type: "", text: "" });

      const response = await fetch(`${AUTH_API}/profile`, {
        method: "PUT",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
          Accept: "application/json",
        },
        body: JSON.stringify({
          FirstName: profile.firstName.trim(),
          LastName: profile.lastName.trim(),
          Email: profile.email.trim(),
        }),
      });

      const data = await response.json().catch(() => null);

      if (!response.ok) {
        throw new Error(
          data?.message || "Profile update failed."
        );
      }

      const updatedProfile = {
        firstName:
          data?.firstName ??
          data?.FirstName ??
          profile.firstName.trim(),

        lastName:
          data?.lastName ??
          data?.LastName ??
          profile.lastName.trim(),

        email:
          data?.email ??
          data?.Email ??
          profile.email.trim(),
      };

      setProfile(updatedProfile);
      setOriginalProfile(updatedProfile);
      setUser(data || user);

      showMessage(
        "success",
        "Your profile has been updated successfully."
      );
    } catch (error) {
      console.error("Profile update error:", error);

      showMessage(
        "error",
        error.message || "Unable to update your profile."
      );
    } finally {
      setSavingProfile(false);
    }
  };

  // =========================================================
  // PASSWORD
  // PUT /api/Auth/password
  // =========================================================

  const handlePasswordChange = (event) => {
    const { name, value } = event.target;

    setPasswords((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleChangePassword = async (event) => {
    event.preventDefault();

    if (
      !passwords.currentPassword ||
      !passwords.newPassword ||
      !passwords.confirmPassword
    ) {
      showMessage(
        "error",
        "Please complete all password fields."
      );
      return;
    }

    if (passwords.newPassword.length < 6) {
      showMessage(
        "error",
        "The new password must contain at least 6 characters."
      );
      return;
    }

    if (
      passwords.newPassword !==
      passwords.confirmPassword
    ) {
      showMessage(
        "error",
        "The new passwords do not match."
      );
      return;
    }

    const token = getToken();

    if (!token) {
      showMessage(
        "error",
        "Your session has expired. Please log in again."
      );
      return;
    }

    try {
      setSavingPassword(true);
      setMessage({ type: "", text: "" });

      const response = await fetch(`${AUTH_API}/password`, {
        method: "PUT",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
          Accept: "application/json",
        },
        body: JSON.stringify({
          CurrentPassword: passwords.currentPassword,
          NewPassword: passwords.newPassword,
          ConfirmPassword: passwords.confirmPassword,
        }),
      });

      const data = await response.json().catch(() => null);

      if (!response.ok) {
        throw new Error(
          data?.message || "Password update failed."
        );
      }

      setPasswords({
        currentPassword: "",
        newPassword: "",
        confirmPassword: "",
      });

      showMessage(
        "success",
        data?.message ||
          "Your password has been updated successfully."
      );
    } catch (error) {
      console.error("Password update error:", error);

      showMessage(
        "error",
        error.message || "Unable to update your password."
      );
    } finally {
      setSavingPassword(false);
    }
  };

  // =========================================================
  // PASSWORD VISIBILITY
  // =========================================================

  const togglePassword = (field) => {
    setShowPasswords((prev) => ({
      ...prev,
      [field]: !prev[field],
    }));
  };

  // =========================================================
  // LOGOUT
  // =========================================================

  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("accessToken");
    localStorage.removeItem("userId");
    localStorage.removeItem("userID");
    localStorage.removeItem("user");

    window.location.href = "/login";
  };

  // =========================================================
  // HELPERS
  // =========================================================

  const fullName =
    `${profile.firstName} ${profile.lastName}`.trim() ||
    "Enseignant";

  const initials =
    `${profile.firstName?.charAt(0) || ""}${profile.lastName?.charAt(0) || ""}`
      .toUpperCase() || "EN";

  const role =
    user?.role ??
    user?.Role ??
    "Enseignant";

  const email =
    profile.email ||
    user?.email ||
    user?.Email ||
    "—";

  const renderPasswordField = (
    label,
    name,
    value,
    field,
    placeholder
  ) => {
    return (
      <div className="es-field">
        <label htmlFor={name}>{label}</label>

        <div className="es-password-input">
          <LockKeyhole size={17} />

          <input
            id={name}
            name={name}
            type={showPasswords[field] ? "text" : "password"}
            value={value}
            onChange={handlePasswordChange}
            placeholder={placeholder}
            autoComplete="off"
          />

          <button
            type="button"
            className="es-eye-button"
            onClick={() => togglePassword(field)}
            aria-label={
              showPasswords[field]
                ? "Hide password"
                : "Show password"
            }
          >
            {showPasswords[field] ? (
              <EyeOff size={17} />
            ) : (
              <Eye size={17} />
            )}
          </button>
        </div>
      </div>
    );
  };

  // =========================================================
  // LOADING
  // =========================================================

  if (loading) {
    return (
      <div className="es-page">
        <div className="es-loading">
          <div className="es-loading-orb">
            <RefreshCw size={25} className="es-spin" />
          </div>

          <h3>Loading your workspace</h3>

          <p>
            Synchronizing your KnowFlow AI profile...
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="es-page">

      {/* =====================================================
          HEADER
      ===================================================== */}

      <header className="es-header">

        <div className="es-heading">

          <div className="es-heading-icon">
            <GraduationCap size={23} />
          </div>

          <div>
            <div className="es-eyebrow">
              KNOWFLOW AI · TEACHING INTELLIGENCE
            </div>

            <h1>Settings</h1>

            <p>
              Manage your teaching workspace, profile and
              security preferences.
            </p>
          </div>

        </div>

        <div className="es-header-status">
          <span className="es-online-dot" />
          AI Workspace Active
        </div>

      </header>

      {/* =====================================================
          MESSAGE
      ===================================================== */}

      {message.text && (
        <div
          className={`es-message ${
            message.type === "success"
              ? "success"
              : "error"
          }`}
        >
          {message.type === "success" ? (
            <CheckCircle2 size={18} />
          ) : (
            <AlertCircle size={18} />
          )}

          <span>{message.text}</span>
        </div>
      )}

      {/* =====================================================
          PROFILE OVERVIEW
      ===================================================== */}

      <section className="es-profile-card">

        <div className="es-profile-main">

          <div className="es-avatar">
            {initials}
          </div>

          <div className="es-profile-copy">

            <div className="es-profile-name">
              {fullName}
              <span className="es-verified">
                <CheckCircle2 size={13} />
              </span>
            </div>

            <div className="es-profile-email">
              <Mail size={14} />
              {email}
            </div>

            <div className="es-role-badge">
              <GraduationCap size={14} />
              {role}
            </div>

          </div>

        </div>

        <div className="es-account-state">
          <span className="es-state-icon">
            <ShieldCheck size={19} />
          </span>

          <div>
            <strong>Account protected</strong>
            <span>JWT authentication enabled</span>
          </div>
        </div>

      </section>

      {/* =====================================================
          MAIN
      ===================================================== */}

      <div className="es-layout">

        {/* SIDEBAR */}

        <aside className="es-sidebar">

          <div className="es-sidebar-label">
            ACCOUNT
          </div>

          <button
            className={`es-tab ${
              activeTab === "profile" ? "active" : ""
            }`}
            onClick={() => setActiveTab("profile")}
          >
            <span className="es-tab-icon">
              <User size={18} />
            </span>

            <span>
              <strong>Profile</strong>
              <small>Personal information</small>
            </span>
          </button>

          <button
            className={`es-tab ${
              activeTab === "security" ? "active" : ""
            }`}
            onClick={() => setActiveTab("security")}
          >
            <span className="es-tab-icon">
              <ShieldCheck size={18} />
            </span>

            <span>
              <strong>Security</strong>
              <small>Password & protection</small>
            </span>
          </button>

          <div className="es-sidebar-label workspace-label">
            WORKSPACE
          </div>

          <button
            className={`es-tab ${
              activeTab === "ai" ? "active" : ""
            }`}
            onClick={() => setActiveTab("ai")}
          >
            <span className="es-tab-icon">
              <BrainCircuit size={18} />
            </span>

            <span>
              <strong>AI Workspace</strong>
              <small>Teaching intelligence</small>
            </span>
          </button>

          <button
            className={`es-tab ${
              activeTab === "account" ? "active" : ""
            }`}
            onClick={() => setActiveTab("account")}
          >
            <span className="es-tab-icon">
              <Database size={18} />
            </span>

            <span>
              <strong>Account</strong>
              <small>Workspace information</small>
            </span>
          </button>

          <div className="es-sidebar-footer">

            <div className="es-sidebar-ai">
              <Sparkles size={16} />

              <div>
                <strong>KnowFlow AI</strong>
                <span>Intelligence Engine Online</span>
              </div>
            </div>

            <button
              className="es-logout"
              onClick={handleLogout}
            >
              <LogOut size={17} />
              Sign out
            </button>

          </div>

        </aside>

        {/* CONTENT */}

        <main className="es-content">

          {/* =================================================
              PROFILE TAB
          ================================================= */}

          {activeTab === "profile" && (
            <section className="es-section">

              <div className="es-section-header">

                <div>
                  <div className="es-section-kicker">
                    PERSONAL PROFILE
                  </div>

                  <h2>Your identity</h2>

                  <p>
                    Update the information associated with
                    your KnowFlow AI account.
                  </p>
                </div>

                <div className="es-section-symbol">
                  <User size={22} />
                </div>

              </div>

              <form
                className="es-form"
                onSubmit={handleSaveProfile}
              >

                <div className="es-form-grid">

                  <div className="es-field">
                    <label htmlFor="firstName">
                      First name
                    </label>

                    <div className="es-input">
                      <User size={17} />

                      <input
                        id="firstName"
                        name="firstName"
                        value={profile.firstName}
                        onChange={handleProfileChange}
                        placeholder="Your first name"
                        maxLength={100}
                      />
                    </div>
                  </div>

                  <div className="es-field">
                    <label htmlFor="lastName">
                      Last name
                    </label>

                    <div className="es-input">
                      <User size={17} />

                      <input
                        id="lastName"
                        name="lastName"
                        value={profile.lastName}
                        onChange={handleProfileChange}
                        placeholder="Your last name"
                        maxLength={100}
                      />
                    </div>
                  </div>

                </div>

                <div className="es-field">

                  <label htmlFor="email">
                    Email address
                  </label>

                  <div className="es-input">
                    <Mail size={17} />

                    <input
                      id="email"
                      name="email"
                      type="email"
                      value={profile.email}
                      onChange={handleProfileChange}
                      placeholder="name@example.com"
                      maxLength={255}
                    />
                  </div>

                  <small className="es-help">
                    This email is used to identify your
                    authenticated account.
                  </small>

                </div>

                <div className="es-form-footer">

                  <div className="es-save-info">
                    <ShieldCheck size={16} />
                    Changes are protected by your
                    authenticated session.
                  </div>

                  <button
                    type="submit"
                    className="es-primary-button"
                    disabled={
                      savingProfile || !profileChanged
                    }
                  >
                    {savingProfile ? (
                      <>
                        <RefreshCw
                          size={17}
                          className="es-spin"
                        />
                        Saving...
                      </>
                    ) : (
                      <>
                        <Save size={17} />
                        Save changes
                      </>
                    )}
                  </button>

                </div>

              </form>

            </section>
          )}

          {/* =================================================
              SECURITY TAB
          ================================================= */}

          {activeTab === "security" && (
            <section className="es-section">

              <div className="es-section-header">

                <div>
                  <div className="es-section-kicker">
                    ACCOUNT SECURITY
                  </div>

                  <h2>Protect your account</h2>

                  <p>
                    Keep your KnowFlow AI account secure by
                    regularly updating your password.
                  </p>
                </div>

                <div className="es-section-symbol security">
                  <KeyRound size={22} />
                </div>

              </div>

              <div className="es-security-banner">

                <div className="es-security-banner-icon">
                  <ShieldCheck size={22} />
                </div>

                <div>
                  <strong>JWT-secured session</strong>
                  <p>
                    Your password change request is sent
                    through an authenticated API connection.
                  </p>
                </div>

              </div>

              <form
                className="es-form"
                onSubmit={handleChangePassword}
              >

                {renderPasswordField(
                  "Current password",
                  "currentPassword",
                  passwords.currentPassword,
                  "current",
                  "Enter your current password"
                )}

                {renderPasswordField(
                  "New password",
                  "newPassword",
                  passwords.newPassword,
                  "new",
                  "Create a new password"
                )}

                {renderPasswordField(
                  "Confirm new password",
                  "confirmPassword",
                  passwords.confirmPassword,
                  "confirm",
                  "Repeat your new password"
                )}

                <div className="es-password-rules">

                  <div>
                    <CheckCircle2 size={15} />
                    Minimum 6 characters
                  </div>

                  <div>
                    <CheckCircle2 size={15} />
                    New passwords must match
                  </div>

                </div>

                <div className="es-form-footer">

                  <div className="es-save-info">
                    <LockKeyhole size={16} />
                    Password changes are recorded in
                    the security audit trail.
                  </div>

                  <button
                    type="submit"
                    className="es-primary-button"
                    disabled={savingPassword}
                  >
                    {savingPassword ? (
                      <>
                        <RefreshCw
                          size={17}
                          className="es-spin"
                        />
                        Updating...
                      </>
                    ) : (
                      <>
                        <KeyRound size={17} />
                        Update password
                      </>
                    )}
                  </button>

                </div>

              </form>

            </section>
          )}

          {/* =================================================
              AI TAB
          ================================================= */}

          {activeTab === "ai" && (
            <section className="es-section">

              <div className="es-section-header">

                <div>
                  <div className="es-section-kicker">
                    TEACHING INTELLIGENCE
                  </div>

                  <h2>AI workspace</h2>

                  <p>
                    Personalize how the teaching intelligence
                    layer behaves inside your workspace.
                  </p>
                </div>

                <div className="es-section-symbol ai">
                  <BrainCircuit size={22} />
                </div>

              </div>

              <div className="es-ai-intro">

                <div className="es-ai-glow">
                  <Sparkles size={24} />
                </div>

                <div>
                  <strong>
                    Your knowledge, intelligently connected.
                  </strong>

                  <p>
                    These preferences control the experience
                    shown in the Enseignant workspace.
                  </p>
                </div>

                <span className="es-local-badge">
                  Workspace preferences
                </span>

              </div>

              <div className="es-preferences">

                <label className="es-preference">

                  <div className="es-preference-icon">
                    <Sparkles size={18} />
                  </div>

                  <div className="es-preference-copy">
                    <strong>Smart suggestions</strong>
                    <span>
                      Show contextual AI suggestions while
                      working with teaching resources.
                    </span>
                  </div>

                  <input
                    type="checkbox"
                    checked={
                      aiPreferences.smartSuggestions
                    }
                    onChange={(e) =>
                      setAiPreferences((prev) => ({
                        ...prev,
                        smartSuggestions:
                          e.target.checked,
                      }))
                    }
                  />

                  <span className="es-switch" />

                </label>

                <label className="es-preference">

                  <div className="es-preference-icon">
                    <BrainCircuit size={18} />
                  </div>

                  <div className="es-preference-copy">
                    <strong>Semantic context</strong>
                    <span>
                      Use semantic relationships to improve
                      knowledge discovery.
                    </span>
                  </div>

                  <input
                    type="checkbox"
                    checked={
                      aiPreferences.semanticContext
                    }
                    onChange={(e) =>
                      setAiPreferences((prev) => ({
                        ...prev,
                        semanticContext:
                          e.target.checked,
                      }))
                    }
                  />

                  <span className="es-switch" />

                </label>

                <label className="es-preference">

                  <div className="es-preference-icon">
                    <GraduationCap size={18} />
                  </div>

                  <div className="es-preference-copy">
                    <strong>Learning insights</strong>
                    <span>
                      Display AI-generated insights about
                      your teaching knowledge.
                    </span>
                  </div>

                  <input
                    type="checkbox"
                    checked={
                      aiPreferences.learningInsights
                    }
                    onChange={(e) =>
                      setAiPreferences((prev) => ({
                        ...prev,
                        learningInsights:
                          e.target.checked,
                      }))
                    }
                  />

                  <span className="es-switch" />

                </label>

                <label className="es-preference">

                  <div className="es-preference-icon">
                    <Bell size={18} />
                  </div>

                  <div className="es-preference-copy">
                    <strong>Activity notifications</strong>
                    <span>
                      Receive workspace notifications about
                      indexing and AI activity.
                    </span>
                  </div>

                  <input
                    type="checkbox"
                    checked={
                      aiPreferences.activityNotifications
                    }
                    onChange={(e) =>
                      setAiPreferences((prev) => ({
                        ...prev,
                        activityNotifications:
                          e.target.checked,
                      }))
                    }
                  />

                  <span className="es-switch" />

                </label>

              </div>

              <div className="es-info-note">
                <AlertCircle size={17} />

                <span>
                  AI preferences are currently stored for
                  this workspace session. No unsupported
                  backend endpoint is called.
                </span>
              </div>

            </section>
          )}

          {/* =================================================
              ACCOUNT TAB
          ================================================= */}

          {activeTab === "account" && (
            <section className="es-section">

              <div className="es-section-header">

                <div>
                  <div className="es-section-kicker">
                    ACCOUNT OVERVIEW
                  </div>

                  <h2>Workspace information</h2>

                  <p>
                    A quick overview of your KnowFlow AI
                    account and access level.
                  </p>
                </div>

                <div className="es-section-symbol">
                  <Database size={22} />
                </div>

              </div>

              <div className="es-account-grid">

                <div className="es-account-item">
                  <span className="es-account-icon">
                    <User size={18} />
                  </span>

                  <div>
                    <small>Account name</small>
                    <strong>{fullName}</strong>
                  </div>
                </div>

                <div className="es-account-item">
                  <span className="es-account-icon">
                    <Mail size={18} />
                  </span>

                  <div>
                    <small>Email</small>
                    <strong>{email}</strong>
                  </div>
                </div>

                <div className="es-account-item">
                  <span className="es-account-icon">
                    <GraduationCap size={18} />
                  </span>

                  <div>
                    <small>Access role</small>
                    <strong>{role}</strong>
                  </div>
                </div>

                <div className="es-account-item">
                  <span className="es-account-icon">
                    <ShieldCheck size={18} />
                  </span>

                  <div>
                    <small>Security</small>
                    <strong>Authenticated</strong>
                  </div>
                </div>

              </div>

              <div className="es-account-status">

                <div className="es-status-left">

                  <div className="es-status-icon">
                    <CheckCircle2 size={20} />
                  </div>

                  <div>
                    <strong>
                      KnowFlow AI workspace is active
                    </strong>

                    <span>
                      Your account has access to the
                      Enseignant teaching environment.
                    </span>
                  </div>

                </div>

                <span className="es-active-badge">
                  ACTIVE
                </span>

              </div>

              <div className="es-danger-zone">

                <div>
                  <strong>Sign out</strong>

                  <p>
                    End your current authenticated
                    KnowFlow AI session on this device.
                  </p>
                </div>

                <button
                  className="es-danger-button"
                  onClick={handleLogout}
                >
                  <LogOut size={17} />
                  Sign out
                </button>

              </div>

            </section>
          )}

        </main>

      </div>

    </div>
  );
}