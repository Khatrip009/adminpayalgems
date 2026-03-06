import { apiFetch, API_ROUTES } from "@/lib/apiClient";

/* =========================================================
   BASE
========================================================= */

const BASE = `${API_ROUTES.masters}/warehouses`;

/* =========================================================
   TYPES
========================================================= */

export interface Warehouse {
  id: number;
  code: string;
  name: string;
  address?: string | null;
  phone?: string | null;
  is_default?: boolean;
  created_at?: string;
  updated_at?: string;
}

export interface WarehousePayload {
  code: string;
  name: string;
  address?: string | null;
  phone?: string | null;
  is_default?: boolean;
}

export interface WarehouseInventoryItem {
  packet_id: string;
  packet_code: string;
  carats: number;
  value?: number;
}

/* =========================================================
   HELPERS
========================================================= */

function assertId(id: number, label = "warehouse_id") {
  if (id == null || Number.isNaN(id)) {
    throw new Error(`${label}_required`);
  }
  return encodeURIComponent(String(id));
}

/* =========================================================
   WAREHOUSES
========================================================= */

/**
 * GET /masters/warehouses
 */
export async function listWarehouses() {
  return apiFetch<Warehouse[]>(BASE);
}

/**
 * GET /masters/warehouses/:id
 */
export async function getWarehouse(id: number) {
  return apiFetch<Warehouse>(
    `${BASE}/${assertId(id)}`
  );
}

/**
 * GET /masters/warehouses/:id/inventory
 */
export async function getWarehouseInventory(id: number) {
  return apiFetch<WarehouseInventoryItem[]>(
    `${BASE}/${assertId(id)}/inventory`
  );
}

/**
 * POST /masters/warehouses
 */
export async function createWarehouse(payload: WarehousePayload) {
  return apiFetch<Warehouse>(
    BASE,
    { method: "POST", body: payload }
  );
}

/**
 * PUT /masters/warehouses/:id
 */
export async function updateWarehouse(
  id: number,
  payload: Partial<WarehousePayload>
) {
  return apiFetch<Warehouse>(
    `${BASE}/${assertId(id)}`,
    { method: "PUT", body: payload }
  );
}

/**
 * DELETE /masters/warehouses/:id
 */
export async function deleteWarehouse(id: number) {
  return apiFetch<void>(
    `${BASE}/${assertId(id)}`,
    { method: "DELETE" }
  );
}

/* =========================================================
   OPTIONAL: WAREHOUSE VALUATION
   (ONLY if route exists on backend)
========================================================= */

/**
 * GET /masters/warehouses/:id/valuation
 */
export async function getWarehouseValuation(id: number) {
  return apiFetch(
    `${BASE}/${assertId(id)}/valuation`
  );
}
