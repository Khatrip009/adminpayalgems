import { apiFetch, apiFetchRaw, API_ROUTES } from "@/lib/apiClient";

/* =========================================================
   BASE + HELPERS
========================================================= */

const BASE = `${API_ROUTES.procurement}/purchase-orders`;

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
   LIST / DETAIL
========================================================= */

export async function listPurchaseOrders(params?: Record<string, any>) {
  return apiFetch(
    `${BASE}${buildQuery(params)}`
  );
}

export async function getPurchaseOrder(id: string) {
  if (!id) throw new Error("purchase_order_id_required");

  return apiFetch(
    `${BASE}/${encodeURIComponent(id)}`
  );
}

/* =========================================================
   CREATE / UPDATE / DELETE
========================================================= */

export async function createPurchaseOrder(payload: any) {
  return apiFetch(
    BASE,
    { method: "POST", body: payload }
  );
}

export async function updatePurchaseOrder(
  id: string,
  payload: any
) {
  if (!id) throw new Error("purchase_order_id_required");

  return apiFetch(
    `${BASE}/${encodeURIComponent(id)}`,
    { method: "PUT", body: payload }
  );
}

export async function deletePurchaseOrder(id: string) {
  if (!id) throw new Error("purchase_order_id_required");

  return apiFetch(
    `${BASE}/${encodeURIComponent(id)}`,
    { method: "DELETE" }
  );
}

/* =========================================================
   RECEIVE
========================================================= */

export async function receivePurchaseOrder(
  id: string,
  payload: any
) {
  if (!id) throw new Error("purchase_order_id_required");

  return apiFetch(
    `${BASE}/${encodeURIComponent(id)}/receive`,
    { method: "POST", body: payload }
  );
}

/* =========================================================
   EXPORTS
========================================================= */

export async function exportPurchaseOrdersCsv(
  params?: Record<string, any>
) {
  return apiFetchRaw(
    `${BASE}/export/csv${buildQuery(params)}`
  );
}

/* =========================================================
   PDF
========================================================= */

export function getPoPdfUrl(id: string) {
  if (!id) throw new Error("purchase_order_id_required");

  // defensive: ensure only UUID is accepted
  if (id.includes("/")) {
    throw new Error("invalid_purchase_order_id");
  }

  return `${BASE}/${id}/pdf`;
}


export async function downloadPdfBlob(
  path: string,
  filename: string
) {
  const res = await apiFetchRaw(path, {
    method: "GET",
  });

  const blob = await res.blob();
  const url = window.URL.createObjectURL(blob);

  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();

  window.URL.revokeObjectURL(url);
}


/* =========================================================
   IMPORT
========================================================= */

export async function importPurchaseOrdersCsv(file: File) {
  if (!file) throw new Error("csv_file_required");

  const form = new FormData();
  form.append("file", file);

  return apiFetch(
    `${BASE}/import`,
    { method: "POST", body: form }
  );
}
