// src/api/inventory/valuation.api.ts
import { apiFetch, API_ROUTES } from "@/lib/apiClient";

/* =========================================================
   BASE
========================================================= */

const BASE = `${API_ROUTES.finance}/valuation`;

/* =========================================================
   TYPES — MATCH BACKEND REALITY
========================================================= */

export interface WarehouseValuationRow {
  packet_id: string;
  packet_code: string;
  carats_in_stock: number;
  weighted_cost: number;
}

export interface PacketValuation {
  packet_id: string;
  packet_code?: string;

  // inventory truth
  carats_in_stock: number;
  qty_in_state?: number;

  // valuation
  avg_rate: number;
  total_value: number;
}

export interface FifoLayer {
  id: string;
  qty: number;
  remaining_qty: number;
  unit_price: number;
  total_value: number;
  warehouse_id: number;
  created_at: string;
  metadata?: Record<string, any>;
}

export interface ManualValuationEntryInput {
  reference_type: string;
  reference_id: string;

  material_type: "diamond_packet" | "gold_lot";
  material_id: string;

  warehouse_id: number;

  amount: number;
  valuation_method: "fifo" | "wavg" | "manual";

  notes?: string;
  metadata?: Record<string, any>;
}

/* =========================================================
   HELPERS
========================================================= */

function assertWarehouseId(id: number) {
  if (id == null || Number.isNaN(id)) {
    throw new Error("warehouse_id_required");
  }
  return encodeURIComponent(String(id));
}

function assertPacketId(id: string) {
  if (!id) throw new Error("packet_id_required");
  return encodeURIComponent(id);
}

/* =========================================================
   PACKET VALUATION (FINANCE VIEW)
   GET /api/finance/valuation/packet/:packet_id
========================================================= */

export async function getPacketValuation(
  packetId: string,
  warehouseId: number
): Promise<PacketValuation | null> {
  const pid = assertPacketId(packetId);
  const wid = assertWarehouseId(warehouseId);

  const res = await apiFetch<any>(
    `${BASE}/packet/${pid}?warehouse_id=${wid}`
  );

  return res?.valuation ?? null;
}

/* =========================================================
   WAREHOUSE VALUATION SUMMARY
   GET /api/finance/valuation/warehouse/:warehouse_id
========================================================= */

export async function getWarehouseValuation(
  warehouseId: number
): Promise<WarehouseValuationRow[]> {
  const wid = assertWarehouseId(warehouseId);

  const res = await apiFetch<any>(
    `${BASE}/warehouse/${wid}`
  );

  return res?.rows ?? res ?? [];
}

/* =========================================================
   FIFO LAYERS (AUDIT / DEBUG)
   GET /api/finance/valuation/layers
========================================================= */

export async function getPacketFifoLayers(
  packetId: string,
  warehouseId: number
): Promise<FifoLayer[]> {
  const pid = assertPacketId(packetId);
  const wid = assertWarehouseId(warehouseId);

  const res = await apiFetch<any>(
    `${BASE}/layers?packet_id=${pid}&warehouse_id=${wid}`
  );

  return res?.layers ?? [];
}

/* =========================================================
   MANUAL VALUATION ENTRY (FINANCE ONLY)
   POST /api/finance/valuation/entry
========================================================= */

export async function createManualValuationEntry(
  payload: ManualValuationEntryInput
) {
  if (payload?.warehouse_id == null) {
    throw new Error("warehouse_id_required");
  }

  return apiFetch(
    `${BASE}/entry`,
    {
      method: "POST",
      body: payload,
    }
  );
}
