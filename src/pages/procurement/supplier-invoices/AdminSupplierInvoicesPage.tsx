import React, { useEffect, useState } from "react";
import {
  Plus,
  Edit2,
  Trash2,
  ChevronUp,
  ChevronDown,
  Loader2,
  X,
} from "lucide-react";
import { toast } from "react-hot-toast";
import { useParams, useNavigate } from "react-router-dom";

import {
  listSupplierInvoices,
  getSupplierInvoice,
  createSupplierInvoice,
  updateSupplierInvoice,
  deleteSupplierInvoice,
} from "@/api/procurement/supplierInvoices.api";

import { apiFetch } from "@/lib/apiClient";
import { useAuth } from "@/context/AuthContext";

const LIMIT = 20;

type SortField =
  | "invoice_date"
  | "amount"
  | "due_date"
  | "invoice_number"
  | null;

type SortDir = "asc" | "desc";

const STATUS_OPTIONS = ["unpaid", "paid", "overdue"];

const AdminSupplierInvoicesPage: React.FC = () => {
  const { id: supplierId } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const isSuperAdminUI = user?.role_id === 1;

  /* --------------------------
     State
  -------------------------- */
  const [loading, setLoading] = useState(false);
  const [invoices, setInvoices] = useState<any[]>([]);
  const [total, setTotal] = useState(0);

  const [page, setPage] = useState(1);
  const [q, setQ] = useState("");
  const [status, setStatus] = useState<string | undefined>(undefined);

  const [sortField, setSortField] = useState<SortField>("invoice_date");
  const [sortDir, setSortDir] = useState<SortDir>("desc");

  const [modalOpen, setModalOpen] = useState(false);
  const [saving, setSaving] = useState(false);

  const [form, setForm] = useState<any>({
    id: "",
    invoice_number: "",
    purchase_order_id: "",
    invoice_date: "",
    due_date: "",
    amount: "",
    status: "unpaid",
    metadata: {},
  });

  const [purchaseOrders, setPurchaseOrders] = useState<any[]>([]);

  /* --------------------------
     Load Purchase Orders
  -------------------------- */
  const loadPOs = async () => {
    try {
      const res = await apiFetch(
        `/purchase-orders?supplier_id=${supplierId}&limit=200`
      );
      setPurchaseOrders(res.purchase_orders || []);
    } catch (err) {
      console.error("PO load failed", err);
    }
  };

  /* --------------------------
     Load Invoices
  -------------------------- */
  const loadInvoices = async () => {
    if (!supplierId) return;
    setLoading(true);

    try {
      const res = await listSupplierInvoices({
        supplier_id: supplierId,
        q: q || undefined,
        status: status || undefined,
        limit: LIMIT,
        offset: (page - 1) * LIMIT,
      });

      let items = res.invoices || [];

      // Safe sorting
      items = [...items].sort((a, b) => {
        const A = a[sortField || ""] ?? "";
        const B = b[sortField || ""] ?? "";

        if (sortField === "amount") {
          return sortDir === "asc"
            ? Number(A) - Number(B)
            : Number(B) - Number(A);
        }

        const tA = A ? new Date(A).getTime() : 0;
        const tB = B ? new Date(B).getTime() : 0;

        return sortDir === "asc" ? tA - tB : tB - tA;
      });

      setInvoices(items);
      setTotal(res.total || 0);
    } catch (err) {
      console.error(err);
      toast.error("Failed to load invoices.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadInvoices();
    loadPOs();
  }, [supplierId, page, q, status, sortField, sortDir]);

  /* --------------------------
     Sorting Toggle
  -------------------------- */
  const toggleSort = (field: SortField) => {
    if (sortField === field) {
      setSortDir(sortDir === "asc" ? "desc" : "asc");
    } else {
      setSortField(field);
      setSortDir("asc");
    }
  };

  /* --------------------------
     Create Modal
  -------------------------- */
  const openCreateModal = () => {
    setForm({
      id: "",
      invoice_number: "",
      purchase_order_id: "",
      invoice_date: "",
      due_date: "",
      amount: "",
      status: "unpaid",
      metadata: {},
    });
    setModalOpen(true);
  };

  /* --------------------------
     Edit Modal
  -------------------------- */
  const openEditModal = async (id: string) => {
    try {
      const r = await getSupplierInvoice(id);
      const inv = r.invoice;

      setForm({
        id: inv.id,
        invoice_number: inv.invoice_number,
        purchase_order_id: inv.purchase_order_id || "",
        invoice_date: inv.invoice_date || "",
        due_date: inv.due_date || "",
        amount: inv.amount,
        status: inv.status,
        metadata: inv.metadata || {},
      });

      setModalOpen(true);
    } catch (err) {
      toast.error("Failed to load invoice.");
    }
  };

  /* --------------------------
     Save
  -------------------------- */
  const handleSave = async (e: any) => {
    e.preventDefault();
    setSaving(true);

    try {
      const payload = {
        supplier_id: supplierId,
        invoice_number: form.invoice_number,
        purchase_order_id: form.purchase_order_id || null,
        invoice_date: form.invoice_date || null,
        due_date: form.due_date || null,
        amount: Number(form.amount),
        status: form.status,
        metadata: form.metadata || {},
      };

      if (form.id) {
        await updateSupplierInvoice(form.id, payload);
        toast.success("Invoice updated.");
      } else {
        await createSupplierInvoice(payload);
        toast.success("Invoice created.");
      }

      setModalOpen(false);
      loadInvoices();
    } catch (err: any) {
      toast.error(err?.message || "Save failed.");
    } finally {
      setSaving(false);
    }
  };

  /* --------------------------
     Delete
  -------------------------- */
  const handleDelete = async (id: string) => {
    if (!isSuperAdminUI)
      return toast.error("Delete requires super-admin privileges.");
    if (!confirm("Delete this invoice?")) return;

    try {
      await deleteSupplierInvoice(id);
      toast.success("Deleted.");
      loadInvoices();
    } catch (err) {
      toast.error("Delete failed.");
    }
  };

  const totalPages = Math.max(1, Math.ceil(total / LIMIT));

  /* --------------------------
     Render
  -------------------------- */
  return (
    <div className="p-6">
      {/* Header */}
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-lg font-semibold">Supplier Invoices</h1>
          <p className="text-xs text-slate-500">
            Manage invoices for this supplier.
          </p>
        </div>

        <button
          onClick={openCreateModal}
          className="rounded-full bg-slate-900 px-4 py-2 text-sm font-semibold text-white hover:bg-slate-800"
        >
          <Plus size={16} className="inline mr-1" /> Add Invoice
        </button>
      </div>

      {/* Filters */}
      <div className="mb-4 flex items-center gap-4">
        <input
          placeholder="Search invoice number..."
          value={q}
          onChange={(e) => setQ(e.target.value)}
          className="rounded-lg border px-3 py-2 text-sm w-64"
        />

        <select
          value={status || ""}
          onChange={(e) =>
            setStatus(e.target.value ? e.target.value : undefined)
          }
          className="rounded-lg border px-3 py-2 text-sm"
        >
          <option value="">All Status</option>
          {STATUS_OPTIONS.map((s) => (
            <option key={s} value={s}>
              {s}
            </option>
          ))}
        </select>
      </div>

      {/* Table */}
      <div className="rounded-xl border overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-slate-100">
            <tr>
              <th
                className="px-3 py-2 cursor-pointer"
                onClick={() => toggleSort("invoice_number")}
              >
                Invoice #
                {sortField === "invoice_number" &&
                  (sortDir === "asc" ? <ChevronUp /> : <ChevronDown />)}
              </th>

              <th className="px-3 py-2">PO</th>

              <th
                className="px-3 py-2 cursor-pointer"
                onClick={() => toggleSort("invoice_date")}
              >
                Invoice Date
                {sortField === "invoice_date" &&
                  (sortDir === "asc" ? <ChevronUp /> : <ChevronDown />)}
              </th>

              <th
                className="px-3 py-2 cursor-pointer"
                onClick={() => toggleSort("due_date")}
              >
                Due Date
                {sortField === "due_date" &&
                  (sortDir === "asc" ? <ChevronUp /> : <ChevronDown />)}
              </th>

              <th
                className="px-3 py-2 cursor-pointer text-right"
                onClick={() => toggleSort("amount")}
              >
                Amount
                {sortField === "amount" &&
                  (sortDir === "asc" ? <ChevronUp /> : <ChevronDown />)}
              </th>

              <th className="px-3 py-2 text-center">Status</th>
              <th className="px-3 py-2 text-right">Actions</th>
            </tr>
          </thead>

          <tbody>
            {loading ? (
              <tr>
                <td colSpan={7} className="text-center py-6">
                  <Loader2 className="animate-spin inline" />
                </td>
              </tr>
            ) : invoices.length === 0 ? (
              <tr>
                <td colSpan={7} className="text-center py-6 text-slate-500">
                  No invoices found.
                </td>
              </tr>
            ) : (
              invoices.map((inv) => {
                const overdue =
                  inv.status !== "paid" &&
                  inv.due_date &&
                  new Date(inv.due_date).getTime() < Date.now();

                return (
                  <tr key={inv.id} className="border-t">
                    <td className="px-3 py-2">{inv.invoice_number}</td>

                    <td className="px-3 py-2">
                      {inv.purchase_order_id ? (
                        <span className="text-blue-600 font-medium">
                          PO-{String(inv.purchase_order_id).slice(0, 6)}
                        </span>
                      ) : (
                        "—"
                      )}
                    </td>

                    <td className="px-3 py-2">
                      {inv.invoice_date
                        ? new Date(inv.invoice_date).toLocaleDateString()
                        : "—"}
                    </td>

                    <td
                      className={`px-3 py-2 ${
                        overdue ? "text-red-600 font-semibold" : ""
                      }`}
                    >
                      {inv.due_date
                        ? new Date(inv.due_date).toLocaleDateString()
                        : "—"}
                    </td>

                    <td className="px-3 py-2 text-right">
                      ₹ {Number(inv.amount).toLocaleString("en-IN")}
                    </td>

                    <td className="px-3 py-2 text-center capitalize">
                      {overdue ? "overdue" : inv.status}
                    </td>

                    <td className="px-3 py-2 text-right flex justify-end gap-2">
                      <button
                        onClick={() => openEditModal(inv.id)}
                        className="rounded-lg border px-2 py-1 hover:bg-slate-100 text-xs"
                      >
                        <Edit2 size={14} />
                      </button>

                      <button
                        disabled={!isSuperAdminUI}
                        onClick={() => handleDelete(inv.id)}
                        className="rounded-lg border border-rose-300 text-rose-600 px-2 py-1 hover:bg-rose-50 text-xs disabled:opacity-40"
                      >
                        <Trash2 size={14} />
                      </button>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="mt-4 flex items-center justify-between text-sm">
          <button
            onClick={() => setPage(Math.max(1, page - 1))}
            className="border rounded-lg px-3 py-1"
          >
            Previous
          </button>

          <span>
            Page {page} of {totalPages}
          </span>

          <button
            onClick={() => setPage(Math.min(totalPages, page + 1))}
            className="border rounded-lg px-3 py-1"
          >
            Next
          </button>
        </div>
      )}

      {/* Modal */}
      {modalOpen && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center p-4 z-50">
          <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-xl p-6 w-full max-w-xl border dark:border-slate-700">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold">
                {form.id ? "Edit Invoice" : "Create Invoice"}
              </h2>
              <button
                onClick={() => setModalOpen(false)}
                className="rounded-full p-1 hover:bg-slate-200 dark:hover:bg-slate-700"
              >
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleSave} className="space-y-4">
              {/* Invoice Number */}
              <div>
                <label className="block text-xs mb-1 font-medium">
                  Invoice Number
                </label>
                <input
                  value={form.invoice_number}
                  onChange={(e) =>
                    setForm((f: any) => ({
                      ...f,
                      invoice_number: e.target.value,
                    }))
                  }
                  className="w-full rounded-lg border px-3 py-2 text-sm"
                  required
                />
              </div>

              {/* Purchase Order Dropdown */}
              <div>
                <label className="block text-xs mb-1 font-medium">
                  Purchase Order
                </label>
                <select
                  value={form.purchase_order_id}
                  onChange={(e) =>
                    setForm((f: any) => ({
                      ...f,
                      purchase_order_id: e.target.value,
                    }))
                  }
                  className="w-full rounded-lg border px-3 py-2 text-sm"
                >
                  <option value="">— None —</option>
                  {purchaseOrders.map((po) => (
                    <option key={po.id} value={po.id}>
                      {po.po_number || po.id}
                    </option>
                  ))}
                </select>
              </div>

              {/* Dates */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs mb-1 font-medium">
                    Invoice Date
                  </label>
                  <input
                    type="date"
                    value={form.invoice_date}
                    onChange={(e) =>
                      setForm((f: any) => ({
                        ...f,
                        invoice_date: e.target.value,
                      }))
                    }
                    className="w-full rounded-lg border px-3 py-2 text-sm"
                  />
                </div>

                <div>
                  <label className="block text-xs mb-1 font-medium">
                    Due Date
                  </label>
                  <input
                    type="date"
                    value={form.due_date}
                    onChange={(e) =>
                      setForm((f: any) => ({
                        ...f,
                        due_date: e.target.value,
                      }))
                    }
                    className="w-full rounded-lg border px-3 py-2 text-sm"
                  />
                </div>
              </div>

              {/* Amount */}
              <div>
                <label className="block text-xs mb-1 font-medium">Amount</label>
                <input
                  type="number"
                  step="0.01"
                  value={form.amount}
                  onChange={(e) =>
                    setForm((f: any) => ({ ...f, amount: e.target.value }))
                  }
                  className="w-full rounded-lg border px-3 py-2 text-sm"
                  required
                />
              </div>

              {/* Status */}
              <div>
                <label className="block text-xs mb-1 font-medium">Status</label>
                <select
                  value={form.status}
                  onChange={(e) =>
                    setForm((f: any) => ({ ...f, status: e.target.value }))
                  }
                  className="w-full rounded-lg border px-3 py-2 text-sm"
                >
                  {STATUS_OPTIONS.map((s) => (
                    <option key={s} value={s}>
                      {s}
                    </option>
                  ))}
                </select>
              </div>

              {/* Actions */}
              <div className="flex justify-end gap-3 pt-4">
                <button
                  type="button"
                  onClick={() => setModalOpen(false)}
                  className="rounded-full border px-4 py-2 text-xs"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="rounded-full bg-slate-900 text-white px-4 py-2 text-xs"
                >
                  {saving ? (
                    <Loader2 size={16} className="animate-spin inline-block" />
                  ) : (
                    "Save"
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminSupplierInvoicesPage;
