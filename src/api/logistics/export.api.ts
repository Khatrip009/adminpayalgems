import { apiFetchRaw, API_ROUTES } from "@/lib/apiClient";

/* =========================================================
   ORDERS EXPORTS
========================================================= */

export async function exportOrdersCSV() {
  const res = await apiFetchRaw(
    `${API_ROUTES.sales}/orders/export/csv`,
    { method: "GET" }
  );
  return res.blob();
}

export async function exportOrdersPDF() {
  const res = await apiFetchRaw(
    `${API_ROUTES.sales}/orders/export/pdf`,
    { method: "GET" }
  );
  return res.blob();
}

export async function exportOrdersZIP() {
  const res = await apiFetchRaw(
    `${API_ROUTES.sales}/orders/export/bulk-zip`,
    { method: "GET" }
  );
  return res.blob();
}

/* =========================================================
   SHIPPING / LOGISTICS
========================================================= */

export async function exportShippingLabelsPDF() {
  const res = await apiFetchRaw(
    `${API_ROUTES.sales}/orders/export/shipping-labels`,
    { method: "GET" }
  );
  return res.blob();
}

/* =========================================================
   CRM / LEADS
========================================================= */

export async function exportLeadsCSV() {
  const res = await apiFetchRaw(
    `${API_ROUTES.crm}/leads/export/csv`,
    { method: "GET" }
  );
  return res.blob();
}

export async function exportLeadsPDF() {
  const res = await apiFetchRaw(
    `${API_ROUTES.crm}/leads/export/pdf`,
    { method: "GET" }
  );
  return res.blob();
}
