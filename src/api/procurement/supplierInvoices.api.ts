import { apiFetch, API_ROUTES } from "@/lib/apiClient";

/* =========================================================
   BASE + HELPERS
========================================================= */

const BASE = `${API_ROUTES.procurement}/supplier-invoices`;

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

export async function listSupplierInvoices(
  params?: Record<string, any>
) {
  return apiFetch(
    `${BASE}${buildQuery(params)}`
  );
}

export async function getSupplierInvoice(id: string) {
  if (!id) throw new Error("supplier_invoice_id_required");

  return apiFetch(
    `${BASE}/${encodeURIComponent(id)}`
  );
}

/* =========================================================
   CREATE / UPDATE / DELETE
========================================================= */

export async function createSupplierInvoice(payload: any) {
  return apiFetch(
    BASE,
    { method: "POST", body: payload }
  );
}

export async function updateSupplierInvoice(
  id: string,
  payload: any
) {
  if (!id) throw new Error("supplier_invoice_id_required");

  return apiFetch(
    `${BASE}/${encodeURIComponent(id)}`,
    { method: "PATCH", body: payload }
  );
}

export async function deleteSupplierInvoice(id: string) {
  if (!id) throw new Error("supplier_invoice_id_required");

  return apiFetch(
    `${BASE}/${encodeURIComponent(id)}`,
    { method: "DELETE" }
  );
}
