// src/pages/sales/Sales.tsx
import React, { useEffect, useState, useCallback, useRef } from "react";
import { toast } from "react-hot-toast";
import {
  Plus, Trash2, Download, FileText, Edit, Search, X,
  Image as ImageIcon, ChevronLeft, ChevronRight,
} from "lucide-react";

import {
  listSalesItems, createSalesItem, updateSalesItem,
  deleteSalesItem, exportSalesItemsCSV, exportSalesItemsPDF,
} from "@/api/sales/sales.api";

import { fetchProductsAdmin, type Product } from "@/api/masters/products.api";
import { listCustomers } from "@/api/masters/customers.api";
import { listCraftsmen } from "@/api/masters/craftsmen.api";

interface Sale {
  id: number;
  number: string;
  item: string;
  product_image_url?: string | null;
  diamond_pcs: number | string;
  diamond_carat: number | string;
  rate: number | string;
  total_diamond_price: number | string;
  gold: number | string;
  gold_price: number | string;
  labour_charge: number | string;
  total_making_cost: number | string;
  selling_price: number | string;
  product_id?: string | null;
  product_title?: string | null;
  craftsman_id?: string | null;
  craftsman_name?: string | null;
  customer_id?: string | null;
  customer_name?: string | null;
  created_at: string;
  updated_at: string;
}

interface Option {
  id: string;
  name: string;
}

const formatMoney = (value: any): string => {
  if (value === null || value === undefined || value === "") return "—";
  const num = Number(value);
  return isNaN(num) ? "—" : `₹${num.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
};

const formatDate = (dateStr: string): string => {
  return new Date(dateStr).toLocaleDateString("en-IN", {
    day: "2-digit", month: "short", year: "numeric",
  });
};

const API_BASE = import.meta.env.VITE_API_BASE_URL?.replace(/\/+$/, "") || "https://apiminalgems.exotech.co.in/api";

const Sales: React.FC = () => {
  const [items, setItems] = useState<Sale[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [page, setPage] = useState(1);
  const [totalCount, setTotalCount] = useState(0);
  const limit = 20;

  const [showCreateModal, setShowCreateModal] = useState(false);
  const [editingSale, setEditingSale] = useState<Sale | null>(null);

  const [products, setProducts] = useState<Product[]>([]);
  const [customers, setCustomers] = useState<Option[]>([]);
  const [craftsmen, setCraftsmen] = useState<Option[]>([]);

  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const loadSales = useCallback(async () => {
    try {
      setLoading(true);
      const response = await listSalesItems({
        q: searchTerm,
        limit,
        offset: (page - 1) * limit,
      });
      if (!response.ok) throw new Error(response.error || "Failed to load");
      setItems(response.results || []);
      setTotalCount(response.count || 0);
    } catch (error) {
      toast.error("Could not load sales items");
      console.error(error);
    } finally {
      setLoading(false);
    }
  }, [searchTerm, page]);

  const loadMasters = async () => {
    try {
      const [productsRes, customersRes, craftsmenRes] = await Promise.all([
        fetchProductsAdmin({ limit: 500 }),
        listCustomers({ limit: 500 }),
        listCraftsmen({ limit: 500 }),
      ]);

      setProducts(productsRes.products || []);

      const customersList = customersRes.results || customersRes.data?.results || customersRes;
      setCustomers(
        Array.isArray(customersList)
          ? customersList.map((c: any) => ({ id: c.id, name: c.name }))
          : []
      );

      const craftsmenList = craftsmenRes.results || craftsmenRes.data?.results || craftsmenRes;
      setCraftsmen(
        Array.isArray(craftsmenList)
          ? craftsmenList.map((c: any) => ({ id: c.id, name: c.name }))
          : []
      );
    } catch (error) {
      toast.error("Failed to load master data");
    }
  };

  useEffect(() => {
    loadSales();
  }, [loadSales]);

  useEffect(() => {
    loadMasters();
  }, []);

  const handleCreate = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);

    const payload = new FormData();
    payload.append("number", formData.get("number") as string);
    payload.append("item", formData.get("item") as string);
    payload.append("diamond_pcs", formData.get("diamond_pcs") as string || "0");
    payload.append("diamond_carat", formData.get("diamond_carat") as string || "0");
    payload.append("rate", formData.get("rate") as string || "0");
    payload.append("gold", formData.get("gold") as string || "0");
    payload.append("gold_price", formData.get("gold_price") as string || "0");
    payload.append("labour_charge", formData.get("labour_charge") as string || "0");

    const productId = formData.get("product_id");
    if (productId) payload.append("product_id", productId as string);

    const customerId = formData.get("customer_id");
    if (customerId) payload.append("customer_id", customerId as string);

    const craftsmanId = formData.get("craftsman_id");
    if (craftsmanId) payload.append("craftsman_id", craftsmanId as string);

    const imageFile = formData.get("product_image") as File;
    if (imageFile && imageFile.size > 0) {
      payload.append("product_image", imageFile);
    }

    try {
      const response = await createSalesItem(payload);
      if (!response.ok) throw new Error(response.error);
      toast.success("Sale created successfully");
      setShowCreateModal(false);
      setImagePreview(null);
      loadSales();
    } catch (error: any) {
      toast.error(error.message || "Creation failed");
    }
  };

  const handleUpdate = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!editingSale) return;

    const formData = new FormData(e.currentTarget);
    const payload = new FormData();
    
    payload.append("number", formData.get("number") as string);
    payload.append("item", formData.get("item") as string);
    payload.append("diamond_pcs", formData.get("diamond_pcs") as string || "0");
    payload.append("diamond_carat", formData.get("diamond_carat") as string || "0");
    payload.append("rate", formData.get("rate") as string || "0");
    payload.append("gold", formData.get("gold") as string || "0");
    payload.append("gold_price", formData.get("gold_price") as string || "0");
    payload.append("labour_charge", formData.get("labour_charge") as string || "0");

    const productId = formData.get("product_id");
    if (productId) payload.append("product_id", productId as string);

    const customerId = formData.get("customer_id");
    if (customerId) payload.append("customer_id", customerId as string);

    const craftsmanId = formData.get("craftsman_id");
    if (craftsmanId) payload.append("craftsman_id", craftsmanId as string);

    const imageFile = formData.get("product_image") as File;
    if (imageFile && imageFile.size > 0) {
      payload.append("product_image", imageFile);
    }

    try {
      const response = await updateSalesItem(String(editingSale.id), payload);
      if (!response.ok) throw new Error(response.error);
      toast.success("Sale updated successfully");
      setEditingSale(null);
      setImagePreview(null);
      loadSales();
    } catch (error: any) {
      toast.error(error.message || "Update failed");
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm("Delete this sale?")) return;
    try {
      const response = await deleteSalesItem(String(id));
      if (!response.ok) throw new Error(response.error);
      toast.success("Sale deleted");
      loadSales();
    } catch (error: any) {
      toast.error(error.message || "Delete failed");
    }
  };

  const handleExportCSV = async () => {
    try {
      const blob = await exportSalesItemsCSV();
      const url = window.URL.createObjectURL(blob as Blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `sales_${Date.now()}.csv`;
      a.click();
      toast.success("CSV exported");
    } catch (error) {
      toast.error("Export failed");
    }
  };

  const handleExportPDF = async () => {
    try {
      const blob = await exportSalesItemsPDF();
      const url = window.URL.createObjectURL(blob as Blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `sales_${Date.now()}.pdf`;
      a.click();
      toast.success("PDF exported");
    } catch (error) {
      toast.error("Export failed");
    }
  };

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 10 * 1024 * 1024) {
        toast.error("Image must be less than 10MB");
        return;
      }
      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const totalPages = Math.ceil(totalCount / limit);

  return (
    <div className="p-4 md:p-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
        <h1 className="text-2xl md:text-3xl font-bold text-gray-800">Sales Management</h1>
        <div className="flex flex-wrap gap-2">
          <button
            onClick={() => setShowCreateModal(true)}
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition"
          >
            <Plus size={18} />
            <span className="hidden sm:inline">Add Sale</span>
          </button>
          <button
            onClick={handleExportCSV}
            className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition"
          >
            <FileText size={18} />
            <span className="hidden sm:inline">CSV</span>
          </button>
          <button
            onClick={handleExportPDF}
            className="flex items-center gap-2 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition"
          >
            <Download size={18} />
            <span className="hidden sm:inline">PDF</span>
          </button>
        </div>
      </div>

      {/* Search */}
      <div className="mb-6">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
          <input
            type="text"
            placeholder="Search by number or item..."
            value={searchTerm}
            onChange={(e) => {
              setSearchTerm(e.target.value);
              setPage(1);
            }}
            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
        </div>
      </div>

      {/* Table */}
      <div className="bg-white rounded-lg shadow overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 border-b">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Image</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Number</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Item</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Customer</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Craftsman</th>
                <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">Selling Price</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Date</th>
                <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {loading ? (
                <tr>
                  <td colSpan={8} className="px-4 py-8 text-center text-gray-500">
                    Loading...
                  </td>
                </tr>
              ) : items.length === 0 ? (
                <tr>
                  <td colSpan={8} className="px-4 py-8 text-center text-gray-500">
                    No sales found
                  </td>
                </tr>
              ) : (
                items.map((sale) => (
                  <tr key={sale.id} className="hover:bg-gray-50">
                    <td className="px-4 py-3">
                      {sale.product_image_url ? (
                        <img
                          src={`${API_BASE}${sale.product_image_url}`}
                          alt={sale.item}
                          className="w-12 h-12 object-cover rounded"
                        />
                      ) : (
                        <div className="w-12 h-12 bg-gray-200 rounded flex items-center justify-center">
                          <ImageIcon size={20} className="text-gray-400" />
                        </div>
                      )}
                    </td>
                    <td className="px-4 py-3 text-sm font-medium text-gray-900">{sale.number}</td>
                    <td className="px-4 py-3 text-sm text-gray-700">{sale.item}</td>
                    <td className="px-4 py-3 text-sm text-gray-700">{sale.customer_name || "—"}</td>
                    <td className="px-4 py-3 text-sm text-gray-700">{sale.craftsman_name || "—"}</td>
                    <td className="px-4 py-3 text-sm text-right font-semibold text-gray-900">
                      {formatMoney(sale.selling_price)}
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-700">{formatDate(sale.created_at)}</td>
                    <td className="px-4 py-3">
                      <div className="flex items-center justify-center gap-2">
                        <button
                          onClick={() => {
                            setEditingSale(sale);
                            setImagePreview(sale.product_image_url ? `${API_BASE}${sale.product_image_url}` : null);
                          }}
                          className="p-1 text-blue-600 hover:bg-blue-50 rounded"
                        >
                          <Edit size={18} />
                        </button>
                        <button
                          onClick={() => handleDelete(sale.id)}
                          className="p-1 text-red-600 hover:bg-red-50 rounded"
                        >
                          <Trash2 size={18} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="px-4 py-3 border-t flex items-center justify-between">
            <div className="text-sm text-gray-700">
              Page {page} of {totalPages} ({totalCount} total)
            </div>
            <div className="flex gap-2">
              <button
                onClick={() => setPage(p => Math.max(1, p - 1))}
                disabled={page === 1}
                className="px-3 py-1 border rounded hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <ChevronLeft size={18} />
              </button>
              <button
                onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                disabled={page === totalPages}
                className="px-3 py-1 border rounded hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <ChevronRight size={18} />
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Create/Edit Modal */}
      {(showCreateModal || editingSale) && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50 overflow-y-auto">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-2xl my-8">
            <div className="flex items-center justify-between p-4 border-b">
              <h2 className="text-xl font-bold">
                {editingSale ? "Edit Sale" : "Create Sale"}
              </h2>
              <button
                onClick={() => {
                  setShowCreateModal(false);
                  setEditingSale(null);
                  setImagePreview(null);
                }}
                className="p-1 hover:bg-gray-100 rounded"
              >
                <X size={20} />
              </button>
            </div>

            <form onSubmit={editingSale ? handleUpdate : handleCreate} className="p-4 space-y-4">
              {/* Image Upload */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Product Image</label>
                <div className="flex items-center gap-4">
                  {imagePreview && (
                    <img src={imagePreview} alt="Preview" className="w-24 h-24 object-cover rounded" />
                  )}
                  <input
                    ref={fileInputRef}
                    type="file"
                    name="product_image"
                    accept="image/*"
                    onChange={handleImageChange}
                    className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Number */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Number *</label>
                  <input
                    type="text"
                    name="number"
                    defaultValue={editingSale?.number || ""}
                    required
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>

                {/* Item */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Item *</label>
                  <input
                    type="text"
                    name="item"
                    defaultValue={editingSale?.item || ""}
                    required
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>

                {/* Product */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Product</label>
                  <select
                    name="product_id"
                    defaultValue={editingSale?.product_id || ""}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    <option value="">Select Product</option>
                    {products.map((p) => (
                      <option key={p.id} value={p.id}>
                        {p.title}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Customer */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Customer</label>
                  <select
                    name="customer_id"
                    defaultValue={editingSale?.customer_id || ""}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    <option value="">Select Customer</option>
                    {customers.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.name}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Craftsman */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Craftsman</label>
                  <select
                    name="craftsman_id"
                    defaultValue={editingSale?.craftsman_id || ""}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    <option value="">Select Craftsman</option>
                    {craftsmen.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.name}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Diamond Pcs */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Diamond Pcs</label>
                  <input
                    type="number"
                    name="diamond_pcs"
                    step="1"
                    defaultValue={editingSale?.diamond_pcs || 0}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>

                {/* Diamond Carat */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Diamond Carat</label>
                  <input
                    type="number"
                    name="diamond_carat"
                    step="0.01"
                    defaultValue={editingSale?.diamond_carat || 0}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>

                {/* Rate */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Rate</label>
                  <input
                    type="number"
                    name="rate"
                    step="0.01"
                    defaultValue={editingSale?.rate || 0}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>

                {/* Gold */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Gold (grams)</label>
                  <input
                    type="number"
                    name="gold"
                    step="0.01"
                    defaultValue={editingSale?.gold || 0}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>

                {/* Gold Price */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Gold Price</label>
                  <input
                    type="number"
                    name="gold_price"
                    step="0.01"
                    defaultValue={editingSale?.gold_price || 0}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>

                {/* Labour Charge */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Labour Charge</label>
                  <input
                    type="number"
                    name="labour_charge"
                    step="0.01"
                    defaultValue={editingSale?.labour_charge || 0}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
              </div>

              {/* Actions */}
              <div className="flex justify-end gap-3 pt-4 border-t">
                <button
                  type="button"
                  onClick={() => {
                    setShowCreateModal(false);
                    setEditingSale(null);
                    setImagePreview(null);
                  }}
                  className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition"
                >
                  {editingSale ? "Update" : "Create"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Sales;
