// src/pages/GRNDetailPage.tsx
import React, { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import {
  getGrn,
  openGrnPdf,
  downloadGrnPdf,
} from "@/api/procurement/grn.api";

export default function GRNDetailPage(): JSX.Element {
  const { id: grnId } = useParams<{ id: string }>();

  const [grn, setGrn] = useState<any | null>(null);
  const [loading, setLoading] = useState(false);

  /* ================= LOAD GRN ================= */

  useEffect(() => {
    if (!grnId) return;

    setLoading(true);
    getGrn(grnId)
      .then((r) => setGrn(r?.ok ? r.grn : null))
      .catch(() => setGrn(null))
      .finally(() => setLoading(false));
  }, [grnId]);

  /* ================= PDF ================= */

  async function viewPdf() {
    if (!grnId) return;
    await openGrnPdf(grnId);
  }

  async function downloadPdf() {
    if (!grnId) return;
    await downloadGrnPdf(grnId);
  }

  if (!grnId) return <div className="p-6">GRN ID missing</div>;

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold">
          GRN: {grn?.grn_number || grnId}
        </h1>

        <div className="flex gap-2">
          <button
            onClick={viewPdf}
            className="px-3 py-2 border rounded hover:bg-slate-50"
          >
            View PDF
          </button>

          <button
            onClick={downloadPdf}
            className="px-3 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
          >
            Download PDF
          </button>
        </div>
      </div>

      {loading ? (
        <div>Loading…</div>
      ) : grn ? (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="p-4 border rounded bg-white space-y-2">
            <div><strong>PO Number:</strong> {grn.po_number || "—"}</div>
            <div><strong>Supplier:</strong> {grn.supplier_name || "—"}</div>
            <div><strong>Warehouse:</strong> {grn.warehouse_name || "—"}</div>
            <div>
              <strong>Received At:</strong>{" "}
              {grn.received_at
                ? new Date(grn.received_at).toLocaleString()
                : "—"}
            </div>
            <div><strong>Received By:</strong> {grn.received_by_name || "—"}</div>
          </div>

          <div className="p-4 border rounded bg-white">
            <h2 className="font-semibold mb-3">Items</h2>
            <div className="space-y-2">
              {grn.items?.length ? (
                grn.items.map((it: any) => (
                  <div
                    key={it.id}
                    className="border rounded p-3 flex justify-between"
                  >
                    <div>
                      <div className="font-medium">
                        {it.description || "Item"}
                      </div>
                      <div className="text-sm text-slate-500">
                        {Number(it.qty).toFixed(3)} {it.uom || "pcs"} × ₹
                        {Number(it.unit_price || 0).toFixed(2)}
                      </div>
                    </div>
                    <div className="font-semibold">
                      ₹{Number(it.total || 0).toFixed(2)}
                    </div>
                  </div>
                ))
              ) : (
                <div className="text-sm text-slate-500">No items found</div>
              )}
            </div>
          </div>
        </div>
      ) : (
        <div className="text-sm text-slate-500">GRN not found</div>
      )}
    </div>
  );
}
