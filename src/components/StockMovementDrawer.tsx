import React from "react";

export default function StockMovementDrawer({ open, onClose, movement }) {
  if (!open) return null;

  return (
    <div className="fixed inset-0 bg-black/40 flex justify-end z-50">
      <div className="w-[420px] bg-white p-6 shadow-xl animate-slideLeft">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-lg font-semibold">Movement Details</h2>
          <button onClick={onClose} className="text-gray-600 hover:text-black">✕</button>
        </div>

        <div className="space-y-3 text-sm">
          <div><strong>Type:</strong> {movement.movement_type}</div>
          <div><strong>Date:</strong> {new Date(movement.created_at).toLocaleString()}</div>
          <div><strong>Packet:</strong> {movement.packet_code || "-"}</div>
          <div><strong>Quantity:</strong> {movement.quantity}</div>
          <div><strong>Warehouse:</strong> {movement.warehouse_name || "-"}</div>
          <div><strong>Reference:</strong> {movement.reference || "-"}</div>

          {movement.metadata && (
            <div>
              <strong>Metadata:</strong>
              <pre className="bg-gray-100 p-2 rounded text-xs mt-1">
                {JSON.stringify(movement.metadata, null, 2)}
              </pre>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
