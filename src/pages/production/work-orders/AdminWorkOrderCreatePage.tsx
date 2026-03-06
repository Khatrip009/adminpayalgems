import React, { useEffect, useState } from "react";
import { toast } from "react-hot-toast";
import { useNavigate } from "react-router-dom";
import { issueWorkOrder } from "@/api/production/workorders.api";
import { apiFetch } from "@/lib/apiClient";
import { searchMaterials } from "@/api/inventory/inventory.materials.api";
import { listWarehouses } from "@/api/masters/warehouses.api";
import { listCustomers } from "@/api/masters/customers.api";
import { listCraftsmen } from "@/api/masters/craftsmen.api";
import { fetchProductsAdmin } from "@/api/masters/products.api";
import { Plus, Trash, Search, ArrowLeft } from "lucide-react";

/* =========================================================
   TYPES
========================================================= */
type MaterialRow = {
  material_type: "diamond_packet" | "gold_lot";
  material_id?: string | null;
  material_name: string;
  available: number;
  qty: string;
  unit: string;
  rate: number;
  cost: number;
  error: string | null;
};

type InventoryItem = {
  id: string;
  label: string;
  available_qty: number;
};

const AdminWorkOrderCreatePage: React.FC = () => {
  const navigate = useNavigate();

  /* =========================================================
     MASTER DATA
  ========================================================= */
  const [warehouses, setWarehouses] = useState<any[]>([]);
  const [products, setProducts] = useState<any[]>([]);
  const [customers, setCustomers] = useState<any[]>([]);
  const [craftsmen, setCraftsmen] = useState<any[]>([]);

  /* =========================================================
     HEADER STATE
  ========================================================= */
  const [woNumber, setWoNumber] = useState("");
  const [warehouseId, setWarehouseId] = useState<number | null>(null);
  const [expectedReturn, setExpectedReturn] = useState("");

  const [productId, setProductId] = useState("");
  const [productManual, setProductManual] = useState("");

  const [customerId, setCustomerId] = useState("");
  const [customerManual, setCustomerManual] = useState("");

  const [craftsmanId, setCraftsmanId] = useState("");
  const [craftsmanManual, setCraftsmanManual] = useState("");

  /* =========================================================
     MATERIALS
  ========================================================= */
  const [materials, setMaterials] = useState<MaterialRow[]>([]);

  /* =========================================================
     INVENTORY MODAL (DIAMOND)
  ========================================================= */
  const [modalOpen, setModalOpen] = useState(false);
  const [modalIndex, setModalIndex] = useState<number | null>(null);
  const [inventoryItems, setInventoryItems] = useState<InventoryItem[]>([]);

  /* =========================================================
     INIT
  ========================================================= */
  useEffect(() => {
    setWoNumber(`WO-${Date.now()}`);

    listWarehouses().then(r => r?.ok && setWarehouses(r.data || r.results));
    listCustomers().then(r => r?.ok && setCustomers(r.items || []));
    listCraftsmen().then(r => r?.ok && setCraftsmen(r.items || []));
    fetchProductsAdmin({ limit: 100 }).then(r => r?.ok && setProducts(r.products));
  }, []);

  /* =========================================================
     ADD MATERIALS
  ========================================================= */
  const addDiamond = () => {
    if (!warehouseId) return toast.error("Select warehouse first");

    setMaterials(prev => [
      ...prev,
      {
        material_type: "diamond_packet",
        material_id: null,
        material_name: "",
        available: 0,
        qty: "",
        unit: "ct",
        rate: 0,
        cost: 0,
        error: null,
      },
    ]);
  };

  const addGold = () => {
    setMaterials(prev => [
      ...prev,
      {
        material_type: "gold_lot",
        material_name: "",
        available: 0,
        qty: "",
        unit: "gm",
        rate: 0,
        cost: 0,
        error: null,
      },
    ]);
  };

  /* =========================================================
     INVENTORY (DIAMOND)
  ========================================================= */
  const openInventory = async (index: number) => {
    if (!warehouseId) return toast.error("Select warehouse first");

    setModalIndex(index);
    setModalOpen(true);

    const r = await searchMaterials({
      warehouse_id: warehouseId,
      type: "diamond_packet",
    });

    setInventoryItems(
      (r?.materials || []).map((x: any) => ({
        id: x.id,
        label: x.label,
        available_qty: Number(x.available_qty || 0),
      }))
    );
  };

  const selectDiamond = (item: InventoryItem) => {
    if (modalIndex === null) return;

    const updated = [...materials];
    updated[modalIndex] = {
      ...updated[modalIndex],
      material_id: item.id,
      material_name: item.label,
      available: item.available_qty,
      error: null,
    };

    setMaterials(updated);
    setModalOpen(false);
  };

  /* =========================================================
     UPDATE QTY / RATE
  ========================================================= */
  const updateQty = (i: number, value: string) => {
    const updated = [...materials];
    const m = updated[i];
    const qty = Number(value);

    m.qty = value;
    m.cost = qty * m.rate;

    if (!qty || qty <= 0) m.error = "Invalid qty";
    else if (m.material_type === "diamond_packet" && qty > m.available)
      m.error = `Only ${m.available} available`;
    else m.error = null;

    setMaterials(updated);
  };

  const updateRate = (i: number, value: string) => {
    const updated = [...materials];
    const m = updated[i];
    const rate = Number(value);

    m.rate = rate;
    m.cost = rate * Number(m.qty || 0);

    if (rate <= 0) m.error = "Invalid rate";
    else m.error = null;

    setMaterials(updated);
  };

  /* =========================================================
     TOTALS
  ========================================================= */
  const diamondCost = materials
    .filter(m => m.material_type === "diamond_packet")
    .reduce((s, m) => s + m.cost, 0);

  const goldCost = materials
    .filter(m => m.material_type === "gold_lot")
    .reduce((s, m) => s + m.cost, 0);

  const totalCost = diamondCost + goldCost;

  /* =========================================================
     SUBMIT
  ========================================================= */
  const handleCreate = async () => {
    if (!warehouseId) return toast.error("Warehouse required");
    if (!expectedReturn) return toast.error("Expected return required");
    if (!materials.length) return toast.error("Add materials");
    if (!productId && !productManual) return toast.error("Product required");
    if (!customerId && !customerManual) return toast.error("Customer required");
    if (!craftsmanId && !craftsmanManual) return toast.error("Craftsman required");

    const payload = {
      wo_number: woNumber,
      warehouse_id: warehouseId,
      expected_return: expectedReturn,

      product_id: productId || undefined,
      product_manual: productManual || undefined,

      customer_id: customerId || undefined,
      customer_manual: customerManual || undefined,

      craftsman_id: craftsmanId || undefined,
      craftsman_manual: craftsmanManual || undefined,

      materials: materials.map(m => ({
        material_type: m.material_type,
        material_id: m.material_id,
        material_manual:
          m.material_type === "gold_lot" ? m.material_name : undefined,
        qty: Number(m.qty),
        unit: m.unit,
        rate: m.rate,
      })),
    };

    const r = await issueWorkOrder(payload);
    if (r?.ok) {
      toast.success("Work Order Created");
      navigate("/admin/work-orders");
    } else toast.error(r?.error || "Failed");
  };

  /* =========================================================
     RENDER
  ========================================================= */
  return (
    <div className="p-6 space-y-6">
      <button onClick={() => navigate(-1)} className="flex items-center text-sm">
        <ArrowLeft size={14} className="mr-1" /> Back
      </button>

      <h1 className="text-xl font-semibold">Create Work Order</h1>

      {/* HEADER */}
      <div className="grid grid-cols-2 gap-4">
        <input className="border p-2 rounded" value={woNumber} disabled />

        <select
          className="border p-2 rounded"
          value={warehouseId ?? ""}
          onChange={e => {
            setWarehouseId(Number(e.target.value) || null);
            setMaterials([]);
          }}
        >
          <option value="">Select Warehouse *</option>
          {warehouses.map(w => (
            <option key={w.id} value={w.id}>{w.name}</option>
          ))}
        </select>

        <input type="date" className="border p-2 rounded"
          value={expectedReturn}
          onChange={e => setExpectedReturn(e.target.value)}
        />

        {/* PRODUCT */}
        <select
          className="border p-2 rounded"
          value={productId}
          onChange={e => {
            setProductId(e.target.value);
            setProductManual("");
          }}
        >
          <option value="">Select Product (Master)</option>
          {products.map(p => (
            <option key={p.id} value={p.id}>{p.title}</option>
          ))}
        </select>

        <input
          className="border p-2 rounded"
          placeholder="Or product name (manual)"
          value={productManual}
          onChange={e => {
            setProductManual(e.target.value);
            setProductId("");
          }}
        />

        {/* CUSTOMER */}
        <select
          className="border p-2 rounded"
          value={customerId}
          onChange={e => {
            setCustomerId(e.target.value);
            setCustomerManual("");
          }}
        >
          <option value="">Select Customer</option>
          {customers.map(c => (
            <option key={c.id} value={c.id}>{c.name}</option>
          ))}
        </select>

        <input
          className="border p-2 rounded"
          placeholder="Or customer name (manual)"
          value={customerManual}
          onChange={e => {
            setCustomerManual(e.target.value);
            setCustomerId("");
          }}
        />

        {/* CRAFTSMAN */}
        <select
          className="border p-2 rounded"
          value={craftsmanId}
          onChange={e => {
            setCraftsmanId(e.target.value);
            setCraftsmanManual("");
          }}
        >
          <option value="">Select Craftsman</option>
          {craftsmen.map(c => (
            <option key={c.id} value={c.id}>{c.name}</option>
          ))}
        </select>

        <input
          className="border p-2 rounded"
          placeholder="Or craftsman name (manual)"
          value={craftsmanManual}
          onChange={e => {
            setCraftsmanManual(e.target.value);
            setCraftsmanId("");
          }}
        />
      </div>

      {/* ADD MATERIALS */}
      <div className="flex gap-3">
        <button onClick={addDiamond} className="bg-blue-600 text-white px-3 py-1 rounded">
          + Diamond Packet
        </button>
        <button onClick={addGold} className="bg-yellow-600 text-white px-3 py-1 rounded">
          + Gold (Manual)
        </button>
      </div>

      {/* TABLE */}
      <table className="w-full border rounded">
        <thead className="bg-gray-100">
          <tr>
            <th>Type</th>
            <th>Material</th>
            <th>Available</th>
            <th>Qty</th>
            <th>Rate</th>
            <th>Cost</th>
            <th />
          </tr>
        </thead>
        <tbody>
          {materials.map((m, i) => (
            <tr key={i} className="border-t">
              <td>{m.material_type === "gold_lot" ? "Gold" : "Diamond"}</td>
              <td>
                {m.material_type === "diamond_packet" ? (
                  <button
                    className="border px-2 py-1 rounded"
                    onClick={() => openInventory(i)}
                  >
                    <Search size={12} className="inline mr-1" />
                    {m.material_name || "Select"}
                  </button>
                ) : (
                  <input
                    className="border px-2 py-1"
                    placeholder="Gold description"
                    value={m.material_name}
                    onChange={e => {
                      const u = [...materials];
                      u[i].material_name = e.target.value;
                      setMaterials(u);
                    }}
                  />
                )}
              </td>
              <td>{m.material_type === "diamond_packet" ? m.available : "-"}</td>
              <td>
                <input
                  className="border px-2 py-1 w-20"
                  value={m.qty}
                  onChange={e => updateQty(i, e.target.value)}
                />
              </td>
              <td>
                <input
                  className="border px-2 py-1 w-24"
                  value={m.rate}
                  onChange={e => updateRate(i, e.target.value)}
                />
              </td>
              <td className="font-semibold">₹ {m.cost}</td>
              <td>
                <Trash
                  size={14}
                  className="text-red-500 cursor-pointer"
                  onClick={() =>
                    setMaterials(prev => prev.filter((_, x) => x !== i))
                  }
                />
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      {/* SUMMARY */}
      <div className="border rounded p-4 bg-gray-50">
        <div>Diamond Cost: ₹ {diamondCost}</div>
        <div>Gold Cost: ₹ {goldCost}</div>
        <div className="font-bold text-lg mt-2">
          Total Cost: ₹ {totalCost}
        </div>
      </div>

      <button onClick={handleCreate} className="bg-green-600 text-white px-6 py-2 rounded">
        Create Work Order
      </button>

      {/* INVENTORY MODAL */}
      {modalOpen && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center">
          <div className="bg-white p-6 rounded w-[500px]">
            <h2 className="font-semibold mb-3">Select Diamond Packet</h2>
            {inventoryItems.map(item => (
              <div key={item.id} className="flex justify-between py-2 border-b">
                <div>
                  <div>{item.label}</div>
                  <div className="text-xs text-gray-500">
                    Available: {item.available_qty}
                  </div>
                </div>
                <button
                  onClick={() => selectDiamond(item)}
                  className="text-blue-600"
                >
                  Select
                </button>
              </div>
            ))}
            <div className="text-right mt-4">
              <button onClick={() => setModalOpen(false)}>Close</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminWorkOrderCreatePage;
