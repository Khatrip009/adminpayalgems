// src/pages/sales/Sales.tsx
import React, { useEffect, useState, useCallback, useRef } from "react";
import { toast } from "react-hot-toast";
import { useForm, useFieldArray, Controller } from "react-hook-form";
import {
  Download,
  FileText,
  Receipt,
  Trash2,
  ChevronLeft,
  ChevronRight,
  ChevronDown,
  ChevronUp,
  Plus,
  Pencil,
  X,
  Save,
} from "lucide-react";

// API imports
import {
  listSalesItems,
  deleteSalesItem,
  exportSalesItemsCSV,
  exportSalesItemsExcel,
  exportSalesRegisterPDF,
  exportSalesInvoicePDF,
  importSalesItemsCSV,
  createSalesItem,
  updateSalesItem,
  getSalesItem,
  type SalesItemPayload,
  type DiamondInput,
} from "@/api/sales/sales.api";

// Masters API
import { fetchProductsAdmin, type Product } from "@/api/masters/products.api";
import { listCustomers } from "@/api/masters/customers.api";
import { listCraftsmen } from "@/api/masters/craftsmen.api";

/* =========================================================
   TYPES
========================================================= */

interface Diamond {
  pcs: number;
  carat: number;
  rate: number;
  amount?: number;
  type?: string;
  packet_no?: string | null;
}

interface Sale {
  id: string;
  number: string;
  item: string;
  product_id?: string | null;
  product_image_url?: string | null;
  diamonds: Diamond[];
  diamond_pcs: number;
  diamond_carat: number;
  total_diamond_price: number;
  gold: number;
  gold_price: number;
  labour_charge: number;
  total_making_cost: number;
  profit_percent: number;
  profit_amount: number;
  selling_price: number;
  customer_id?: string | null;
  customer_name?: string;
  craftsman_id?: string | null;
  craftsman_name?: string;
  created_at: string;
}

/* =========================================================
   FORM TYPES
========================================================= */

interface SaleFormValues {
  number: string;
  item: string;
  product_id?: string | null;
  diamonds: DiamondInput[];
  gold: number;
  gold_price: number;
  labour_charge: number;
  profit_percent: number;
  customer_id?: string | null;
  customer_name?: string;
  craftsman_id?: string | null;
  craftsman_name?: string;
  product_image?: FileList | null;
}

/* =========================================================
   HELPERS
========================================================= */

const money = (v?: number | string) =>
  v === null || v === undefined || isNaN(Number(v))
    ? "—"
    : `₹${Number(v).toLocaleString("en-IN", {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
      })}`;

const dateFmt = (d: string) => new Date(d).toLocaleDateString("en-IN");

/* =========================================================
   MAIN COMPONENT
========================================================= */

const Sales: React.FC = () => {
  /* ================= STATE ================= */
  const [items, setItems] = useState<Sale[]>([]);
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState("");
  const [fromDate, setFromDate] = useState("");
  const [toDate, setToDate] = useState("");
  const [sortKey, setSortKey] = useState<keyof Sale>("created_at");
  const [sortDir, setSortDir] = useState<"asc" | "desc">("desc");
  const [expanded, setExpanded] = useState<Set<string>>(new Set());
  const [page, setPage] = useState(1);
  const limit = 20;
  const [count, setCount] = useState(0);

  // Modal state
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [modalLoading, setModalLoading] = useState(false);

  // File input ref for import
  const fileRef = useRef<HTMLInputElement>(null);

  /* =========================================================
     LOAD SALES
  ========================================================= */

  const loadSales = useCallback(async () => {
    try {
      setLoading(true);
      const r: any = await listSalesItems({
        search,
        from: fromDate || undefined,
        to: toDate || undefined,
        page,
        limit,
      });

      if (!r?.ok) throw new Error();

      const normalized = (r.results || []).map((s: any) => ({
        ...s,
        diamonds:
          typeof s.diamonds === "string"
            ? JSON.parse(s.diamonds)
            : s.diamonds || [],
      }));

      setItems(normalized);
      setCount(r.count || 0);
    } catch {
      toast.error("Failed to load sales");
    } finally {
      setLoading(false);
    }
  }, [search, fromDate, toDate, page, limit]);

  useEffect(() => {
    loadSales();
  }, [loadSales]);

  /* =========================================================
     SORTING
  ========================================================= */

  const sortedItems = [...items].sort((a, b) => {
    const valA: any = a[sortKey];
    const valB: any = b[sortKey];

    if (sortDir === "asc") return valA > valB ? 1 : -1;
    return valA < valB ? 1 : -1;
  });

  const handleSort = (key: keyof Sale) => {
    if (sortKey === key) {
      setSortDir(sortDir === "asc" ? "desc" : "asc");
    } else {
      setSortKey(key);
      setSortDir("asc");
    }
  };

  /* =========================================================
     EXPORT / IMPORT
  ========================================================= */

  const download = (blob: Blob, filename: string) => {
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = filename;
    a.click();
    window.URL.revokeObjectURL(url);
  };

  const safeDownload = async (fn: () => Promise<Blob>, filename: string) => {
    try {
      const blob = await fn();
      download(blob, filename);
    } catch {
      toast.error("Download failed");
    }
  };

  const handleImport = async (file: File) => {
    try {
      const r = await importSalesItemsCSV(file);
      if (!r?.ok) throw new Error();
      toast.success("Import successful");
      loadSales();
    } catch {
      toast.error("Import failed");
    }
  };

  /* =========================================================
     MODAL HANDLERS
  ========================================================= */

  const openCreateModal = () => {
    setEditingId(null);
    setIsModalOpen(true);
  };

  const openEditModal = async (id: string) => {
    setEditingId(id);
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setEditingId(null);
  };

  /* ========================================================= */

  const totalPages = Math.ceil(count / limit);

  return (
    <div className="p-6 bg-gray-100 min-h-screen">
      {/* BRAND HEADER */}
      <div className="flex justify-between items-center mb-6">
        <div className="flex items-center gap-4">
          <img src="/logo_minalgems.png" className="h-12" alt="Minal Gems" />
          <h1 className="text-3xl font-bold text-gray-800">Sales Register</h1>
        </div>

        <div className="flex gap-2 flex-wrap">
          <button
            onClick={() => safeDownload(exportSalesItemsCSV, "sales.csv")}
            className="btn-green"
          >
            <Download size={16} /> CSV
          </button>
          <button
            onClick={() => safeDownload(exportSalesItemsExcel, "sales.xlsx")}
            className="btn-green"
          >
            <Download size={16} /> Excel
          </button>
          <button
            onClick={() =>
              safeDownload(exportSalesRegisterPDF, "sales-register.pdf")
            }
            className="btn-red"
          >
            <FileText size={16} /> Register PDF
          </button>
          <button onClick={() => fileRef.current?.click()} className="btn-blue">
            Import CSV
          </button>
          <input
            type="file"
            ref={fileRef}
            hidden
            accept=".csv"
            onChange={(e) => e.target.files && handleImport(e.target.files[0])}
          />
          <button onClick={openCreateModal} className="btn-primary">
            <Plus size={16} /> New Sale
          </button>
        </div>
      </div>

      {/* ADVANCED FILTERS */}
      <div className="bg-white p-4 rounded shadow mb-4 grid grid-cols-1 md:grid-cols-4 gap-4">
        <input
          type="text"
          placeholder="Search invoice / customer..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="border p-2 rounded"
        />
        <input
          type="date"
          value={fromDate}
          onChange={(e) => setFromDate(e.target.value)}
          className="border p-2 rounded"
        />
        <input
          type="date"
          value={toDate}
          onChange={(e) => setToDate(e.target.value)}
          className="border p-2 rounded"
        />
        <button onClick={loadSales} className="bg-gray-800 text-white rounded">
          Apply Filters
        </button>
      </div>

      {/* TABLE */}
      <div className="bg-white rounded shadow overflow-auto">
        <table className="w-full text-sm border-collapse">
          <thead className="bg-gray-200 sticky top-0 z-10">
            <tr>
              <th></th>
              <th onClick={() => handleSort("number")} className="cursor-pointer p-2 border">
                Invoice
              </th>
              <th className="p-2 border">Image</th>
              <th className="p-2 border">Item</th>
              <th className="p-2 border">Dia Pcs</th>
              <th className="p-2 border">Dia Ct</th>
              <th className="p-2 border">Diamond ₹</th>
              <th className="p-2 border">Gold (g)</th>
              <th className="p-2 border">Gold ₹</th>
              <th className="p-2 border">Making</th>
              <th className="p-2 border">Profit</th>
              <th className="p-2 border">Selling</th>
              <th className="p-2 border">Customer</th>
              <th className="p-2 border">Craftsman</th>
              <th className="p-2 border">Date</th>
              <th className="p-2 border">Invoice</th>
              <th className="p-2 border">Edit</th>
              <th className="p-2 border">Delete</th>
            </tr>
          </thead>

          <tbody>
            {sortedItems.map((sale) => (
              <React.Fragment key={sale.id}>
                <tr className="hover:bg-gray-50">
                  <td className="p-2 border text-center">
                    <button
                      onClick={() => {
                        const next = new Set(expanded);
                        next.has(sale.id) ? next.delete(sale.id) : next.add(sale.id);
                        setExpanded(next);
                      }}
                    >
                      {expanded.has(sale.id) ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                    </button>
                  </td>

                  <td className="p-2 border">{sale.number}</td>

                  <td className="p-2 border">
                    {sale.product_image_url && (
                      <img
                        src={`${import.meta.env.VITE_API_BASE_URL}${sale.product_image_url}`}
                        className="h-10 w-10 object-cover rounded"
                      />
                    )}
                  </td>

                  <td className="p-2 border">{sale.item}</td>
                  <td className="p-2 border">{sale.diamond_pcs}</td>
                  <td className="p-2 border">{sale.diamond_carat}</td>
                  <td className="p-2 border">{money(sale.total_diamond_price)}</td>
                  <td className="p-2 border font-medium">{Number(sale.gold).toFixed(3)}</td>
                  <td className="p-2 border">{money(sale.gold_price)}</td>
                  <td className="p-2 border">{money(sale.total_making_cost)}</td>
                  <td
                    className={`p-2 border font-semibold ${
                      sale.profit_amount > 0 ? "text-green-600" : "text-red-500"
                    }`}
                  >
                    {money(sale.profit_amount)}
                  </td>
                  <td className="p-2 border font-bold text-gray-800">{money(sale.selling_price)}</td>
                  <td className="p-2 border">{sale.customer_name}</td>
                  <td className="p-2 border font-medium text-gray-700">
                    {sale.craftsman_name || "—"}
                  </td>
                  <td className="p-2 border">{dateFmt(sale.created_at)}</td>

                  <td className="p-2 border text-center">
                    <button
                      onClick={() =>
                        safeDownload(
                          () => exportSalesInvoicePDF(sale.id),
                          `invoice-${sale.number}.pdf`
                        )
                      }
                    >
                      <Receipt size={16} />
                    </button>
                  </td>

                  <td className="p-2 border text-center">
                    <button onClick={() => openEditModal(sale.id)} className="text-blue-600 hover:text-blue-800">
                      <Pencil size={16} />
                    </button>
                  </td>

                  <td className="p-2 border text-center">
                    <button
                      onClick={async () => {
                        if (!confirm("Delete?")) return;
                        await deleteSalesItem(sale.id);
                        loadSales();
                      }}
                      className="text-red-600 hover:text-red-800"
                    >
                      <Trash2 size={16} />
                    </button>
                  </td>
                </tr>

                {/* DIAMOND EXPAND ROW */}
                {expanded.has(sale.id) && (
                  <tr>
                    <td colSpan={18} className="bg-gray-50 p-4 border">
                      <h4 className="font-semibold mb-2">Diamond Details</h4>
                      <table className="w-full text-xs border">
                        <thead className="bg-gray-200">
                          <tr>
                            <th className="border p-1">Pcs</th>
                            <th className="border p-1">Carat</th>
                            <th className="border p-1">Rate</th>
                            <th className="border p-1">Amount</th>
                            <th className="border p-1">Type</th>
                          </tr>
                        </thead>
                        <tbody>
                          {sale.diamonds.map((d, i) => (
                            <tr key={i}>
                              <td className="border p-1">{d.pcs}</td>
                              <td className="border p-1">{d.carat}</td>
                              <td className="border p-1">{money(d.rate)}</td>
                              <td className="border p-1">{money(d.amount)}</td>
                              <td className="border p-1">{d.type}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </td>
                  </tr>
                )}
              </React.Fragment>
            ))}
          </tbody>
        </table>

        {items.length === 0 && !loading && (
          <div className="p-6 text-center text-gray-500">No sales found</div>
        )}
      </div>

      {/* PAGINATION */}
      {totalPages > 1 && (
        <div className="flex justify-between mt-4">
          <span>
            Page {page} of {totalPages}
          </span>
          <div className="flex gap-2">
            <button
              disabled={page === 1}
              onClick={() => setPage((p) => p - 1)}
              className="p-2 border rounded disabled:opacity-50"
            >
              <ChevronLeft />
            </button>
            <button
              disabled={page === totalPages}
              onClick={() => setPage((p) => p + 1)}
              className="p-2 border rounded disabled:opacity-50"
            >
              <ChevronRight />
            </button>
          </div>
        </div>
      )}

      {/* CREATE/EDIT MODAL */}
      {isModalOpen && (
        <SaleModal
          editingId={editingId}
          onClose={closeModal}
          onSuccess={loadSales}
        />
      )}
    </div>
  );
};

/* =========================================================
   SALE MODAL (FORM)
========================================================= */

interface SaleModalProps {
  editingId: string | null;
  onClose: () => void;
  onSuccess: () => void;
}

const SaleModal: React.FC<SaleModalProps> = ({ editingId, onClose, onSuccess }) => {
  const [loading, setLoading] = useState(false);
  const [products, setProducts] = useState<Product[]>([]);
  const [customers, setCustomers] = useState<any[]>([]);
  const [craftsmen, setCraftsmen] = useState<any[]>([]);

  const {
    register,
    control,
    handleSubmit,
    setValue,
    watch,
    reset,
    formState: { errors },
  } = useForm<SaleFormValues>({
    defaultValues: {
      number: "",
      item: "",
      product_id: null,
      diamonds: [{ pcs: 1, carat: 0, rate: 0, type: "Diamond", packet_no: "" }],
      gold: 0,
      gold_price: 0,
      labour_charge: 0,
      profit_percent: 0,
      customer_id: null,
      customer_name: "",
      craftsman_id: null,
      craftsman_name: "",
      product_image: null,
    },
  });

  const { fields, append, remove } = useFieldArray({
    control,
    name: "diamonds",
  });

  // Load master data on mount
  useEffect(() => {
    const loadMasters = async () => {
      try {
        const [prodRes, custRes, craftRes] = await Promise.all([
          fetchProductsAdmin({ limit: 100 }),
          listCustomers({ limit: 100 }),
          listCraftsmen({ limit: 100 }),
        ]);
        if (prodRes?.ok) setProducts(prodRes.products || []);
        if (custRes?.ok) setCustomers(custRes.results || []);
        if (craftRes?.ok) setCraftsmen(craftRes.results || []);
      } catch (error) {
        toast.error("Failed to load master data");
      }
    };
    loadMasters();
  }, []);

  // Load sale data if editing
  useEffect(() => {
    if (editingId) {
      setLoading(true);
      getSalesItem(editingId)
        .then((res: any) => {
          if (res?.ok && res.result) {
            const sale = res.result;
            reset({
              number: sale.number,
              item: sale.item,
              product_id: sale.product_id,
              diamonds: sale.diamonds.map((d: any) => ({
                pcs: d.pcs,
                carat: d.carat,
                rate: d.rate,
                type: d.type || "Diamond",
                packet_no: d.packet_no || "",
              })),
              gold: sale.gold,
              gold_price: sale.gold_price,
              labour_charge: sale.labour_charge,
              profit_percent: sale.profit_percent,
              customer_id: sale.customer_id,
              customer_name: sale.customer_name,
              craftsman_id: sale.craftsman_id,
              craftsman_name: sale.craftsman_name,
            });
          } else {
            toast.error("Failed to load sale details");
            onClose();
          }
        })
        .catch(() => {
          toast.error("Error loading sale");
          onClose();
        })
        .finally(() => setLoading(false));
    }
  }, [editingId, reset, onClose]);

  // Handle form submit
  const onSubmit = async (data: SaleFormValues) => {
    setLoading(true);
    try {
      // Prepare payload
      const payload: SalesItemPayload = {
        number: data.number,
        item: data.item,
        diamonds: data.diamonds,
        gold: data.gold,
        gold_price: data.gold_price,
        labour_charge: data.labour_charge,
        profit_percent: data.profit_percent,
        product_id: data.product_id || null,
        customer_id: data.customer_id || null,
        customer_name: data.customer_name || null,
        craftsman_id: data.craftsman_id || null,
        craftman: data.craftsman_name || null,
      };

      // Handle image
      let formData: FormData | SalesItemPayload = payload;
      if (data.product_image && data.product_image[0]) {
        formData = new FormData();
        Object.entries(payload).forEach(([key, val]) => {
          if (val !== undefined && val !== null) {
            if (key === "diamonds") {
              formData.append(key, JSON.stringify(val));
            } else {
              formData.append(key, String(val));
            }
          }
        });
        formData.append("product_image", data.product_image[0]);
      }

      let res;
      if (editingId) {
        res = await updateSalesItem(editingId, formData);
      } else {
        res = await createSalesItem(formData);
      }

      if (res?.ok) {
        toast.success(editingId ? "Sale updated" : "Sale created");
        onSuccess();
        onClose();
      } else {
        toast.error("Operation failed");
      }
    } catch (error) {
      toast.error("An error occurred");
    } finally {
      setLoading(false);
    }
  };

  // Auto-fill item when product selected
  const handleProductChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const productId = e.target.value;
    const product = products.find((p) => p.id === productId);
    if (product) {
      setValue("product_id", product.id);
      setValue("item", product.title);
    } else {
      setValue("product_id", null);
      setValue("item", "");
    }
  };

  // Auto-fill customer name when customer selected
  const handleCustomerChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const custId = e.target.value;
    const customer = customers.find((c) => c.id === custId);
    if (customer) {
      setValue("customer_id", customer.id);
      setValue("customer_name", customer.name);
    } else {
      setValue("customer_id", null);
      setValue("customer_name", "");
    }
  };

  // Auto-fill craftsman name when craftsman selected
  const handleCraftsmanChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const craftId = e.target.value;
    const craftsman = craftsmen.find((c) => c.id === craftId);
    if (craftsman) {
      setValue("craftsman_id", craftsman.id);
      setValue("craftsman_name", craftsman.name);
    } else {
      setValue("craftsman_id", null);
      setValue("craftsman_name", "");
    }
  };

  if (loading) {
    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
        <div className="bg-white p-6 rounded shadow-lg">Loading...</div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 overflow-y-auto">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-4xl max-h-[90vh] overflow-y-auto m-4">
        <div className="flex justify-between items-center p-6 border-b sticky top-0 bg-white">
          <h2 className="text-xl font-bold">{editingId ? "Edit Sale" : "New Sale"}</h2>
          <button onClick={onClose} className="text-gray-500 hover:text-gray-700">
            <X size={20} />
          </button>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="p-6 space-y-6">
          {/* Basic Details */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-1">Invoice Number *</label>
              <input
                {...register("number", { required: "Invoice number is required" })}
                className="w-full border rounded p-2"
                placeholder="INV-001"
              />
              {errors.number && <p className="text-red-500 text-xs mt-1">{errors.number.message}</p>}
            </div>

            <div>
              <label className="block text-sm font-medium mb-1">Product (optional)</label>
              <select
                onChange={handleProductChange}
                className="w-full border rounded p-2"
                value={watch("product_id") || ""}
              >
                <option value="">-- Select Product --</option>
                {products.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.title}
                  </option>
                ))}
              </select>
            </div>

            <div className="md:col-span-2">
              <label className="block text-sm font-medium mb-1">Item Description *</label>
              <input
                {...register("item", { required: "Item description is required" })}
                className="w-full border rounded p-2"
                placeholder="Gold ring with diamonds..."
              />
              {errors.item && <p className="text-red-500 text-xs mt-1">{errors.item.message}</p>}
            </div>

            <div>
              <label className="block text-sm font-medium mb-1">Customer (optional)</label>
              <select
                onChange={handleCustomerChange}
                className="w-full border rounded p-2"
                value={watch("customer_id") || ""}
              >
                <option value="">-- Select Customer --</option>
                {customers.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium mb-1">Or Enter Customer Name</label>
              <input
                {...register("customer_name")}
                className="w-full border rounded p-2"
                placeholder="Customer name"
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-1">Craftsman (optional)</label>
              <select
                onChange={handleCraftsmanChange}
                className="w-full border rounded p-2"
                value={watch("craftsman_id") || ""}
              >
                <option value="">-- Select Craftsman --</option>
                {craftsmen.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium mb-1">Or Enter Craftsman Name</label>
              <input
                {...register("craftsman_name")}
                className="w-full border rounded p-2"
                placeholder="Craftsman name"
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-1">Product Image</label>
              <input
                type="file"
                accept="image/*"
                {...register("product_image")}
                className="w-full border rounded p-2"
              />
            </div>
          </div>

          {/* Diamonds Section */}
          <div className="border-t pt-4">
            <h3 className="font-semibold mb-2">Diamonds</h3>
            <div className="space-y-2">
              {fields.map((field, index) => (
                <div key={field.id} className="grid grid-cols-12 gap-2 items-end">
                  <div className="col-span-2">
                    <label className="block text-xs">Pcs</label>
                    <input
                      type="number"
                      {...register(`diamonds.${index}.pcs` as const, { valueAsNumber: true, min: 1 })}
                      className="w-full border rounded p-1"
                    />
                  </div>
                  <div className="col-span-2">
                    <label className="block text-xs">Carat</label>
                    <input
                      type="number"
                      step="0.01"
                      {...register(`diamonds.${index}.carat` as const, { valueAsNumber: true })}
                      className="w-full border rounded p-1"
                    />
                  </div>
                  <div className="col-span-2">
                    <label className="block text-xs">Rate</label>
                    <input
                      type="number"
                      step="0.01"
                      {...register(`diamonds.${index}.rate` as const, { valueAsNumber: true })}
                      className="w-full border rounded p-1"
                    />
                  </div>
                  <div className="col-span-2">
                    <label className="block text-xs">Type</label>
                    <input
                      {...register(`diamonds.${index}.type` as const)}
                      className="w-full border rounded p-1"
                      placeholder="Diamond"
                    />
                  </div>
                  <div className="col-span-3">
                    <label className="block text-xs">Packet No (opt)</label>
                    <input
                      {...register(`diamonds.${index}.packet_no` as const)}
                      className="w-full border rounded p-1"
                    />
                  </div>
                  <div className="col-span-1">
                    <button
                      type="button"
                      onClick={() => remove(index)}
                      className="text-red-500 hover:text-red-700 p-1"
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                </div>
              ))}
              <button
                type="button"
                onClick={() => append({ pcs: 1, carat: 0, rate: 0, type: "Diamond", packet_no: "" })}
                className="text-blue-600 text-sm flex items-center gap-1 mt-2"
              >
                <Plus size={16} /> Add Diamond
              </button>
            </div>
          </div>

          {/* Gold & Pricing */}
          <div className="border-t pt-4 grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium mb-1">Gold (g)</label>
              <input
                type="number"
                step="0.01"
                {...register("gold", { valueAsNumber: true })}
                className="w-full border rounded p-2"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Gold Price (₹)</label>
              <input
                type="number"
                step="0.01"
                {...register("gold_price", { valueAsNumber: true })}
                className="w-full border rounded p-2"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Labour Charge (₹)</label>
              <input
                type="number"
                step="0.01"
                {...register("labour_charge", { valueAsNumber: true })}
                className="w-full border rounded p-2"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Profit Percent (%)</label>
              <input
                type="number"
                step="0.01"
                {...register("profit_percent", { valueAsNumber: true })}
                className="w-full border rounded p-2"
              />
            </div>
          </div>

          {/* Form Actions */}
          <div className="border-t pt-4 flex justify-end gap-2">
            <button type="button" onClick={onClose} className="px-4 py-2 border rounded hover:bg-gray-100">
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50 flex items-center gap-2"
            >
              <Save size={16} /> {editingId ? "Update" : "Create"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default Sales;