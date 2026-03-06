import React from "react";

type PacketCardProps = {
  packet: {
    id: string;
    packet_code: string;

    // FIFO truth (preferred)
    available_carats?: number;

    // backward compatibility
    stock_quantity?: number;

    // inventory lifecycle (AUTHORITATIVE)
    status?: string;

    // informational attributes ONLY
    attributes?: {
      shape?: string;
      color?: string;
      clarity?: string;
      stage?: string;
      source?: string;
      [key: string]: any;
    };
  };
};

export default function PacketCard({ packet }: PacketCardProps) {
  const { packet_code, status, attributes } = packet;

  const shape = attributes?.shape ?? null;
  const color = attributes?.color ?? null;
  const clarity = attributes?.clarity ?? null;
  const stage = attributes?.stage ?? null;
  const source = attributes?.source ?? null;

  /* =====================================================
     FIFO STOCK (SINGLE SOURCE OF QUANTITY)
  ===================================================== */
  const available =
    typeof packet.available_carats === "number"
      ? packet.available_carats
      : typeof packet.stock_quantity === "number"
      ? packet.stock_quantity
      : 0;

  /* =====================================================
     RAW vs SORTED (NO GUESSING)
     RAW = no diamond attributes present
  ===================================================== */
  const isRawPacket =
    !shape && !color && !clarity;

  /* =====================================================
     STATUS BADGE (INVENTORY LIFECYCLE ONLY)
  ===================================================== */
  function renderStatus() {
    const s = String(status || "").toLowerCase();

    if (s === "available") {
      return (
        <span className="text-xs px-2 py-0.5 rounded font-medium bg-green-50 text-green-700">
          AVAILABLE
        </span>
      );
    }

    if (s === "assigned") {
      return (
        <span className="text-xs px-2 py-0.5 rounded font-medium bg-blue-50 text-blue-700">
          ASSIGNED
        </span>
      );
    }

    if (s === "depleted") {
      return (
        <span className="text-xs px-2 py-0.5 rounded font-medium bg-red-50 text-red-700">
          DEPLETED
        </span>
      );
    }

    return (
      <span className="text-xs px-2 py-0.5 rounded font-medium bg-slate-100 text-slate-600">
        —
      </span>
    );
  }

  return (
    <div className="border rounded-xl p-4 bg-white hover:shadow-md transition cursor-pointer">
      {/* =====================================================
         HEADER
      ===================================================== */}
      <div className="flex justify-between items-start mb-2">
        <div className="font-semibold text-sm text-slate-800">
          {packet_code || "—"}
        </div>

        {renderStatus()}
      </div>

      {/* =====================================================
         CONTENT
      ===================================================== */}
      {isRawPacket ? (
        <div className="text-xs text-orange-700 bg-orange-50 border border-orange-200 rounded p-2 mb-3">
          Raw packet from {source || "inventory"} (not yet assorted)
        </div>
      ) : (
        <div className="grid grid-cols-3 gap-2 text-xs text-slate-700 mb-3">
          <div>
            <div className="text-[11px] text-slate-400">Shape</div>
            <div className="font-medium">{shape}</div>
          </div>

          <div>
            <div className="text-[11px] text-slate-400">Color</div>
            <div className="font-medium">{color}</div>
          </div>

          <div>
            <div className="text-[11px] text-slate-400">Clarity</div>
            <div className="font-medium">{clarity}</div>
          </div>
        </div>
      )}

      {/* =====================================================
         FOOTER
      ===================================================== */}
      <div className="flex justify-between items-center text-xs text-slate-600 border-t pt-2">
        <div>
          <span className="text-slate-400">Carats:</span>{" "}
          <span className="font-semibold text-slate-800">
            {Number(available).toFixed(3)}
          </span>
        </div>

        <div className="text-[11px] text-slate-400">
          Inventory
        </div>
      </div>
    </div>
  );
}
