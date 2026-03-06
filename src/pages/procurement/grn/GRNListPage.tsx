import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  listGrns,
  openGrnPdf,
  downloadGrnPdf,
} from "@/api/procurement/grn.api";

export default function GRNListPage(): JSX.Element {
  const [rows, setRows] = useState<any[]>([]);
  const [q, setQ] = useState("");
  const [page, setPage] = useState(0);
  const [limit] = useState(25);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(false);

  const navigate = useNavigate();

  /* ================= LOAD ================= */

  async function load() {
    setLoading(true);
    try {
      const offset = page * limit;
      const r = await listGrns({ q: q || undefined, limit, offset });
      if (r?.ok) {
        setRows(r.results || []);
        setTotal(r.total || 0);
      }
    } catch (err) {
      console.error("load GRNs", err);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [page]);

  /* ================= PAGINATION ================= */

  function next() {
    setPage((p) => p + 1);
  }

  function prev() {
    setPage((p) => Math.max(0, p - 1));
  }

  /* ================= PDF ================= */

  async function viewPdf(grnId: string) {
    await openGrnPdf(grnId);
  }

  async function downloadPdf(grnId: string) {
    await downloadGrnPdf(grnId);
  }

  /* ================= RENDER ================= */

  return (
    <div className="p-6 space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold">
          Goods Receipt Notes (GRN)
        </h1>
      </div>

      {/* SEARCH */}
      <div className="flex gap-2">
        <input
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="Search GRN No / PO No / Supplier"
          className="border p-2 rounded w-72"
        />
        <button
          onClick={() => {
            setPage(0);
            load();
          }}
          className="px-3 py-2 border rounded"
        >
          Search
        </button>
      </div>

      {loading ? (
        <div>Loading…</div>
      ) : (
        <div>
          {/* HEADER */}
          <div className="grid grid-cols-7 gap-4 font-medium border-b pb-2 text-sm">
            <div>GRN No</div>
            <div>PO Number</div>
            <div>Supplier</div>
            <div>Warehouse</div>
            <div>Total Items</div>
            <div>Received At</div>
            <div>Actions</div>
          </div>

          {/* ROWS */}
          <div className="divide-y">
            {rows.map((r) => (
              <div
                key={r.id}
                className="grid grid-cols-7 gap-4 py-3 items-center"
              >
                <div className="font-medium">{r.grn_number}</div>
                <div>{r.po_number || "—"}</div>
                <div>{r.supplier_name || "—"}</div>
                <div>{r.warehouse_name || "—"}</div>
                <div>{r.item_count ?? 0}</div>
                <div>
                  {r.received_at
                    ? new Date(r.received_at).toLocaleString()
                    : "—"}
                </div>

                <div className="flex gap-2">
                  <button
                    onClick={() => navigate(`/admin/grn/${r.id}`)}
                    className="px-2 py-1 border rounded text-sm"
                  >
                    Open
                  </button>

                  <button
                    onClick={() => viewPdf(r.id)}
                    className="px-2 py-1 border rounded text-sm"
                  >
                    View PDF
                  </button>

                  <button
                    onClick={() => downloadPdf(r.id)}
                    className="px-2 py-1 border rounded text-sm"
                  >
                    Download
                  </button>
                </div>
              </div>
            ))}

            {rows.length === 0 && (
              <div className="p-4 text-sm text-slate-500">
                No GRN records found
              </div>
            )}
          </div>

          {/* PAGINATION */}
          <div className="flex items-center justify-between mt-4">
            <div>
              <button
                onClick={prev}
                disabled={page === 0}
                className="px-3 py-2 border rounded mr-2"
              >
                Prev
              </button>
              <button
                onClick={next}
                disabled={(page + 1) * limit >= total}
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
        </div>
      )}
    </div>
  );
}
