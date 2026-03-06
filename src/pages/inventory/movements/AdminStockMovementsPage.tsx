import React, { useEffect, useState } from "react";
import { apiFetch } from "@/lib/apiClient";
import { listWarehouses } from "@/api/masters/warehouses.api";
import type { Warehouse } from "@/api/masters/warehouses.api";
function toISODate(date: string) {
  if (!date) return "";
  // input: DD-MM-YYYY OR YYYY-MM-DD
  if (date.includes("-") && date.split("-")[0].length === 2) {
    const [dd, mm, yyyy] = date.split("-");
    return `${yyyy}-${mm}-${dd}`;
  }
  return date; // already ISO
}


/* -------------------------------------------------------
   Types
------------------------------------------------------- */
interface StockMovement {
  id: string;
  movement_type: string;
  material_type: string;
  material_id: string;
  quantity: number;
  warehouse_id: string;
  warehouse_name?: string;
  reference: string | null;
  metadata: any;
  created_at: string;
}

/* -------------------------------------------------------
   Movement Badge Utility
------------------------------------------------------- */
const badgeColors: any = {
  receive: "bg-green-100 text-green-700 border-green-300",
  issue: "bg-red-100 text-red-700 border-red-300",
  split: "bg-blue-100 text-blue-700 border-blue-300",
  merge: "bg-purple-100 text-purple-700 border-purple-300",
  transfer: "bg-yellow-100 text-yellow-700 border-yellow-300",
  grn: "bg-indigo-100 text-indigo-700 border-indigo-300",
};

function MovementBadge({ type }: { type: string }) {
  return (
    <span
      className={`px-2 py-1 border rounded text-xs capitalize ${
        badgeColors[type] || "bg-gray-100 text-gray-700"
      }`}
    >
      {type}
    </span>
  );
}

/* -------------------------------------------------------
   Drawer Component
------------------------------------------------------- */
function MovementDrawer({
  open,
  onClose,
  movement,
}: {
  open: boolean;
  onClose: () => void;
  movement: StockMovement | null;
}) {
  if (!open || !movement) return null;

  return (
    <div className="fixed inset-0 bg-black/40 flex justify-end z-50">
      <div className="w-[420px] bg-white p-6 shadow-xl animate-slideLeft h-full overflow-y-auto">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-lg font-semibold">Movement Details</h2>
          <button onClick={onClose} className="text-gray-600 hover:text-black">
            ✕
          </button>
        </div>

        <div className="space-y-4 text-sm">
          <p>
            <strong>Type: </strong>
            <MovementBadge type={movement.movement_type} />
          </p>
          <p>
            <strong>Date:</strong>{" "}
            {new Date(movement.created_at).toLocaleString()}
          </p>
          <p>
            <strong>Material:</strong>{" "}
            {movement.material_type} — {movement.material_id}
          </p>
          <p>
            <strong>Quantity:</strong> {movement.quantity}
          </p>
          <p>
            <strong>Warehouse:</strong>{" "}
            {movement.warehouse_name || movement.warehouse_id}
          </p>
          <p>
            <strong>Reference:</strong> {movement.reference || "—"}
          </p>

          {movement.metadata && (
            <pre className="bg-gray-100 p-2 rounded text-xs">
              {JSON.stringify(movement.metadata, null, 2)}
            </pre>
          )}
        </div>
      </div>
    </div>
  );
}

/* -------------------------------------------------------
   Main Page Component
------------------------------------------------------- */
export default function AdminStockMovementsPage() {
  const [rows, setRows] = useState<StockMovement[]>([]);
  const [warehouses, setWarehouses] = useState<Warehouse[]>([]);
  const [loading, setLoading] = useState(false);

  const [q, setQ] = useState("");
  const [warehouse, setWarehouse] = useState<string>(""); // 🔴 REQUIRED
  const [movementType, setMovementType] = useState("");

  const [fromDate, setFromDate] = useState("");
  const [toDate, setToDate] = useState("");

  const [page, setPage] = useState(0);
  const limit = 25;
  const [total, setTotal] = useState(0);

  const [drawerOpen, setDrawerOpen] = useState(false);
  const [selected, setSelected] = useState<StockMovement | null>(null);

  /* -------------------------------------------------------
     Load warehouses + auto-select
  ------------------------------------------------------- */
async function loadWarehouses() {
  try {
    const res: any = await listWarehouses();

    // ✅ EXACT MATCH to backend response
    if (!res?.ok || !Array.isArray(res.data) || res.data.length === 0) {
      console.warn("No warehouses returned", res);
      return;
    }

    const list = res.data;

    setWarehouses(list);

    // ✅ Auto-select default warehouse
    const defaultWh =
      list.find((w: any) => w.is_default === true) || list[0];

    setWarehouse(String(defaultWh.id));
  } catch (err) {
    console.error("Failed to load warehouses", err);
  }
}


  /* -------------------------------------------------------
     Load movements (GUARDED)
  ------------------------------------------------------- */
  async function load() {
    if (!warehouse) return; // ✅ prevent invalid backend call

    setLoading(true);

    try {
      const params = new URLSearchParams();
      params.append("limit", String(limit));
      params.append("offset", String(page * limit));
      params.append("warehouse_id", warehouse);

      if (q) params.append("q", q);
      if (movementType) params.append("movement_type", movementType);
      if (fromDate) params.append("from", toISODate(fromDate));
if (toDate) params.append("to", toISODate(toDate));


      const r = await apiFetch(`/inventory/movements?${params.toString()}`);

      if (r?.ok) {
        setRows(r.items || []);

        setTotal(r.total || 0);
      } else {
        setRows([]);
        setTotal(0);
      }
    } catch (err) {
      console.error("load stock movements error", err);
    }

    setLoading(false);
  }

  useEffect(() => {
    loadWarehouses();
  }, []);

  useEffect(() => {
    load();
  }, [warehouse, page]);

  function resetFilters() {
    setQ("");
    setMovementType("");
    setFromDate("");
    setToDate("");
    setPage(0);
    load();
  }

  /* -------------------------------------------------------
     Render
  ------------------------------------------------------- */
  return (
    <div className="p-6 space-y-6">
      <h1 className="text-2xl font-semibold">Stock Movements</h1>

      {/* FILTER CARD */}
      <div className="bg-white p-4 border rounded space-y-4">
        <div className="grid grid-cols-5 gap-4">
          <input
            className="border rounded p-2"
            placeholder="Search reference or type"
            value={q}
            onChange={(e) => setQ(e.target.value)}
          />

          <input
            className="border rounded p-2"
            type="date"
            value={fromDate}
            onChange={(e) => setFromDate(e.target.value)}
          />

          <input
            className="border rounded p-2"
            type="date"
            value={toDate}
            onChange={(e) => setToDate(e.target.value)}
          />

          <select
            className="border rounded p-2"
            value={movementType}
            onChange={(e) => setMovementType(e.target.value)}
          >
            <option value="">All Movement Types</option>
            <option value="receive">Receive</option>
            <option value="issue">Issue</option>
            <option value="split">Split</option>
            <option value="merge">Merge</option>
            <option value="transfer">Transfer</option>
            <option value="grn">GRN</option>
          </select>

          <select
            className="border rounded p-2"
            value={warehouse}
            onChange={(e) => {
              setPage(0);
              setWarehouse(e.target.value);
            }}
          >
            {warehouses.map((w) => (
              <option key={w.id} value={w.id}>
                {w.name}
              </option>
            ))}
          </select>
        </div>

        <div className="flex gap-3">
          <button
            onClick={() => {
              setPage(0);
              load();
            }}
            className="px-4 py-2 border rounded bg-blue-600 text-white"
          >
            Apply Filters
          </button>

          <button onClick={resetFilters} className="px-4 py-2 border rounded">
            Reset
          </button>
        </div>

        <button
          onClick={() =>
            window.open(
              `/api/inventory/movements/export/pdf?warehouse_id=${warehouse}`
            )
          }
          className="px-3 py-2 border rounded bg-white hover:bg-gray-100"
        >
          Export PDF
        </button>
      </div>

      {/* TABLE */}
      <div className="bg-white border rounded">
        <div className="grid grid-cols-7 gap-3 px-4 py-2 border-b text-sm font-medium">
          <div>Type</div>
          <div>Material</div>
          <div>Qty</div>
          <div>Warehouse</div>
          <div>Reference</div>
          <div>Date</div>
          <div>Details</div>
        </div>

        {loading ? (
          <div className="p-4 text-center text-slate-500">Loading…</div>
        ) : rows.length === 0 ? (
          <div className="p-4 text-center text-slate-500">
            No movements found
          </div>
        ) : (
          rows.map((r) => (
            <div
              key={r.id}
              className="grid grid-cols-7 gap-3 px-4 py-3 border-b text-sm hover:bg-gray-50"
            >
              <MovementBadge type={r.movement_type} />
              <div>{r.material_type} — {r.material_id}</div>
              <div>{r.quantity}</div>
              <div>{r.warehouse_name || r.warehouse_id}</div>
              <div>{r.reference || "—"}</div>
              <div>{new Date(r.created_at).toLocaleString()}</div>
              <button
                onClick={() => {
                  setSelected(r);
                  setDrawerOpen(true);
                }}
                className="px-2 py-1 text-xs border rounded"
              >
                View
              </button>
            </div>
          ))
        )}
      </div>

      {/* PAGINATION */}
      <div className="flex items-center justify-between">
        <div>
          <button
            disabled={page === 0}
            onClick={() => setPage((p) => p - 1)}
            className="px-3 py-2 border rounded mr-2"
          >
            Prev
          </button>
          <button
            disabled={(page + 1) * limit >= total}
            onClick={() => setPage((p) => p + 1)}
            className="px-3 py-2 border rounded"
          >
            Next
          </button>
        </div>

        <div className="text-sm text-slate-500">
          Showing {page * limit + 1} –{" "}
          {Math.min((page + 1) * limit, total)} of {total}
        </div>
      </div>

      <MovementDrawer
        open={drawerOpen}
        onClose={() => setDrawerOpen(false)}
        movement={selected}
      />
    </div>
  );
}

/* DRAWER ANIMATION */
const style = document.createElement("style");
style.innerHTML = `
@keyframes slideLeft {
  from { transform: translateX(100%); }
  to { transform: translateX(0); }
}
.animate-slideLeft {
  animation: slideLeft 0.25s ease-out;
}
`;
document.head.appendChild(style);
