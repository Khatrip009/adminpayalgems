import React, { useEffect, useState } from "react";
import {
  createPurchaseOrder,
  getPurchaseOrder,
  updatePurchaseOrder,
} from "@/api/procurement/purchaseOrders.api";
import { useNavigate, useParams } from "react-router-dom";
import { v4 as uuidv4 } from "uuid";

export default function PurchaseOrderCreatePage() {
  const { id } = useParams(); // edit mode
  const navigate = useNavigate();

  const [poNumber, setPoNumber] = useState("");
  const [supplierId, setSupplierId] = useState("");
  const [currency, setCurrency] = useState("INR");

  const [items, setItems] = useState<any[]>([
    { tempId: uuidv4(), description: "", qty: 0, unit_price: 0, unit_of_measure: "" },
  ]);

  const [loading, setLoading] = useState(false);

  /* LOAD IF EDITING */
  useEffect(() => {
    if (!id) return;

    (async () => {
      setLoading(true);
      const r = await getPurchaseOrder(id);

      if (r?.ok) {
        const po = r.purchase_order;

        setPoNumber(po.po_number || "");
        setSupplierId(po.supplier_id || "");
        setCurrency(po.currency || "INR");

        setItems(
          (po.items || []).map((it: any) => ({
            tempId: uuidv4(),
            ...it,
          }))
        );
      }

      setLoading(false);
    })();
  }, [id]);

  /* ITEM OPERATIONS */
  function addItem() {
    setItems((prev) => [
      ...prev,
      {
        tempId: uuidv4(),
        description: "",
        qty: 0,
        unit_price: 0,
        unit_of_measure: "",
      },
    ]);
  }

  function removeItem(tempId: string) {
    setItems((prev) => prev.filter((i) => i.tempId !== tempId));
  }

  function updateItem(tempId: string, field: string, value: any) {
    setItems((prev) =>
      prev.map((i) =>
        i.tempId === tempId ? { ...i, [field]: value } : i
      )
    );
  }

  /* SUBMIT */
  async function onSubmit() {
    setLoading(true);

    try {
      const payload = {
        po_number: poNumber || undefined, // backend auto-generates if missing
        supplier_id: supplierId || null,
        currency,
        items: items.map((i) => ({
          description: i.description,
          qty: Number(i.qty || 0),
          unit_price: Number(i.unit_price || 0),
          unit_of_measure: i.unit_of_measure,
        })),
      };

      let r;
      if (id) r = await updatePurchaseOrder(id, payload);
      else r = await createPurchaseOrder(payload);

      if (r?.ok) {
        alert("Purchase Order saved");
        navigate("/admin/purchase-orders");
      } else {
        alert("Save failed");
      }
    } catch (err: any) {
      alert("Error: " + err?.message);
    }

    setLoading(false);
  }

  /* UI */
  return (
    <div className="p-6 space-y-6">
      <h1 className="text-xl font-semibold">
        {id ? "Edit Purchase Order" : "Create Purchase Order"}
      </h1>

      {/* FORM */}
      <div className="grid grid-cols-2 gap-4 text-sm">
        <div>
          <label className="block mb-1 text-xs font-medium">PO Number (optional)</label>
          <input
            value={poNumber}
            onChange={(e) => setPoNumber(e.target.value)}
            className="border p-2 rounded w-full"
            placeholder="Auto-generated if empty"
          />
        </div>

        <div>
          <label className="block mb-1 text-xs font-medium">Supplier ID</label>
          <input
            value={supplierId}
            onChange={(e) => setSupplierId(e.target.value)}
            className="border p-2 rounded w-full"
            placeholder="SUP-001 (optional)"
          />
        </div>

        <div>
          <label className="block mb-1 text-xs font-medium">Currency</label>
          <input
            value={currency}
            onChange={(e) => setCurrency(e.target.value)}
            className="border p-2 rounded w-full"
            placeholder="INR"
          />
        </div>
      </div>

      {/* ITEMS */}
      <div className="border rounded bg-white p-4">
        <div className="flex items-center justify-between mb-2">
          <div className="font-semibold text-sm">Items</div>
          <button onClick={addItem} className="px-2 py-1 border rounded text-xs">
            Add Item
          </button>
        </div>

        {/* HEADER */}
        <div className="grid grid-cols-6 gap-2 px-2 py-1 border-b text-xs font-medium bg-gray-50">
          <div className="col-span-2">Description</div>
          <div className="text-right">Qty</div>
          <div className="text-right">Unit Price</div>
          <div className="text-right">UOM</div>
          <div className="text-center">—</div>
        </div>

        {/* ROWS */}
        <div className="divide-y">
          {items.map((it) => (
            <div
              key={it.tempId}
              className="grid grid-cols-6 gap-2 px-2 py-2 items-center text-xs"
            >
              <input
                className="col-span-2 border rounded p-1"
                placeholder="Description"
                value={it.description}
                onChange={(e) =>
                  updateItem(it.tempId, "description", e.target.value)
                }
              />

              <input
                className="border p-1 rounded text-right"
                type="number"
                step="0.001"
                value={it.qty}
                onChange={(e) => updateItem(it.tempId, "qty", e.target.value)}
              />

              <input
                className="border p-1 rounded text-right"
                type="number"
                step="0.01"
                value={it.unit_price}
                onChange={(e) =>
                  updateItem(it.tempId, "unit_price", e.target.value)
                }
              />

              <input
                className="border p-1 rounded text-right"
                placeholder="pcs"
                value={it.unit_of_measure}
                onChange={(e) =>
                  updateItem(it.tempId, "unit_of_measure", e.target.value)
                }
              />

              <button
                onClick={() => removeItem(it.tempId)}
                className="px-2 py-1 border rounded text-red-600 text-xs text-center"
              >
                Remove
              </button>
            </div>
          ))}
        </div>
      </div>

      {/* SAVE BUTTON */}
      <div>
        <button
          onClick={onSubmit}
          disabled={loading}
          className="px-4 py-2 bg-blue-600 text-white rounded text-sm"
        >
          {loading ? "Saving…" : "Save Purchase Order"}
        </button>
      </div>
    </div>
  );
}
