// src/pages/AdminWorkOrderDetailPage.tsx

import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { toast } from "react-hot-toast";
import {
  ArrowLeft,
  Clock,
  Boxes,
  Plus,
  Trash,
} from "lucide-react";

import {
  getWorkOrder,
  startWorkOrder,
  completeWorkOrder,
  receiveWorkOrder,
  closeWorkOrder,
} from "@/api/production/workorders.api";

/* =====================================================
   STATUS CONFIG
===================================================== */

const STATUS_FLOW = [
  "issued",
  "in_progress",
  "completed",
  "received",
  "closed",
] as const;

const STATUS_LABELS: Record<string, string> = {
  issued: "Issued",
  in_progress: "In Progress",
  completed: "Completed",
  received: "Received",
  closed: "Closed",
};

/* =====================================================
   TYPES (MATCH DB FUNCTION EXACTLY)
===================================================== */

type FinishedItem = {
  sku?: string;        // OPTIONAL → DB auto-generates
  qty: number;         // REQUIRED
  valuation?: number; // OPTIONAL → DB FIFO auto-fill
};

const AdminWorkOrderDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const [wo, setWO] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  const [receiveOpen, setReceiveOpen] = useState(false);
  const [finishedItems, setFinishedItems] = useState<FinishedItem[]>([]);

  /* =====================================================
     LOAD WORK ORDER
  ===================================================== */

  const loadWorkOrder = async () => {
    try {
      setLoading(true);
      const r = await getWorkOrder(id!);
      if (!r.ok) throw new Error();
      setWO(r.work_order);
    } catch {
      toast.error("Failed to load work order");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadWorkOrder();
  }, [id]);

  /* =====================================================
     FSM ACTIONS
  ===================================================== */

  const doStart = async () => {
    const r = await startWorkOrder(id!);
    if (r.ok) {
      toast.success("Work order started");
      loadWorkOrder();
    }
  };

  const doComplete = async () => {
    const r = await completeWorkOrder(id!);
    if (r.ok) {
      toast.success("Work order completed");
      loadWorkOrder();
    }
  };

  const doReceive = async () => {
    if (!finishedItems.length) {
      return toast.error("Add at least one finished item");
    }

    for (const item of finishedItems) {
      if (!item.qty || item.qty <= 0) {
        return toast.error("Quantity must be greater than zero");
      }
      if (item.valuation !== undefined && item.valuation < 0) {
        return toast.error("Valuation cannot be negative");
      }
    }

    const r = await receiveWorkOrder(id!, {
      finished_items: finishedItems,
    });

    if (!r.ok) {
      toast.error(r.message || "Receive failed");
      return;
    }

    toast.success("Work order received");
    setReceiveOpen(false);
    setFinishedItems([]);
    loadWorkOrder();
  };

  const doClose = async () => {
    const r = await closeWorkOrder(id!);
    if (r.ok) {
      toast.success("Work order closed");
      loadWorkOrder();
    }
  };

  /* =====================================================
     FINISHED ITEMS HANDLERS
  ===================================================== */

  const addFinishedItem = () => {
    setFinishedItems((prev) => [
      ...prev,
      {
        sku: "",
        qty: 0,
        valuation: undefined, // FIFO auto-fill
      },
    ]);
  };

  const updateFinished = (
    index: number,
    field: keyof FinishedItem,
    value: any
  ) => {
    const updated = [...finishedItems];
    updated[index] = { ...updated[index], [field]: value };
    setFinishedItems(updated);
  };

  const removeFinishedItem = (index: number) => {
    setFinishedItems((prev) => prev.filter((_, i) => i !== index));
  };

  /* =====================================================
     RENDER
  ===================================================== */

  if (loading) return <div className="p-6">Loading...</div>;
  if (!wo) return <div className="p-6 text-red-600">Not found</div>;

  return (
    <div className="p-6">
      <button
        className="flex items-center mb-3 text-sm"
        onClick={() => navigate(-1)}
      >
        <ArrowLeft size={14} className="mr-1" /> Back
      </button>

      <h1 className="text-xl font-semibold">
        Work Order #{wo.wo_number}
      </h1>
      <p className="text-gray-500">
        Status: {STATUS_LABELS[wo.status]}
      </p>

      {/* ACTIONS */}
      <div className="my-4">
        {wo.status === "issued" && (
          <button onClick={doStart} className="btn-primary">
            Start Work
          </button>
        )}

        {wo.status === "in_progress" && (
          <button onClick={doComplete} className="btn-indigo">
            Mark Completed
          </button>
        )}

        {wo.status === "completed" && (
          <button
            onClick={() => setReceiveOpen(true)}
            className="btn-green"
          >
            Receive Work
          </button>
        )}

        {wo.status === "received" && (
          <button onClick={doClose} className="btn-dark">
            Close Work Order
          </button>
        )}

        {wo.status === "closed" && (
          <div className="text-green-700 font-medium">
            Work Order Closed
          </div>
        )}
      </div>

      {/* MATERIALS */}
      <h2 className="text-lg font-medium mt-8 mb-2 flex items-center">
        <Boxes size={18} className="mr-2" /> Materials Allocated
      </h2>

      <table className="w-full border mb-6">
        <thead className="bg-gray-100">
          <tr>
            <th className="p-2">Type</th>
            <th className="p-2">ID</th>
            <th className="p-2">Qty</th>
            <th className="p-2">Unit</th>
          </tr>
        </thead>
        <tbody>
          {wo.materials?.map((m: any) => (
            <tr key={m.id} className="border-t">
              <td className="p-2">{m.material_type}</td>
              <td className="p-2">{m.material_id}</td>
              <td className="p-2">{m.allocated_weight}</td>
              <td className="p-2">{m.unit_of_measure}</td>
            </tr>
          ))}
        </tbody>
      </table>

      {/* RECEIVE MODAL */}
      {receiveOpen && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
          <div className="bg-white w-[700px] p-6 rounded-lg">
            <h2 className="text-lg font-semibold mb-4">
              Receive Finished Goods
            </h2>

            <div className="flex justify-between mb-2">
              <span className="text-sm font-medium">Finished Items</span>
              <button onClick={addFinishedItem} className="btn-primary-sm">
                <Plus size={14} /> Add
              </button>
            </div>

            <table className="w-full border">
              <thead className="bg-gray-100">
                <tr>
                  <th className="p-2">SKU</th>
                  <th className="p-2">Qty</th>
                  <th className="p-2">Valuation</th>
                  <th />
                </tr>
              </thead>
              <tbody>
                {finishedItems.map((row, i) => (
                  <tr key={i} className="border-t">
                    <td className="p-2">
                      <input
                        className="input"
                        placeholder="Auto-generated if empty"
                        value={row.sku || ""}
                        onChange={(e) =>
                          updateFinished(i, "sku", e.target.value)
                        }
                      />
                    </td>
                    <td className="p-2">
                      <input
                        type="number"
                        className="input w-24"
                        value={row.qty}
                        onChange={(e) =>
                          updateFinished(i, "qty", Number(e.target.value))
                        }
                      />
                    </td>
                    <td className="p-2">
                      <input
                        type="number"
                        className="input w-32 bg-gray-100"
                        placeholder="Auto FIFO"
                        value={row.valuation ?? ""}
                        onChange={(e) =>
                          updateFinished(
                            i,
                            "valuation",
                            Number(e.target.value)
                          )
                        }
                      />
                    </td>
                    <td className="p-2 text-right">
                      <button onClick={() => removeFinishedItem(i)}>
                        <Trash size={16} className="text-red-600" />
                      </button>
                    </td>
                  </tr>
                ))}

                {finishedItems.length === 0 && (
                  <tr>
                    <td
                      colSpan={4}
                      className="p-4 text-center text-gray-500"
                    >
                      No finished items added
                    </td>
                  </tr>
                )}
              </tbody>
            </table>

            <div className="flex justify-end gap-3 mt-4">
              <button
                onClick={() => setReceiveOpen(false)}
                className="btn-gray"
              >
                Cancel
              </button>
              <button onClick={doReceive} className="btn-green">
                Receive Work
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminWorkOrderDetailPage;
