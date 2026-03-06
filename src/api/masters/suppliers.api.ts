import {  apiFetchRaw, API_ROUTES } from "@/lib/apiClient";
import { apiFetch } from "@/lib/apiClient";

/* =========================================================
   BASE + HELPERS
========================================================= */

const BASE = `${API_ROUTES.masters}/suppliers`;

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
   SUPPLIERS
========================================================= */

export async function listSuppliers(
  params?: Record<string, any>
) {
  return apiFetch(
    `${BASE}${buildQuery(params)}`
  );
}

export async function getSupplier(id: string) {
  if (!id) throw new Error("supplier_id_required");

  return apiFetch(
    `${BASE}/${encodeURIComponent(id)}`
  );
}

export async function createSupplier(payload: any) {
  return apiFetch(
    BASE,
    { method: "POST", body: payload }
  );
}

export async function updateSupplier(
  id: string,
  payload: any
) {
  if (!id) throw new Error("supplier_id_required");

  return apiFetch(
    `${BASE}/${encodeURIComponent(id)}`,
    { method: "PUT", body: payload }
  );
}

export async function deleteSupplier(id: string) {
  if (!id) throw new Error("supplier_id_required");

  return apiFetch(
    `${BASE}/${encodeURIComponent(id)}`,
    { method: "DELETE" }
  );
}

/* =========================================================
   EXPORT / IMPORT
========================================================= */

export async function exportSuppliersCSV(
  params?: Record<string, any>
) {
  const res = await apiFetchRaw(
    `${BASE}/export${buildQuery(params)}`
  );
  return res.blob();
}

export async function importSuppliersCSV(file: File) {
  if (!file) throw new Error("csv_file_required");

  const fd = new FormData();
  fd.append("file", file);

  return apiFetch(
    `${BASE}/import`,
    { method: "POST", body: fd }
  );
}
