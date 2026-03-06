import React from "react";

export default function FifoLayerTable({
  layers,
}: {
  layers: any[];
}) {
  if (!Array.isArray(layers)) return null;

  if (!layers.length) {
    return (
      <div className="bg-white border rounded-lg p-4 text-sm text-slate-500">
        No FIFO layers available
      </div>
    );
  }

  return (
    <div className="overflow-x-auto bg-white border rounded-lg">
      <table className="w-full text-sm">
        <thead className="bg-slate-50">
          <tr>
            <th className="p-2 text-left">Layer Date</th>
            <th className="p-2 text-right">Qty</th>
            <th className="p-2 text-right">Remaining</th>
            <th className="p-2 text-right">Unit Price</th>
            <th className="p-2 text-right">Total Value</th>
            <th className="p-2 text-left">Warehouse</th>
          </tr>
        </thead>

        <tbody>
          {layers.map((l) => {
            const qty = Number(l.qty || 0);
            const remaining = Number(l.remaining_qty || 0);
            const unitPrice = Number(l.unit_price || 0);
            const totalValue = Number(l.total_value || 0);

            let createdAt = "—";
            if (l.created_at) {
              const d = new Date(l.created_at);
              if (!isNaN(d.getTime())) {
                createdAt = d.toLocaleString();
              }
            }

            return (
              <tr key={l.id} className="border-t">
                <td className="p-2">{createdAt}</td>

                <td className="p-2 text-right">
                  {qty.toFixed(3)}
                </td>

                <td className="p-2 text-right">
                  {remaining.toFixed(3)}
                </td>

                <td className="p-2 text-right">
                  ₹{unitPrice.toFixed(2)}
                </td>

                <td className="p-2 text-right">
                  ₹{totalValue.toFixed(2)}
                </td>

                <td className="p-2 text-left">
                  {l.warehouse_name ||
                    l.warehouse_id ||
                    "—"}
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
