// src/pages/GRNCreatePage.tsx
import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { createManualGrn } from "@/api/procurement/grn.api";
import { apiFetch } from "@/lib/apiClient";

type GrnItem = {
  id: string;
  description: string;
  qty: number | "";
  unit_of_measure: string;
  unit_price: number | "";
  material_type?: string | null;
  material_id?: string | null;
};

export default function GRNCreatePage(): JSX.Element {
  const [suppliers, setSuppliers] = useState<any[]>([]);
  const [warehouses, setWarehouses] = useState<any[]>([]);
  const [supplierId, setSupplierId] = useState<string | null>(null);
  const [warehouseId, setWarehouseId] = useState<string | null>(null);
  const [items, setItems] = useState<GrnItem[]>([
    { id: crypto.randomUUID(), description: "", qty: "", unit_of_measure: "pcs", unit_price: "" },
  ]);
  const [metadataNotes, setMetadataNotes] = useState<string>("");
  const [submitting, setSubmitting] = useState(false);

  const navigate = useNavigate();

  useEffect(() => {
    async function loadLookups() {
      try {
        // suppliers
        const s = await apiFetch(`/suppliers?limit=1000`);
        if (s?.ok) setSuppliers(s.results || s.rows || s.data || []);
        // warehouses
        const w = await apiFetch(`/warehouses?limit=1000`);
        if (w?.ok) setWarehouses(w.data || w.rows || w.results || []);
      } catch (err) {
        console.error("lookup load error", err);
      }
    }
    loadLookups();
  }, []);

  function updateItem(id: string, patch: Partial<GrnItem>) {
    setItems((prev) => prev.map((it) => (it.id === id ? { ...it, ...patch } : it)));
  }

  function addItem() {
    setItems((prev) => [...prev, { id: crypto.randomUUID(), description: "", qty: "", unit_of_measure: "pcs", unit_price: "" }]);
  }

  function removeItem(id: string) {
    if (items.length <= 1) {
      alert("At least one item required.");
      return;
    }
    setItems((prev) => prev.filter((it) => it.id !== id));
  }

  const totalAmount = items.reduce((s, it) => s + (Number(it.qty || 0) * Number(it.unit_price || 0)), 0);

  async function onSubmit(e?: React.FormEvent) {
    if (e) e.preventDefault();
    if (!warehouseId) return alert("Select warehouse");
    if (!items.length) return alert("Add at least one item");

    // validate items
    for (const it of items) {
      if (!it.description || !it.qty || Number(it.qty) <= 0) {
        return alert("Each item must have description and qty > 0");
      }
    }

    const payload = {
      supplier_id: supplierId || null,
      warehouse_id: warehouseId,
      items: items.map((it) => ({
        description: it.description,
        qty: Number(it.qty),
        unit_of_measure: it.unit_of_measure,
        unit_price: Number(it.unit_price || 0),
        material_type: it.material_type || null,
        material_id: it.material_id || null,
      })),
      metadata: { notes: metadataNotes },
    };

    setSubmitting(true);
    try {
      const r = await createManualGrn(payload);
      if (r?.ok) {
        alert("GRN created: " + (r.grn?.grn_number || r.grn?.id));
        // navigate to GRN details page
        const createdId = r.grn?.id;
        setSubmitting(false);
        if (createdId) navigate(`/admin/grn/${createdId}`);
      } else {
        console.error("create GRN failed", r);
        alert("Create GRN failed: " + JSON.stringify(r));
      }
    } catch (err: any) {
      console.error("create error", err);
      alert("Create error: " + (err?.message || String(err)));
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="p-6 space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold">Create Goods Receipt Note (GRN)</h1>
      </div>

      <form onSubmit={onSubmit} className="space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm mb-1">Supplier (optional)</label>
            <select value={supplierId || ""} onChange={(e) => setSupplierId(e.target.value || null)} className="border p-2 rounded w-full">
              <option value="">-- Select supplier (optional) --</option>
              {suppliers.map((s: any) => <option key={s.id} value={s.id}>{s.name}</option>)}
            </select>
          </div>

          <div>
            <label className="block text-sm mb-1">Warehouse</label>
            <select value={warehouseId || ""} onChange={(e) => setWarehouseId(e.target.value || null)} className="border p-2 rounded w-full" required>
              <option value="">-- Select warehouse --</option>
              {warehouses.map((w: any) => <option key={w.id} value={w.id}>{w.name || w.code || w.id}</option>)}
            </select>
          </div>
        </div>

        <div className="border rounded p-3 bg-white">
          <div className="flex justify-between items-center mb-3">
            <div className="font-semibold">Items</div>
            <div className="text-sm text-slate-500">Total: ₹{totalAmount.toFixed(2)}</div>
          </div>

          <div className="space-y-2">
            {items.map((it) => (
              <div key={it.id} className="grid grid-cols-12 gap-2 items-center border-b pb-2">
                <div className="col-span-5">
                  <input className="w-full border p-2 rounded" placeholder="Description" value={it.description} onChange={(e) => updateItem(it.id, { description: e.target.value })} />
                </div>

                <div className="col-span-2">
                  <input type="number" step="0.001" min="0" className="w-full border p-2 rounded text-right" placeholder="Qty" value={String(it.qty)} onChange={(e) => updateItem(it.id, { qty: e.target.value === "" ? "" : Number(e.target.value) })} />
                </div>

                <div className="col-span-2">
                  <input className="w-full border p-2 rounded" placeholder="UOM" value={it.unit_of_measure} onChange={(e) => updateItem(it.id, { unit_of_measure: e.target.value })} />
                </div>

                <div className="col-span-2">
                  <input type="number" step="0.01" min="0" className="w-full border p-2 rounded text-right" placeholder="Unit Price" value={String(it.unit_price)} onChange={(e) => updateItem(it.id, { unit_price: e.target.value === "" ? "" : Number(e.target.value) })} />
                </div>

                <div className="col-span-1 text-right">
                  <button type="button" onClick={() => removeItem(it.id)} className="px-2 py-1 text-red-600">Remove</button>
                </div>
              </div>
            ))}
          </div>

          <div className="mt-3">
            <button type="button" onClick={addItem} className="px-3 py-2 border rounded">Add Item</button>
          </div>
        </div>

        <div>
          <label className="block text-sm mb-1">Notes (optional)</label>
          <textarea value={metadataNotes} onChange={(e) => setMetadataNotes(e.target.value)} className="border p-2 rounded w-full h-24" />
        </div>

        <div className="flex gap-2">
          <button type="submit" disabled={submitting} className="px-4 py-2 bg-emerald-600 text-white rounded">
            {submitting ? "Creating…" : "Create GRN"}
          </button>

          <button type="button" onClick={() => navigate("/admin/grn")} className="px-4 py-2 border rounded">
            Cancel
          </button>
        </div>
      </form>
    </div>
  );
}
