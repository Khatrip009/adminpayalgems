// src/lib/apiClient.ts
// Hardened API client – TypeScript / JavaScript compatible
// Supports auto token refresh, single‑refresh queue, query params, and download helper
// No automatic redirect – throws 401 for the caller to handle.

export interface ApiResponse<T = any> {
  ok: boolean;
  error?: string;
  message?: string;
  [key: string]: any;
}

/* =====================================================
   API BASE
===================================================== */
const API_BASE =
  (import.meta as any).env?.VITE_API_BASE_URL?.replace(/\/+$/, "") ||
  "http://localhost:4500/api";

export const API_BASE_URL = API_BASE;

/* =====================================================
   DOMAIN ROUTES (keep in sync with your backend)
===================================================== */
export const API_ROUTES = {
  auth: "/auth",
  health: "/health",
  masters: "/masters",
  crm: "/crm",
  procurement: "/procurement",
  inventory: "/inventory",
  production: "/production",
  finance: "/finance",
  sales: "/sales",
  logistics: "/logistics",
  analytics: "/analytics",
  system: "/system",
  misc: "/misc",
  events: "/system/events",
} as const;

/* =====================================================
   TOKEN HELPERS
===================================================== */
function getToken() {
  return localStorage.getItem("mg_admin_token");
}

function setToken(t: string) {
  localStorage.setItem("mg_admin_token", t);
}

function clearAuth() {
  localStorage.removeItem("mg_admin_token");
  localStorage.removeItem("mg_admin_user");
}

/* =====================================================
   TOKEN REFRESH QUEUE
===================================================== */
let isRefreshing = false;
let waiting: ((token: string | null) => void)[] = [];

async function refreshAccessToken(): Promise<string | null> {
  if (isRefreshing) {
    return new Promise((resolve) => waiting.push(resolve));
  }

  isRefreshing = true;

  try {
    const res = await fetch(`${API_BASE_URL}/auth/refresh`, {
      method: "POST",
      credentials: "include",
      headers: { "Content-Type": "application/json" },
    });

    if (!res.ok) {
      waiting.forEach((fn) => fn(null));
      waiting = [];
      return null;
    }

    const data = await res.json();
    if (data?.token) {
      setToken(data.token);
      waiting.forEach((fn) => fn(data.token));
      waiting = [];
      return data.token;
    }

    waiting.forEach((fn) => fn(null));
    waiting = [];
    return null;
  } catch (err) {
    console.error("Token refresh failed:", err);
    waiting.forEach((fn) => fn(null));
    waiting = [];
    return null;
  } finally {
    isRefreshing = false;
  }
}

/* =====================================================
   CORE FETCH
===================================================== */
export async function apiFetch<T = any>(
  path: string,
  options: RequestInit & {
    __retry?: boolean;
    responseType?: "json" | "blob";
    query?: Record<string, any>;
  } = {}
): Promise<T> {
  // Build URL with query string if present
  let url = path.startsWith("http")
    ? path
    : `${API_BASE_URL}${path.startsWith("/") ? path : `/${path}`}`;

  if (options.query) {
    const qs = new URLSearchParams();
    Object.entries(options.query).forEach(([k, v]) => {
      if (v !== undefined && v !== null && v !== "") {
        qs.append(k, String(v));
      }
    });
    const q = qs.toString();
    if (q) url += `?${q}`;
  }

  const opts: RequestInit & {
    __retry?: boolean;
    responseType?: "json" | "blob";
  } = { ...options };
  const headers: Record<string, string> = {};

  // Convert any existing headers to a plain object
  if (options.headers) {
    const src = options.headers;
    if (src instanceof Headers) {
      src.forEach((val, key) => (headers[key] = val));
    } else if (Array.isArray(src)) {
      src.forEach(([k, v]) => (headers[k] = v));
    } else {
      Object.assign(headers, src);
    }
  }

  const token = getToken();
  if (token) headers["Authorization"] = `Bearer ${token}`;

  const method = (opts.method || "GET").toUpperCase();
  const isForm = opts.body instanceof FormData;

  if (!isForm && method !== "GET" && !headers["Content-Type"]) {
    headers["Content-Type"] = "application/json";
    if (opts.body && typeof opts.body !== "string") {
      opts.body = JSON.stringify(opts.body);
    }
  }

  opts.headers = headers;
  opts.credentials = "include";

  let res: Response;
  try {
    res = await fetch(url, opts);
  } catch (err) {
    console.error("Network error:", err);
    throw { status: 0, data: { message: "Network error – check your connection" } };
  }

  /* ---------- 401 HANDLING (NO AUTOMATIC REDIRECT) ---------- */
  if (res.status === 401) {
    const isAuthEndpoint =
      url.includes("/auth/login") || url.includes("/auth/refresh");

    // Do not retry auth endpoints or already retried requests
    if (opts.__retry || isAuthEndpoint) {
      throw { status: 401, data: { message: "Session expired. Please log in again." } };
    }

    // Attempt to refresh token once
    const newToken = await refreshAccessToken();
    if (!newToken) {
      clearAuth();
      throw { status: 401, data: { message: "Session expired. Please log in again." } };
    }

    // Retry original request with new token
    opts.__retry = true;
    opts.headers = {
      ...(opts.headers || {}),
      Authorization: `Bearer ${newToken}`,
    };
    // Recursive call – pass the same options (already correctly typed)
    return apiFetch<T>(path, opts);
  }

  /* ---------- NORMAL FLOW ---------- */
  if (opts.responseType === "blob") {
    if (!res.ok) {
      const text = await res.text();
      let data: any;
      try { data = text ? JSON.parse(text) : null; } catch { data = text; }
      throw { status: res.status, data: { message: data?.message || data?.error || "API error" } };
    }
    return (await res.blob()) as T;
  }

  const text = await res.text();
  let data: any;
  try { data = text ? JSON.parse(text) : null; } catch { data = text; }

  if (!res.ok) {
    throw {
      status: res.status,
      data: { message: data?.message || data?.error || "API error" },
    };
  }

  return data as T;
}

/* =====================================================
   HTTP HELPERS (with query support)
===================================================== */
export const api = {
  get: <T = any>(path: string, params?: Record<string, any>) =>
    apiFetch<T>(path, { method: "GET", query: params }),
  post: <T = any>(path: string, body?: any) =>
    apiFetch<T>(path, { method: "POST", body }),
  put: <T = any>(path: string, body?: any) =>
    apiFetch<T>(path, { method: "PUT", body }),
  patch: <T = any>(path: string, body?: any) =>
    apiFetch<T>(path, { method: "PATCH", body }),
  delete: <T = any>(path: string) =>
    apiFetch<T>(path, { method: "DELETE" }),

  /** File download helper */
  download: async (path: string, filename?: string) => {
    const blob = await apiFetch<Blob>(path, {
      method: "GET",
      responseType: "blob" as const, // ✅ ensure literal type
    });
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.download = filename || "download";
    document.body.appendChild(link);
    link.click();
    link.remove();
    URL.revokeObjectURL(link.href);
  },
};

/* =====================================================
   RAW FETCH (for special cases, no auto‑refresh)
===================================================== */
export async function apiFetchRaw(
  path: string,
  options: RequestInit = {}
): Promise<Response> {
  const url = path.startsWith("http")
    ? path
    : `${API_BASE_URL}${path.startsWith("/") ? path : `/${path}`}`;

  const headers: Record<string, string> = {};
  if (options.headers) {
    const src = options.headers;
    if (src instanceof Headers) {
      src.forEach((val, key) => (headers[key] = val));
    } else if (Array.isArray(src)) {
      src.forEach(([k, v]) => (headers[k] = v));
    } else {
      Object.assign(headers, src);
    }
  }

  const token = getToken();
  if (token) headers["Authorization"] = `Bearer ${token}`;

  return fetch(url, { ...options, headers, credentials: "include" });
}

export default apiFetch;