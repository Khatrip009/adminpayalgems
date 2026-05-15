// src/components/OrderShipments.tsx
import React, { useEffect, useState } from "react";
import { toast } from "react-hot-toast";
import { api } from "@/lib/apiClient";

/* --------------- TYPES --------------- */
interface Shipment {
  id: string;
  order_id: string;
  shipping_method_id: string | null;
  tracking_number: string | null;
  carrier: string | null;
  status: "pending" | "shipped" | "delivered" | "cancelled";
  shipped_at: string | null;
  delivered_at: string | null;
  metadata: any;
  created_at: string;
  updated_at: string;
}

interface ShipmentItem {
  id: string;
  shipment_id: string;
  order_item_id: string;
  quantity: number;
  product_title?: string;
  created_at: string;
}

const SHIPMENT_STATUSES = ["pending", "shipped", "delivered", "cancelled"];

/* --------------- COMPONENT --------------- */
interface Props {
  orderId: string;
}

export const OrderShipments: React.FC<Props> = ({ orderId }) => {
  const [shipments, setShipments] = useState<Shipment[]>([]);
  const [loading, setLoading] = useState(false);

  const [newStatus, setNewStatus] = useState("pending");
  const [tracking, setTracking] = useState("");
  const [carrier, setCarrier] = useState("");

  // Expanded shipment → show items
  const [expandedShipment, setExpandedShipment] = useState<string | null>(null);
  const [items, setItems] = useState<ShipmentItem[]>([]);
  const [itemsLoading, setItemsLoading] = useState(false);

  // Add item form
  const [addingItem, setAddingItem] = useState(false);
  const [itemOrderItemId, setItemOrderItemId] = useState("");
  const [itemQuantity, setItemQuantity] = useState(1);

  // ---------- Load shipments ----------
  const loadShipments = async () => {
    setLoading(true);
    try {
      const res = await api.get(`/logistics/shipments?order_id=${encodeURIComponent(orderId)}`);
      if (res.ok) {
        setShipments(res.shipments || []);
      } else {
        toast.error("Failed to load shipments");
      }
    } catch (err) {
      toast.error("Error loading shipments");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (orderId) loadShipments();
  }, [orderId]);

  // ---------- Create shipment ----------
  const handleCreate = async () => {
    try {
      const res = await api.post(`/logistics/shipments`, {
        order_id: orderId,
        status: newStatus,
        tracking_number: tracking || null,
        carrier: carrier || null,
      });
      if (res.ok) {
        toast.success("Shipment created");
        loadShipments();
        setTracking("");
        setCarrier("");
        setNewStatus("pending");
      } else {
        toast.error("Failed to create shipment");
      }
    } catch (err) {
      toast.error("Error creating shipment");
    }
  };

  // ---------- Update status/tracking ----------
  const handleUpdate = async (shipmentId: string, fields: Partial<Shipment>) => {
    try {
      const res = await api.put(`/logistics/shipments/${shipmentId}`, fields);
      if (res.ok) {
        toast.success("Shipment updated");
        loadShipments();
      } else {
        toast.error("Failed to update shipment");
      }
    } catch (err) {
      toast.error("Error updating shipment");
    }
  };

  // ---------- Delete shipment ----------
  const handleDelete = async (shipmentId: string) => {
    if (!confirm("Delete this shipment?")) return;
    try {
      const res = await api.delete(`/logistics/shipments/${shipmentId}`);
      if (res.ok) {
        toast.success("Shipment deleted");
        loadShipments();
      } else {
        toast.error("Failed to delete shipment");
      }
    } catch (err) {
      toast.error("Error deleting shipment");
    }
  };

  // ---------- Load items for a shipment ----------
  const loadItems = async (shipmentId: string) => {
    if (expandedShipment === shipmentId) {
      setExpandedShipment(null);
      return;
    }
    setExpandedShipment(shipmentId);
    setItemsLoading(true);
    try {
      const res = await api.get(`/logistics/shipments/${shipmentId}/items`);
      if (res.ok) {
        setItems(res.items || []);
      } else {
        toast.error("Failed to load items");
      }
    } catch (err) {
      toast.error("Error loading items");
    } finally {
      setItemsLoading(false);
    }
  };

  // ---------- Add item to shipment ----------
  const handleAddItem = async (shipmentId: string) => {
    if (!itemOrderItemId.trim()) {
      toast.error("Order item ID required");
      return;
    }
    try {
      const res = await api.post(`/logistics/shipments/${shipmentId}/items`, {
        order_item_id: itemOrderItemId.trim(),
        quantity: itemQuantity,
      });
      if (res.ok) {
        toast.success("Item added");
        loadItems(shipmentId);
        setItemOrderItemId("");
        setItemQuantity(1);
        setAddingItem(false);
      } else {
        toast.error("Failed to add item");
      }
    } catch (err) {
      toast.error("Error adding item");
    }
  };

  // ---------- Remove item ----------
  const handleRemoveItem = async (itemId: string, shipmentId: string) => {
    try {
      const res = await api.delete(`/logistics/shipments/items/${itemId}`);
      if (res.ok) {
        toast.success("Item removed");
        loadItems(shipmentId);
      } else {
        toast.error("Failed to remove item");
      }
    } catch (err) {
      toast.error("Error removing item");
    }
  };

  return (
    <div className="bg-white rounded-lg shadow p-4 space-y-4">
      <h3 className="text-lg font-semibold">Shipments for Order #{orderId}</h3>

      {/* Create new shipment */}
      <div className="flex flex-wrap gap-2 items-end border-b pb-3">
        <select
          value={newStatus}
          onChange={(e) => setNewStatus(e.target.value)}
          className="border rounded p-2 text-sm"
        >
          {SHIPMENT_STATUSES.map((s) => (
            <option key={s} value={s}>{s}</option>
          ))}
        </select>
        <input
          type="text"
          placeholder="Tracking number"
          value={tracking}
          onChange={(e) => setTracking(e.target.value)}
          className="border rounded p-2 text-sm"
        />
        <input
          type="text"
          placeholder="Carrier"
          value={carrier}
          onChange={(e) => setCarrier(e.target.value)}
          className="border rounded p-2 text-sm"
        />
        <button
          onClick={handleCreate}
          className="bg-blue-600 text-white px-4 py-2 rounded text-sm"
        >
          Create Shipment
        </button>
      </div>

      {/* Shipments list */}
      {loading ? (
        <div className="text-center text-gray-500">Loading...</div>
      ) : shipments.length === 0 ? (
        <div className="text-gray-500">No shipments created yet.</div>
      ) : (
        shipments.map((s) => (
          <div key={s.id} className="border rounded p-3 space-y-2">
            <div className="flex justify-between items-center">
              <div>
                <span className="font-medium">Status: </span>
                <select
                  value={s.status}
                  onChange={(e) => handleUpdate(s.id, { status: e.target.value })}
                  className="border rounded p-1 text-sm"
                >
                  {SHIPMENT_STATUSES.map((st) => (
                    <option key={st} value={st}>{st}</option>
                  ))}
                </select>
                <span className="ml-4 text-sm text-gray-500">
                  Tracking: {s.tracking_number || "—"} | Carrier: {s.carrier || "—"}
                </span>
              </div>
              <button
                onClick={() => handleDelete(s.id)}
                className="text-red-500 text-sm hover:underline"
              >
                Delete
              </button>
            </div>
            <div className="flex gap-2 items-center">
              <input
                type="text"
                placeholder="Update tracking"
                onBlur={(e) =>
                  e.target.value && handleUpdate(s.id, { tracking_number: e.target.value })
                }
                className="border rounded p-1 text-sm w-40"
              />
              <input
                type="text"
                placeholder="Update carrier"
                onBlur={(e) =>
                  e.target.value && handleUpdate(s.id, { carrier: e.target.value })
                }
                className="border rounded p-1 text-sm w-40"
              />
              <button
                onClick={() => loadItems(s.id)}
                className="text-blue-600 text-sm hover:underline"
              >
                {expandedShipment === s.id ? "Hide Items" : "View Items"}
              </button>
            </div>

            {/* Expanded items */}
            {expandedShipment === s.id && (
              <div className="pl-4 border-l-2 border-blue-200 mt-2 space-y-2">
                {itemsLoading ? (
                  <span className="text-gray-500 text-sm">Loading items...</span>
                ) : items.length === 0 ? (
                  <span className="text-gray-500 text-sm">No items in this shipment.</span>
                ) : (
                  <ul className="space-y-1">
                    {items.map((item) => (
                      <li key={item.id} className="text-sm flex justify-between">
                        <span>{item.product_title || item.order_item_id} × {item.quantity}</span>
                        <button
                          onClick={() => handleRemoveItem(item.id, s.id)}
                          className="text-red-500 hover:underline"
                        >
                          Remove
                        </button>
                      </li>
                    ))}
                  </ul>
                )}
                {!addingItem ? (
                  <button
                    onClick={() => setAddingItem(true)}
                    className="text-blue-600 text-xs hover:underline"
                  >
                    + Add item
                  </button>
                ) : (
                  <div className="flex gap-2 items-end">
                    <input
                      type="text"
                      placeholder="Order item ID"
                      value={itemOrderItemId}
                      onChange={(e) => setItemOrderItemId(e.target.value)}
                      className="border rounded p-1 text-sm w-32"
                    />
                    <input
                      type="number"
                      min={1}
                      value={itemQuantity}
                      onChange={(e) => setItemQuantity(Number(e.target.value))}
                      className="border rounded p-1 text-sm w-20"
                    />
                    <button
                      onClick={() => handleAddItem(s.id)}
                      className="bg-green-600 text-white px-3 py-1 rounded text-xs"
                    >
                      Save
                    </button>
                    <button
                      onClick={() => setAddingItem(false)}
                      className="text-gray-500 text-xs hover:underline"
                    >
                      Cancel
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>
        ))
      )}
    </div>
  );
};