// src/api/inventory/grn-assortment.api.ts
import { apiFetch, API_ROUTES } from "@/lib/apiClient";

/* =========================================================
   TYPES — FINAL (GRN → PACKET ASSORTMENT)
   ---------------------------------------------------------
   ✔ GRN items are the ONLY source of diamonds
   ✔ Packets inherit Purchase Order via GRN
   ✔ No RAW / source packet concept
========================================================= */

export interface GrnAssortmentInput {
  /** Source GRN (linked to Purchase Order internally) */
  grn_id: string;

  /** Target warehouse */
  warehouse_id: number;

  allocations: {
    /** REQUIRED: GRN item source */
    grn_item_id: string;

    /** Merge into existing packet */
    packet_id?: string;

    /** OR create a new packet */
    create_new_packet?: boolean;
    packet_code?: string;

    /** Packet attributes (for new packets) */
    attributes?: {
      shape?: string;
      color?: string;
      clarity?: string;
      stage?: string;
      [key: string]: any;
    };

    /** Carats to allocate from GRN item */
    carats: number;
  }[];
}

export interface GrnAssortmentResult {
  ok: boolean;

  /** Source GRN */
  grn_id: string;

  /** Warehouse */
  warehouse_id: number;

  /** Allocation results */
  allocations: {
    grn_item_id: string;
    packet_id: string;
    allocated_carats: number;
  }[];

  error?: string;
}

/* =========================================================
   API BASE
========================================================= */

const BASE = `${API_ROUTES.inventory}/diamond-assortments`;

/* =========================================================
   ASSORT GRN → DIAMOND PACKETS
========================================================= */
export async function assortGrnToPackets(
  payload: GrnAssortmentInput
): Promise<GrnAssortmentResult> {
  if (!payload.grn_id) throw new Error("grn_id_required");
  if (!payload.warehouse_id) throw new Error("warehouse_id_required");
  if (!payload.allocations?.length)
    throw new Error("allocations_required");

  for (const a of payload.allocations) {
    if (!a.grn_item_id) throw new Error("grn_item_id_required");
    if (!a.carats || a.carats <= 0)
      throw new Error("invalid_carats");

    if (a.create_new_packet && !a.packet_code)
      throw new Error("packet_code_required_for_new_packet");

    if (!a.create_new_packet && !a.packet_id)
      throw new Error("packet_id_required_for_existing_packet");
  }

  return apiFetch<GrnAssortmentResult>(BASE, {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

/* =========================================================
   GRN REMAINING ITEMS (READ MODEL)
========================================================= */

export interface GrnRemainingItem {
  grn_item_id: string;
  grn_id: string;
  received_qty: number;
  allocated_qty: number;
  remaining_qty: number;
}

/* =========================================================
   GET GRN ITEMS WITH REMAINING QTY
========================================================= */
export async function getGrnItemsWithRemainingQty(
  grnId: string
): Promise<{
  ok: boolean;
  items: GrnRemainingItem[];
}> {
  if (!grnId) {
    throw new Error("grn_id_required");
  }

  return apiFetch(
    `${API_ROUTES.inventory}/grn-items/${encodeURIComponent(grnId)}/remaining`,
    { method: "GET" }
  );
}
