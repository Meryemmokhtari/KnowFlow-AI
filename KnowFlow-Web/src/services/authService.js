const API_URL = "http://localhost:5282/api/Auth";

// ======================
// LOGIN
// ======================

export async function login(email, password) {
  const response = await fetch(
    `${API_URL}/login`,
    {
      method: "POST",

      headers: {
        "Content-Type": "application/json"
      },

      body: JSON.stringify({
        email,
        password
      })
    }
  );

  const data = await response.json().catch(() => null);

  if (!response.ok) {
    throw new Error(
      data?.message ||
      "Invalid email or password."
    );
  }

  if (!data?.token) {
    throw new Error(
      "Authentication succeeded but no token was returned."
    );
  }

  return data.token;
}


// ======================
// REGISTER
// ======================

export async function register(user) {
  const response = await fetch(
    `${API_URL}/register`,
    {
      method: "POST",

      headers: {
        "Content-Type": "application/json"
      },

      body: JSON.stringify(user)
    }
  );

  const data = await response.json().catch(() => null);

  if (!response.ok) {
    throw new Error(
      data?.message ||
      "Registration failed."
    );
  }

  return data;
}


// ======================
// LOGOUT
// ======================

export function logout() {
  localStorage.removeItem("token");
  sessionStorage.removeItem("token");
}


// ======================
// GET TOKEN
// ======================

export function getToken() {
  return (
    localStorage.getItem("token") ||
    sessionStorage.getItem("token")
  );
}


// ======================
// AUTH HEADER
// ======================

export function authHeader() {
  const token = getToken();

  return {
    headers: {
      Authorization: `Bearer ${token}`
    }
  };
}