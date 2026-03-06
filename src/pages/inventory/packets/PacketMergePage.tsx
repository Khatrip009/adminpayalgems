import React, { useEffect, useMemo, useState } from "react";
import { useParams } from "react-router-dom";
import toast from "react-hot-toast";

import { useWarehouse } from "@/context/WarehouseContext";

import {
  listPackets,
  getPacket,
  mergePacket,
} from "@/api/inventory/packets.api";

import { getPacketFifoLayers } from "@/api/inventory/valuation.api";

export default function PacketMergePage() {
  const { id: sourceId } = useParams<{ id: string }>();
  const { warehouseId, loading: warehouseLoading } = useWarehouse();

  const [packets, setPackets] = useState<any[]>([]);
  const [targetId, setTargetId] = useState<string>("");

  const [sourcePacket, setSourcePacket] = useState<any>(null);
  const [layers, setLayers] = useState<any[]>([]);

  const [mergeCarats, setMergeCarats] = useState<number>(0);
  const [loading, setLoading] = useState(false);

  const availableCarats = useMemo(
    () => layers.reduce((s, l) => s + Number(l.remaining_qty || 0), 0),
    [layers]
  );

  /* -----------------------------------------
     LOAD DATA
  ------------------------------------------ */
  useEffect(() => {
    if (!warehouseId) return;

    listPackets({ warehouse_id: warehouseId, limit: 200 })
      .then(r => setPackets(r?.results || []))
      .catch(() => toast.error("Failed to load packets"));
  }, [warehouseId]);

  useEffect(() => {
    if (!sourceId || !warehouseId) return;

    Promise.all([
      getPacket(sourceId, warehouseId),
      getPacketFifoLayers(sourceId, warehouseId),
    ])
      .then(([p, l]) => {
        if (p?.ok) {
          setSourcePacket(p.packet);
          setLayers(l || []);
        }
      })
      .catch(() => toast.error("Failed to load source packet"));
  }, [sourceId, warehouseId]);

  /* -----------------------------------------
     SUBMIT
  ------------------------------------------ */
  async function handleMerge() {
    if (!warehouseId) return toast.error("Warehouse not selected");
    if (!sourceId) return toast.error("Source packet missing");
    if (!targetId) return toast.error("Select target packet");
    if (mergeCarats <= 0) return toast.error("Invalid carats");
    if (mergeCarats > availableCarats)
      return toast.error("Exceeds available stock");

    setLoading(true);
    try {
      const r = await mergePacket({
        source_packet_id: sourceId,
        target_packet_id: targetId,
        warehouse_id: warehouseId,
        carats: mergeCarats,
        reason: "merge",
      });

      if (r?.ok) {
        toast.success("Packets merged successfully");
        setMergeCarats(0);
      }
    } finally {
      setLoading(false);
    }
  }

  /* -----------------------------------------
     GUARDS
  ------------------------------------------ */
  if (warehouseLoading) return <div>Loading warehouse…</div>;
  if (!warehouseId) return <div>Select warehouse…</div>;
  if (!sourcePacket) return <div>Loading packet…</div>;

  /* -----------------------------------------
     UI
  ------------------------------------------ */
  return (
    <div className="p-6 space-y-6">
      <h1 className="text-2xl font-semibold">Merge Diamond Packets</h1>

      {/* SOURCE */}
      <div className="p-4 border rounded bg-white grid grid-cols-3 gap-4">
        <div>
          <div className="text-slate-500 text-sm">Source Packet</div>
          <div className="font-semibold">{sourcePacket.packet_code}</div>
        </div>
        <div>
          <div className="text-slate-500 text-sm">Available</div>
          <div className="font-semibold">{availableCarats.toFixed(3)} ct</div>
        </div>
        <div>
          <div className="text-slate-500 text-sm">Warehouse</div>
          <div className="font-semibold">{warehouseId}</div>
        </div>
      </div>

      {/* TARGET */}
      <div className="p-4 border rounded bg-white">
        <label className="text-sm font-semibold">Target Packet</label>
        <select
          className="border p-2 rounded w-full"
          value={targetId}
          onChange={e => setTargetId(e.target.value)}
        >
          <option value="">-- Select --</option>
          {packets
            .filter(p => p.id !== sourceId)
            .map(p => (
              <option key={p.id} value={p.id}>
                {p.packet_code}
              </option>
            ))}
        </select>
      </div>

      {/* CARATS */}
      <input
        type="number"
        step="0.001"
        className="border p-2 rounded w-full"
        value={mergeCarats}
        onChange={e => setMergeCarats(Number(e.target.value))}
      />

      <button
        onClick={handleMerge}
        disabled={loading}
        className="px-6 py-3 bg-indigo-600 text-white rounded"
      >
        {loading ? "Merging…" : "Merge Packets"}
      </button>
    </div>
  );
}
