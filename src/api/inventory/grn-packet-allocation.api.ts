// src/api/inventory/grn-packet-allocation.api.ts
import { apiFetch, API_ROUTES } from "@/lib/apiClient";

/* =========================================================
   TYPES (BACKEND-ALIGNED – FINAL)
========================================================= */

export interface GrnPacketAllocationInput {
  grn_id: string;
  warehouse_id: number;

  /** RAW packet created at GRN time */
  source_packet_id: string;

  allocations: {
    /** REQUIRED: exact GRN item source */
    grn_item_id: string;

    /** Existing packet */
    packet_id?: string;

    /** OR create new packet */
    create_new_packet?: boolean;
    packet_code?: string;
    attributes?: {
      shape?: string;
      color?: string;
      clarity?: string;
      stage?: string;
      [key: string]: any;
    };

    /** Allocated carats from this GRN item */
    carats: number;
  }[];
}

export interface GrnPacketAllocationResult {
  ok: boolean;
  grn_id: string;
  warehouse_id: number;
  source_packet_id: string;
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

const BASE = `${API_ROUTES.inventory}/grn-packet-allocations`;

/* =========================================================
   ALLOCATE RAW PACKET → DIAMOND PACKETS (FIFO SAFE)
========================================================= */
export async function allocateGrnToPackets(
  payload: GrnPacketAllocationInput
): Promise<GrnPacketAllocationResult> {
  if (!payload.grn_id) throw new Error("grn_id_required");
  if (!payload.warehouse_id) throw new Error("warehouse_id_required");
  if (!payload.source_packet_id) throw new Error("source_packet_id_required");
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

  return apiFetch<GrnPacketAllocationResult>(BASE, {
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
