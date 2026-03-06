import { apiFetch, API_ROUTES } from "@/lib/apiClient";

/* =========================================================
   BASE + HELPERS
========================================================= */

const BASE = `${API_ROUTES.procurement}/supplier-payments`;

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

export function listSupplierPayments(
  params?: Record<string, any>
) {
  return apiFetch(
    `${BASE}${buildQuery(params)}`
  );
}

export function getSupplierPayment(id: string) {
  if (!id) throw new Error("supplier_payment_id_required");

  return apiFetch(
    `${BASE}/${encodeURIComponent(id)}`
  );
}

/* =========================================================
   CREATE / UPDATE / DELETE
========================================================= */

export function createSupplierPayment(data: any) {
  return apiFetch(
    BASE,
    { method: "POST", body: data }
  );
}

export function updateSupplierPayment(
  id: string,
  data: any
) {
  if (!id) throw new Error("supplier_payment_id_required");

  return apiFetch(
    `${BASE}/${encodeURIComponent(id)}`,
    { method: "PUT", body: data }
  );
}

export function deleteSupplierPayment(id: string) {
  if (!id) throw new Error("supplier_payment_id_required");

  return apiFetch(
    `${BASE}/${encodeURIComponent(id)}`,
    { method: "DELETE" }
  );
}
