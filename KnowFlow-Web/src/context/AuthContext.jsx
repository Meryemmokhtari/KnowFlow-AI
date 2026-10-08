import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";

import { jwtDecode } from "jwt-decode";

// =====================================================
// KNOWFLOW AI — AUTH SERVICE
// =====================================================

const AUTH_API = "http://localhost:5282/api/Auth";

// =====================================================
// CONTEXT
// =====================================================

const AuthContext = createContext(null);

// =====================================================
// TOKEN HELPERS
// =====================================================

function getStoredToken() {
  return (
    localStorage.getItem("token") ||
    localStorage.getItem("accessToken") ||
    sessionStorage.getItem("token") ||
    sessionStorage.getItem("accessToken") ||
    null
  );
}

function clearStoredTokens() {
  // Local storage
  localStorage.removeItem("token");
  localStorage.removeItem("accessToken");
  localStorage.removeItem("user");
  localStorage.removeItem("role");

  // Session storage
  sessionStorage.removeItem("token");
  sessionStorage.removeItem("accessToken");
  sessionStorage.removeItem("user");
  sessionStorage.removeItem("role");
}

// =====================================================
// ROLE NORMALIZATION
// =====================================================

function normalizeRole(role) {
  if (!role) return "";

  const value = role.toString().trim().toLowerCase();

  if (
    value === "admin" ||
    value === "administrator" ||
    value === "administrateur"
  ) {
    return "Admin";
  }

  if (
    value === "manager" ||
    value === "responsable"
  ) {
    return "Manager";
  }

  if (
    value === "enseignant" ||
    value === "teacher"
  ) {
    return "Enseignant";
  }

  if (
    value === "employee" ||
    value === "employé" ||
    value === "employe"
  ) {
    return "Employee";
  }

  if (
    value === "étudiant" ||
    value === "etudiant" ||
    value === "student"
  ) {
    return "Étudiant";
  }

  return role.toString().trim();
}

// =====================================================
// JWT CLAIM HELPER
// =====================================================

function getClaim(decoded, possibleNames = []) {
  if (!decoded) return null;

  for (const name of possibleNames) {
    if (
      decoded[name] !== undefined &&
      decoded[name] !== null &&
      decoded[name] !== ""
    ) {
      return decoded[name];
    }
  }

  return null;
}

// =====================================================
// DECODE USER FROM JWT
// =====================================================

function getUserFromToken(token) {
  if (!token) {
    return null;
  }

  try {
    const decoded = jwtDecode(token);

    // =================================================
    // CHECK EXPIRATION
    // =================================================

    if (decoded?.exp) {
      const now = Math.floor(Date.now() / 1000);

      if (decoded.exp <= now) {
        console.warn(
          "KnowFlow Auth - token expired"
        );

        return null;
      }
    }

    // =================================================
    // USER ID
    // =================================================

    const id =
      getClaim(decoded, [
        "sub",
        "id",
        "userId",
        "UserId",
        "userID",
        "UserID",
        "http://schemas.xmlsoap.org/ws/2005/05/identity/claims/nameidentifier",
      ]) || null;

    // =================================================
    // NAME
    // =================================================

    const name =
      getClaim(decoded, [
        "name",
        "Name",
        "username",
        "Username",
        "fullName",
        "FullName",
        "http://schemas.xmlsoap.org/ws/2005/05/identity/claims/name",
      ]) || "";

    // =================================================
    // EMAIL
    // =================================================

    const email =
      getClaim(decoded, [
        "email",
        "Email",
        "mail",
        "Mail",
        "http://schemas.xmlsoap.org/ws/2005/05/identity/claims/emailaddress",
      ]) || "";

    // =================================================
    // ROLE
    // =================================================

    const rawRole =
      getClaim(decoded, [
        "role",
        "Role",
        "roles",
        "Roles",
        "http://schemas.microsoft.com/ws/2008/06/identity/claims/role",
      ]) || "";

    let role = rawRole;

    if (Array.isArray(rawRole)) {
      role = rawRole[0] || "";
    }

    role = normalizeRole(role);

    return {
      id,
      name,
      email,
      role,
      token,
      ...decoded,
    };
  } catch (error) {
    console.error(
      "KnowFlow Auth - JWT decode error:",
      error
    );

    return null;
  }
}

// =====================================================
// EXTRACT TOKEN FROM AUTH RESPONSE
// =====================================================

function extractToken(data) {
  if (!data) {
    return null;
  }

  // =================================================
  // RAW STRING RESPONSE
  // =================================================

  if (typeof data === "string") {
    const value = data.trim();

    if (!value) {
      return null;
    }

    if (
      value
        .toLowerCase()
        .startsWith("bearer ")
    ) {
      return value.substring(7).trim();
    }

    return value;
  }

  // =================================================
  // OBJECT RESPONSE
  // =================================================

  const token =
    data?.token ||
    data?.Token ||
    data?.accessToken ||
    data?.AccessToken ||
    data?.jwt ||
    data?.JWT ||
    data?.access_token ||
    data?.accessToken ||
    data?.data?.token ||
    data?.data?.Token ||
    data?.data?.accessToken ||
    data?.data?.AccessToken ||
    data?.data?.jwt ||
    data?.result?.token ||
    data?.result?.Token ||
    data?.result?.accessToken ||
    data?.result?.AccessToken ||
    null;

  if (!token) {
    return null;
  }

  if (
    typeof token === "string" &&
    token
      .toLowerCase()
      .startsWith("bearer ")
  ) {
    return token.substring(7).trim();
  }

  return token;
}

// =====================================================
// PROVIDER
// =====================================================

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  // ===================================================
  // LOGIN
  // ===================================================

  const login = useCallback(
    async (
      email,
      password,
      remember = true
    ) => {
      console.log(
        "======================================"
      );

      console.log(
        "🔐 KNOWFLOW AI LOGIN"
      );

      console.log(
        "======================================"
      );

      console.log(
        "📡 Auth URL:",
        `${AUTH_API}/login`
      );

      console.log(
        "📧 Email:",
        email
      );

      let response;

      try {
        response = await fetch(
          `${AUTH_API}/login`,
          {
            method: "POST",

            headers: {
              "Content-Type":
                "application/json",

              Accept:
                "application/json",
            },

            body: JSON.stringify({
              email,
              password,
            }),
          }
        );
      } catch (error) {
        console.error(
          "❌ AuthService connection error:",
          error
        );

        throw new Error(
          "Unable to connect to AuthService."
        );
      }

      // =================================================
      // READ RESPONSE
      // =================================================

      const rawText =
        await response.text();

      console.log(
        "📡 AuthService HTTP Status:",
        response.status
      );

      console.log(
        "📦 AuthService Raw Response:",
        rawText
      );

      let data = null;

      if (rawText) {
        try {
          data = JSON.parse(rawText);
        } catch {
          data = rawText;
        }
      }

      console.log(
        "📦 AuthService Parsed Response:",
        data
      );

      // =================================================
      // HTTP ERROR
      // =================================================

      if (!response.ok) {
        const message =
          data?.message ||
          data?.Message ||
          data?.error ||
          data?.Error ||
          data?.title ||
          data?.Title ||
          (typeof data === "string"
            ? data
            : null) ||
          `Login failed (${response.status})`;

        throw new Error(message);
      }

      // =================================================
      // EXTRACT JWT
      // =================================================

      const token =
        extractToken(data);

      console.log(
        "🔑 Token found:",
        !!token
      );

      if (!token) {
        console.error(
          "❌ AuthService did not return a JWT token."
        );

        console.error(
          "❌ Complete response:",
          data
        );

        throw new Error(
          "Authentication token not received from AuthService."
        );
      }

      // =================================================
      // DECODE JWT
      // =================================================

      const decodedUser =
        getUserFromToken(token);

      if (!decodedUser) {
        throw new Error(
          "Invalid or expired authentication token."
        );
      }

      // =================================================
      // CLEAR OLD AUTH
      // =================================================

      clearStoredTokens();

      // =================================================
      // SELECT STORAGE
      // =================================================

      const storage = remember
        ? localStorage
        : sessionStorage;

      // =================================================
      // SAVE TOKEN
      // =================================================

      storage.setItem(
        "token",
        token
      );

      storage.setItem(
        "accessToken",
        token
      );

      // =================================================
      // NORMALIZED USER
      // =================================================

      const safeUser = {
        id:
          decodedUser.id,

        name:
          decodedUser.name,

        email:
          decodedUser.email,

        role:
          decodedUser.role,
      };

      // =================================================
      // SAVE USER
      // =================================================

      storage.setItem(
        "user",
        JSON.stringify(safeUser)
      );

      // =================================================
      // SAVE ROLE
      // =================================================

      storage.setItem(
        "role",
        decodedUser.role
      );

      // =================================================
      // UPDATE REACT STATE
      // =================================================

      setUser({
        ...safeUser,
        token,
      });

      setLoading(false);

      // =================================================
      // VERIFY STORAGE
      // =================================================

      console.log(
        "======================================"
      );

      console.log(
        "✅ LOGIN SUCCESS"
      );

      console.log(
        "👤 User:",
        safeUser
      );

      console.log(
        "🎭 Role:",
        decodedUser.role
      );

      console.log(
        "🔐 JWT saved:",
        !!getStoredToken()
      );

      console.log(
        "💾 Storage:",
        remember
          ? "localStorage"
          : "sessionStorage"
      );

      console.log(
        "======================================"
      );

      // =================================================
      // RETURN
      // =================================================

      return {
        ...(typeof data === "object" &&
        data
          ? data
          : {}),

        token,

        user: safeUser,
      };
    },
    []
  );

  // ===================================================
  // LOGIN USER WITH TOKEN
  // ===================================================

  const loginUser = useCallback(
    (
      token,
      remember = true
    ) => {
      console.log(
        "🔐 KnowFlow Auth - loginUser()"
      );

      if (!token) {
        console.error(
          "❌ loginUser called without token"
        );

        return false;
      }

      const decodedUser =
        getUserFromToken(token);

      if (!decodedUser) {
        console.error(
          "❌ Invalid JWT token"
        );

        clearStoredTokens();

        setUser(null);

        return false;
      }

      clearStoredTokens();

      const storage = remember
        ? localStorage
        : sessionStorage;

      storage.setItem(
        "token",
        token
      );

      storage.setItem(
        "accessToken",
        token
      );

      const safeUser = {
        id:
          decodedUser.id,

        name:
          decodedUser.name,

        email:
          decodedUser.email,

        role:
          decodedUser.role,
      };

      storage.setItem(
        "user",
        JSON.stringify(safeUser)
      );

      storage.setItem(
        "role",
        decodedUser.role
      );

      setUser({
        ...safeUser,
        token,
      });

      setLoading(false);

      console.log(
        "✅ Token stored successfully."
      );

      return true;
    },
    []
  );

  // ===================================================
  // LOGOUT
  // ===================================================

  const logoutUser =
    useCallback(() => {
      console.log(
        "🚪 KnowFlow Auth - logout"
      );

      clearStoredTokens();

      setUser(null);
    }, []);

  // ===================================================
  // REFRESH AUTH
  // ===================================================

  const refreshAuth =
    useCallback(() => {
      console.log(
        "🔄 KnowFlow Auth - refresh"
      );

      const token =
        getStoredToken();

      console.log(
        "🔑 Token found:",
        !!token
      );

      if (!token) {
        setUser(null);
        setLoading(false);

        return false;
      }

      const decodedUser =
        getUserFromToken(token);

      if (!decodedUser) {
        clearStoredTokens();

        setUser(null);
        setLoading(false);

        return false;
      }

      const safeUser = {
        id:
          decodedUser.id,

        name:
          decodedUser.name,

        email:
          decodedUser.email,

        role:
          decodedUser.role,

        token,
      };

      setUser(safeUser);

      setLoading(false);

      return true;
    }, []);

  // ===================================================
  // INITIAL AUTH CHECK
  // ===================================================

  useEffect(() => {
    refreshAuth();
  }, [refreshAuth]);

  // ===================================================
  // CONTEXT VALUE
  // ===================================================

  const value = useMemo(
    () => ({
      user,

      loading,

      login,

      loginUser,

      logoutUser,

      refreshAuth,

      getToken:
        getStoredToken,
    }),
    [
      user,
      loading,
      login,
      loginUser,
      logoutUser,
      refreshAuth,
    ]
  );

  // ===================================================
  // PROVIDER
  // ===================================================

  return (
    <AuthContext.Provider
      value={value}
    >
      {children}
    </AuthContext.Provider>
  );
}

// =====================================================
// HOOK
// =====================================================

export function useAuth() {
  const context =
    useContext(AuthContext);

  if (!context) {
    throw new Error(
      "useAuth must be used inside AuthProvider"
    );
  }

  return context;
}

// =====================================================
// DEFAULT EXPORT
// =====================================================

export default AuthContext;