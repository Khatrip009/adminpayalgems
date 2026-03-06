import React, { useEffect, useState, useCallback } from "react";
import { useParams, useNavigate, useSearchParams } from "react-router-dom";
import toast from "react-hot-toast";

import { useWarehouse } from "@/context/WarehouseContext";

import { getPacket } from "@/api/inventory/packets.api";
import { getPacketMovements } from "@/api/inventory/packets.api";
import {
  getPacketValuation,
  getPacketFifoLayers,
} from "@/api/inventory/valuation.api";

import PacketValuationCard from "@/components/inventory/PacketValuationCard";
import MovementTimeline from "@/components/inventory/MovementTimeline";
import FifoLayerTable from "@/components/inventory/FifoLayerTable";

/* =====================================================
   PAGE — ADMIN PACKET DETAIL (PRODUCTION GRADE)
===================================================== */

export default function AdminPacketDetailPage() {
  const { id: packetId } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();

  const {
    warehouseId: contextWarehouseId,
    warehouses,
    loading: warehouseLoading,
    setWarehouseId,
  } = useWarehouse();

  /* =====================================================
     RESOLVE WAREHOUSE (SAFE + DETERMINISTIC)
  ===================================================== */
  const warehouseIdFromUrl = searchParams.get("warehouse_id");
  const parsedWarehouseId = warehouseIdFromUrl
    ? Number(warehouseIdFromUrl)
    : null;

  const warehouseId =
    Number.isFinite(parsedWarehouseId)
      ? parsedWarehouseId
      : contextWarehouseId ?? null;

  /* =====================================================
     STATE
  ===================================================== */
  const [packet, setPacket] = useState<any>(null);
  const [valuation, setValuation] = useState<any>(null);
  const [layers, setLayers] = useState<any[]>([]);
  const [movements, setMovements] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  /* =====================================================
     SYNC URL → CONTEXT (ONE WAY)
  ===================================================== */
  useEffect(() => {
    if (
      warehouseId &&
      contextWarehouseId !== warehouseId
    ) {
      setWarehouseId(warehouseId);
    }
  }, [warehouseId, contextWarehouseId, setWarehouseId]);

  /* =====================================================
     LOAD DATA (NORMALIZED, SAFE)
  ===================================================== */
  const loadAll = useCallback(async () => {
    if (!packetId || !warehouseId) return;

    setLoading(true);
    try {
      const packetRes = await getPacket(packetId, warehouseId);
      const valuationRes = await getPacketValuation(packetId, warehouseId);
      const movementsRes = await getPacketMovements(packetId, warehouseId);
      const layersRes = await getPacketFifoLayers(packetId, warehouseId);

      setPacket(packetRes?.packet ?? null);
      setValuation(valuationRes ?? null);
      setMovements(movementsRes?.items ?? []);
      setLayers(layersRes ?? []);
    } catch (err) {
      console.error(err);
      toast.error("Failed to load packet details");
    } finally {
      setLoading(false);
    }
  }, [packetId, warehouseId]);

  /* =====================================================
     EFFECT
  ===================================================== */
  useEffect(() => {
    if (warehouseLoading) return;
    if (!packetId || !warehouseId) return;

    loadAll();
  }, [warehouseLoading, packetId, warehouseId, loadAll]);

  /* =====================================================
     GUARDS
  ===================================================== */
  if (!packetId) {
    return <div className="p-4">Packet ID required</div>;
  }

  if (warehouseLoading) {
    return <div className="p-4">Loading warehouse…</div>;
  }

  if (!warehouseId) {
    return <div className="p-4">Select warehouse…</div>;
  }

  if (loading) {
    return <div className="p-4">Loading packet…</div>;
  }

  /* =====================================================
     RENDER
  ===================================================== */
  return (
    <div className="space-y-6">
      {/* HEADER */}
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold">
          Packet: {packet?.packet_code || packetId}
        </h1>

        {warehouses.length > 0 && (
          <select
            value={warehouseId}
            onChange={(e) => {
              const wid = Number(e.target.value);
              if (!Number.isFinite(wid)) return;

              setWarehouseId(wid);
              setSearchParams((prev) => {
                prev.set("warehouse_id", String(wid));
                return prev;
              });
            }}
            className="px-3 py-2 border rounded-lg"
          >
            {warehouses.map((w) => (
              <option key={w.id} value={w.id}>
                {w.name || w.code}
              </option>
            ))}
          </select>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* MAIN */}
        <div className="lg:col-span-2 space-y-4">
          {packet && (
            <PacketValuationCard
              valuation={
                valuation
                  ? { ...valuation, packet }
                  : { packet }
              }
            />
          )}

          <div>
            <h3 className="text-lg font-medium mb-2">
              FIFO Layers
            </h3>
            <FifoLayerTable layers={layers} />
          </div>

          <div>
            <h3 className="text-lg font-medium mb-2">
              Movements
            </h3>
            <MovementTimeline movements={movements} />
          </div>
        </div>

        {/* ACTIONS */}
        <div className="p-4 border rounded bg-white space-y-3">
          <h3 className="text-sm font-medium">
            Quick Actions
          </h3>

          <button
  className="w-full border px-3 py-2 rounded"
  onClick={() =>
    navigate(
      `/admin/inventory/packets/${packetId}/split`
    )
  }
>
  Split Packet
</button>

<button
  className="w-full border px-3 py-2 rounded"
  onClick={() =>
    navigate(
      `/admin/inventory/packets/${packetId}/merge`
    )
  }
>
  Merge Packet
</button>
        </div>
      </div>
    </div>
  );
}
