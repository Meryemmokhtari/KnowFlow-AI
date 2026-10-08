
import React, { useCallback, useEffect, useMemo, useState } from "react";
import {
  Activity,
  AlertCircle,
  Check,
  CheckCircle2,
  ChevronDown,
  Eye,
  Filter,
  Loader2,
  Plus,
  RefreshCw,
  Search,
  Shield,
  Trash2,
  UserPlus,
  Users,
  X,
} from "lucide-react";

import "./AdminUsers.css";

/* =========================================================
   API CONFIG
   ========================================================= */

const API_URL = "http://localhost:5282";

/* =========================================================
   DEFAULT ROLES
   Used only as fallback if /api/Admin/roles fails.
   ========================================================= */

const DEFAULT_ROLES = [
  { id: 1, name: "Admin" },
  { id: 2, name: "Manager" },
  { id: 3, name: "Employé" },
  { id: 4, name: "Enseignant" },
  { id: 5, name: "Étudiant" },
];

/* =========================================================
   EMPTY FORM
   ========================================================= */

const EMPTY_FORM = {
  firstName: "",
  lastName: "",
  email: "",
  password: "",
  roleId: 5,
};

/* =========================================================
   TOKEN
   ========================================================= */

function getToken() {
  return (
    localStorage.getItem("token") ||
    localStorage.getItem("authToken") ||
    localStorage.getItem("accessToken") ||
    sessionStorage.getItem("token") ||
    sessionStorage.getItem("authToken") ||
    sessionStorage.getItem("accessToken") ||
    ""
  );
}

/* =========================================================
   CURRENT LOGGED USER
   ========================================================= */

function getCurrentUserId() {
  return (
    localStorage.getItem("userId") ||
    localStorage.getItem("currentUserId") ||
    sessionStorage.getItem("userId") ||
    sessionStorage.getItem("currentUserId") ||
    ""
  );
}

/* =========================================================
   JWT PAYLOAD
   ========================================================= */

function getJwtPayload() {
  const token = getToken();

  if (!token) return null;

  try {
    const parts = token.split(".");

    if (parts.length !== 3) return null;

    const payload = parts[1]
      .replace(/-/g, "+")
      .replace(/_/g, "/");

    return JSON.parse(
      decodeURIComponent(
        atob(payload)
          .split("")
          .map(
            (char) =>
              "%" +
              ("00" + char.charCodeAt(0).toString(16)).slice(-2)
          )
          .join("")
      )
    );
  } catch {
    return null;
  }
}

/* =========================================================
   ROLE HELPERS
   ========================================================= */

function getRoleName(roleId, roles = DEFAULT_ROLES) {
  const role = roles.find(
    (item) => Number(item.id) === Number(roleId)
  );

  return role?.name || "Utilisateur";
}

/* =========================================================
   NORMALIZE USER
   ========================================================= */

function normalizeUser(user, roles = DEFAULT_ROLES) {
  const roleId = Number(user?.roleId || 0);

  return {
    id: user?.id,
    firstName: user?.firstName || "",
    lastName: user?.lastName || "",
    email: user?.email || "",
    roleId,
    role:
      user?.role ||
      user?.roleName ||
      getRoleName(roleId, roles),
    isActive: Boolean(user?.isActive),
    createdAt: user?.createdAt || null,
  };
}

/* =========================================================
   DATE
   ========================================================= */

function formatDate(date) {
  if (!date) return "—";

  const parsed = new Date(date);

  if (Number.isNaN(parsed.getTime())) {
    return "—";
  }

  return parsed.toLocaleDateString("fr-FR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  });
}

/* =========================================================
   INITIALS
   ========================================================= */

function getInitials(user) {
  const first =
    user?.firstName?.trim()?.charAt(0) || "";

  const last =
    user?.lastName?.trim()?.charAt(0) || "";

  return `${first}${last}`.toUpperCase() || "?";
}

/* =========================================================
   API REQUEST
   ========================================================= */

async function apiRequest(endpoint, options = {}) {
  const token = getToken();

  if (!token) {
    throw new Error("NO_TOKEN");
  }

  let response;

  try {
    response = await fetch(`${API_URL}${endpoint}`, {
      ...options,
      headers: {
        Accept: "application/json",
        ...(options.body
          ? {
              "Content-Type": "application/json",
            }
          : {}),
        Authorization: `Bearer ${token}`,
        ...(options.headers || {}),
      },
    });
  } catch (error) {
    console.error("API connection error:", error);

    throw new Error(
      "Impossible de contacter AuthService. Vérifiez que le service est démarré et que le port est correct."
    );
  }

  if (response.status === 401) {
    throw new Error("UNAUTHORIZED");
  }

  if (response.status === 403) {
    throw new Error("FORBIDDEN");
  }

  if (response.status === 204) {
    return null;
  }

  const contentType =
    response.headers.get("content-type") || "";

  let data = null;

  if (contentType.includes("application/json")) {
    try {
      data = await response.json();
    } catch {
      data = null;
    }
  } else {
    try {
      const text = await response.text();
      data = text || null;
    } catch {
      data = null;
    }
  }

  if (!response.ok) {
    let message = `Erreur serveur (${response.status})`;

    if (
      typeof data === "object" &&
      data?.message
    ) {
      message = data.message;
    }

    if (
      typeof data === "object" &&
      data?.title
    ) {
      message = data.title;
    }

    throw new Error(message);
  }

  return data;
}

/* =========================================================
   COMPONENT
   ========================================================= */

export default function AdminUsers() {
  const [users, setUsers] = useState([]);

  const [roles, setRoles] = useState(DEFAULT_ROLES);

  const [loading, setLoading] = useState(true);

  const [actionLoading, setActionLoading] =
    useState(false);

  const [error, setError] = useState("");

  const [success, setSuccess] = useState("");

  const [search, setSearch] = useState("");

  const [roleFilter, setRoleFilter] =
    useState("all");

  const [statusFilter, setStatusFilter] =
    useState("all");

  const [selectedUser, setSelectedUser] =
    useState(null);

  const [showDetails, setShowDetails] =
    useState(false);

  const [showAddModal, setShowAddModal] =
    useState(false);

  const [showRoleModal, setShowRoleModal] =
    useState(false);

  const [showDeleteModal, setShowDeleteModal] =
    useState(false);

  const [newRoleId, setNewRoleId] =
    useState(5);

  const [form, setForm] =
    useState(EMPTY_FORM);

  const [submitting, setSubmitting] =
    useState(false);

  /* =======================================================
     CURRENT USER
     ======================================================= */

  const currentUserId = useMemo(() => {
    const storedId = getCurrentUserId();

    if (storedId) return storedId;

    const payload = getJwtPayload();

    return (
      payload?.sub ||
      payload?.userId ||
      payload?.id ||
      ""
    );
  }, []);

  /* =======================================================
     MESSAGES
     ======================================================= */

  const clearMessages = () => {
    setError("");
    setSuccess("");
  };

  /* =======================================================
     LOAD ROLES
     ======================================================= */

  const loadRoles = useCallback(async () => {
    try {
      const data =
        await apiRequest("/api/Admin/roles");

      if (Array.isArray(data) && data.length > 0) {
        setRoles(
          data.map((role) => ({
            id: Number(role.id),
            name: role.name,
          }))
        );
      }
    } catch (err) {
      console.warn(
        "Roles could not be loaded. Using defaults.",
        err
      );
    }
  }, []);

  /* =======================================================
     LOAD USERS
     ======================================================= */

  const loadUsers = useCallback(async () => {
    setLoading(true);
    setError("");

    try {
      const data =
        await apiRequest("/api/Admin/users");

      const normalized = Array.isArray(data)
        ? data.map((user) =>
            normalizeUser(user, roles)
          )
        : [];

      setUsers(normalized);
    } catch (err) {
      console.error(
        "Admin users loading error:",
        err
      );

      switch (err.message) {
        case "NO_TOKEN":
          setError(
            "Aucun token JWT trouvé. Connectez-vous puis revenez à Administration."
          );
          break;

        case "UNAUTHORIZED":
          setError(
            "Session expirée ou token JWT invalide. Reconnectez-vous."
          );
          break;

        case "FORBIDDEN":
          setError(
            "Accès refusé. Cette page est réservée aux administrateurs."
          );
          break;

        default:
          setError(
            err.message ||
              "Impossible de charger les utilisateurs."
          );
      }
    } finally {
      setLoading(false);
    }
  }, [roles]);

  /* =======================================================
     INITIAL LOAD
     ======================================================= */

  useEffect(() => {
    loadRoles();
  }, [loadRoles]);

  useEffect(() => {
    loadUsers();
  }, [loadUsers]);

  /* =======================================================
     AUTO CLEAR MESSAGES
     ======================================================= */

  useEffect(() => {
    if (!error && !success) return;

    const timer = setTimeout(() => {
      setError("");
      setSuccess("");
    }, 5000);

    return () => clearTimeout(timer);
  }, [error, success]);

  /* =======================================================
     FILTER USERS
     ======================================================= */

  const filteredUsers = useMemo(() => {
    const query = search
      .trim()
      .toLowerCase();

    return users.filter((user) => {
      const fullName =
        `${user.firstName} ${user.lastName}`
          .toLowerCase();

      const matchesSearch =
        !query ||
        fullName.includes(query) ||
        user.email
          .toLowerCase()
          .includes(query) ||
        user.role
          .toLowerCase()
          .includes(query);

      const matchesRole =
        roleFilter === "all" ||
        Number(user.roleId) ===
          Number(roleFilter);

      const matchesStatus =
        statusFilter === "all" ||
        (statusFilter === "active" &&
          user.isActive) ||
        (statusFilter === "inactive" &&
          !user.isActive);

      return (
        matchesSearch &&
        matchesRole &&
        matchesStatus
      );
    });
  }, [
    users,
    search,
    roleFilter,
    statusFilter,
  ]);

  /* =======================================================
     STATS
     ======================================================= */

  const stats = useMemo(() => {
    return {
      total: users.length,

      active: users.filter(
        (user) => user.isActive
      ).length,

      admins: users.filter(
        (user) =>
          Number(user.roleId) === 1
      ).length,

      teachers: users.filter(
        (user) =>
          Number(user.roleId) === 4
      ).length,

      students: users.filter(
        (user) =>
          Number(user.roleId) === 5
      ).length,
    };
  }, [users]);

  /* =======================================================
     REFRESH
     ======================================================= */

  const handleRefresh = async () => {
    clearMessages();

    await loadRoles();
    await loadUsers();

    setSuccess(
      "Liste des utilisateurs actualisée."
    );
  };

  /* =======================================================
     DETAILS
     ======================================================= */

  const openDetails = async (user) => {
    clearMessages();

    setSelectedUser(user);
    setShowDetails(true);

    try {
      const data =
        await apiRequest(
          `/api/Admin/users/${user.id}`
        );

      if (data) {
        setSelectedUser(
          normalizeUser(data, roles)
        );
      }
    } catch (err) {
      console.error(
        "User details error:",
        err
      );

      if (
        err.message !== "UNAUTHORIZED" &&
        err.message !== "FORBIDDEN"
      ) {
        setError(
          err.message ||
            "Impossible de charger les détails de l'utilisateur."
        );
      }
    }
  };

  /* =======================================================
     ROLE MODAL
     ======================================================= */

  const openRoleModal = (user) => {
    clearMessages();

    setSelectedUser(user);

    setNewRoleId(
      Number(user.roleId)
    );

    setShowRoleModal(true);
  };

  /* =======================================================
     DELETE MODAL
     ======================================================= */

  const openDeleteModal = (user) => {
    clearMessages();

    if (
      currentUserId &&
      String(user.id) ===
        String(currentUserId)
    ) {
      setError(
        "Vous ne pouvez pas supprimer votre propre compte administrateur."
      );

      return;
    }

    setSelectedUser(user);
    setShowDeleteModal(true);
  };

  /* =======================================================
     DELETE
     ======================================================= */

  const handleDelete = async () => {
    if (!selectedUser?.id) return;

    if (
      currentUserId &&
      String(selectedUser.id) ===
        String(currentUserId)
    ) {
      setError(
        "Vous ne pouvez pas supprimer votre propre compte."
      );

      return;
    }

    setActionLoading(true);
    clearMessages();

    try {
      await apiRequest(
        `/api/Admin/users/${selectedUser.id}`,
        {
          method: "DELETE",
        }
      );

      setUsers((current) =>
        current.filter(
          (user) =>
            user.id !== selectedUser.id
        )
      );

      setSuccess(
        "Utilisateur supprimé avec succès."
      );

      setShowDeleteModal(false);
      setSelectedUser(null);
    } catch (err) {
      console.error(
        "Delete user error:",
        err
      );

      if (
        err.message === "UNAUTHORIZED"
      ) {
        setError(
          "Votre session JWT n'est plus valide."
        );
      } else if (
        err.message === "FORBIDDEN"
      ) {
        setError(
          "Vous n'avez pas les droits nécessaires."
        );
      } else {
        setError(
          err.message ||
            "Impossible de supprimer l'utilisateur."
        );
      }
    } finally {
      setActionLoading(false);
    }
  };

  /* =======================================================
     STATUS
     ======================================================= */

  const handleStatusChange = async (user) => {
    if (!user?.id) return;

    if (
      currentUserId &&
      String(user.id) ===
        String(currentUserId)
    ) {
      setError(
        "Vous ne pouvez pas désactiver votre propre compte."
      );

      return;
    }

    setActionLoading(true);
    clearMessages();

    const newStatus = !user.isActive;

    try {
      await apiRequest(
        `/api/Admin/users/${user.id}/status`,
        {
          method: "PUT",
          body: JSON.stringify({
            isActive: newStatus,
          }),
        }
      );

      setUsers((current) =>
        current.map((item) =>
          item.id === user.id
            ? {
                ...item,
                isActive: newStatus,
              }
            : item
        )
      );

      if (
        selectedUser?.id === user.id
      ) {
        setSelectedUser((current) =>
          current
            ? {
                ...current,
                isActive: newStatus,
              }
            : current
        );
      }

      setSuccess(
        newStatus
          ? "Utilisateur activé avec succès."
          : "Utilisateur désactivé avec succès."
      );
    } catch (err) {
      console.error(
        "Status change error:",
        err
      );

      if (
        err.message === "UNAUTHORIZED"
      ) {
        setError(
          "Votre session JWT n'est plus valide."
        );
      } else if (
        err.message === "FORBIDDEN"
      ) {
        setError(
          "Vous n'avez pas les droits nécessaires."
        );
      } else {
        setError(
          err.message ||
            "Impossible de modifier le statut."
        );
      }
    } finally {
      setActionLoading(false);
    }
  };

  /* =======================================================
     ROLE CHANGE
     ======================================================= */

  const handleRoleChange = async () => {
    if (!selectedUser?.id) return;

    setActionLoading(true);
    clearMessages();

    try {
      await apiRequest(
        `/api/Admin/users/${selectedUser.id}/role`,
        {
          method: "PUT",
          body: JSON.stringify({
            roleId: Number(newRoleId),
          }),
        }
      );

      const roleName =
        getRoleName(
          newRoleId,
          roles
        );

      setUsers((current) =>
        current.map((user) =>
          user.id === selectedUser.id
            ? {
                ...user,
                roleId:
                  Number(newRoleId),
                role: roleName,
              }
            : user
        )
      );

      setSelectedUser((current) =>
        current
          ? {
              ...current,
              roleId:
                Number(newRoleId),
              role: roleName,
            }
          : current
      );

      setShowRoleModal(false);

      setSuccess(
        "Rôle modifié avec succès."
      );
    } catch (err) {
      console.error(
        "Role change error:",
        err
      );

      if (
        err.message === "UNAUTHORIZED"
      ) {
        setError(
          "Votre session JWT n'est plus valide."
        );
      } else if (
        err.message === "FORBIDDEN"
      ) {
        setError(
          "Vous n'avez pas les droits nécessaires."
        );
      } else {
        setError(
          err.message ||
            "Impossible de modifier le rôle."
        );
      }
    } finally {
      setActionLoading(false);
    }
  };

  /* =======================================================
     FORM CHANGE
     ======================================================= */

  const handleFormChange = (
    event
  ) => {
    const {
      name,
      value,
    } = event.target;

    setForm((current) => ({
      ...current,

      [name]:
        name === "roleId"
          ? Number(value)
          : value,
    }));
  };

  /* =======================================================
     CREATE USER
     ======================================================= */

  const handleCreateUser = async (
    event
  ) => {
    event.preventDefault();

    if (
      !form.firstName.trim() ||
      !form.lastName.trim() ||
      !form.email.trim() ||
      !form.password
    ) {
      setError(
        "Veuillez remplir tous les champs obligatoires."
      );

      return;
    }

    if (form.password.length < 6) {
      setError(
        "Le mot de passe doit contenir au moins 6 caractères."
      );

      return;
    }

    setSubmitting(true);
    clearMessages();

    try {
      const payload = {
        firstName:
          form.firstName.trim(),

        lastName:
          form.lastName.trim(),

        email:
          form.email.trim(),

        password:
          form.password,

        roleId:
          Number(form.roleId),
      };

      await apiRequest(
        "/api/Auth/register",
        {
          method: "POST",
          body: JSON.stringify(
            payload
          ),
        }
      );

      setShowAddModal(false);

      setForm(EMPTY_FORM);

      setSuccess(
        "Utilisateur créé avec succès."
      );

      await loadUsers();
    } catch (err) {
      console.error(
        "Create user error:",
        err
      );

      if (
        err.message === "UNAUTHORIZED"
      ) {
        setError(
          "Votre session JWT n'est plus valide."
        );
      } else if (
        err.message === "FORBIDDEN"
      ) {
        setError(
          "Vous n'avez pas les droits nécessaires pour créer un utilisateur."
        );
      } else {
        setError(
          err.message ||
            "Impossible de créer l'utilisateur."
        );
      }
    } finally {
      setSubmitting(false);
    }
  };

  /* =======================================================
     CLOSE MODALS
     ======================================================= */

  const closeAllModals = () => {
    if (
      actionLoading ||
      submitting
    ) {
      return;
    }

    setShowDetails(false);
    setShowAddModal(false);
    setShowRoleModal(false);
    setShowDeleteModal(false);

    setSelectedUser(null);
  };

  /* =======================================================
     RENDER
     ======================================================= */

  return (
    <div className="admin-users-page">
      <div className="admin-users-container">

        {/* =================================================
            HEADER
        ================================================= */}

        <header className="admin-users-header">
          <div>
            <div className="admin-users-eyebrow">
              <Shield size={15} />
              Administration
            </div>

            <h1>
              Gestion des utilisateurs
            </h1>

            <p>
              Gérez les comptes, les rôles
              et les accès de votre
              plateforme KnowFlow AI.
            </p>
          </div>

          <div className="admin-users-header-actions">

            <button
              type="button"
              className="admin-btn admin-btn-secondary"
              onClick={
                handleRefresh
              }
              disabled={loading}
            >
              {loading ? (
                <Loader2
                  size={18}
                  className="spin"
                />
              ) : (
                <RefreshCw
                  size={18}
                />
              )}

              Actualiser
            </button>

            <button
              type="button"
              className="admin-btn admin-btn-primary"
              onClick={() => {
                clearMessages();

                setForm(
                  EMPTY_FORM
                );

                setShowAddModal(
                  true
                );
              }}
            >
              <Plus size={18} />

              Ajouter un utilisateur
            </button>

          </div>
        </header>

        {/* =================================================
            ALERTS
        ================================================= */}

        {error && (
          <div className="admin-alert admin-alert-error">
            <AlertCircle size={19} />

            <span>
              {error}
            </span>

            <button
              type="button"
              onClick={() =>
                setError("")
              }
              aria-label="Fermer"
            >
              <X size={17} />
            </button>
          </div>
        )}

        {success && (
          <div className="admin-alert admin-alert-success">
            <CheckCircle2 size={19} />

            <span>
              {success}
            </span>

            <button
              type="button"
              onClick={() =>
                setSuccess("")
              }
              aria-label="Fermer"
            >
              <X size={17} />
            </button>
          </div>
        )}

        {/* =================================================
            STATS
        ================================================= */}

        <section className="admin-stats-grid">

          <StatCard
            icon={
              <Users size={21} />
            }
            label="Total utilisateurs"
            value={stats.total}
          />

          <StatCard
            icon={
              <Activity size={21} />
            }
            label="Utilisateurs actifs"
            value={stats.active}
          />

          <StatCard
            icon={
              <Shield size={21} />
            }
            label="Administrateurs"
            value={stats.admins}
          />

          <StatCard
            icon={
              <UserPlus size={21} />
            }
            label="Enseignants"
            value={stats.teachers}
          />

          <StatCard
            icon={
              <Users size={21} />
            }
            label="Étudiants"
            value={stats.students}
          />

        </section>

        {/* =================================================
            USERS CARD
        ================================================= */}

        <section className="admin-users-card">

          <div className="admin-toolbar">

            <div className="admin-search">
              <Search size={19} />

              <input
                type="text"
                value={search}
                onChange={(event) =>
                  setSearch(
                    event.target.value
                  )
                }
                placeholder="Rechercher par nom, email ou rôle..."
              />
            </div>

            <div className="admin-filters">

              <div className="admin-select">
                <Filter size={17} />

                <select
                  value={roleFilter}
                  onChange={(event) =>
                    setRoleFilter(
                      event.target.value
                    )
                  }
                >
                  <option value="all">
                    Tous les rôles
                  </option>

                  {roles.map(
                    (role) => (
                      <option
                        key={role.id}
                        value={role.id}
                      >
                        {role.name}
                      </option>
                    )
                  )}
                </select>

                <ChevronDown
                  size={16}
                />
              </div>

              <div className="admin-select">
                <Activity
                  size={17}
                />

                <select
                  value={
                    statusFilter
                  }
                  onChange={(event) =>
                    setStatusFilter(
                      event.target.value
                    )
                  }
                >
                  <option value="all">
                    Tous les statuts
                  </option>

                  <option value="active">
                    Actifs
                  </option>

                  <option value="inactive">
                    Inactifs
                  </option>
                </select>

                <ChevronDown
                  size={16}
                />
              </div>

            </div>
          </div>

          {/* TABLE HEADER */}

          <div className="admin-table-header">
            <div>
              <h2>
                Utilisateurs
              </h2>

              <span>
                {filteredUsers.length}{" "}
                utilisateur
                {filteredUsers.length !==
                1
                  ? "s"
                  : ""}
              </span>
            </div>
          </div>

          {/* LOADING */}

          {loading ? (
            <div className="admin-empty-state">

              <Loader2
                size={38}
                className="spin"
              />

              <h3>
                Chargement des
                utilisateurs...
              </h3>

              <p>
                Connexion au serveur
                KnowFlow AI.
              </p>

            </div>
          ) : filteredUsers.length ===
            0 ? (
            <div className="admin-empty-state">

              <div className="admin-empty-icon">
                <Users size={30} />
              </div>

              <h3>
                Aucun utilisateur
                trouvé
              </h3>

              <p>
                Essayez de modifier
                votre recherche ou
                vos filtres.
              </p>

              {(search ||
                roleFilter !==
                  "all" ||
                statusFilter !==
                  "all") && (
                <button
                  type="button"
                  className="admin-btn admin-btn-secondary"
                  onClick={() => {
                    setSearch("");
                    setRoleFilter(
                      "all"
                    );
                    setStatusFilter(
                      "all"
                    );
                  }}
                >
                  Réinitialiser
                  les filtres
                </button>
              )}

            </div>
          ) : (
            <div className="admin-table-wrapper">

              <table className="admin-users-table">

                <thead>
                  <tr>
                    <th>
                      Utilisateur
                    </th>

                    <th>
                      Email
                    </th>

                    <th>
                      Rôle
                    </th>

                    <th>
                      Statut
                    </th>

                    <th>
                      Créé le
                    </th>

                    <th className="actions-column">
                      Actions
                    </th>
                  </tr>
                </thead>

                <tbody>
                  {filteredUsers.map(
                    (user) => (
                      <tr
                        key={user.id}
                      >

                        <td>
                          <div className="admin-user-cell">

                            <div className="admin-avatar">
                              {getInitials(
                                user
                              )}
                            </div>

                            <div>
                              <strong>
                                {
                                  user.firstName
                                }{" "}
                                {
                                  user.lastName
                                }
                              </strong>

                              <small>
                                {user.id}
                              </small>
                            </div>

                          </div>
                        </td>

                        <td>
                          <span className="admin-email">
                            {
                              user.email
                            }
                          </span>
                        </td>

                        <td>
                          <span className="admin-role-badge">
                            {
                              user.role
                            }
                          </span>
                        </td>

                        <td>
                          {user.isActive ? (
                            <span className="admin-status active">
                              <CheckCircle2
                                size={15}
                              />

                              Actif
                            </span>
                          ) : (
                            <span className="admin-status inactive">
                              <X
                                size={15}
                              />

                              Inactif
                            </span>
                          )}
                        </td>

                        <td>
                          <span className="admin-date">
                            {formatDate(
                              user.createdAt
                            )}
                          </span>
                        </td>

                        <td>
                          <div className="admin-actions">

                            <button
                              type="button"
                              className="icon-btn"
                              title="Voir"
                              onClick={() =>
                                openDetails(
                                  user
                                )
                              }
                            >
                              <Eye
                                size={17}
                              />
                            </button>

                            <button
                              type="button"
                              className="icon-btn"
                              title="Modifier le rôle"
                              onClick={() =>
                                openRoleModal(
                                  user
                                )
                              }
                            >
                              <Shield
                                size={17}
                              />
                            </button>

                            <button
                              type="button"
                              className={`icon-btn ${
                                user.isActive
                                  ? "danger-icon"
                                  : "success-icon"
                              }`}
                              title={
                                user.isActive
                                  ? "Désactiver"
                                  : "Activer"
                              }
                              onClick={() =>
                                handleStatusChange(
                                  user
                                )
                              }
                              disabled={
                                actionLoading ||
                                (currentUserId &&
                                  String(
                                    user.id
                                  ) ===
                                    String(
                                      currentUserId
                                    ))
                              }
                            >
                              {user.isActive ? (
                                <X
                                  size={17}
                                />
                              ) : (
                                <Check
                                  size={17}
                                />
                              )}
                            </button>

                            <button
                              type="button"
                              className="icon-btn danger-icon"
                              title="Supprimer"
                              onClick={() =>
                                openDeleteModal(
                                  user
                                )
                              }
                              disabled={
                                actionLoading ||
                                (currentUserId &&
                                  String(
                                    user.id
                                  ) ===
                                    String(
                                      currentUserId
                                    ))
                              }
                            >
                              <Trash2
                                size={17}
                              />
                            </button>

                          </div>
                        </td>

                      </tr>
                    )
                  )}
                </tbody>

              </table>
            </div>
          )}

        </section>
      </div>

      {/* ===================================================
          DETAILS MODAL
      =================================================== */}

      {showDetails &&
        selectedUser && (
          <Modal
            title="Détails de l'utilisateur"
            onClose={
              closeAllModals
            }
          >

            <div className="user-details">

              <div className="details-profile">

                <div className="details-avatar">
                  {getInitials(
                    selectedUser
                  )}
                </div>

                <div>
                  <h3>
                    {
                      selectedUser.firstName
                    }{" "}
                    {
                      selectedUser.lastName
                    }
                  </h3>

                  <p>
                    {
                      selectedUser.email
                    }
                  </p>
                </div>

              </div>

              <div className="details-grid">

                <Detail
                  label="Prénom"
                  value={
                    selectedUser.firstName
                  }
                />

                <Detail
                  label="Nom"
                  value={
                    selectedUser.lastName
                  }
                />

                <Detail
                  label="Email"
                  value={
                    selectedUser.email
                  }
                />

                <Detail
                  label="Rôle"
                  value={
                    selectedUser.role
                  }
                />

                <Detail
                  label="Statut"
                  value={
                    selectedUser.isActive
                      ? "Actif"
                      : "Inactif"
                  }
                />

                <Detail
                  label="Date de création"
                  value={formatDate(
                    selectedUser.createdAt
                  )}
                />

              </div>
            </div>

            <div className="modal-actions">

              <button
                type="button"
                className="admin-btn admin-btn-secondary"
                onClick={
                  closeAllModals
                }
              >
                Fermer
              </button>

              <button
                type="button"
                className="admin-btn admin-btn-primary"
                onClick={() => {
                  setShowDetails(
                    false
                  );

                  openRoleModal(
                    selectedUser
                  );
                }}
              >
                <Shield
                  size={17}
                />

                Modifier le rôle
              </button>

            </div>
          </Modal>
        )}

      {/* ===================================================
          ROLE MODAL
      =================================================== */}

      {showRoleModal &&
        selectedUser && (
          <Modal
            title="Modifier le rôle"
            onClose={
              closeAllModals
            }
          >

            <div className="modal-user-summary">

              <div className="admin-avatar">
                {getInitials(
                  selectedUser
                )}
              </div>

              <div>
                <strong>
                  {
                    selectedUser.firstName
                  }{" "}
                  {
                    selectedUser.lastName
                  }
                </strong>

                <span>
                  {
                    selectedUser.email
                  }
                </span>
              </div>

            </div>

            <label className="form-label">
              Nouveau rôle
            </label>

            <div className="form-select-wrapper">

              <select
                value={newRoleId}
                onChange={(event) =>
                  setNewRoleId(
                    Number(
                      event.target.value
                    )
                  )
                }
              >
                {roles.map(
                  (role) => (
                    <option
                      key={role.id}
                      value={role.id}
                    >
                      {role.name}
                    </option>
                  )
                )}
              </select>

              <ChevronDown
                size={17}
              />

            </div>

            <div className="modal-actions">

              <button
                type="button"
                className="admin-btn admin-btn-secondary"
                onClick={
                  closeAllModals
                }
                disabled={
                  actionLoading
                }
              >
                Annuler
              </button>

              <button
                type="button"
                className="admin-btn admin-btn-primary"
                onClick={
                  handleRoleChange
                }
                disabled={
                  actionLoading
                }
              >
                {actionLoading ? (
                  <Loader2
                    size={17}
                    className="spin"
                  />
                ) : (
                  <Check
                    size={17}
                  />
                )}

                Enregistrer
              </button>

            </div>

          </Modal>
        )}

      {/* ===================================================
          DELETE MODAL
      =================================================== */}

      {showDeleteModal &&
        selectedUser && (
          <Modal
            title="Supprimer l'utilisateur"
            onClose={
              closeAllModals
            }
          >

            <div className="delete-warning">

              <div className="delete-icon">
                <Trash2
                  size={24}
                />
              </div>

              <h3>
                Êtes-vous sûr ?
              </h3>

              <p>
                Vous êtes sur le
                point de supprimer
                définitivement{" "}
                <strong>
                  {
                    selectedUser.firstName
                  }{" "}
                  {
                    selectedUser.lastName
                  }
                </strong>
                .
              </p>

              <span>
                Cette action ne peut
                pas être annulée.
              </span>

            </div>

            <div className="modal-actions">

              <button
                type="button"
                className="admin-btn admin-btn-secondary"
                onClick={
                  closeAllModals
                }
                disabled={
                  actionLoading
                }
              >
                Annuler
              </button>

              <button
                type="button"
                className="admin-btn admin-btn-danger"
                onClick={
                  handleDelete
                }
                disabled={
                  actionLoading
                }
              >
                {actionLoading ? (
                  <Loader2
                    size={17}
                    className="spin"
                  />
                ) : (
                  <Trash2
                    size={17}
                  />
                )}

                Supprimer
              </button>

            </div>

          </Modal>
        )}

      {/* ===================================================
          ADD USER MODAL
      =================================================== */}

      {showAddModal && (
        <Modal
          title="Ajouter un utilisateur"
          onClose={
            closeAllModals
          }
        >

          <form
            onSubmit={
              handleCreateUser
            }
          >

            <div className="form-grid">

              <div>
                <label className="form-label">
                  Prénom
                </label>

                <input
                  className="form-input"
                  type="text"
                  name="firstName"
                  value={
                    form.firstName
                  }
                  onChange={
                    handleFormChange
                  }
                  placeholder="Prénom"
                  required
                />
              </div>

              <div>
                <label className="form-label">
                  Nom
                </label>

                <input
                  className="form-input"
                  type="text"
                  name="lastName"
                  value={
                    form.lastName
                  }
                  onChange={
                    handleFormChange
                  }
                  placeholder="Nom"
                  required
                />
              </div>

            </div>

            <div>
              <label className="form-label">
                Email
              </label>

              <input
                className="form-input"
                type="email"
                name="email"
                value={
                  form.email
                }
                onChange={
                  handleFormChange
                }
                placeholder="utilisateur@example.com"
                required
              />
            </div>

            <div>
              <label className="form-label">
                Mot de passe
              </label>

              <input
                className="form-input"
                type="password"
                name="password"
                value={
                  form.password
                }
                onChange={
                  handleFormChange
                }
                placeholder="Mot de passe"
                minLength={6}
                required
              />
            </div>

            <div>
              <label className="form-label">
                Rôle
              </label>

              <div className="form-select-wrapper">

                <select
                  name="roleId"
                  value={
                    form.roleId
                  }
                  onChange={
                    handleFormChange
                  }
                >
                  {roles.map(
                    (role) => (
                      <option
                        key={role.id}
                        value={role.id}
                      >
                        {role.name}
                      </option>
                    )
                  )}
                </select>

                <ChevronDown
                  size={17}
                />

              </div>
            </div>

            <div className="modal-actions">

              <button
                type="button"
                className="admin-btn admin-btn-secondary"
                onClick={
                  closeAllModals
                }
                disabled={
                  submitting
                }
              >
                Annuler
              </button>

              <button
                type="submit"
                className="admin-btn admin-btn-primary"
                disabled={
                  submitting
                }
              >

                {submitting ? (
                  <Loader2
                    size={17}
                    className="spin"
                  />
                ) : (
                  <UserPlus
                    size={17}
                  />
                )}

                {submitting
                  ? "Création..."
                  : "Créer l'utilisateur"}

              </button>

            </div>

          </form>

        </Modal>
      )}

    </div>
  );
}

/* =========================================================
   STAT CARD
   ========================================================= */

function StatCard({
  icon,
  label,
  value,
}) {
  return (
    <div className="admin-stat-card">

      <div className="admin-stat-icon">
        {icon}
      </div>

      <div>
        <span>
          {label}
        </span>

        <strong>
          {value}
        </strong>
      </div>

    </div>
  );
}

/* =========================================================
   DETAIL
   ========================================================= */

function Detail({
  label,
  value,
}) {
  return (
    <div className="detail-item">

      <span>
        {label}
      </span>

      <strong>
        {value || "—"}
      </strong>

    </div>
  );
}

/* =========================================================
   MODAL
   ========================================================= */

function Modal({
  title,
  children,
  onClose,
}) {
  return (
    <div
      className="admin-modal-overlay"
      onMouseDown={onClose}
    >

      <div
        className="admin-modal"
        onMouseDown={(event) =>
          event.stopPropagation()
        }
      >

        <div className="admin-modal-header">

          <h2>
            {title}
          </h2>

          <button
            type="button"
            className="modal-close"
            onClick={onClose}
            aria-label="Fermer"
          >
            <X size={19} />
          </button>

        </div>

        <div className="admin-modal-body">
          {children}
        </div>

      </div>

    </div>
  );
}