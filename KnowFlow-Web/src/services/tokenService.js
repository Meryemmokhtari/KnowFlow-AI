import { jwtDecode } from "jwt-decode";

export function getToken() {
  return (
    localStorage.getItem("token") ||
    sessionStorage.getItem("token")
  );
}

export function getCurrentUser() {
  const token = getToken();

  if (!token) return null;

  try {
    return jwtDecode(token);
  } catch (error) {
    console.error("Invalid JWT:", error);
    return null;
  }
}