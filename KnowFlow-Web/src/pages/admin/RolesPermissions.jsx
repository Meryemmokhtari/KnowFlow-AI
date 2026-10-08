
import React, { useEffect, useMemo, useState } from "react";

import {
  Shield,
  ShieldCheck,
  Users,
  FileText,
  Search,
  Bot,
  Settings,
  Activity,
  Check,
  X,
  Save,
  RotateCcw,
  ChevronDown,
  Lock,
  Sparkles,
  UserCog,
  KeyRound,
  CheckCircle2,
  AlertCircle,
  Loader2,
} from "lucide-react";

import "./RolesPermissions.css";

// =====================================================
// API
// =====================================================

const API_URL = "http://localhost:5282/api";

// =====================================================
// ROLE VISUAL CONFIG
// =====================================================

const ROLE_CONFIG = {
  Admin: {
    label: "Administrator",
    description:
      "Full access to the KnowFlow AI platform and system administration.",
    icon: ShieldCheck,
    color: "purple",
    protected: true,
  },

  Administrator: {
    label: "Administrator",
    description:
      "Full access to the KnowFlow AI platform and system administration.",
    icon: ShieldCheck,
    color: "purple",
    protected: true,
  },

  Manager: {
    label: "Manager",
    description:
      "Manage documents, users and organizational knowledge.",
    icon: UserCog,
    color: "blue",
    protected: false,
  },

  Employee: {
    label: "Employee",
    description:
      "Access organizational resources according to assigned permissions.",
    icon: Users,
    color: "green",
    protected: false,
  },

  Enseignant: {
    label: "Enseignant",
    description:
      "Access documents, search knowledge and use AI assistance.",
    icon: Users,
    color: "green",
    protected: false,
  },

  "Étudiant": {
    label: "Étudiant",
    description:
      "Access learning resources according to assigned permissions.",
    icon: Users,
    color: "green",
    protected: false,
  },
};

// =====================================================
// PERMISSION GROUPS
// =====================================================

const permissionGroups = [
  {
    id: "users",
    title: "User Management",
    description: "Manage users and their access",
    icon: Users,
    permissions: [
      {
        id: "users.view",
        label: "View users",
        description: "View the list of platform users",
      },
      {
        id: "users.create",
        label: "Create users",
        description: "Create new user accounts",
      },
      {
        id: "users.edit",
        label: "Edit users",
        description: "Update user information",
      },
      {
        id: "users.delete",
        label: "Delete users",
        description: "Remove users from the platform",
      },
      {
        id: "users.roles",
        label: "Manage roles",
        description: "Assign roles and permissions",
      },
    ],
  },

  {
    id: "documents",
    title: "Documents",
    description: "Control access to knowledge documents",
    icon: FileText,
    permissions: [
      {
        id: "documents.view",
        label: "View documents",
        description: "Open and view documents",
      },
      {
        id: "documents.upload",
        label: "Upload documents",
        description: "Upload new knowledge documents",
      },
      {
        id: "documents.edit",
        label: "Edit documents",
        description: "Modify document metadata",
      },
      {
        id: "documents.delete",
        label: "Delete documents",
        description: "Remove documents",
      },
      {
        id: "documents.download",
        label: "Download documents",
        description: "Download documents to the device",
      },
    ],
  },

  {
    id: "search",
    title: "Search & Knowledge",
    description: "Semantic and knowledge discovery access",
    icon: Search,
    permissions: [
      {
        id: "search.keyword",
        label: "Keyword search",
        description: "Search documents using keywords",
      },
      {
        id: "search.semantic",
        label: "Semantic search",
        description:
          "Search using AI-powered semantic matching",
      },
      {
        id: "search.index",
        label: "Manage indexing",
        description:
          "Trigger and manage document indexing",
      },
    ],
  },

  {
    id: "ai",
    title: "AI Assistant",
    description: "Access to the KnowFlow AI assistant",
    icon: Bot,
    permissions: [
      {
        id: "ai.use",
        label: "Use AI assistant",
        description:
          "Ask questions to the AI assistant",
      },
      {
        id: "ai.rag",
        label: "Use RAG",
        description:
          "Ask questions using organizational documents",
      },
      {
        id: "ai.configure",
        label: "Configure AI",
        description:
          "Configure AI and model settings",
      },
    ],
  },

  {
    id: "system",
    title: "System",
    description:
      "Platform configuration and monitoring",
    icon: Settings,
    permissions: [
      {
        id: "system.settings",
        label: "System settings",
        description:
          "Manage platform configuration",
      },
      {
        id: "system.monitoring",
        label: "System monitoring",
        description:
          "View system and service status",
      },
      {
        id: "system.logs",
        label: "Audit logs",
        description:
          "View platform activity logs",
      },
      {
        id: "system.notifications",
        label: "Notifications",
        description:
          "Manage system notifications",
      },
    ],
  },
];

// =====================================================
// HELPERS
// =====================================================

function getToken() {
  return (
    localStorage.getItem("token") ||
    localStorage.getItem("accessToken") ||
    sessionStorage.getItem("token") ||
    sessionStorage.getItem("accessToken") ||
    ""
  );
}

function getRoleConfig(roleName) {
  return (
    ROLE_CONFIG[roleName] || {
      label: roleName,
      description:
        "Access resources according to assigned permissions.",
      icon: Users,
      color: "blue",
      protected: false,
    }
  );
}

// =====================================================
// BACKEND PERMISSION -> FRONTEND ID
// =====================================================

function getPermissionFrontendId(permission) {
  if (!permission) {
    return null;
  }

  const permissionName =
    permission.name ||
    permission.Name ||
    "";

  if (!permissionName) {
    return null;
  }

  const normalizedName =
    permissionName.trim().toLowerCase();

  const exactMatch = permissionGroups
    .flatMap((group) => group.permissions)
    .find(
      (item) =>
        item.label.trim().toLowerCase() ===
        normalizedName
    );

  return exactMatch?.id || null;
}

// =====================================================
// COMPONENT
// =====================================================

function RolesPermissions() {
  // =====================================================
  // STATE
  // =====================================================

  const [roles, setRoles] = useState([]);

  const [selectedRoleId, setSelectedRoleId] =
    useState(null);

  const [permissions, setPermissions] =
    useState({});

  const [searchTerm, setSearchTerm] =
    useState("");

  const [openGroups, setOpenGroups] =
    useState(
      permissionGroups.reduce(
        (acc, group) => {
          acc[group.id] = true;
          return acc;
        },
        {}
      )
    );

  const [hasChanges, setHasChanges] =
    useState(false);

  const [showSaved, setShowSaved] =
    useState(false);

  const [loading, setLoading] =
    useState(true);

  const [saving, setSaving] =
    useState(false);

  const [error, setError] =
    useState("");

  // =====================================================
  // LOAD ROLES
  // =====================================================

  const loadRoles = async () => {
    try {
      setLoading(true);
      setError("");

      const token = getToken();

      if (!token) {
        throw new Error(
          "Authentication token not found."
        );
      }

      const response = await fetch(
        `${API_URL}/Role`,
        {
          method: "GET",
          headers: {
            Accept: "application/json",
            Authorization: `Bearer ${token}`,
          },
        }
      );

      if (!response.ok) {
        if (response.status === 401) {
          throw new Error(
            "Your session has expired. Please login again."
          );
        }

        if (response.status === 403) {
          throw new Error(
            "You do not have permission to manage roles."
          );
        }

        throw new Error(
          `Failed to load roles (${response.status}).`
        );
      }

      const data =
        await response.json();

      if (!Array.isArray(data)) {
        throw new Error(
          "Invalid roles response from server."
        );
      }

      // =================================================
      // IMPORTANT:
      // Build the real backend permission ID map.
      // =================================================

      const backendPermissionMap = {};

      for (const role of data) {
        if (
          !Array.isArray(
            role.permissions
          )
        ) {
          continue;
        }

        for (const permission of role.permissions) {
          const frontendId =
            getPermissionFrontendId(
              permission
            );

          const backendId =
            permission.id ??
            permission.Id;

          if (
            frontendId &&
            Number.isInteger(
              Number(backendId)
            )
          ) {
            backendPermissionMap[
              frontendId
            ] = Number(backendId);
          }
        }
      }

      // Store globally for saveChanges().
      window.__KNOWFLOW_PERMISSION_MAP__ =
        backendPermissionMap;

      // =================================================
      // NORMALIZE ROLES
      // =================================================

      const normalizedRoles =
        data.map((role) => {
          const config =
            getRoleConfig(
              role.name ||
                role.Name ||
                ""
            );

          return {
            id:
              role.id ??
              role.Id,

            backendName:
              role.name ||
              role.Name ||
              "Unknown",

            name:
              config.label ||
              role.name ||
              role.Name ||
              "Unknown",

            description:
              config.description,

            icon:
              config.icon ||
              Shield,

            color:
              config.color ||
              "blue",

            members:
              Number(
                role.members ??
                  role.Members ??
                  0
              ),

            protected:
              config.protected ||
              false,
          };
        });

      // =================================================
      // ROLE PERMISSIONS
      // =================================================

      const rolePermissions = {};

      for (const role of data) {
        const roleId =
          role.id ??
          role.Id;

        rolePermissions[
          roleId
        ] = Array.isArray(
          role.permissions
        )
          ? role.permissions
              .map(
                (
                  permission
                ) =>
                  getPermissionFrontendId(
                    permission
                  )
              )
              .filter(Boolean)
          : [];
      }

      setRoles(normalizedRoles);
      setPermissions(
        rolePermissions
      );

      // =================================================
      // DEFAULT SELECTED ROLE
      // =================================================

      if (
        normalizedRoles.length > 0
      ) {
        const selectedStillExists =
          normalizedRoles.some(
            (role) =>
              role.id ===
              selectedRoleId
          );

        if (
          selectedRoleId === null ||
          !selectedStillExists
        ) {
          setSelectedRoleId(
            normalizedRoles[0].id
          );
        }
      } else {
        setSelectedRoleId(null);
      }

      setHasChanges(false);
      setShowSaved(false);
    } catch (err) {
      console.error(
        "Roles loading error:",
        err
      );

      setError(
        err?.message ||
          "Unable to load roles and permissions."
      );
    } finally {
      setLoading(false);
    }
  };

  // =====================================================
  // INITIAL LOAD
  // =====================================================

  useEffect(() => {
    loadRoles();
  }, []);

  // =====================================================
  // ACTIVE ROLE
  // =====================================================

  const activeRole = useMemo(
    () =>
      roles.find(
        (role) =>
          role.id ===
          selectedRoleId
      ),
    [roles, selectedRoleId]
  );

  const RoleIcon =
    activeRole?.icon ||
    Shield;

  // =====================================================
  // ACTIVE PERMISSIONS
  // =====================================================

  const activePermissions =
    selectedRoleId !== null
      ? permissions[
          selectedRoleId
        ] || []
      : [];

  // =====================================================
  // TOTAL PERMISSIONS
  // =====================================================

  const totalPermissions =
    permissionGroups.reduce(
      (total, group) =>
        total +
        group.permissions.length,
      0
    );

  const enabledCount =
    activePermissions.length;

  const percentage =
    totalPermissions > 0
      ? Math.round(
          (enabledCount /
            totalPermissions) *
            100
        )
      : 0;

  // =====================================================
  // SEARCH
  // =====================================================

  const filteredGroups =
    useMemo(() => {
      const query =
        searchTerm
          .trim()
          .toLowerCase();

      if (!query) {
        return permissionGroups;
      }

      return permissionGroups
        .map((group) => {
          const groupMatches =
            group.title
              .toLowerCase()
              .includes(query) ||
            group.description
              .toLowerCase()
              .includes(query);

          const filteredPermissions =
            group.permissions.filter(
              (permission) =>
                permission.label
                  .toLowerCase()
                  .includes(query) ||
                permission.description
                  .toLowerCase()
                  .includes(query)
            );

          if (groupMatches) {
            return group;
          }

          if (
            filteredPermissions.length >
            0
          ) {
            return {
              ...group,
              permissions:
                filteredPermissions,
            };
          }

          return null;
        })
        .filter(Boolean);
    }, [searchTerm]);

  // =====================================================
  // TOGGLE GROUP OPEN/CLOSE
  // =====================================================

  const toggleGroup = (
    groupId
  ) => {
    setOpenGroups(
      (previous) => ({
        ...previous,
        [groupId]:
          !previous[groupId],
      })
    );
  };

  // =====================================================
  // HAS PERMISSION
  // =====================================================

  const hasPermission = (
    permissionId
  ) =>
    activePermissions.includes(
      permissionId
    );

  // =====================================================
  // TOGGLE SINGLE PERMISSION
  // =====================================================

  const togglePermission = (
    permissionId
  ) => {
    if (
      !activeRole ||
      activeRole.protected
    ) {
      return;
    }

    setPermissions(
      (previous) => {
        const current =
          previous[
            selectedRoleId
          ] || [];

        const updated =
          current.includes(
            permissionId
          )
            ? current.filter(
                (id) =>
                  id !==
                  permissionId
              )
            : [
                ...current,
                permissionId,
              ];

        return {
          ...previous,
          [selectedRoleId]:
            updated,
        };
      }
    );

    setHasChanges(true);
    setShowSaved(false);
  };

  // =====================================================
  // TOGGLE GROUP PERMISSIONS
  // =====================================================

  const toggleGroupPermissions = (
    group
  ) => {
    if (
      !activeRole ||
      activeRole.protected
    ) {
      return;
    }

    const groupPermissionIds =
      group.permissions.map(
        (permission) =>
          permission.id
      );

    const allEnabled =
      groupPermissionIds.every(
        (id) =>
          activePermissions.includes(
            id
          )
      );

    setPermissions(
      (previous) => {
        const current =
          previous[
            selectedRoleId
          ] || [];

        let updated;

        if (allEnabled) {
          updated =
            current.filter(
              (id) =>
                !groupPermissionIds.includes(
                  id
                )
            );
        } else {
          updated = [
            ...new Set([
              ...current,
              ...groupPermissionIds,
            ]),
          ];
        }

        return {
          ...previous,
          [selectedRoleId]:
            updated,
        };
      }
    );

    setHasChanges(true);
    setShowSaved(false);
  };

  // =====================================================
  // RESET
  // =====================================================

  const resetPermissions = async () => {
    if (!selectedRoleId) {
      return;
    }

    try {
      setLoading(true);
      setError("");

      const token = getToken();

      if (!token) {
        throw new Error(
          "Authentication token not found."
        );
      }

      const response =
        await fetch(
          `${API_URL}/Role/${selectedRoleId}/permissions`,
          {
            method: "GET",
            headers: {
              Accept:
                "application/json",
              Authorization:
                `Bearer ${token}`,
            },
          }
        );

      if (!response.ok) {
        if (
          response.status ===
          401
        ) {
          throw new Error(
            "Your session has expired. Please login again."
          );
        }

        throw new Error(
          `Failed to reset permissions (${response.status}).`
        );
      }

      const data =
        await response.json();

      // =================================================
      // Update backend permission map too.
      // =================================================

      const map =
        {
          ...(window
            .__KNOWFLOW_PERMISSION_MAP__ ||
            {}),
        };

      const backendPermissionIds =
        Array.isArray(data)
          ? data
              .map(
                (permission) => {
                  const frontendId =
                    getPermissionFrontendId(
                      permission
                    );

                  const backendId =
                    permission.id ??
                    permission.Id;

                  if (
                    frontendId &&
                    Number.isInteger(
                      Number(
                        backendId
                      )
                    )
                  ) {
                    map[
                      frontendId
                    ] =
                      Number(
                        backendId
                      );
                  }

                  return frontendId;
                }
              )
              .filter(Boolean)
          : [];

      window.__KNOWFLOW_PERMISSION_MAP__ =
        map;

      setPermissions(
        (previous) => ({
          ...previous,
          [selectedRoleId]:
            backendPermissionIds,
        })
      );

      setHasChanges(false);
      setShowSaved(false);
    } catch (err) {
      console.error(
        "Reset permissions error:",
        err
      );

      setError(
        err?.message ||
          "Unable to reset permissions."
      );
    } finally {
      setLoading(false);
    }
  };

  // =====================================================
  // SAVE CHANGES
  // =====================================================

  const saveChanges = async () => {
    if (
      !selectedRoleId ||
      !activeRole ||
      activeRole.protected
    ) {
      return;
    }

    try {
      setSaving(true);
      setError("");
      setShowSaved(false);

      const token = getToken();

      if (!token) {
        throw new Error(
          "Authentication token not found."
        );
      }

      // =================================================
      // REAL BACKEND PERMISSION MAP
      // =================================================

      const backendPermissionMap =
        window
          .__KNOWFLOW_PERMISSION_MAP__ ||
        {};

      // =================================================
      // FRONTEND -> BACKEND IDS
      // =================================================

      const permissionIds =
        activePermissions
          .map(
            (frontendPermissionId) =>
              backendPermissionMap[
                frontendPermissionId
              ]
          )
          .filter(
            (id) =>
              Number.isInteger(
                Number(id)
              )
          )
          .map(Number);

      console.log(
        "Saving permission IDs:",
        permissionIds
      );

      // =================================================
      // PUT
      // =================================================

      const response =
        await fetch(
          `${API_URL}/Role/${selectedRoleId}/permissions`,
          {
            method: "PUT",

            headers: {
              "Content-Type":
                "application/json",

              Accept:
                "application/json",

              Authorization:
                `Bearer ${token}`,
            },

            body: JSON.stringify({
              permissionIds,
            }),
          }
        );

      const data =
        await response
          .json()
          .catch(() => null);

      if (!response.ok) {
        if (
          response.status ===
          401
        ) {
          throw new Error(
            "Your session has expired. Please login again."
          );
        }

        if (
          response.status ===
          403
        ) {
          throw new Error(
            "You do not have permission to modify roles."
          );
        }

        throw new Error(
          data?.message ||
            data?.Message ||
            `Failed to save permissions (${response.status}).`
        );
      }

      setHasChanges(false);
      setShowSaved(true);

      // =================================================
      // HIDE SUCCESS MESSAGE
      // =================================================

      setTimeout(() => {
        setShowSaved(false);
      }, 3000);
    } catch (err) {
      console.error(
        "Save permissions error:",
        err
      );

      setError(
        err?.message ||
          "Unable to save permissions."
      );
    } finally {
      setSaving(false);
    }
  };

  // =====================================================
  // SELECT ROLE
  // =====================================================

  const selectRole = (
    roleId
  ) => {
    setSelectedRoleId(
      roleId
    );

    setSearchTerm("");

    setHasChanges(false);

    setShowSaved(false);

    setError("");
  };

  // =====================================================
  // LOADING
  // =====================================================

  if (
    loading &&
    roles.length === 0
  ) {
    return (
      <div className="roles-page">

        <div className="roles-loading">

          <Loader2
            size={25}
            className="roles-spinner"
          />

          <span>
            Loading roles and permissions...
          </span>

        </div>

      </div>
    );
  }

  // =====================================================
  // RENDER
  // =====================================================

  return (
    <div className="roles-page">

      {/* =================================================
          HEADER
      ================================================= */}

      <div className="roles-header">

        <div className="roles-header-content">

          <div className="roles-title-area">

            <div className="roles-title-icon">

              <Shield
                size={25}
                strokeWidth={2.2}
              />

            </div>

            <div>

              <div className="roles-breadcrumb">

                <span>
                  Administration
                </span>

                <span className="breadcrumb-dot">
                  /
                </span>

                <span>
                  Access Control
                </span>

              </div>

              <h1>
                Roles & Permissions
              </h1>

              <p>
                Control access to KnowFlow AI
                features and resources.
              </p>

            </div>

          </div>

          <div className="roles-header-actions">

            {hasChanges && (
              <button
                className="roles-reset-btn"
                onClick={
                  resetPermissions
                }
                disabled={saving}
              >

                <RotateCcw
                  size={16}
                />

                Reset

              </button>
            )}

            <button
              className={`roles-save-btn ${
                !hasChanges ||
                saving ||
                activeRole?.protected
                  ? "disabled"
                  : ""
              }`}
              onClick={saveChanges}
              disabled={
                !hasChanges ||
                saving ||
                activeRole?.protected
              }
            >

              {saving ? (
                <Loader2
                  size={17}
                  className="roles-spinner"
                />
              ) : (
                <Save size={17} />
              )}

              {saving
                ? "Saving..."
                : "Save Changes"}

            </button>

          </div>

        </div>

      </div>

      {/* =================================================
          ERROR
      ================================================= */}

      {error && (
        <div className="roles-error">

          <AlertCircle
            size={18}
          />

          <div>

            <strong>
              Operation failed
            </strong>

            <span>
              {error}
            </span>

          </div>

          <button
            type="button"
            onClick={() =>
              setError("")
            }
          >
            <X size={17} />
          </button>

        </div>
      )}

      {/* =================================================
          SUCCESS
      ================================================= */}

      {showSaved && (
        <div className="roles-success">

          <CheckCircle2
            size={18}
          />

          <div>

            <strong>
              Changes saved successfully
            </strong>

            <span>
              Permissions for{" "}
              {activeRole?.name}{" "}
              have been updated.
            </span>

          </div>

          <button
            type="button"
            onClick={() =>
              setShowSaved(false)
            }
          >
            <X size={17} />
          </button>

        </div>
      )}

      {/* =================================================
          OVERVIEW
      ================================================= */}

      <div className="roles-overview">

        <div className="overview-card">

          <div className="overview-icon purple">
            <ShieldCheck
              size={21}
            />
          </div>

          <div className="overview-info">

            <span>
              Active Roles
            </span>

            <strong>
              {roles.length}
            </strong>

          </div>

        </div>

        <div className="overview-card">

          <div className="overview-icon blue">
            <KeyRound
              size={21}
            />
          </div>

          <div className="overview-info">

            <span>
              Total Permissions
            </span>

            <strong>
              {totalPermissions}
            </strong>

          </div>

        </div>

        <div className="overview-card">

          <div className="overview-icon green">
            <Users size={21} />
          </div>

          <div className="overview-info">

            <span>
              Managed Users
            </span>

            <strong>
              {roles.reduce(
                (
                  total,
                  role
                ) =>
                  total +
                  role.members,
                0
              )}
            </strong>

          </div>

        </div>

        <div className="overview-card">

          <div className="overview-icon cyan">
            <Activity
              size={21}
            />
          </div>

          <div className="overview-info">

            <span>
              Current Access
            </span>

            <strong>
              {percentage}%
            </strong>

          </div>

        </div>

      </div>

      {/* =================================================
          MAIN CONTENT
      ================================================= */}

      <div className="roles-content">

        {/* =================================================
            LEFT
        ================================================= */}

        <aside className="roles-sidebar">

          <div className="sidebar-heading">

            <div>

              <span className="section-label">
                ACCESS CONTROL
              </span>

              <h2>
                Roles
              </h2>

            </div>

            <span className="role-count">
              {roles.length}
            </span>

          </div>

          <div className="role-list">

            {roles.map((role) => {

              const Icon =
                role.icon ||
                Shield;

              const isActive =
                selectedRoleId ===
                role.id;

              return (
                <button
                  type="button"
                  key={role.id}
                  className={`role-card ${
                    isActive
                      ? "active"
                      : ""
                  }`}
                  onClick={() =>
                    selectRole(
                      role.id
                    )
                  }
                >

                  <div
                    className={`role-icon ${
                      role.color
                    }`}
                  >
                    <Icon
                      size={20}
                    />
                  </div>

                  <div className="role-card-content">

                    <div className="role-card-top">

                      <strong>
                        {role.name}
                      </strong>

                      {role.protected && (
                        <span className="protected-badge">

                          <Lock
                            size={10}
                          />

                          Protected

                        </span>
                      )}

                    </div>

                    <p>
                      {role.description}
                    </p>

                    <div className="role-members">

                      <Users
                        size={13}
                      />

                      {role.members}{" "}

                      {role.members ===
                      1
                        ? "member"
                        : "members"}

                    </div>

                  </div>

                  {isActive && (
                    <div className="role-active-indicator">

                      <Check
                        size={15}
                      />

                    </div>
                  )}

                </button>
              );
            })}

          </div>

          <div className="sidebar-tip">

            <div className="tip-icon">

              <Sparkles
                size={16}
              />

            </div>

            <div>

              <strong>
                Access Control
              </strong>

              <p>
                Permissions determine what
                each role can access across
                KnowFlow AI.
              </p>

            </div>

          </div>

        </aside>

        {/* =================================================
            RIGHT
        ================================================= */}

        <main className="permissions-panel">

          {/* ROLE HEADER */}

          <div className="permissions-header">

            <div className="selected-role">

              <div
                className={`selected-role-icon ${
                  activeRole?.color ||
                  "purple"
                }`}
              >

                <RoleIcon
                  size={24}
                />

              </div>

              <div>

                <div className="selected-role-label">
                  SELECTED ROLE
                </div>

                <h2>
                  {activeRole?.name ||
                    "No role selected"}
                </h2>

                <p>
                  {activeRole?.description ||
                    "Select a role to manage permissions."}
                </p>

              </div>

            </div>

            <div className="permission-summary">

              <div className="summary-number">

                <strong>
                  {enabledCount}
                </strong>

                <span>
                  / {totalPermissions}
                </span>

              </div>

              <span>
                permissions enabled
              </span>

              <div className="progress-track">

                <div
                  className="progress-value"
                  style={{
                    width:
                      `${percentage}%`,
                  }}
                />

              </div>

            </div>

          </div>

          {/* SEARCH */}

          <div className="permissions-toolbar">

            <div className="permission-search">

              <Search
                size={18}
              />

              <input
                type="text"
                placeholder="Search permissions..."
                value={
                  searchTerm
                }
                onChange={(
                  event
                ) =>
                  setSearchTerm(
                    event.target
                      .value
                  )
                }
              />

              {searchTerm && (
                <button
                  type="button"
                  className="clear-search"
                  onClick={() =>
                    setSearchTerm(
                      ""
                    )
                  }
                >
                  <X size={15} />
                </button>
              )}

            </div>

            <div className="toolbar-info">

              <span className="secure-dot" />

              {activeRole?.protected
                ? "Role protected"
                : "Role permissions"}

            </div>

          </div>

          {/* PERMISSION GROUPS */}

          <div className="permission-groups">

            {filteredGroups.length ===
            0 ? (
              <div className="empty-permissions">

                <div className="empty-icon">

                  <Search
                    size={25}
                  />

                </div>

                <h3>
                  No permissions found
                </h3>

                <p>
                  Try another keyword or
                  clear the search.
                </p>

                <button
                  type="button"
                  onClick={() =>
                    setSearchTerm(
                      ""
                    )
                  }
                >
                  Clear Search
                </button>

              </div>
            ) : (
              filteredGroups.map(
                (group) => {

                  const GroupIcon =
                    group.icon;

                  const isOpen =
                    openGroups[
                      group.id
                    ];

                  const groupIds =
                    group.permissions.map(
                      (
                        permission
                      ) =>
                        permission.id
                    );

                  const enabledInGroup =
                    groupIds.filter(
                      (id) =>
                        activePermissions.includes(
                          id
                        )
                    ).length;

                  const allEnabled =
                    enabledInGroup ===
                      groupIds.length &&
                    groupIds.length >
                      0;

                  return (
                    <section
                      className="permission-group"
                      key={group.id}
                    >

                      <div
                        className="permission-group-header"
                        onClick={() =>
                          toggleGroup(
                            group.id
                          )
                        }
                      >

                        <div className="group-title">

                          <div className="group-icon">

                            <GroupIcon
                              size={18}
                            />

                          </div>

                          <div>

                            <h3>
                              {group.title}
                            </h3>

                            <p>
                              {
                                group.description
                              }
                            </p>

                          </div>

                        </div>

                        <div className="group-actions">

                          <span className="group-counter">

                            {enabledInGroup}/
                            {groupIds.length}

                          </span>

                          <button
                            type="button"
                            className={`group-toggle ${
                              allEnabled
                                ? "active"
                                : ""
                            }`}
                            disabled={
                              activeRole?.protected
                            }
                            onClick={(
                              event
                            ) => {
                              event.stopPropagation();

                              toggleGroupPermissions(
                                group
                              );
                            }}
                            title={
                              activeRole?.protected
                                ? "Protected role"
                                : allEnabled
                                ? "Disable all"
                                : "Enable all"
                            }
                          >

                            {allEnabled ? (
                              <Check
                                size={14}
                              />
                            ) : (
                              <span>
                                +
                              </span>
                            )}

                          </button>

                          <ChevronDown
                            size={18}
                            className={`group-chevron ${
                              isOpen
                                ? "open"
                                : ""
                            }`}
                          />

                        </div>

                      </div>

                      {isOpen && (
                        <div className="permission-list">

                          {group.permissions.map(
                            (
                              permission
                            ) => {

                              const enabled =
                                hasPermission(
                                  permission.id
                                );

                              return (
                                <div
                                  className={`permission-row ${
                                    enabled
                                      ? "enabled"
                                      : ""
                                  } ${
                                    activeRole?.protected
                                      ? "protected"
                                      : ""
                                  }`}
                                  key={
                                    permission.id
                                  }
                                  onClick={() =>
                                    togglePermission(
                                      permission.id
                                    )
                                  }
                                >

                                  <div className="permission-check">

                                    {enabled && (
                                      <Check
                                        size={14}
                                      />
                                    )}

                                  </div>

                                  <div className="permission-info">

                                    <strong>
                                      {
                                        permission.label
                                      }
                                    </strong>

                                    <span>
                                      {
                                        permission.description
                                      }
                                    </span>

                                  </div>

                                  <div className="permission-status">

                                    {enabled ? (
                                      <span className="status-enabled">
                                        Enabled
                                      </span>
                                    ) : (
                                      <span className="status-disabled">
                                        Disabled
                                      </span>
                                    )}

                                  </div>

                                  <div className="permission-switch">

                                    <div
                                      className={`switch ${
                                        enabled
                                          ? "on"
                                          : ""
                                      }`}
                                    >

                                      <div className="switch-thumb" />

                                    </div>

                                  </div>

                                </div>
                              );
                            }
                          )}

                        </div>
                      )}

                    </section>
                  );
                }
              )
            )}

          </div>

          {/* SECURITY NOTICE */}

          <div className="security-notice">

            <div className="security-notice-icon">

              <AlertCircle
                size={18}
              />

            </div>

            <div>

              <strong>
                Permission changes
              </strong>

              <p>
                Changes affect all users
                assigned to the{" "}
                <b>
                  {activeRole?.name}
                </b>{" "}
                role. Make sure access is
                granted according to your
                organization's security policy.
              </p>

            </div>

          </div>

        </main>

      </div>

      {/* =================================================
          FLOATING SAVE BAR
      ================================================= */}

      {hasChanges && (
        <div className="floating-save">

          <div className="floating-save-info">

            <div className="floating-dot" />

            <div>

              <strong>
                Unsaved changes
              </strong>

              <span>
                You modified{" "}
                {activeRole?.name}{" "}
                permissions.
              </span>

            </div>

          </div>

          <div className="floating-actions">

            <button
              type="button"
              className="floating-cancel"
              onClick={
                resetPermissions
              }
              disabled={saving}
            >
              Cancel
            </button>

            <button
              type="button"
              className="floating-save-btn"
              onClick={saveChanges}
              disabled={saving}
            >

              {saving ? (
                <Loader2
                  size={16}
                  className="roles-spinner"
                />
              ) : (
                <Save size={16} />
              )}

              {saving
                ? "Saving..."
                : "Save changes"}

            </button>

          </div>

        </div>
      )}

    </div>
  );
}

export default RolesPermissions;
