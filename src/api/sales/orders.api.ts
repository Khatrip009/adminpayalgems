// src/api/sales/orders.api.ts
import { apiFetch, API_ROUTES } from "@/lib/apiClient";

/* =========================================================
   TYPES
========================================================= */

export interface OrderOverview {
  id: string;
  order_number: string;
  status: string;
  payment_status: string;
  fulfillment_status: string;
  currency: string;
  subtotal: number;
  discount_total: number;
  tax_total: number;
  shipping_total: number;
  grand_total: number;
  items_count: number;
  placed_at: string | null;

  customer_id?: string | null;
  customer_name?: string | null;
  customer_email?: string | null;

  metadata?: any;
  [key: string]: any;
}

export interface ListOrdersResponse {
  ok: boolean;
  orders: OrderOverview[];
  page: number;
  limit: number;
  total: number;
}

/* =========================================================
   STATUS OPTIONS
========================================================= */

export const ORDER_STATUS_OPTIONS = [
  "pending",
  "confirmed",
  "processing",
  "shipped",
  "completed",
  "cancelled",
] as const;

export const PAYMENT_STATUS_OPTIONS = [
  "pending",
  "paid",
  "failed",
  "refunded",
  "partial",
] as const;

export const FULFILLMENT_STATUS_OPTIONS = [
  "unfulfilled",
  "partial",
  "fulfilled",
] as const;

/* =========================================================
   BASE + HELPERS
========================================================= */

const BASE = `${API_ROUTES.sales}/orders`;

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
   API METHODS
========================================================= */

/** Admin: list orders */
export async function listOrders(params?: {
  page?: number;
  limit?: number;
}): Promise<ListOrdersResponse> {
  return apiFetch<ListOrdersResponse>(
    `${BASE}${buildQuery({
      page: params?.page ?? 1,
      limit: params?.limit ?? 20,
    })}`
  );
}

/** Customer: my orders */
export async function getMyOrders() {
  return apiFetch(`${BASE}/my`);
}

/** Get single order */
export async function getOrderById(id: string) {
  if (!id) throw new Error("order_id_required");

  return apiFetch(
    `${BASE}/${encodeURIComponent(id)}`
  );
}

/** Admin: update order status */
export async function updateOrderStatus(
  id: string,
  payload: { status: string; payment_status?: string }
) {
  if (!id) throw new Error("order_id_required");

  return apiFetch(
    `${BASE}/${encodeURIComponent(id)}/status`,
    {
      method: "PATCH",
      body: payload,
    }
  );
}
