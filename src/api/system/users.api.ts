import { apiFetch, API_ROUTES } from "@/lib/apiClient";

/* =========================================================
   BASE + HELPERS
========================================================= */

const BASE = `${API_ROUTES.system}/users`;

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

/* =========================================================
   USERS
========================================================= */

export async function listUsers(
  params?: Record<string, any>
) {
  return apiFetch(
    `${BASE}${buildQuery(params)}`
  );
}

export async function getUser(id: string) {
  if (!id) throw new Error("user_id_required");

  return apiFetch(
    `${BASE}/${encodeURIComponent(id)}`
  );
}

export async function createUser(payload: any) {
  return apiFetch(
    BASE,
    { method: "POST", body: payload }
  );
}

export async function updateUser(
  id: string,
  payload: any
) {
  if (!id) throw new Error("user_id_required");

  return apiFetch(
    `${BASE}/${encodeURIComponent(id)}`,
    { method: "PUT", body: payload }
  );
}

export async function deleteUser(id: string) {
  if (!id) throw new Error("user_id_required");

  return apiFetch(
    `${BASE}/${encodeURIComponent(id)}`,
    { method: "DELETE" }
  );
}
