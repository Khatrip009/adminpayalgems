import { apiFetch, API_ROUTES } from "@/lib/apiClient";

const BASE = `${API_ROUTES.crm}/notifications`;

/* ---------------------------------------------
   Helper: safe query builder
--------------------------------------------- */
function buildQuery(params?: Record<string, any>) {
  if (!params) return "";
  const q = new URLSearchParams();

  Object.entries(params).forEach(([key, val]) => {
    if (val !== undefined && val !== null && val !== "") {
      q.append(key, String(val));
    }
  });

  const s = q.toString();
  return s ? `?${s}` : "";
}

/* ===============================
   USER: FETCH
================================ */

export function fetchUnreadNotifications(limit = 8) {
  return apiFetch(
    `${BASE}/unread${buildQuery({ limit })}`
  );
}

/* =========================================================
   UNREAD (used as "latest")
========================================================= */
export async function fetchLatestNotifications(limit = 8) {
  const r = await apiFetch(
    `/crm/notifications/unread?limit=${limit}`
  );
  return r.items || [];
}

export function fetchNotificationsPage(
  page = 1,
  limit = 20
) {
  return apiFetch(
    `${BASE}${buildQuery({ page, limit })}`
  );
}

/* ===============================
   USER: UPDATE
================================ */

export function markNotificationRead(id: string) {
  if (!id) throw new Error("notification_id_required");

  return apiFetch(
    `${BASE}/${encodeURIComponent(id)}/read`,
    { method: "POST" }
  );
}

export function markAllAsRead() {
  return apiFetch(
    `${BASE}/read-all`,
    { method: "POST" }
  );
}

/* ===============================
   ADMIN: CREATE
================================ */

export async function createNotification(payload: {
  title: string;
  body?: string;
  user_id?: string | null;
  role_id?: number | null;
  metadata?: Record<string, any>;
}) {
  return apiFetch(
    BASE,
    {
      method: "POST",
      body: payload,
    }
  );
}

/* ===============================
   ADMIN: LIST (PAGINATED)
================================ */

export async function listNotifications(params?: {
  page?: number;
  limit?: number;
  q?: string;
}) {
  return apiFetch<{
    ok: boolean;
    items: NotificationListItem[];
    total: number;
    page: number;
    pages: number;
  }>(
    `${BASE}${buildQuery(params)}`
  );
}
