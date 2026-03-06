// PacketSplitPage.tsx
import React, { useEffect, useMemo, useState, useCallback } from "react";
import { useParams } from "react-router-dom";
import toast from "react-hot-toast";

import { useWarehouse } from "@/context/WarehouseContext";

import {
  listPackets,
  getPacket,
  generatePacketCode,
  splitPacket,
} from "@/api/inventory/packets.api";

import { getPacketFifoLayers } from "@/api/inventory/valuation.api";

/* =====================================================
   CONSTANTS
===================================================== */

const SHAPES = [
  { code: "RD", label: "Round Brilliant" },
  { code: "PR", label: "Princess" },
  { code: "EM", label: "Emerald" },
  { code: "AS", label: "Asscher" },
  { code: "OV", label: "Oval" },
  { code: "CU", label: "Cushion" },
  { code: "MQ", label: "Marquise" },
  { code: "PS", label: "Pear" },
  { code: "HT", label: "Heart" },
  { code: "RC", label: "Radiant" },
];

const COLORS = ["D", "E", "F", "G", "H", "I", "J", "K", "L", "M"];
const CLARITIES = [
  "FL",
  "IF",
  "VVS1",
  "VVS2",
  "VS1",
  "VS2",
  "SI1",
  "SI2",
  "I1",
  "I2",
  "I3",
];

/* =====================================================
   PAGE
===================================================== */

export default function PacketSplitPage() {
  const { id } = useParams<{ id: string }>();
  const { warehouseId, loading: warehouseLoading } = useWarehouse();

  const [packets, setPackets] = useState<any[]>([]);
  const [selected, setSelected] = useState<string>("");

  const [packet, setPacket] = useState<any>(null);
  const [layers, setLayers] = useState<any[]>([]);

  const [editAttributes, setEditAttributes] = useState({
    shape: "",
    color: "",
    clarity: "",
  });

  const [newPacketCode, setNewPacketCode] = useState("");
  const [splitCarats, setSplitCarats] = useState<number>(0);
  const [loading, setLoading] = useState(false);

  const num = (v: any, d = 0) => {
    const n = Number(v);
    return Number.isFinite(n) ? n : d;
  };

  const loadPacket = useCallback(async () => {
    if (!selected || !warehouseId) {
      setPacket(null);
      setLayers([]);
      return;
    }

    try {
      const [p, l] = await Promise.all([
        getPacket(selected, warehouseId),
        getPacketFifoLayers(selected, warehouseId),
      ]);

      if (p?.ok) {
        setPacket(p.packet);
        setLayers(l || []);
      }
    } catch {
      toast.error("Failed to load packet details");
    }
  }, [selected, warehouseId]);

  useEffect(() => {
    if (!warehouseId) return;
    listPackets({ warehouse_id: warehouseId, limit: 200 })
      .then(r => setPackets(r?.results || []))
      .catch(() => toast.error("Failed to load packets"));
  }, [warehouseId]);

  useEffect(() => {
    if (id) setSelected(id);
  }, [id]);

  useEffect(() => {
    loadPacket();
  }, [loadPacket]);

  const availableCarats = useMemo(
    () => layers.reduce((s, l) => s + num(l.remaining_qty), 0),
    [layers]
  );
  const remainingCarats = useMemo(
  () => Math.max(0, availableCarats - splitCarats),
  [availableCarats, splitCarats]
);


  async function handleGenerateCode() {
    const { shape, color, clarity } = editAttributes;
    if (!shape || !color || !clarity) {
      return toast.error("Shape, Color & Clarity required");
    }

    const r = await generatePacketCode({ shape, color, clarity });
    if (r?.ok) setNewPacketCode(r.packet_code);
  }

  async function handleSubmit() {
    if (!warehouseId) return toast.error("Warehouse not selected");
    if (!selected) return toast.error("Select source packet");
    if (!newPacketCode) return toast.error("Packet code required");
    if (splitCarats <= 0) return toast.error("Invalid split carats");
    if (splitCarats > availableCarats)
      return toast.error("Exceeds available stock");

    setLoading(true);
    try {
      const r = await splitPacket({
        source_packet_id: selected,
        new_packet_code: newPacketCode,
        split_carats: splitCarats,
        warehouse_id: warehouseId,
        reason: "split",
        metadata: { attributes: editAttributes },
      });

      if (r?.ok) {
        toast.success("Packet split successfully");
        setNewPacketCode("");
        setSplitCarats(0);
        loadPacket();
      }
    } finally {
      setLoading(false);
    }
  }

  if (warehouseLoading) return <div>Loading warehouse…</div>;
  if (!warehouseId) return <div>Select warehouse…</div>;
  /* =====================================================
     UI
  ===================================================== */

  return (
    <div className="p-6 space-y-6">
      <h1 className="text-2xl font-semibold">
        Split Diamond Packet
      </h1>

      {/* SOURCE PACKET */}
      <div className="p-4 border rounded bg-white">
        <label className="text-sm font-semibold">
          Source Packet
        </label>
        <select
          className="border p-2 rounded w-full"
          value={selected}
          onChange={(e) => setSelected(e.target.value)}
        >
          <option value="">-- Select --</option>
          {packets.map((p) => (
            <option key={p.id} value={p.id}>
              {p.packet_code}
            </option>
          ))}
        </select>
      </div>

      {packet && (
        <>
          {/* SUMMARY */}
          <div className="p-4 border rounded bg-white grid grid-cols-3 gap-4 text-sm">
            <div>
              <div className="text-slate-500">Packet</div>
              <div className="font-semibold">
                {packet.packet_code}
              </div>
            </div>
            <div>
              <div className="text-slate-500">Available</div>
              <div className="font-semibold">
                {availableCarats.toFixed(3)} ct
              </div>
            </div>
            <div>
              <div className="text-slate-500">Warehouse</div>
              <div className="font-semibold">
                {warehouseId}
              </div>
            </div>
          </div>

          {/* CREATE */}
          <div className="p-4 border rounded bg-white space-y-4">
            <div className="flex gap-2">
              <input
                className="border p-2 rounded w-full"
                placeholder="New Packet Code"
                value={newPacketCode}
                onChange={(e) =>
                  setNewPacketCode(e.target.value)
                }
              />
              <button
                onClick={handleGenerateCode}
                className="px-3 py-2 bg-blue-600 text-white rounded"
              >
                Auto
              </button>
            </div>

            <div className="grid grid-cols-3 gap-4">
              {/* SHAPE */}
              <select
                className="border p-2 rounded"
                value={editAttributes.shape}
                onChange={(e) =>
                  setEditAttributes((p) => ({
                    ...p,
                    shape: e.target.value,
                  }))
                }
              >
                <option value="">Shape</option>
                {SHAPES.map((s) => (
                  <option key={s.code} value={s.code}>
                    {s.label}
                  </option>
                ))}
              </select>

              {/* COLOR */}
              <select
                className="border p-2 rounded"
                value={editAttributes.color}
                onChange={(e) =>
                  setEditAttributes((p) => ({
                    ...p,
                    color: e.target.value,
                  }))
                }
              >
                <option value="">Color</option>
                {COLORS.map((c) => (
                  <option key={c} value={c}>
                    {c}
                  </option>
                ))}
              </select>

              {/* CLARITY */}
              <select
                className="border p-2 rounded"
                value={editAttributes.clarity}
                onChange={(e) =>
                  setEditAttributes((p) => ({
                    ...p,
                    clarity: e.target.value,
                  }))
                }
              >
                <option value="">Clarity</option>
                {CLARITIES.map((c) => (
                  <option key={c} value={c}>
                    {c}
                  </option>
                ))}
              </select>
            </div>

            <input
              type="number"
              step="0.001"
              className="border p-2 rounded w-full"
              value={splitCarats}
              onChange={(e) =>
                setSplitCarats(Number(e.target.value))
              }
            />

            <div className="text-right text-sm">
              Remaining after split:{" "}
              <strong>
                {remainingCarats.toFixed(3)} ct
              </strong>
            </div>
          </div>

          <button
            onClick={handleSubmit}
            disabled={loading}
            className="px-6 py-3 bg-green-600 text-white rounded"
          >
            {loading ? "Splitting…" : "Split Packet"}
          </button>
        </>
      )}
    </div>
  );
}
