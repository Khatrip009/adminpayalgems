import React from "react";

export default function MovementTimeline({
  movements,
}: {
  movements: any[];
}) {
  if (!Array.isArray(movements)) return null;

  if (!movements.length) {
    return (
      <div className="bg-white border rounded-lg p-4 text-sm text-slate-500">
        No stock movements recorded
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {movements.map((m: any) => {
        /* -----------------------------
           SAFE NORMALIZATION
        ------------------------------ */
        const qty = Number(
          m.quantity ??
            m.qty ??
            m.val_qty ??
            0
        );

        const amount = Number(
          m.amount ??
            m.val_value ??
            m.valuation_value ??
            m.total_value ??
            0
        );

        let createdAt = "—";
        if (m.created_at) {
          const d = new Date(m.created_at);
          if (!isNaN(d.getTime())) {
            createdAt = d.toLocaleString();
          }
        }

        const title =
          m.movement_type ||
          m.type ||
          m.event ||
          "Movement";

        return (
          <div
            key={m.movement_id || m.id}
            className="p-3 bg-white border rounded-lg flex justify-between items-start"
          >
            <div>
              <div className="text-sm font-medium">
                {title}
              </div>

              {m.reference && (
                <div className="text-xs text-slate-500 mt-1">
                  {m.reference}
                </div>
              )}

              <div className="text-xs text-slate-400 mt-1">
                {createdAt}
              </div>
            </div>

            <div className="text-right">
              <div className="text-sm font-semibold">
                {qty.toFixed(3)} ct
              </div>

              <div className="text-xs text-slate-500">
                Val: ₹{amount.toFixed(2)}
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}
