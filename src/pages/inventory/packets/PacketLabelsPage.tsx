// src/pages/inventory/packets/PacketLabelsPage.tsx
import React, { useState } from "react";
import { generatePacketLabelsPdf } from "@/api/masters/barcodes.api";

export default function PacketLabelsPage() {
  const [packetsText, setPacketsText] = useState(""); // CSV: packet_id,packet_code,shape,color,clarity
  const [loading, setLoading] = useState(false);

  async function onDownload() {
    // parse simple CSV lines
    const lines = packetsText.split(/\r?\n/).map(l => l.trim()).filter(Boolean);
    const packets = lines.map(l => {
      const cols = l.split(",").map(c=>c.trim());
      return { id: cols[0], packet_code: cols[1]||cols[0], shape: cols[2]||'', color: cols[3]||'', clarity: cols[4]||'' };
    });
    if (!packets.length) return alert("Add at least one packet line");
    setLoading(true);
    try {
      const blob = await generatePacketLabelsPdf(packets);
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = "packet_labels.pdf";
      a.click();
      URL.revokeObjectURL(url);
    } catch (err:any) {
      alert("Error generating labels: " + err?.message);
    } finally { setLoading(false); }
  }

  return (
    <div className="p-6 space-y-4">
      <h1 className="text-2xl font-semibold">Packet Labels</h1>
      <p className="text-sm text-slate-500">Enter CSV lines: packet_id,packet_code,shape,color,clarity</p>
      <textarea className="w-full border p-2 h-40" value={packetsText} onChange={(e)=>setPacketsText(e.target.value)} />
      <div>
        <button onClick={onDownload} className="px-4 py-2 bg-emerald-600 text-white rounded" disabled={loading}>
          {loading ? "Generating…" : "Download Labels PDF"}
        </button>
      </div>
    </div>
  );
}
