// src/api/inventory/packets.api.ts
import { apiFetch, API_ROUTES } from "@/lib/apiClient";

/* =========================================================
   BASE PATHS (SINGLE SOURCE OF TRUTH)
========================================================= */
const DIAMOND_PACKETS = `${API_ROUTES.inventory}/diamond-packets`;
const DIAMOND_INVENTORY = `${API_ROUTES.inventory}/diamond`;

/* =========================================================
   TYPES
========================================================= */

export interface DiamondPacketRow {
  id: string;
  packet_code: string;

  attributes?: Record<string, any>;
  status?: string | null;
  current_location?: string | null;

  total_carats?: number;     // informational only
  total_pieces?: number;

  available_carats: number; // ✅ FIFO source of truth
}

/* =========================================================
   PACKET CRUD
========================================================= */

export async function createPacket(payload: {
  created_from_po: string;
  warehouse_id: number;
  attributes: {
    shape?: string;
    color?: string;
    clarity?: string;
    stage?: string;
    source?: string;
  };
  items: Array<{
    piece_ref?: string;
    carat: number;
    metadata?: any;
  }>;
}) {
  return apiFetch(DIAMOND_PACKETS, {
    method: "POST",
    body: payload,
  });
}

export async function getPacket(packetId: string, warehouseId: number) {
  const res = await apiFetch<any>(
    `${DIAMOND_PACKETS}/${encodeURIComponent(packetId)}?warehouse_id=${warehouseId}`
  );

  return {
    ...res,
    packet: {
      ...res.packet,
      available_carats: Number(res.packet.stock_quantity || 0),
    }
  };
}


export async function searchPackets(params: {
  shape?: string;
  color?: string;
  clarity?: string;
  stage?: string;
}) {
  return apiFetch(
    `${DIAMOND_PACKETS}/search?${new URLSearchParams(
      params as any
    ).toString()}`
  );
}

/* =========================================================
   INVENTORY OPERATIONS
========================================================= */

export async function receivePacket(payload: {
  packet_id: string;
  warehouse_id: number;
  qty_carats: number;
  valuation?: number;
}) {
  return apiFetch(`${DIAMOND_INVENTORY}/receive`, {
    method: "POST",
    body: payload,
  });
}

export async function splitPacket(payload: {
  source_packet_id: string;
  split_carats: number;
  warehouse_id: number;
  reason?: string;
  metadata?: any;
}) {
  return apiFetch(`${DIAMOND_INVENTORY}/split`, {
    method: "POST",
    body: payload,
  });
}

export async function mergePacket(payload: {
  source_packet_id: string;
  target_packet_id: string;
  warehouse_id: number;
  carats: number;
  reason?: string;
  metadata?: any;
}) {
  return apiFetch(`${DIAMOND_INVENTORY}/merge`, {
    method: "POST",
    body: payload,
  });
}

/* =========================================================
   LIST DIAMOND PACKETS (WAREHOUSE + FIFO)
========================================================= */
export async function listPackets(params: {
  warehouse_id: number;
  q?: string;
  limit?: number;
  offset?: number;
}): Promise<{ ok: boolean; results: DiamondPacketRow[] }> {
  if (!params?.warehouse_id) {
    throw new Error("warehouse_id_required");
  }

  const qs = new URLSearchParams();
  qs.append("warehouse_id", String(params.warehouse_id));

  if (params.q) qs.append("q", params.q);
  if (params.limit) qs.append("limit", String(params.limit));
  if (params.offset) qs.append("offset", String(params.offset));

  const res = await apiFetch<{ ok: boolean; results: any[] }>(
    `${DIAMOND_PACKETS}?${qs.toString()}`
  );

  // 🔒 normalize FIFO numeric values
  return {
    ok: res.ok,
    results: (res.results || []).map((r) => ({
      ...r,
      available_carats: Number(r.available_carats || 0),
    })),
  };
}

/* =========================================================
   PACKET MOVEMENTS
========================================================= */
export async function getPacketMovements(
  packetId: string,
  warehouseId: number
) {
  if (!packetId) throw new Error("packet_id_required");
  if (!warehouseId) throw new Error("warehouse_id_required");

  return apiFetch(
    `${API_ROUTES.inventory}/movements?material_type=diamond_packet&material_id=${packetId}&warehouse_id=${warehouseId}`
  );
}

/* =========================================================
   GENERATE PACKET CODE
========================================================= */
export async function generatePacketCode(payload: {
  shape: string;
  color: string;
  clarity: string;
}) {
  if (!payload?.shape || !payload?.color || !payload?.clarity) {
    throw new Error("shape_color_clarity_required");
  }

  return apiFetch(
    `${API_ROUTES.inventory}/diamond-packets/generate-code`,
    {
      method: "POST",
      body: payload,
    }
  );
}


/* =========================================================
   PACKET VALUATION (FINANCE)
========================================================= */
export async function getPacketValuation(
  packetId: string,
  warehouseId: number
) {
  if (!packetId) throw new Error("packet_id_required");
  if (!warehouseId) throw new Error("warehouse_id_required");

  const res = await apiFetch<any>(
    `${API_ROUTES.finance}/valuation/packet/${encodeURIComponent(packetId)}`
  );

  return res || null;
}
