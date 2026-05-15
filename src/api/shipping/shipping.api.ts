// src/api/shipping/shipping.api.ts
import { api } from "@/lib/apiClient";

/* =====================================================
   TYPES
===================================================== */

export interface ShippingMethod {
  id: string;
  code: string;
  name: string;
  description?: string | null;
  is_active: boolean;
  base_rate: number;
  rate_config?: any;
  created_at: string;
  updated_at: string;
}

export interface ShippingRule {
  id: string;
  name: string;
  type: "flat" | "weight" | "order_value";
  amount: number;
  min_order_value?: number | null;
  max_order_value?: number | null;
  min_weight?: number | null;
  max_weight?: number | null;
  active: boolean;
  created_at: string;
  updated_at: string;
}

/* =====================================================
   LIST PARAMETERS
===================================================== */

export interface ListShippingMethodsParams {
  page?: number;
  limit?: number;
  q?: string;
  only_active?: boolean;
}

export interface ListShippingMethodsResponse {
  ok: boolean;
  methods: ShippingMethod[];
  page: number;
  limit: number;
  total: number;
}

export interface ListShippingRulesResponse {
  ok: boolean;
  rules: ShippingRule[];
}

/* =====================================================
   SHIPPING METHODS API
===================================================== */

/**
 * GET /shipping-methods
 * List shipping methods with pagination, search, and optional active filter.
 */
export async function listShippingMethods(
  params?: ListShippingMethodsParams
): Promise<ListShippingMethodsResponse> {
  return api.get("/shipping-methods", { params });
}

/**
 * POST /shipping-methods
 * Create a new shipping method.
 */
export async function createShippingMethod(payload: {
  code: string;
  name: string;
  description?: string | null;
  base_rate?: number;
  is_active?: boolean;
  rate_config?: any;
}): Promise<{ ok: boolean; method: ShippingMethod }> {
  return api.post("/shipping-methods", payload);
}

/**
 * PATCH /shipping-methods/:id
 * Update an existing shipping method.
 */
export async function updateShippingMethod(
  id: string,
  payload: Partial<{
    code: string;
    name: string;
    description: string | null;
    base_rate: number;
    is_active: boolean;
    rate_config: any;
  }>
): Promise<{ ok: boolean; method: ShippingMethod }> {
  return api.patch(`/shipping-methods/${id}`, payload);
}

/**
 * DELETE /shipping-methods/:id
 * Delete a shipping method.
 */
export async function deleteShippingMethod(
  id: string
): Promise<{ ok: boolean }> {
  return api.delete(`/shipping-methods/${id}`);
}

/* =====================================================
   SHIPPING RULES API
===================================================== */

/**
 * GET /shipping-rules
 * List all shipping rules.
 */
export async function listShippingRules(): Promise<ListShippingRulesResponse> {
  return api.get("/shipping-rules");
}

/**
 * POST /shipping-rules
 * Create a new shipping rule.
 */
export async function createShippingRule(payload: {
  name: string;
  type: "flat" | "weight" | "order_value";
  amount: number;
  min_order_value?: number | null;
  max_order_value?: number | null;
  min_weight?: number | null;
  max_weight?: number | null;
  active?: boolean;
}): Promise<{ ok: boolean; rule: ShippingRule }> {
  return api.post("/shipping-rules", payload);
}

/**
 * PATCH /shipping-rules/:id
 * Update an existing shipping rule.
 */
export async function updateShippingRule(
  id: string,
  payload: Partial<{
    name: string;
    type: "flat" | "weight" | "order_value";
    amount: number;
    min_order_value: number | null;
    max_order_value: number | null;
    min_weight: number | null;
    max_weight: number | null;
    active: boolean;
  }>
): Promise<{ ok: boolean; rule: ShippingRule }> {
  return api.patch(`/shipping-rules/${id}`, payload);
}

/**
 * DELETE /shipping-rules/:id
 * Delete a shipping rule.
 */
export async function deleteShippingRule(
  id: string
): Promise<{ ok: boolean }> {
  return api.delete(`/shipping-rules/${id}`);
}