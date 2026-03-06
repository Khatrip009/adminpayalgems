import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";

import {
  listPurchaseOrders,
  importPurchaseOrdersCsv,
  exportPurchaseOrdersCsv,
  getPoPdfUrl,
  downloadPdfBlob,
} from "@/api/procurement/purchaseOrders.api";

export default function PurchaseOrdersPage(): JSX.Element {
  const navigate = useNavigate();

  const [rows, setRows] = useState<any[]>([]);
  const [q, setQ] = useState("");
  const [loading, setLoading] = useState(false);

  const [page, setPage] = useState(0);
  const limit = 25;
  const [total, setTotal] = useState(0);

  const [importing, setImporting] = useState(false);

  async function load() {
    setLoading(true);
    try {
      const offset = page * limit;
      const r = await listPurchaseOrders({
        q: q || undefined,
        limit,
        offset,
      });

      if (r?.ok) {
        setRows(r.results || []);
        setTotal(Number(r.total || 0));
      }
    } catch (err) {
      console.error("load purchase orders error", err);
      setRows([]);
    }
    setLoading(false);
  }

  useEffect(() => {
    load();
  }, [page]);

  function resetSearch() {
    setQ("");
    setPage(0);
    load();
  }

  async function importCsv(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    setImporting(true);

    try {
      const text = await file.text();
      const r = await importPurchaseOrdersCsv(text);

      if (r?.ok) {
        alert(`Imported ${r.created_count} purchase orders`);
        setPage(0);
        load();
      }
    } catch (err) {
      console.error("CSV import error", err);
      alert("CSV Import failed");
    }

    setImporting(false);
    e.target.value = "";
  }

  function exportCsv() {
    const url = exportPurchaseOrdersCsv({
      q: q || undefined,
      limit: 9999,
      offset: 0,
    });
    if (url) window.open(url, "_blank");
  }

  function openPdf(id: string) {
    window.open(getPoPdfUrl(id), "_blank");
  }

  async function downloadPdf(id: string, po: string) {
    try {
      await downloadPdfBlob(getPoPdfUrl(id), `PO_${po || id}.pdf`);
    } catch (err) {
      console.error("PDF download error", err);
      alert("Download failed");
    }
  }

  return (
    <div className="p-6 space-y-6">
      {/* HEADER */}
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold">Purchase Orders</h1>

        <div className="flex gap-2">
          <button
            onClick={() => navigate("/admin/purchase-orders/create")}
            className="px-3 py-2 border rounded bg-blue-600 text-white"
          >
            Create PO
          </button>

          <button
            onClick={() => navigate("/admin/print")}
            className="px-3 py-2 border rounded"
          >
            Print Center
          </button>

          <button onClick={exportCsv} className="px-3 py-2 border rounded">
            Export CSV
          </button>

          <label className="px-3 py-2 border rounded cursor-pointer bg-white">
            {importing ? "Importing…" : "Import CSV"}
            <input
              type="file"
              accept=".csv"
              onChange={importCsv}
              className="hidden"
              disabled={importing}
            />
          </label>
        </div>
      </div>

      {/* SEARCH */}
      <div className="flex gap-3">
        <input
          className="border rounded p-2 w-80"
          placeholder="Search PO…"
          value={q}
          onChange={(e) => setQ(e.target.value)}
        />
        <button
          onClick={() => {
            setPage(0);
            load();
          }}
          className="px-3 py-2 border rounded bg-blue-600 text-white"
        >
          Search
        </button>
        <button onClick={resetSearch} className="px-3 py-2 border rounded">
          Reset
        </button>
      </div>

      {/* TABLE */}
      <div className="bg-white border rounded">
        <div className="grid grid-cols-8 px-4 py-2 border-b font-medium text-sm">
          <div>PO #</div>
          <div>Supplier</div>
          <div>Created By</div>
          <div className="text-right">Amount</div>
          <div>Status</div>
          <div>GRN</div>
          <div>Actions</div>
          <div>PDF</div>
        </div>

        {loading ? (
          <div className="p-4 text-center">Loading…</div>
        ) : rows.length === 0 ? (
          <div className="p-4 text-center text-slate-500">
            No purchase orders
          </div>
        ) : (
          rows.map((po) => (
            <div
              key={po.id}
              className="grid grid-cols-8 px-4 py-3 border-b text-sm items-center hover:bg-gray-50"
            >
              <div className="font-medium">{po.po_number}</div>

              <div>{po.supplier_name || po.supplier_id || "—"}</div>

              <div>{po.purchased_by_name || po.purchased_by || "—"}</div>

              <div className="text-right">
                ₹{Number(po.total_amount || 0).toFixed(2)}
              </div>

              <div>
                <span
                  className={`px-2 py-1 rounded text-xs border capitalize ${
                    po.status === "completed"
                      ? "bg-green-100 text-green-700 border-green-300"
                      : po.status === "created"
                      ? "bg-yellow-100 text-yellow-700 border-yellow-300"
                      : "bg-gray-100 text-gray-700 border-gray-300"
                  }`}
                >
                  {po.status}
                </span>
              </div>

              <div>
                {po.status === "completed" ? (
                  <span className="text-green-700 font-medium">✓ Created</span>
                ) : (
                  "—"
                )}
              </div>

              <div className="flex gap-2">
                <button
                  onClick={() =>
                    navigate(`/admin/purchase-orders/${po.id}`)
                  }
                  className="px-2 py-1 border rounded text-xs"
                >
                  Open
                </button>
                <button
                  onClick={() =>
                    navigate(`/admin/purchase-orders/${po.id}/edit`)
                  }
                  className="px-2 py-1 border rounded text-xs"
                >
                  Edit
                </button>
              </div>

              <div className="flex gap-2">
                <button
                  onClick={() => openPdf(po.id)}
                  className="px-2 py-1 border rounded text-xs"
                >
                  View
                </button>
                <button
                  onClick={() => downloadPdf(po.id, po.po_number)}
                  className="px-2 py-1 border rounded text-xs"
                >
                  Download
                </button>
              </div>
            </div>
          ))
        )}
      </div>

      {/* PAGINATION */}
      <div className="flex items-center justify-between">
        <div>
          <button
            disabled={page === 0}
            onClick={() => setPage((p) => Math.max(0, p - 1))}
            className="px-3 py-2 border rounded mr-2 disabled:opacity-50"
          >
            Prev
          </button>

          <button
            disabled={(page + 1) * limit >= total}
            onClick={() => setPage((p) => p + 1)}
            className="px-3 py-2 border rounded disabled:opacity-50"
          >
            Next
          </button>
        </div>

        <div className="text-sm text-slate-600">
          Showing {page * limit + 1}–
          {Math.min((page + 1) * limit, total)} of {total}
        </div>
      </div>
    </div>
  );
}
