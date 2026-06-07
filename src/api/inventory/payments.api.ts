// src/api/inventory/payments.api.ts
import { apiFetch, apiFetchRaw, API_ROUTES } from "@/lib/apiClient";

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
  // Joined fields (from API list endpoint)
  order_number?: string;
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
  // Joined fields
  order_number?: string;
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
  invoice_date?: string;      // from backend
  issued_at?: string;         // alias used in frontend
  // Joined fields
  order_number?: string;
}

export interface Settlement {
  id: string;
  provider: string;
  reference_id?: string;
  amount: number;
  currency?: string;
  settlement_date: string;
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

export async function listPayments(params?: { page?: number; limit?: number }) {
  return apiFetch(`${BASE}${buildQuery(params)}`);
}

export async function getPaymentById(id: string) {
  if (!id) throw new Error("payment_id_required");
  return apiFetch(`${BASE}/${encodeURIComponent(id)}`);
}

export async function getPaymentLogs(id: string) {
  if (!id) throw new Error("payment_id_required");
  return apiFetch(`${BASE}/${encodeURIComponent(id)}/logs`);
}

/* =========================================================
   REFUNDS
========================================================= */

export async function listRefunds() {
  return apiFetch(`${BASE}/refunds/list/all`);
}

export async function getRefundsByPayment(paymentId: string) {
  if (!paymentId) throw new Error("payment_id_required");
  return apiFetch(`${BASE}/${encodeURIComponent(paymentId)}/refunds`);
}

export async function createRefund(
  paymentId: string,
  payload: { amount: number; reason?: string }
) {
  if (!paymentId) throw new Error("payment_id_required");
  return apiFetch(`${BASE}/${encodeURIComponent(paymentId)}/refund`, {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

/* =========================================================
   INVOICES
========================================================= */

export async function listInvoices() {
  return apiFetch(`${BASE}/invoices/all`);
}

export async function getAllInvoices() {
  return listInvoices();
}

export async function getInvoiceById(invoiceId: string) {
  if (!invoiceId) throw new Error("invoice_id_required");
  return apiFetch(`${BASE}/invoice/${encodeURIComponent(invoiceId)}`);
}

export async function getInvoicesByOrder(orderId: string) {
  if (!orderId) throw new Error("order_id_required");
  return apiFetch(`${BASE}/order/${encodeURIComponent(orderId)}/invoices`);
}

export async function getInvoicesByPayment(paymentId: string) {
  if (!paymentId) throw new Error("payment_id_required");
  return apiFetch(`${BASE}/${encodeURIComponent(paymentId)}/invoices`);
}

/* =========================================================
   SETTLEMENTS
========================================================= */

export async function listSettlements() {
  return apiFetch(`${BASE}/settlements/all`);
}

/* =========================================================
   INCOME & OUTSTANDING REPORTS
========================================================= */

export interface IncomeReportData {
  period: string;
  payment_method: string;
  total_amount: number;
  transaction_count: number;
}

export async function getIncomeReport(params: {
  startDate?: string;
  endDate?: string;
  groupBy?: "day" | "week" | "month";
} = {}) {
  const qs = buildQuery({
    startDate: params.startDate,
    endDate: params.endDate,
    groupBy: params.groupBy,
  });
  return apiFetch<{ ok: boolean; data: IncomeReportData[] }>(
    `${BASE}/report/income${qs}`
  );
}

export interface OutstandingPayment {
  order_id: string;
  order_number: string;
  customer_name: string;
  grand_total: number;
  paid_amount: number;
  amount_due: number;
  placed_at: string;
  days_overdue: number;
}

export async function getOutstandingReport(params?: {
  status?: "all" | "overdue" | "late";
}) {
  const qs = buildQuery({ status: params?.status });
  return apiFetch<{ ok: boolean; data: OutstandingPayment[] }>(
    `${BASE}/report/outstanding${qs}`
  );
}

export async function getIncomeReportPdf(params: {
  startDate?: string;
  endDate?: string;
  groupBy?: "day" | "week" | "month";
} = {}): Promise<Blob> {
  const qs = buildQuery({
    startDate: params.startDate,
    endDate: params.endDate,
    groupBy: params.groupBy,
  });
  const response = await apiFetchRaw(`${BASE}/report/income/pdf${qs}`);
  return response.blob();
}

export async function getOutstandingReportPdf(params?: {
  status?: "all" | "overdue" | "late";
}): Promise<Blob> {
  const qs = buildQuery({ status: params?.status });
  const response = await apiFetchRaw(`${BASE}/report/outstanding/pdf${qs}`);
  return response.blob();
}