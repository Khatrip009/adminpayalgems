import { api, apiFetchRaw, API_ROUTES } from "@/lib/apiClient";

const BASE = `${API_ROUTES.masters}/craftsmen`;

/* ---------------------------------------------
   Helper: safe query builder
--------------------------------------------- */
function buildQuery(params?: Record<string, any>) {
  if (!params) return "";
  const q = new URLSearchParams();

  Object.entries(params).forEach(([key, val]) => {
    if (val !== undefined && val !== null) {
      q.append(key, String(val));
    }
  });

  const s = q.toString();
  return s ? `?${s}` : "";
}

/* ---------------------------------------------
   LIST
--------------------------------------------- */
export async function listCraftsmen(params?: Record<string, any>) {
  return api.get(`${BASE}${buildQuery(params)}`);
}

/* ---------------------------------------------
   GET BY ID
--------------------------------------------- */
export async function getCraftsman(id: string) {
  if (!id) throw new Error("craftsman_id_required");
  return api.get(`${BASE}/${id}`);
}

/* ---------------------------------------------
   CREATE
--------------------------------------------- */
export async function createCraftsman(payload: any) {
  return api.post(BASE, payload);
}

/* ---------------------------------------------
   UPDATE
--------------------------------------------- */
export async function updateCraftsman(id: string, payload: any) {
  if (!id) throw new Error("craftsman_id_required");
  return api.patch(`${BASE}/${id}`, payload);
}

/* ---------------------------------------------
   DELETE
--------------------------------------------- */
export async function deleteCraftsman(id: string) {
  if (!id) throw new Error("craftsman_id_required");
  return api.delete(`${BASE}/${id}`);
}

/* ---------------------------------------------
   QUICK SEARCH
--------------------------------------------- */
export async function searchCraftsmenQuick(
  q: string,
  limit = 10
) {
  if (!q) return { ok: true, results: [] };
  return api.get(
    `${BASE}/search/quick${buildQuery({ q, limit })}`
  );
}

/* ---------------------------------------------
   EXPORT CSV
--------------------------------------------- */
export async function exportCraftsmenCSV(
  params?: Record<string, any>
) {
  const res = await apiFetchRaw(
    `${BASE}/export/csv${buildQuery(params)}`
  );
  return res.blob();
}

/* ---------------------------------------------
   IMPORT CSV (SAFE)
--------------------------------------------- */
export async function importCraftsmenCSV(file: File) {
  if (!file) throw new Error("file_required");

  const form = new FormData();
  form.append("file", file);

  const res = await apiFetchRaw(`${BASE}/import`, {
    method: "POST",
    body: form,
  });

  return res.json();
}
