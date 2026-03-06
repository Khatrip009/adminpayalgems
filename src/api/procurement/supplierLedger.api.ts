import { apiFetch, API_ROUTES } from "@/lib/apiClient";

/* =========================================================
   SUPPLIER LEDGER
========================================================= */

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

export async function getSupplierLedger(
  supplierId: string,
  params?: { from?: string; to?: string }
) {
  if (!supplierId) throw new Error("supplier_id_required");

  return apiFetch(
    `${API_ROUTES.procurement}/supplier-ledger${buildQuery({
      supplier_id: supplierId,
      ...params,
    })}`
  );
}
