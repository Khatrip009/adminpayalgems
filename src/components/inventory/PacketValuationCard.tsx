import React, { useMemo } from "react";

/* =====================================================
   TYPES (DEFENSIVE)
===================================================== */
type PacketItem = {
  carat: number;
  shape?: string;
  color?: string;
  clarity?: string;
};

type Packet = {
  packet_code?: string;
  status?: string;
  attributes?: Record<string, any>;
};

type Valuation = {
  total_value?: number;
  avg_rate?: number;
};

export default function PacketValuationCard({
  data,
}: {
  data: {
    packet?: Packet;
    packet_items?: PacketItem[];
    valuation?: Valuation;
  };
}) {
  if (!data?.packet) return null;

  const packet = data.packet;
  const items = data.packet_items || [];
  const valuation = data.valuation || {};

  /* =====================================================
     DERIVED — AUTHORITATIVE
  ===================================================== */

  const totalCarats = useMemo(
    () => items.reduce((s, i) => s + Number(i.carat || 0), 0),
    [items]
  );

  const pieces = items.length;

  const avgRate = Number(valuation.avg_rate || 0);
  const totalValue = Number(valuation.total_value || 0);

  /* =====================================================
     ATTRIBUTE NORMALIZATION
  ===================================================== */

  function uniqueOrMixed(values: (string | undefined)[]) {
    const u = Array.from(new Set(values.filter(Boolean)));
    if (u.length === 0) return "—";
    if (u.length === 1) return u[0];
    return "Mixed";
  }

  const shape = uniqueOrMixed(items.map(i => i.shape));
  const color = uniqueOrMixed(items.map(i => i.color));
  const clarity = uniqueOrMixed(items.map(i => i.clarity));

  /* =====================================================
     STATUS BADGE (ONLY INVENTORY STATUS)
  ===================================================== */

  function renderStatus() {
    const s = packet.status?.toLowerCase();

    if (s === "available") {
      return (
        <span className="px-2 py-0.5 text-xs rounded bg-green-50 text-green-700">
          AVAILABLE
        </span>
      );
    }

    if (s === "assigned") {
      return (
        <span className="px-2 py-0.5 text-xs rounded bg-blue-50 text-blue-700">
          ASSIGNED
        </span>
      );
    }

    if (s === "depleted") {
      return (
        <span className="px-2 py-0.5 text-xs rounded bg-red-50 text-red-700">
          DEPLETED
        </span>
      );
    }

    return (
      <span className="px-2 py-0.5 text-xs rounded bg-slate-100 text-slate-600">
        {packet.status || "—"}
      </span>
    );
  }

  /* =====================================================
     RENDER
  ===================================================== */

  return (
    <div className="p-4 bg-white border rounded-lg shadow-sm space-y-4">
      {/* HEADER */}
      <div className="flex items-center justify-between">
        <div>
          <div className="text-xs text-slate-400">Packet</div>
          <div className="text-lg font-semibold">
            {packet.packet_code || "—"}
          </div>
        </div>

        <div className="flex flex-col items-end gap-1">
          {renderStatus()}
          <div className="text-xs text-slate-400">Total Value</div>
          <div className="text-xl font-bold">
            ₹{totalValue.toFixed(2)}
          </div>
        </div>
      </div>

      {/* METRICS */}
      <div className="grid grid-cols-3 gap-4 text-sm">
        <div>
          <div className="text-xs text-slate-400">Carats</div>
          <div className="font-medium">
            {totalCarats.toFixed(3)}
          </div>
        </div>

        <div>
          <div className="text-xs text-slate-400">Pieces</div>
          <div className="font-medium">
            {pieces}
          </div>
        </div>

        <div>
          <div className="text-xs text-slate-400">Avg Rate (₹/ct)</div>
          <div className="font-medium">
            {avgRate ? avgRate.toFixed(2) : "—"}
          </div>
        </div>
      </div>

      {/* ATTRIBUTES */}
      <div className="grid grid-cols-3 gap-4 text-sm pt-2 border-t">
        <div>
          <div className="text-xs text-slate-400">Shape</div>
          <div className="font-medium">{shape}</div>
        </div>
        <div>
          <div className="text-xs text-slate-400">Color</div>
          <div className="font-medium">{color}</div>
        </div>
        <div>
          <div className="text-xs text-slate-400">Clarity</div>
          <div className="font-medium">{clarity}</div>
        </div>
      </div>
    </div>
  );
}
