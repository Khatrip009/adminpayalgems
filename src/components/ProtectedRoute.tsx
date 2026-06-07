import React, { useEffect } from "react";
import { Navigate, useLocation } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

const ProtectedRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user, token, loading } = useAuth();
  const location = useLocation();

  // Optionally, you can listen to token expiry and force refresh
  useEffect(() => {
    if (token) {
      // Example: check if token expiry is near (if you decode JWT)
      // and trigger a refresh manually. This is optional.
      // For now, we rely on the apiClient to refresh on 401.
    }
  }, [token]);

  if (loading) {
    return (
      <div className="w-full h-screen flex items-center justify-center text-slate-700">
        Checking authentication…
      </div>
    );
  }

  if (!user || !token) {
    // Save intended route for deep‑link restore
    sessionStorage.setItem(
      "postLoginRedirect",
      location.pathname + location.search
    );

    return <Navigate to="/login" replace />;
  }

  return <>{children}</>;
};

export default ProtectedRoute;