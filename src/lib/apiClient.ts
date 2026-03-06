// src/lib/apiClient.ts
// Hardened API client with domain awareness, single-refresh queue, retry-guard

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
  import.meta.env.VITE_API_BASE_URL?.replace(/\/+$/, "") ||
  "https://apiminalgems.exotech.co.in/api";

export const API_BASE_URL = API_BASE;

/* =====================================================
   DOMAIN ROUTES
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
  } catch {
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
  options: RequestInit & { __retry?: boolean; responseType?: 'json' | 'blob' } = {}
): Promise<T> {
  const url = path.startsWith("http")
    ? path
    : `${API_BASE_URL}${path.startsWith("/") ? path : `/${path}`}`;

  const opts: RequestInit & { __retry?: boolean; responseType?: 'json' | 'blob' } = { ...options };
  const headers: HeadersInit = { ...(opts.headers || {}) };

  const token = getToken();
  if (token) headers["Authorization"] = `Bearer ${token}`;

  const method = (opts.method || "GET").toUpperCase();
  const isForm = opts.body instanceof FormData;

  if (!isForm && method !== "GET") {
    headers["Content-Type"] = "application/json";
    if (opts.body && typeof opts.body !== "string") {
      opts.body = JSON.stringify(opts.body);
    }
  }

  opts.headers = headers;
  opts.credentials = "include";

  const res = await fetch(url, opts);

  /* ---------- 401 HANDLING ---------- */
  if (res.status === 401) {
    const isAuthEndpoint =
      url.includes("/auth/login") || url.includes("/auth/refresh");

    if (isAuthEndpoint || opts.__retry) {
      clearAuth();
      if (!window.location.pathname.startsWith("/login")) {
        window.location.replace("/login");
      }
      throw new Error("Session expired");
    }

    const newToken = await refreshAccessToken();
    if (!newToken) {
      clearAuth();
      window.location.replace("/login");
      throw new Error("Session expired");
    }

    opts.__retry = true;
    opts.headers = {
      ...(opts.headers || {}),
      Authorization: `Bearer ${newToken}`,
    };

    return apiFetch<T>(path, opts);
  }

  /* ---------- NORMAL FLOW ---------- */
  // Handle blob responses (for file downloads)
  if (opts.responseType === 'blob') {
    if (!res.ok) {
      const text = await res.text();
      let data: any;
      try {
        data = text ? JSON.parse(text) : null;
      } catch {
        data = text;
      }
      throw {
        status: res.status,
        error: data?.error || "api_error",
        message: data?.message || null,
      };
    }
    return (await res.blob()) as T;
  }

  const text = await res.text();
  let data: any;

  try {
    data = text ? JSON.parse(text) : null;
  } catch {
    data = text;
  }

  if (!res.ok) {
    throw {
      status: res.status,
      error: data?.error || "api_error",
      message: data?.message || null,
    };
  }

  return data as T;
}

/* =====================================================
   HTTP HELPERS
===================================================== */
export const api = {
  get: <T = any>(path: string) => apiFetch<T>(path, { method: "GET" }),
  post: <T = any>(path: string, body?: any) =>
    apiFetch<T>(path, { method: "POST", body }),
  put: <T = any>(path: string, body?: any) =>
    apiFetch<T>(path, { method: "PUT", body }),
  patch: <T = any>(path: string, body?: any) =>
    apiFetch<T>(path, { method: "PATCH", body }),
  delete: <T = any>(path: string) =>
    apiFetch<T>(path, { method: "DELETE" }),
};

/* =====================================================
   RAW FETCH
===================================================== */
export async function apiFetchRaw(
  path: string,
  options: RequestInit = {}
): Promise<Response> {
  const url = path.startsWith("http")
    ? path
    : `${API_BASE_URL}${path.startsWith("/") ? path : `/${path}`}`;

  const headers: HeadersInit = { ...(options.headers || {}) };
  const token = getToken();
  if (token) headers["Authorization"] = `Bearer ${token}`;

  return fetch(url, { ...options, headers, credentials: "include" });
}

export default apiFetch;
