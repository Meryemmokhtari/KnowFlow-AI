
import React from "react";
import { Navigate, useLocation } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";

export default function ProtectedRoute({
  children,
  allowedRoles = [],
}) {
  const { user, loading } = useAuth();
  const location = useLocation();

  // =====================================================
  // AUTH CONTEXT LOADING
  // =====================================================

  if (loading) {
    return (
      <div className="protected-loading">
        <div className="protected-loading-card">
          <div className="protected-loading-spinner" />

          <div>
            <strong>KnowFlow AI</strong>
            <span>Loading your workspace...</span>
          </div>
        </div>
      </div>
    );
  }

  // =====================================================
  // NOT AUTHENTICATED
  // =====================================================

  if (!user) {
    return (
      <Navigate
        to="/login"
        replace
        state={{ from: location }}
      />
    );
  }

  // =====================================================
  // USER ROLE
  // =====================================================

  const userRole = String(
    user?.role ??
      user?.Role ??
      ""
  )
    .trim()
    .toLowerCase();

  // =====================================================
  // ALLOWED ROLES
  // =====================================================

  const normalizedAllowedRoles =
    Array.isArray(allowedRoles)
      ? allowedRoles
          .map((role) =>
            String(role)
              .trim()
              .toLowerCase()
          )
          .filter(Boolean)
      : [];

  // =====================================================
  // ROLE PROTECTION
  // =====================================================

  if (
    normalizedAllowedRoles.length > 0 &&
    !normalizedAllowedRoles.includes(userRole)
  ) {
    return (
      <Navigate
        to="/dashboard"
        replace
      />
    );
  }

  // =====================================================
  // AUTHORIZED
  // =====================================================

  return children;
}