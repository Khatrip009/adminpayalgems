import React, { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { toast } from "react-hot-toast";
import { ArrowLeft, Loader2, Plus, Trash } from "lucide-react";

import {
  getWorkOrder,
  receiveWorkOrder,
} from "@/api/production/workorders.api";

const AdminWorkOrderReceivePage: React.FC = () => {
  const { id } = useParams();
  const navigate = useNavigate();

  const [loading, setLoading] = useState(true);
  const [wo, setWO] = useState<any | null>(null);

  /* IMPORTANT:
     grnNumber is OPTIONAL
     backend auto-generates if empty
  */
  const [grnNumber, setGrnNumber] = useState("");

  const [finishedItems, setFinishedItems] = useState<any[]>([
    { sku: "", qty: "", unit: "pcs", valuation: "" },
  ]);

  /* ---------------------------------------
     LOAD WORK ORDER
  --------------------------------------- */
  useEffect(() => {
    (async () => {
      try {
        const r = await getWorkOrder(id!);
        setWO(r.work_order || r);
      } catch {
        toast.error("Failed to load work order");
      }
      setLoading(false);
    })();
  }, [id]);

  /* ---------------------------------------
     FINISHED ITEMS
  --------------------------------------- */
  const addRow = () =>
    setFinishedItems((p) => [...p, { sku: "", qty: "", unit: "pcs", valuation: "" }]);

  const removeRow = (i: number) =>
    setFinishedItems((p) => p.filter((_, idx) => idx !== i));

  const updateRow = (i: number, k: string, v: any) => {
    const next = [...finishedItems];
    next[i][k] = v;
    setFinishedItems(next);
  };

  /* ---------------------------------------
     SUBMIT RECEIVE
  --------------------------------------- */
  const handleReceive = async () => {
    if (finishedItems.length === 0) {
      return toast.error("Add at least one finished item");
    }

    for (const f of finishedItems) {
      if (!f.sku || !f.qty || Number(f.qty) <= 0) {
        return toast.error("SKU and Qty are required");
      }
    }

    const payload = {
  grn_number: null, // always backend-generated
  finished_items: finishedItems.map((f) => ({
    sku: f.sku.trim(),
    qty: Number(f.qty),
    unit: f.unit || "pcs",
    valuation: Number(f.valuation || 0),
  })),
};


    try {
      await receiveWorkOrder(id!, payload);
      toast.success("Work Order received successfully");
      navigate(`/admin/work-orders/${id}`);
    } catch (e: any) {
      toast.error(e?.message || "Receive failed");
    }
  };

  /* ---------------------------------------
     RENDER
  --------------------------------------- */
  if (loading) {
    return (
      <div className="p-10 text-center">
        <Loader2 className="animate-spin mx-auto" />
      </div>
    );
  }

  if (!wo) {
    return <div className="p-10 text-center text-red-500">Work Order not found</div>;
  }

  return (
    <div className="p-6 max-w-3xl mx-auto">
      <button onClick={() => navigate(-1)} className="flex items-center text-sm mb-4">
        <ArrowLeft size={14} className="mr-1" /> Back
      </button>

      <h1 className="text-xl font-semibold mb-4">
        Receive Finished Goods — {wo.wo_number}
      </h1>

      {/* GRN */}
<div className="mb-4">
  <label className="text-sm font-medium">GRN Number</label>
  <input
    className="border rounded px-3 py-2 w-full mt-1 bg-gray-100 text-gray-600"
    value="Auto-generated"
    readOnly
  />
  <p className="text-xs text-gray-500 mt-1">
    GRN will be generated automatically on receive
  </p>
</div>


      {/* FINISHED ITEMS */}
      <div className="mb-6">
        <div className="flex justify-between mb-2">
          <h2 className="font-medium">Finished Items</h2>
          <button
            onClick={addRow}
            className="px-3 py-1 bg-blue-600 text-white rounded flex items-center"
          >
            <Plus size={16} className="mr-1" /> Add
          </button>
        </div>

        <table className="w-full border rounded">
          <thead className="bg-gray-100">
            <tr>
              <th className="p-2">SKU</th>
              <th className="p-2">Qty</th>
              <th className="p-2">Unit</th>
              <th className="p-2">Valuation (₹)</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            {finishedItems.map((r, i) => (
              <tr key={i} className="border-t">
                <td className="p-2">
                  <input
                    className="border rounded px-2 py-1 w-full"
                    value={r.sku}
                    onChange={(e) => updateRow(i, "sku", e.target.value)}
                  />
                </td>
                <td className="p-2">
                  <input
                    type="number"
                    className="border rounded px-2 py-1 w-20"
                    value={r.qty}
                    onChange={(e) => updateRow(i, "qty", e.target.value)}
                  />
                </td>
                <td className="p-2">
                  <input
                    className="border rounded px-2 py-1 w-20"
                    value={r.unit}
                    onChange={(e) => updateRow(i, "unit", e.target.value)}
                  />
                </td>
                <td className="p-2">
                  <input
                    type="number"
                    className="border rounded px-2 py-1 w-28"
                    value={r.valuation}
                    onChange={(e) => updateRow(i, "valuation", e.target.value)}
                  />
                </td>
                <td className="p-2 text-right">
                  <button onClick={() => removeRow(i)}>
                    <Trash size={16} className="text-red-500" />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <button
        onClick={handleReceive}
        className="px-6 py-2 bg-green-600 text-white rounded shadow"
      >
        Receive Work
      </button>
    </div>
  );
};

export default AdminWorkOrderReceivePage;
