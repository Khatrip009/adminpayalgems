import { api, API_ROUTES } from "@/lib/apiClient";

/* ---------------------------------------------
   Helper: safe query builder
--------------------------------------------- */
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

/* ---------------------------------------------
   SEARCH STOCK MOVEMENTS
   GET /api/inventory/stock-movements
--------------------------------------------- */
export async function searchStock(params?: Record<string, any>) {
  return api.get(
    `${API_ROUTES.inventory}/movements${buildQuery(params)}`
  );
}

/* ---------------------------------------------
   PACKET VALUATION
   GET /api/finance/valuation/packet/:packet_id
--------------------------------------------- */
export async function getPacketValuation(packetId: string) {
  if (!packetId) throw new Error("packet_id_required");

  return api.get(
    `${API_ROUTES.inventory}/valuation/packet/${encodeURIComponent(packetId)}`
  );
}
