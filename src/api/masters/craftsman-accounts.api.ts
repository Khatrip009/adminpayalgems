// src/api/masters/craftsman-accounts.api.ts
import { api, apiFetchRaw, API_ROUTES } from "@/lib/apiClient";

const BASE = `${API_ROUTES.masters}/craftsman-accounts`;

/* -------------------------------------------------------
   Helper: build query string
------------------------------------------------------- */
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

/* -------------------------------------------------------
   TYPES
------------------------------------------------------- */
export interface GoldIssue {
  id: string;
  craftsman_id: string;
  issue_date: string;          // YYYY-MM-DD
  quantity_24kt: number;
  remark: string | null;
  reference_no: string | null;
  created_at: string;
  updated_at: string;
}

export interface GoldConsumption {
  id: string;
  craftsman_id: string;
  consumption_date: string;    // YYYY-MM-DD
  gold_weight: number;         // weight of returned ornament in original carat
  labour_amount: number;
  carat: number;               // e.g., 18, 22
  conversion_percentage: number; // direct percentage to compute 24Kt fine gold (e.g., 76 means 76% of gold_weight is pure)
  final_gold_24kt: number;     // computed pure‑gold equivalent
  remark: string | null;
  reference_no: string | null;
  item_no?: string | null;
  created_at: string;
  updated_at: string;
}

export interface CashPayment {
  id: string;
  craftsman_id: string;
  payment_date: string;        // YYYY-MM-DD
  amount: number;
  remark: string | null;
  reference_no: string | null;
  created_at: string;
  updated_at: string;
}

export interface StatementTotals {
  totalGoldWeight: number;     // sum of gold_weight (raw weight)
  totalLabour: number;
  totalCash: number;
  total24ktIssued: number;
  totalEquivalent24kt: number; // sum of final_gold_24kt
}

export interface StatementData {
  craftsmanId: string;
  craftsmanName: string;
  startDate: string | null;
  endDate: string | null;
  leftEntries: any[];          // gold consumptions with computed fields
  rightEntries: any[];         // gold issues + cash payments
  totals: StatementTotals;
  netGold: number;
  netCash: number;
  summaryLines: string[];
}

/* -------------------------------------------------------
   STATEMENT (JSON)
------------------------------------------------------- */
export async function getCraftsmanStatement(
  craftsmanId: string,
  startDate?: string,
  endDate?: string
): Promise<{ ok: boolean; statement: StatementData }> {
  if (!craftsmanId) throw new Error("craftsmanId required");
  const params: Record<string, string> = {};
  if (startDate) params.startDate = startDate;
  if (endDate) params.endDate = endDate;
  return api.get(`${BASE}/${craftsmanId}/statement${buildQuery(params)}`);
}

/* -------------------------------------------------------
   STATEMENT (PDF) – returns Blob
------------------------------------------------------- */
export async function getCraftsmanStatementPdf(
  craftsmanId: string,
  startDate?: string,
  endDate?: string
): Promise<Blob> {
  if (!craftsmanId) throw new Error("craftsmanId required");
  const params: Record<string, string> = {};
  if (startDate) params.startDate = startDate;
  if (endDate) params.endDate = endDate;
  const response = await apiFetchRaw(`${BASE}/${craftsmanId}/statement/pdf${buildQuery(params)}`);
  return response.blob();
}

/* -------------------------------------------------------
   MONTHLY REPORT (JSON)
------------------------------------------------------- */
export async function getMonthlyReport(
  month: string
): Promise<{ ok: boolean; month: string; reports: any[] }> {
  if (!month) throw new Error("month required (YYYY-MM)");
  return api.get(`${BASE}/report/monthly${buildQuery({ month, format: "json" })}`);
}

/* -------------------------------------------------------
   MONTHLY REPORT (PDF)
------------------------------------------------------- */
export async function getMonthlyReportPdf(month: string): Promise<Blob> {
  if (!month) throw new Error("month required (YYYY-MM)");
  const response = await apiFetchRaw(`${BASE}/report/monthly${buildQuery({ month, format: "pdf" })}`);
  return response.blob();
}

/* -------------------------------------------------------
   GOLD ISSUES (24Kt)
------------------------------------------------------- */
export async function listGoldIssues(
  craftsmanId: string,
  limit = 50,
  offset = 0
): Promise<{ ok: boolean; gold_issues: GoldIssue[]; total: number }> {
  if (!craftsmanId) throw new Error("craftsmanId required");
  return api.get(`${BASE}/${craftsmanId}/gold-issues${buildQuery({ limit, offset })}`);
}

export async function createGoldIssue(
  craftsmanId: string,
  payload: Omit<GoldIssue, "id" | "craftsman_id" | "created_at" | "updated_at">
): Promise<{ ok: boolean; gold_issue: GoldIssue }> {
  if (!craftsmanId) throw new Error("craftsmanId required");
  return api.post(`${BASE}/${craftsmanId}/gold-issues`, payload);
}

export async function updateGoldIssue(
  issueId: string,
  payload: Partial<Omit<GoldIssue, "id" | "craftsman_id" | "created_at" | "updated_at">>
): Promise<{ ok: boolean; gold_issue: GoldIssue }> {
  if (!issueId) throw new Error("issueId required");
  return api.put(`${BASE}/gold-issues/${issueId}`, payload);
}

export async function deleteGoldIssue(issueId: string): Promise<{ ok: boolean; deleted_id: string }> {
  if (!issueId) throw new Error("issueId required");
  return api.delete(`${BASE}/gold-issues/${issueId}`);
}

/* -------------------------------------------------------
   GOLD CONSUMPTIONS (updated with new fields)
------------------------------------------------------- */
export async function listGoldConsumptions(
  craftsmanId: string,
  limit = 50,
  offset = 0
): Promise<{ ok: boolean; gold_consumptions: GoldConsumption[]; total: number }> {
  if (!craftsmanId) throw new Error("craftsmanId required");
  return api.get(`${BASE}/${craftsmanId}/gold-consumptions${buildQuery({ limit, offset })}`);
}

export interface CreateGoldConsumptionPayload {
  consumption_date: string;
  gold_weight: number;
  labour_amount?: number;
  remark?: string | null;
  reference_no?: string | null;
  item_no?: string | null;
  carat?: number;
  conversion_percentage?: number;
  final_gold_24kt?: number;          // optional override
}

export interface UpdateGoldConsumptionPayload extends Partial<CreateGoldConsumptionPayload> {}

export async function createGoldConsumption(
  craftsmanId: string,
  payload: CreateGoldConsumptionPayload
): Promise<{ ok: boolean; gold_consumption: GoldConsumption }> {
  if (!craftsmanId) throw new Error("craftsmanId required");
  return api.post(`${BASE}/${craftsmanId}/gold-consumptions`, payload);
}

export async function updateGoldConsumption(
  consumptionId: string,
  payload: UpdateGoldConsumptionPayload
): Promise<{ ok: boolean; gold_consumption: GoldConsumption }> {
  if (!consumptionId) throw new Error("consumptionId required");
  return api.put(`${BASE}/gold-consumptions/${consumptionId}`, payload);
}

export async function deleteGoldConsumption(consumptionId: string): Promise<{ ok: boolean; deleted_id: string }> {
  if (!consumptionId) throw new Error("consumptionId required");
  return api.delete(`${BASE}/gold-consumptions/${consumptionId}`);
}

/* -------------------------------------------------------
   CASH PAYMENTS
------------------------------------------------------- */
export async function listCashPayments(
  craftsmanId: string,
  limit = 50,
  offset = 0
): Promise<{ ok: boolean; cash_payments: CashPayment[]; total: number }> {
  if (!craftsmanId) throw new Error("craftsmanId required");
  return api.get(`${BASE}/${craftsmanId}/cash-payments${buildQuery({ limit, offset })}`);
}

export async function createCashPayment(
  craftsmanId: string,
  payload: Omit<CashPayment, "id" | "craftsman_id" | "created_at" | "updated_at">
): Promise<{ ok: boolean; cash_payment: CashPayment }> {
  if (!craftsmanId) throw new Error("craftsmanId required");
  return api.post(`${BASE}/${craftsmanId}/cash-payments`, payload);
}

export async function updateCashPayment(
  paymentId: string,
  payload: Partial<Omit<CashPayment, "id" | "craftsman_id" | "created_at" | "updated_at">>
): Promise<{ ok: boolean; cash_payment: CashPayment }> {
  if (!paymentId) throw new Error("paymentId required");
  return api.put(`${BASE}/cash-payments/${paymentId}`, payload);
}

export async function deleteCashPayment(paymentId: string): Promise<{ ok: boolean; deleted_id: string }> {
  if (!paymentId) throw new Error("paymentId required");
  return api.delete(`${BASE}/cash-payments/${paymentId}`);
}