// src/api/sales/sales.api.ts
// PRODUCTION-GRADE SALES API
// Supports CRUD, Profit %, CSV Import, CSV/Excel Export,
// Register PDF & Invoice PDF

import { apiFetch, API_ROUTES } from "@/lib/apiClient";

/* =========================================================
   BASE
========================================================= */

const BASE = `${API_ROUTES.sales}/items`;

/* =========================================================
   QUERY BUILDER
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

/* =========================================================
   TYPES
========================================================= */

export interface DiamondInput {
  pcs: number;
  carat: number;
  rate: number;
  type?: string;
  packet_no?: string | null;   // 🔁 changed from quality
}

export interface SalesItemPayload {
  number: string;
  item: string;

  diamonds?: DiamondInput[];

  gold?: number;
  gold_price?: number;
  labour_charge?: number;

  profit_percent?: number;      // backend calculates profit_amount

  product_id?: string | null;

  customer_id?: string | null;
  customer_name?: string | null;

  craftsman_id?: string | null;
  craftman?: string | null;

  product_image?: File | null;
}

export interface SalesItemUpdatePayload
  extends Partial<SalesItemPayload> {}

/* =========================================================
   CREATE
========================================================= */

export const createSalesItem = (
  payload: SalesItemPayload | FormData
) => {
  const isFormData = payload instanceof FormData;

  return apiFetch(BASE, {
    method: "POST",
    body: payload,
    headers: isFormData ? {} : undefined,
  });
};

/* =========================================================
   LIST / SEARCH / PAGINATION
========================================================= */

export const listSalesItems = (params?: {
  search?: string;
  page?: number;
  limit?: number;
}) =>
  apiFetch(`${BASE}${buildQuery(params)}`);

/* =========================================================
   GET BY ID
========================================================= */

export const getSalesItem = (id: string) => {
  if (!id) throw new Error("sales_item_id_required");
  return apiFetch(`${BASE}/${encodeURIComponent(id)}`);
};

/* =========================================================
   UPDATE
========================================================= */

export const updateSalesItem = (
  id: string,
  payload: SalesItemUpdatePayload | FormData
) => {
  if (!id) throw new Error("sales_item_id_required");

  const isFormData = payload instanceof FormData;

  return apiFetch(`${BASE}/${encodeURIComponent(id)}`, {
    method: "PUT",
    body: payload,
    headers: isFormData ? {} : undefined,
  });
};

/* =========================================================
   DELETE
========================================================= */

export const deleteSalesItem = (id: string) => {
  if (!id) throw new Error("sales_item_id_required");

  return apiFetch(`${BASE}/${encodeURIComponent(id)}`, {
    method: "DELETE",
  });
};

/* =========================================================
   EXPORT – CSV
========================================================= */

export const exportSalesItemsCSV = () =>
  apiFetch(`${BASE}/export/csv`, {
    method: "GET",
    responseType: "blob",
  });

/* =========================================================
   EXPORT – EXCEL
========================================================= */

export const exportSalesItemsExcel = () =>
  apiFetch(`${BASE}/export/excel`, {
    method: "GET",
    responseType: "blob",
  });

/* =========================================================
   EXPORT – REGISTER PDF (INTERNAL / STATEMENT STYLE)
========================================================= */

export const exportSalesRegisterPDF = () =>
  apiFetch(`${BASE}/export/register-pdf`, {
    method: "GET",
    responseType: "blob",
  });

/* =========================================================
   EXPORT – INVOICE PDF (PRINTABLE BILL)
========================================================= */

export const exportSalesInvoicePDF = (saleId: string) => {
  if (!saleId) throw new Error("sales_item_id_required");

  return apiFetch(
    `${BASE}/${encodeURIComponent(saleId)}/export/invoice-pdf`,
    {
      method: "GET",
      responseType: "blob",
    }
  );
};

/* =========================================================
   IMPORT – CSV
========================================================= */

export const importSalesItemsCSV = (file: File) => {
  if (!file) throw new Error("csv_file_required");

  const formData = new FormData();
  formData.append("file", file);

  return apiFetch(`${BASE}/import/csv`, {
    method: "POST",
    body: formData,
    headers: {}, // browser sets multipart boundary
  });
};