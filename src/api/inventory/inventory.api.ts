// src/api/inventory/inventory.api.ts
import { api, API_ROUTES } from "@/lib/apiClient";

/* =====================================================
   HELPERS
===================================================== */
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

/* =====================================================
   TYPES
===================================================== */

export interface StockMovementSearchParams {
  warehouse_id?: number;
  material_type?: "diamond_packet" | "gold_lot" | string;
  material_id?: string;
  movement_type?: string;
  from_date?: string; // ISO date
  to_date?: string;   // ISO date
  limit?: number;
  offset?: number;
}

export interface StockMovement {
  id: string;
  material_type: string;
  material_id: string;
  movement_type: string;
  quantity: number;
  warehouse_id: number;
  reference?: string;
  created_at: string;
  created_by?: string;
  metadata?: Record<string, any>;
}

/* =====================================================
   STOCK MOVEMENTS
===================================================== */
export async function searchStockMovements(
  params?: StockMovementSearchParams
): Promise<{ ok: boolean; items: StockMovement[] }> {
  return api.get(
    `${API_ROUTES.inventory}/stock-movements${buildQuery(params)}`
  );
}
