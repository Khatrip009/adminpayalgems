import { apiFetch, API_ROUTES } from "@/lib/apiClient";

/* =========================================================
   TYPES
========================================================= */

export type ShipmentStatus =
  | "pending"
  | "shipped"
  | "delivered"
  | "cancelled";

export const SHIPMENT_STATUS_OPTIONS: ShipmentStatus[] = [
  "pending",
  "shipped",
  "delivered",
  "cancelled",
];

/* =========================================================
   BASE PATHS (AUTO-LOADER COMPLIANT)
========================================================= */

const SHIPMENTS = `${API_ROUTES.logistics}/shipments`;
const SHIPPING = `${API_ROUTES.logistics}/shipping`;

/* ---------------------------------------------
   Helper: safe query builder
--------------------------------------------- */
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
   SHIPMENTS
========================================================= */

export async function listShipments(orderId: string) {
  if (!orderId) throw new Error("order_id_required");

  return apiFetch(
    `${SHIPMENTS}${buildQuery({ order_id: orderId })}`
  );
}

export async function createShipment(payload: {
  order_id: string;
  shipping_method_id?: string | null;
  tracking_number?: string;
  carrier?: string;
  status?: ShipmentStatus;
}) {
  if (!payload?.order_id) {
    throw new Error("order_id_required");
  }

  return apiFetch(
    SHIPMENTS,
    { method: "POST", body: payload }
  );
}

export async function updateShipment(
  id: string,
  payload: Partial<{
    shipping_method_id: string | null;
    tracking_number: string | null;
    carrier: string | null;
    status: ShipmentStatus;
  }>
) {
  if (!id) throw new Error("shipment_id_required");

  return apiFetch(
    `${SHIPMENTS}/${encodeURIComponent(id)}`,
    { method: "PUT", body: payload }
  );
}

export async function deleteShipment(id: string) {
  if (!id) throw new Error("shipment_id_required");

  return apiFetch(
    `${SHIPMENTS}/${encodeURIComponent(id)}`,
    { method: "DELETE" }
  );
}

/* =========================================================
   SHIPPING METHODS
========================================================= */

export async function listShippingMethods(params?: {
  page?: number;
  limit?: number;
  q?: string;
  only_active?: boolean;
}) {
  return apiFetch(
    `${SHIPPING}/methods${buildQuery(params)}`
  );
}

export async function createShippingMethod(payload: {
  code: string;
  name: string;
  description?: string | null;
  base_rate: number;
  is_active?: boolean;
  rate_config?: any;
}) {
  return apiFetch(
    `${SHIPPING}/methods`,
    { method: "POST", body: payload }
  );
}

export async function updateShippingMethod(
  id: string,
  payload: Partial<{
    code: string;
    name: string;
    description?: string | null;
    base_rate: number;
    is_active: boolean;
    rate_config: any;
  }>
) {
  if (!id) throw new Error("shipping_method_id_required");

  return apiFetch(
    `${SHIPPING}/methods/${encodeURIComponent(id)}`,
    { method: "PATCH", body: payload }
  );
}

export async function deleteShippingMethod(id: string) {
  if (!id) throw new Error("shipping_method_id_required");

  return apiFetch(
    `${SHIPPING}/methods/${encodeURIComponent(id)}`,
    { method: "DELETE" }
  );
}

/* =========================================================
   SHIPPING RULES
========================================================= */

export async function listShippingRules() {
  return apiFetch(
    `${SHIPPING}/rules`
  );
}

export async function createShippingRule(payload: {
  name: string;
  type: "flat" | "weight" | "order_value";
  amount: number;
  min_order_value?: number | null;
  max_order_value?: number | null;
  min_weight?: number | null;
  max_weight?: number | null;
  active?: boolean;
}) {
  return apiFetch(
    `${SHIPPING}/rules`,
    { method: "POST", body: payload }
  );
}

export async function updateShippingRule(
  id: string,
  payload: Partial<{
    name: string;
    type: "flat" | "weight" | "order_value";
    amount: number;
    min_order_value?: number | null;
    max_order_value?: number | null;
    min_weight?: number | null;
    max_weight?: number | null;
    active: boolean;
  }>
) {
  if (!id) throw new Error("shipping_rule_id_required");

  return apiFetch(
    `${SHIPPING}/rules/${encodeURIComponent(id)}`,
    { method: "PATCH", body: payload }
  );
}

export async function deleteShippingRule(id: string) {
  if (!id) throw new Error("shipping_rule_id_required");

  return apiFetch(
    `${SHIPPING}/rules/${encodeURIComponent(id)}`,
    { method: "DELETE" }
  );
}
