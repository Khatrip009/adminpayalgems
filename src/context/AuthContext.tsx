import React, { createContext, useContext, useEffect, useState } from "react";
import { apiFetch } from "../lib/apiClient";
import type { AuthUser } from "../types/auth";

interface AuthContextValue {
  user: AuthUser | null;
  token: string | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

const TOKEN_KEY = "mg_admin_token";
const USER_KEY = "mg_admin_user";

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  /* ----------------------------------------------------
     On mount → validate token using /auth/me
  ---------------------------------------------------- */
  useEffect(() => {
    async function init() {
      const storedToken = localStorage.getItem(TOKEN_KEY);

      if (!storedToken) {
        setLoading(false);
        return;
      }

      try {
        const me = await apiFetch("/auth/me");

        if (me?.user?.role_id === 1) {
          setUser(me.user);
          setToken(storedToken);
        } else {
          logout();
        }
      } catch {
        logout();
      } finally {
        setLoading(false);
      }
    }

    init();
  }, []);

  /* ----------------------------------------------------
     LOGIN
  ---------------------------------------------------- */
  const login = async (email: string, password: string) => {
    const data = await apiFetch("/auth/login", {
      method: "POST",
      body: { email, password },
    });

    if (!data.ok) throw new Error(data.error || "Login failed");

    const u = data.user;
    if (Number(u.role_id) !== 1) {
      throw new Error("Access denied. Admins only.");
    }

    setUser(u);
    setToken(data.token);

    localStorage.setItem(TOKEN_KEY, data.token);
    localStorage.setItem(USER_KEY, JSON.stringify(u));
  };

  /* ----------------------------------------------------
     LOGOUT (backend + frontend)
  ---------------------------------------------------- */
  const logout = async () => {
    try {
      await apiFetch("/auth/logout", { method: "POST" });
    } catch {
      /* ignore */
    }

    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(USER_KEY);

    setUser(null);
    setToken(null);

    window.location.href = "/login";
  };

  return (
    <AuthContext.Provider
      value={{ user, token, loading, login, logout }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}

