// =====================================================
// KNOWFLOW AI — API CONFIGURATION
// =====================================================

const API_CONFIG = {
  AUTH: "http://localhost:5282",
  DOCUMENT: "http://localhost:5260",
  SEARCH: "http://localhost:5035",
  AI: "http://localhost:5057",
};

export { API_CONFIG };

// =====================================================
// TOKEN
// =====================================================

export function getToken() {
  return (
    localStorage.getItem("token") ||
    localStorage.getItem("accessToken") ||
    sessionStorage.getItem("token") ||
    null
  );
}

// =====================================================
// CLEAR AUTH
// =====================================================

function clearAuth() {
  localStorage.removeItem("token");
  localStorage.removeItem("accessToken");

  sessionStorage.removeItem("token");
}

// =====================================================
// RESOLVE API URL
// =====================================================

function resolveApiUrl(endpoint) {
  if (!endpoint) {
    throw new Error("API endpoint is required.");
  }

  // Already a complete URL
  if (
    endpoint.startsWith("http://") ||
    endpoint.startsWith("https://")
  ) {
    return endpoint;
  }

  // ===================================================
  // AUTH SERVICE
  // ===================================================

  if (
    endpoint.startsWith("/api/Auth") ||
    endpoint.startsWith("/api/Admin") ||
    endpoint.startsWith("/api/AuditLogs") ||
    endpoint.startsWith("/api/Notifications") ||
    endpoint.startsWith("/api/Permission") ||
    endpoint.startsWith("/api/Role")
  ) {
    return `${API_CONFIG.AUTH}${endpoint}`;
  }

  // ===================================================
  // DOCUMENT SERVICE
  // ===================================================

  if (endpoint.startsWith("/api/Document")) {
    return `${API_CONFIG.DOCUMENT}${endpoint}`;
  }

  // ===================================================
  // SEARCH SERVICE
  // ===================================================

  if (endpoint.startsWith("/api/Search")) {
    return `${API_CONFIG.SEARCH}${endpoint}`;
  }

  // ===================================================
  // AI SERVICE
  // ===================================================

  if (endpoint.startsWith("/api/AI")) {
    return `${API_CONFIG.AI}${endpoint}`;
  }

  // ===================================================
  // FALLBACK
  // ===================================================

  return endpoint;
}

// =====================================================
// API REQUEST
// =====================================================

export async function apiRequest(endpoint, options = {}) {
  const token = getToken();
  const finalUrl = resolveApiUrl(endpoint);

  const isFormData = options.body instanceof FormData;

  const headers = {
    ...(isFormData
      ? {}
      : {
          "Content-Type": "application/json",
        }),

    Accept: "application/json",

    ...(options.headers || {}),
  };

  // ===================================================
  // AUTHORIZATION
  // ===================================================

  if (token) {
    headers.Authorization = `Bearer ${token}`;
  }

  let response;

  try {
    response = await fetch(finalUrl, {
      ...options,
      headers,
    });
  } catch (error) {
    console.error(
      "KnowFlow API connection error:",
      error
    );

    throw new Error(
      `Unable to connect to the server: ${finalUrl}`
    );
  }

  // ===================================================
  // UNAUTHORIZED
  // ===================================================

  if (response.status === 401) {
    clearAuth();

    window.dispatchEvent(
      new Event("auth:logout")
    );

    throw new Error(
      "Your session has expired. Please login again."
    );
  }

  // ===================================================
  // FORBIDDEN
  // ===================================================

  if (response.status === 403) {
    throw new Error(
      "You do not have permission to perform this action."
    );
  }

  // ===================================================
  // NO CONTENT
  // ===================================================

  if (response.status === 204) {
    return {
      success: true,
      status: 204,
      data: null,
    };
  }

  // ===================================================
  // READ RESPONSE
  // ===================================================

  let data = null;

  const contentType =
    response.headers.get("content-type") || "";

  try {
    if (
      contentType.includes(
        "application/json"
      )
    ) {
      data = await response.json();
    } else {
      const text = await response.text();

      data = text || null;
    }
  } catch (error) {
    console.error(
      "KnowFlow API response parsing error:",
      error
    );

    data = null;
  }

  // ===================================================
  // API ERROR
  // ===================================================

  if (!response.ok) {
    const message =
      data?.message ||
      data?.error ||
      data?.title ||
      (typeof data === "string" &&
      data.trim()
        ? data
        : `Request failed with status ${response.status}.`);

    throw new Error(message);
  }

  // ===================================================
  // SUCCESS
  // ===================================================

  return {
    success: true,
    status: response.status,
    data,
  };
}

// =====================================================
// GET
// =====================================================

export function apiGet(
  endpoint,
  options = {}
) {
  return apiRequest(endpoint, {
    ...options,
    method: "GET",
  });
}

// =====================================================
// POST
// =====================================================

export function apiPost(
  endpoint,
  body,
  options = {}
) {
  return apiRequest(endpoint, {
    ...options,
    method: "POST",
    body:
      body instanceof FormData
        ? body
        : JSON.stringify(body),
  });
}

// =====================================================
// PUT
// =====================================================

export function apiPut(
  endpoint,
  body,
  options = {}
) {
  return apiRequest(endpoint, {
    ...options,
    method: "PUT",
    body:
      body === undefined
        ? undefined
        : body instanceof FormData
          ? body
          : JSON.stringify(body),
  });
}

// =====================================================
// PATCH
// =====================================================

export function apiPatch(
  endpoint,
  body,
  options = {}
) {
  return apiRequest(endpoint, {
    ...options,
    method: "PATCH",
    body:
      body === undefined
        ? undefined
        : body instanceof FormData
          ? body
          : JSON.stringify(body),
  });
}

// =====================================================
// DELETE
// =====================================================

export function apiDelete(
  endpoint,
  options = {}
) {
  return apiRequest(endpoint, {
    ...options,
    method: "DELETE",
  });
}