import { apiFetch, API_ROUTES } from "@/lib/apiClient";

/* =========================================================
   TYPES
========================================================= */

export interface Payment {
  id: string;
  order_id: string | null;
  provider: string;
  provider_payment_id: string | null;
  amount: number;
  currency: string;
  status: string;
  paid_at: string | null;
  raw_response: any;
  created_at: string;
}

export interface Refund {
  id: string;
  order_payment_id: string;
  amount: number;
  currency: string;
  status: string;
  reason?: string | null;
  created_at: string;
  processed_at?: string | null;
}

export interface Invoice {
  id: string;
  invoice_number: string;
  order_id: string;
  subtotal: number;
  tax_total: number;
  discount_total: number;
  shipping_total: number;
  grand_total: number;
  currency: string;
  status: string;
  created_at: string;
}

/* =========================================================
   BASE + HELPERS
========================================================= */

const BASE = `${API_ROUTES.finance}/payments`;

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

/* =========================================================
   PAYMENTS
========================================================= */

export async function listPayments(params?: {
  page?: number;
  limit?: number;
}) {
  return apiFetch(
    `${BASE}${buildQuery(params)}`
  );
}

export async function getPaymentById(id: string) {
  if (!id) throw new Error("payment_id_required");

  return apiFetch(
    `${BASE}/${encodeURIComponent(id)}`
  );
}

export async function getPaymentLogs(id: string) {
  if (!id) throw new Error("payment_id_required");

  return apiFetch(
    `${BASE}/${encodeURIComponent(id)}/logs`
  );
}

/* =========================================================
   REFUNDS
========================================================= */

/** Admin list */
export async function listRefunds() {
  return apiFetch(
    `${BASE}/refunds/list/all`
  );
}

/** Refunds for a specific payment */
export async function getRefundsByPayment(paymentId: string) {
  if (!paymentId) throw new Error("payment_id_required");

  return apiFetch(
    `${BASE}/${encodeURIComponent(paymentId)}/refunds`
  );
}

/** Create refund */
export async function createRefund(
  paymentId: string,
  payload: { amount: number; reason?: string }
) {
  if (!paymentId) throw new Error("payment_id_required");

  return apiFetch(
    `${BASE}/${encodeURIComponent(paymentId)}/refund`,
    { method: "POST", body: payload }
  );
}

/* =========================================================
   INVOICES
========================================================= */

/** All invoices */
export async function listInvoices() {
  return apiFetch(
    `${BASE}/invoices/all`
  );
}

/** Alias used by AdminInvoicesPage */
export async function getAllInvoices() {
  return listInvoices();
}

/** Single invoice detail */
export async function getInvoiceById(invoiceId: string) {
  if (!invoiceId) throw new Error("invoice_id_required");

  return apiFetch(
    `${BASE}/invoices/${encodeURIComponent(invoiceId)}`
  );
}

/** Invoices by order */
export async function getInvoicesByOrder(orderId: string) {
  if (!orderId) throw new Error("order_id_required");

  return apiFetch(
    `${BASE}/order/${encodeURIComponent(orderId)}/invoices`
  );
}

/* =========================================================
   SETTLEMENTS
========================================================= */

export async function listSettlements() {
  return apiFetch(
    `${BASE}/settlements/all`
  );
}
