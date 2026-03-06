import React, { useEffect, useMemo, useState } from "react";
import toast from "react-hot-toast";

import { listWarehouses } from "@/api/masters/warehouses.api";
import { listGrns } from "@/api/procurement/grn.api";
import {
  assortGrnToPackets,
  getGrnItemsWithRemainingQty,
} from "@/api/inventory/grn-assortment.api";
import {
  listPackets,
  type DiamondPacketRow,
  generatePacketCode,
} from "@/api/inventory/packets.api";

/* =====================================================
   MASTER DATA
===================================================== */

const SHAPES = ["Round","Princess","Oval","Emerald","Pear","Marquise","Cushion","Radiant","Asscher","Heart"];
const COLORS = ["D","E","F","G","H","I","J","K","L","M","N"];
const CLARITIES = ["FL","IF","VVS1","VVS2","VS1","VS2","SI1","SI2"];
const STAGES = ["sorted","certified","polished"];

/* =====================================================
   TYPES
===================================================== */

type Warehouse = { id: number; name: string };
type Grn = { id: string; grn_number: string; purchase_order_id?: string };

type GrnItem = {
  grn_item_id: string;
  remaining_qty: number;
};

type PacketTarget = {
  id: string;
  mode: "existing" | "new";
  packet_id?: string;
  packet_code?: string;
  shape?: string;
  color?: string;
  clarity?: string;
  stage?: string;
  allocations: Record<string, number>;
};

/* =====================================================
   COMPONENT
===================================================== */

export default function PacketCreatePage() {
  const [warehouseId, setWarehouseId] = useState<number>();
  const [warehouses, setWarehouses] = useState<Warehouse[]>([]);
  const [grns, setGrns] = useState<Grn[]>([]);
  const [grnId, setGrnId] = useState("");
  const [purchaseOrderId, setPurchaseOrderId] = useState<string | null>(null);

  const [grnItems, setGrnItems] = useState<GrnItem[]>([]);
  const [existingPackets, setExistingPackets] = useState<DiamondPacketRow[]>([]);
  const [targets, setTargets] = useState<PacketTarget[]>([]);
  const [loading, setLoading] = useState(false);

  /* =====================================================
     LOADERS
  ===================================================== */

  useEffect(() => {
    listWarehouses().then(r => {
      const rows = r?.rows || r?.data || [];
      setWarehouses(rows);
      if (rows[0]) setWarehouseId(rows[0].id);
    });
  }, []);

  useEffect(() => {
    if (!warehouseId) return;
    listGrns({ warehouse_id: warehouseId }).then((r: any) => {
      setGrns(r?.results || []);
      setGrnId("");
      setPurchaseOrderId(null);
      setGrnItems([]);
      setTargets([]);
    });
  }, [warehouseId]);

  useEffect(() => {
    if (!grnId) return;
    const grn = grns.find(g => g.id === grnId);
    setPurchaseOrderId(grn?.purchase_order_id || null);

    getGrnItemsWithRemainingQty(grnId).then(r => {
      setGrnItems(r.items || []);
      setTargets([]);
    });
  }, [grnId]);

  useEffect(() => {
    if (!warehouseId || !purchaseOrderId) return;
    listPackets({
      warehouse_id: warehouseId,
      purchase_order_id: purchaseOrderId,
    }).then(r => setExistingPackets(r.results || []));
  }, [warehouseId, purchaseOrderId]);

  /* =====================================================
     HELPERS
  ===================================================== */

  function addNewPacketTarget() {
    setTargets(t => [
      ...t,
      {
        id: crypto.randomUUID(),
        mode: "new",
        stage: "sorted",
        allocations: {},
      },
    ]);
  }

  function addExistingPacketTarget(packet: DiamondPacketRow) {
    setTargets(t => [
      ...t,
      {
        id: crypto.randomUUID(),
        mode: "existing",
        packet_id: packet.id,
        packet_code: packet.packet_code,
        allocations: {},
      },
    ]);
  }

  function updateAllocation(targetId: string, grnItemId: string, value: number) {
    setTargets(ts =>
      ts.map(t =>
        t.id === targetId
          ? { ...t, allocations: { ...t.allocations, [grnItemId]: value } }
          : t
      )
    );
  }

  /* =====================================================
     PAYLOAD (STRICT FILTER)
  ===================================================== */

  const allocationsPayload = useMemo(() => {
    const rows: any[] = [];

    for (const t of targets) {
      for (const [grn_item_id, carats] of Object.entries(t.allocations)) {
        const qty = Number(carats);
        if (!Number.isFinite(qty) || qty <= 0) continue;

        if (t.mode === "new" && !t.packet_code) continue;

        rows.push({
          grn_item_id,
          carats: qty,
          ...(t.mode === "existing"
            ? { packet_id: t.packet_id }
            : {
                create_new_packet: true,
                packet_code: t.packet_code,
                attributes: {
                  shape: t.shape,
                  color: t.color,
                  clarity: t.clarity,
                                  },
              }),
        });
      }
    }

    return rows;
  }, [targets]);

  /* =====================================================
     SUBMIT (HARD VALIDATION)
  ===================================================== */

  async function finalize() {
    if (!warehouseId || !grnId)
      return toast.error("Warehouse and GRN required");

    for (const t of targets) {
      const allocated = Object.values(t.allocations).reduce(
        (s, v) => s + Number(v || 0),
        0
      );
      if (allocated <= 0) continue;

      if (t.mode === "new") {
        if (!t.packet_code)
          return toast.error("Generate packet code for all new packets");
        if (!t.shape || !t.color || !t.clarity)
          return toast.error("Shape, Color & Clarity required");
      }
    }

    if (!allocationsPayload.length)
      return toast.error("No valid allocations");

    setLoading(true);
    try {
      await assortGrnToPackets({
        grn_id: grnId,
        warehouse_id: warehouseId,
        allocations: allocationsPayload,
      });

      toast.success("GRN successfully assorted into packets");
      setGrnId("");
      setTargets([]);
      setGrnItems([]);
    } catch (e: any) {
      toast.error(e?.message || "Assortment failed");
    } finally {
      setLoading(false);
    }
  }

  /* =====================================================
     RENDER
  ===================================================== */

  return (
    <div className="max-w-7xl mx-auto p-6 space-y-6">
      <h1 className="text-2xl font-semibold">GRN → Diamond Packet Assortment</h1>

      {/* CONTEXT */}
      <div className="grid grid-cols-3 gap-4 bg-white p-4 border rounded">
        <select
          className="border p-2 rounded"
          value={warehouseId}
          onChange={e => setWarehouseId(Number(e.target.value))}
        >
          {warehouses.map(w => (
            <option key={w.id} value={w.id}>{w.name}</option>
          ))}
        </select>

        <select
          className="border p-2 rounded"
          value={grnId}
          onChange={e => setGrnId(e.target.value)}
        >
          <option value="">Select GRN</option>
          {grns.map(g => (
            <option key={g.id} value={g.id}>{g.grn_number}</option>
          ))}
        </select>

        <div className="text-sm">PO: <b>{purchaseOrderId || "—"}</b></div>
      </div>

      {/* PANELS */}
      <div className="grid grid-cols-3 gap-6">

        {/* GRN ITEMS */}
        <div className="bg-white p-4 border rounded">
          <h3 className="font-medium mb-3">GRN Items</h3>
          {grnItems.map(i => (
            <div key={i.grn_item_id} className="text-sm border-b py-2">
              Remaining: {i.remaining_qty} ct
            </div>
          ))}
        </div>

        {/* TARGET PACKETS */}
        <div className="bg-white p-4 border rounded space-y-3">
          <h3 className="font-medium">Packet Targets</h3>

          <button onClick={addNewPacketTarget}
            className="text-sm border px-2 py-1 rounded">
            + New Packet
          </button>

          {existingPackets.map(p => (
            <button
              key={p.id}
              onClick={() => addExistingPacketTarget(p)}
              className="block text-left text-sm border p-2 rounded"
            >
              {p.packet_code} ({p.available_carats} ct)
            </button>
          ))}
        </div>

        {/* ALLOCATIONS */}
        <div className="bg-white p-4 border rounded space-y-4">
          <h3 className="font-medium">Allocations</h3>

          {targets.map(t => (
            <div key={t.id} className="border p-3 rounded space-y-3">
              <div className="text-xs font-semibold flex justify-between">
                <span>{t.mode === "existing" ? t.packet_code : "New Packet"}</span>
                {t.packet_code && <span className="text-emerald-600">{t.packet_code}</span>}
              </div>

              {t.mode === "new" && (
                <div className="grid grid-cols-2 gap-2 text-xs">
                  {[
                    ["Shape", SHAPES, "shape"],
                    ["Color", COLORS, "color"],
                    ["Clarity", CLARITIES, "clarity"],
                  ].map(([label, opts, key]) => (
                    <select
                      key={key}
                      className="border px-2 py-1"
                      value={(t as any)[key] || ""}
                      onChange={e =>
                        setTargets(ts =>
                          ts.map(x =>
                            x.id === t.id
                              ? { ...x, [key]: e.target.value }
                              : x
                          )
                        )
                      }
                    >
                      <option value="">{label}</option>
                      {(opts as string[]).map(v => (
                        <option key={v} value={v}>{v}</option>
                      ))}
                    </select>
                  ))}

                

                  <button
                    className="col-span-2 border rounded px-2 py-1"
                    onClick={async () => {
                      if (!t.shape || !t.color || !t.clarity)
                        return toast.error("Select Shape, Color & Clarity first");

                      const r = await generatePacketCode({
                        shape: t.shape,
                        color: t.color,
                        clarity: t.clarity,
                      });

                      if (r?.ok) {
                        setTargets(ts =>
                          ts.map(x =>
                            x.id === t.id
                              ? { ...x, packet_code: r.packet_code }
                              : x
                          )
                        );
                      }
                    }}
                  >
                    Auto Generate Packet Code
                  </button>
                </div>
              )}

              {grnItems.map(i => (
                <div key={i.grn_item_id} className="flex justify-between text-xs">
                  <span>{i.grn_item_id.slice(0, 8)}… ({i.remaining_qty} ct)</span>
                  <input
                    type="number"
                    step="0.01"
                    className="border w-20 px-1 text-right"
                    onChange={e =>
                      updateAllocation(t.id, i.grn_item_id, Number(e.target.value))
                    }
                  />
                </div>
              ))}
            </div>
          ))}
        </div>
      </div>

      <div className="flex justify-end">
        <button
          disabled={loading}
          onClick={finalize}
          className="bg-emerald-600 text-white px-6 py-3 rounded"
        >
          {loading ? "Processing…" : "Confirm Assortment"}
        </button>
      </div>
    </div>
  );
}
