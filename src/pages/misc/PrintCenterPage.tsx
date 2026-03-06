import React, { useEffect, useState } from "react";
import {
  getPoPdfUrl,
  downloadPdfBlob,
  listPurchaseOrders,
} from "@/api/procurement/purchaseOrders.api";
import { listGrns } from "@/api/procurement/grn.api";
import { generatePacketLabelsPdf } from "@/api/masters/barcodes.api";

export default function PrintCenterPage(): JSX.Element {
  /* ======================================================
     STATE
  ====================================================== */

  const [pos, setPos] = useState<any[]>([]);
  const [grns, setGrns] = useState<any[]>([]);

  const [poId, setPoId] = useState("");
  const [grnId, setGrnId] = useState("");

  const [packetsCsv, setPacketsCsv] = useState("");

  /* ======================================================
     LOAD PURCHASE ORDERS
  ====================================================== */

  useEffect(() => {
    async function loadPos() {
      try {
        const r = await listPurchaseOrders({ limit: 100 });
        setPos(r?.results || r?.data || []);
      } catch (err) {
        console.error("PO load failed", err);
        setPos([]);
      }
    }
    loadPos();
  }, []);

  /* ======================================================
     LOAD GRNs FOR SELECTED PO
  ====================================================== */

  useEffect(() => {
    if (!poId) {
      setGrns([]);
      setGrnId("");
      return;
    }

    async function loadGrns() {
      try {
        const r = await listGrns({ purchase_order_id: poId });
        setGrns(r?.results || r?.data || []);
      } catch (err) {
        console.error("GRN load failed", err);
        setGrns([]);
      }
    }

    loadGrns();
  }, [poId]);

  /* ======================================================
     PDF ACTIONS (AUTH-SAFE)
  ====================================================== */

  async function openPoPdf() {
    if (!poId) return;
    await downloadPdfBlob(getPoPdfUrl(poId), undefined, { open: true });
  }

  async function downloadPoPdf() {
    if (!poId) return;
    await downloadPdfBlob(getPoPdfUrl(poId), `PO_${poId}.pdf`);
  }

  async function openGrnPdf() {
    if (!grnId) return;

    await downloadPdfBlob(
      `/procurement/grns/${grnId}/pdf`,
      undefined,
      { open: true }
    );
  }

  /* ======================================================
     PACKET LABELS
  ====================================================== */

  async function labels() {
    const lines = packetsCsv
      .split(/\r?\n/)
      .map(l => l.trim())
      .filter(Boolean);

    const packets = lines.map(l => {
      const cols = l.split(",").map(c => c.trim());
      return {
        id: cols[0],
        packet_code: cols[1] || cols[0],
        shape: cols[2] || "",
        color: cols[3] || "",
        clarity: cols[4] || "",
      };
    });

    if (!packets.length) {
      alert("No packets provided");
      return;
    }

    const blob = await generatePacketLabelsPdf(packets);
    const url = URL.createObjectURL(blob);

    window.open(url, "_blank");
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  }

  /* ======================================================
     RENDER
  ====================================================== */

  return (
    <div className="p-6 space-y-6">
      <h1 className="text-2xl font-semibold">Print Center</h1>

      {/* ================= PURCHASE ORDER ================= */}
      <div className="p-4 border rounded space-y-3">
        <h2 className="font-semibold">Purchase Order</h2>

        <select
          className="border p-2 w-full"
          value={poId}
          onChange={(e) => setPoId(e.target.value)}
        >
          <option value="">Select Purchase Order</option>
          {pos.map((po) => (
            <option key={po.id} value={po.id}>
              {po.po_number || po.id}
            </option>
          ))}
        </select>

        <div className="flex gap-2">
          <button
            disabled={!poId}
            onClick={openPoPdf}
            className="px-3 py-2 border rounded disabled:opacity-50"
          >
            View PDF
          </button>

          <button
            disabled={!poId}
            onClick={downloadPoPdf}
            className="px-3 py-2 bg-blue-600 text-white rounded disabled:opacity-50"
          >
            Download
          </button>
        </div>
      </div>

      {/* ================= GRN ================= */}
      <div className="p-4 border rounded space-y-3">
        <h2 className="font-semibold">GRN</h2>

        <select
          className="border p-2 w-full"
          value={grnId}
          onChange={(e) => setGrnId(e.target.value)}
          disabled={!poId}
        >
          <option value="">
            {poId ? "Select GRN" : "Select PO first"}
          </option>
          {grns.map((g) => (
            <option key={g.id} value={g.id}>
              {g.grn_number || g.id}
            </option>
          ))}
        </select>

        <button
          disabled={!grnId}
          onClick={openGrnPdf}
          className="px-3 py-2 border rounded disabled:opacity-50"
        >
          View GRN PDF
        </button>
      </div>

      {/* ================= PACKET LABELS ================= */}
      <div className="p-4 border rounded space-y-3">
        <h2 className="font-semibold">Packet Labels (CSV)</h2>

        <textarea
          className="w-full border p-2 h-32"
          value={packetsCsv}
          onChange={(e) => setPacketsCsv(e.target.value)}
          placeholder="packet_id,packet_code,shape,color,clarity"
        />

        <button
          onClick={labels}
          className="px-4 py-2 bg-emerald-600 text-white rounded"
        >
          Generate Labels PDF
        </button>
      </div>
    </div>
  );
}
