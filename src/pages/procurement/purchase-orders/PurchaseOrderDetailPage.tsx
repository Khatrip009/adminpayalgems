import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import {
  getPurchaseOrder,
  deletePurchaseOrder,
  getPoPdfUrl,
  downloadPdfBlob,
  receivePurchaseOrder,
} from "@/api/procurement/purchaseOrders.api";
import { getGrnPdfUrl } from "@/api/procurement/grn.api";
import { listWarehouses } from "@/api/masters/warehouses.api";

export default function PurchaseOrderDetailPage(): JSX.Element {
  const { id } = useParams();
  const navigate = useNavigate();

  const [po, setPo] = useState<any | null>(null);
  const [loading, setLoading] = useState(false);
  const [receiving, setReceiving] = useState(false);
  const [grnInfo, setGrnInfo] = useState<any | null>(null);
  const [defaultWarehouseId, setDefaultWarehouseId] = useState<number | null>(null);

  /* ======================================================
     LOAD PO
  ====================================================== */

  async function load() {
    if (!id) return;
    setLoading(true);
    try {
      const r = await getPurchaseOrder(id);
      setPo(r?.ok ? r.purchase_order : null);
    } catch (err) {
      console.error("getPurchaseOrder error", err);
      setPo(null);
    }
    setLoading(false);
  }

  useEffect(() => {
    load();
  }, [id]);

  /* ======================================================
     LOAD DEFAULT WAREHOUSE
  ====================================================== */

  useEffect(() => {
    async function loadDefaultWarehouse() {
      try {
        const r = await listWarehouses();
        const rows = r?.data || r;
        const def = rows?.find((w: any) => w.is_default);
        if (def) setDefaultWarehouseId(def.id);
      } catch (err) {
        console.error("default warehouse load failed", err);
      }
    }
    loadDefaultWarehouse();
  }, []);

  /* ======================================================
     PDF HELPERS (AUTH SAFE)
  ====================================================== */

  async function openPdf() {
    if (!id) return;
    try {
      await downloadPdfBlob(getPoPdfUrl(id), undefined, { open: true });
    } catch (err) {
      console.error("Open PDF error", err);
      alert("Failed to open PDF");
    }
  }

  async function downloadPdf() {
    if (!id) return;
    try {
      await downloadPdfBlob(
        getPoPdfUrl(id),
        `PO_${po?.po_number || id}.pdf`
      );
    } catch (err) {
      console.error("Download PDF error", err);
      alert("Failed to download PDF");
    }
  }

  function openGrnPdf() {
    if (!po || !grnInfo) return;
    window.open(getGrnPdfUrl(po.id, grnInfo.id), "_blank");
  }

  /* ======================================================
     ACTIONS
  ====================================================== */

  async function onDelete() {
    if (!id) return;
    if (!confirm("Delete this Purchase Order?")) return;

    try {
      const r = await deletePurchaseOrder(id);
      if (r?.ok) {
        alert("Purchase Order deleted");
        navigate("/admin/purchase-orders");
      } else {
        alert("Delete failed");
      }
    } catch (err) {
      console.error("delete error", err);
      alert("Delete failed");
    }
  }

  async function onReceive() {
    if (!id || !po) return;
    if (!confirm("Mark this PO as received and generate GRN?")) return;

    setReceiving(true);

    try {
      const warehouseId =
        po.metadata?.warehouse_id || defaultWarehouseId;

      if (!warehouseId) {
        alert("No warehouse selected or default warehouse found");
        return;
      }

      const itemsPayload = po.items.map((it: any) => {
        if (it.material_type === "commodity" && !it.material_id) {
          throw new Error(`Missing material_id for item "${it.description || it.id}"`);
        }

        return {
          purchase_order_item_id: it.id,
          material_type: it.material_type || "commodity",
          material_id: it.material_type === "commodity" ? it.material_id : null,
          warehouse_id: warehouseId,
          qty: it.qty,
          unit_price: it.unit_price,
          valuation: it.unit_price,
        };
      });

      const r = await receivePurchaseOrder(id, {
        warehouse_id: warehouseId,
        items: itemsPayload,
      });

      if (r?.ok) {
        alert("PO received. GRN generated.");
        setGrnInfo(r.grn?.grn || r.grn);
        load();
      } else {
        alert(r?.error || "Receive failed");
      }
    } catch (err: any) {
      console.error("receive error", err);
      alert(err.message || "Receive failed");
    } finally {
      setReceiving(false);
    }
  }

  /* ======================================================
     RENDER
  ====================================================== */

  if (!id) return <div className="p-6 text-sm">PO id required</div>;

  return (
    <div className="p-6 space-y-6">
      {/* HEADER */}
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-semibold">
          Purchase Order: <span className="font-bold">{po?.po_number}</span>
        </h1>

        <div className="flex gap-2">
          <button
            onClick={() => navigate(`/admin/purchase-orders/${id}/edit`)}
            className="px-3 py-1 border rounded text-sm"
          >
            Edit
          </button>

          <button
            onClick={() => navigate("/admin/print")}
            className="px-3 py-1 border rounded text-sm"
          >
            Print Center
          </button>

          <button
            onClick={onDelete}
            className="px-3 py-1 border rounded text-sm text-red-600"
          >
            Delete
          </button>
        </div>
      </div>

      {/* PDF / RECEIVE */}
      <div className="flex gap-2">
        <button onClick={openPdf} className="px-3 py-1 border rounded text-sm">
          View PDF
        </button>

        <button onClick={downloadPdf} className="px-3 py-1 border rounded text-sm">
          Download PDF
        </button>

        {po?.status === "created" && (
          <button
            disabled={receiving}
            onClick={onReceive}
            className="px-3 py-1 bg-emerald-600 text-white rounded text-sm"
          >
            {receiving ? "Receiving..." : "Receive → Create GRN"}
          </button>
        )}
      </div>

      {/* GRN INFO */}
      {grnInfo && (
        <div className="border p-3 bg-white rounded text-sm space-y-1">
          <div className="font-semibold">GRN Created</div>
          <div>GRN No: {grnInfo.grn_number}</div>
          <div>Received At: {new Date(grnInfo.received_at).toLocaleString()}</div>
          <button
            onClick={openGrnPdf}
            className="px-3 py-1 border rounded text-xs mt-1"
          >
            View GRN PDF
          </button>
        </div>
      )}

      {/* MAIN */}
      {loading ? (
        <div>Loading…</div>
      ) : !po ? (
        <div className="text-sm text-slate-600">PO not found</div>
      ) : (
        <div className="grid grid-cols-3 gap-4">
          {/* LEFT */}
          <div className="border rounded bg-white p-3 text-sm space-y-2">
            <div><b>Supplier:</b> {po.supplier_name || po.supplier_id || "—"}</div>
            <div><b>Purchased By:</b> {po.purchased_by_name || po.purchased_by || "—"}</div>
            <div><b>Currency:</b> {po.currency}</div>
            <div><b>Total Amount:</b> ₹{Number(po.total_amount).toFixed(2)}</div>
            <div>
              <b>Status:</b>{" "}
              <span className="px-2 py-1 text-xs rounded border capitalize">
                {po.status}
              </span>
            </div>
          </div>

          {/* ITEMS */}
          <div className="col-span-2 border rounded bg-white p-3">
            <div className="font-semibold text-sm mb-2">Items</div>

            <div className="grid grid-cols-5 px-2 py-1 border-b text-xs font-medium">
              <div>Description</div>
              <div className="text-right">Qty</div>
              <div className="text-right">UOM</div>
              <div className="text-right">Price</div>
              <div className="text-right">Total</div>
            </div>

            <div className="divide-y text-xs">
              {(po.items || []).map((it: any) => (
                <div key={it.id} className="grid grid-cols-5 px-2 py-1">
                  <div>{it.description || "-"}</div>
                  <div className="text-right">{it.qty}</div>
                  <div className="text-right">{it.unit_of_measure || "-"}</div>
                  <div className="text-right">₹{Number(it.unit_price).toFixed(2)}</div>
                  <div className="text-right">₹{Number(it.total_price).toFixed(2)}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
