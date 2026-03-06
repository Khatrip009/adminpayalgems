// src/api/inventory/inventory.materials.api.ts
import { apiFetch, API_ROUTES } from "@/lib/apiClient";

/* =====================================================
   TYPES
===================================================== */

export type InventoryMaterialType =
  | "diamond_packet"
  | "gold_lot"
  | "all";

export interface SearchMaterialsParams {
  type: InventoryMaterialType;
  warehouse_id: number;      // 🔒 REQUIRED
  search?: string;
}

export interface InventoryMaterial {
  id: string;
  label?: string;            // packet_code for packets
  material_type?: string;    // for non-packet materials
  attributes?: Record<string, any>;

  available_qty: number;
  warehouse_id: number;

  // packets only (informational)
  total_carats_all_warehouses?: number;
}

/* =====================================================
   SEARCH INVENTORY MATERIALS
===================================================== */
export async function searchMaterials(
  params: SearchMaterialsParams
): Promise<{ ok: boolean; materials: InventoryMaterial[] }> {

  if (!params?.type) {
    throw new Error("material_type_required");
  }

  if (!params?.warehouse_id) {
    throw new Error("warehouse_id_required");
  }

  const q = new URLSearchParams();
  q.append("type", params.type);
  q.append("warehouse_id", String(params.warehouse_id));

  if (params.search) {
    q.append("search", params.search);
  }

  const r = await apiFetch<{ ok: boolean; results: InventoryMaterial[] }>(
    `${API_ROUTES.inventory}/materials/search?${q.toString()}`
  );

  return {
    ok: r?.ok,
    materials: r?.results || [],   // ✅ NORMALIZED HERE
  };
}
