import React, { useEffect, useState } from "react";
import {
  Receipt,
  Plus,
  Edit2,
  Trash2,
  Loader2,
  ChevronUp,
  ChevronDown,
} from "lucide-react";

import { toast } from "react-hot-toast";
import { useParams } from "react-router-dom";
import { useAuth } from "@/context/AuthContext";

/* API Client */
import {
  listSupplierPayments,
  getSupplierPayment,
  createSupplierPayment,
  updateSupplierPayment,
  deleteSupplierPayment,
} from "@/api/procurement/supplierPayments.api";

import { listSuppliers } from "@/api/masters/suppliers.api";
import { listSupplierInvoices } from "@/api/procurement/supplierInvoices.api";

/* -----------------------------
   Types
----------------------------- */
type SortField = "payment_date" | "amount" | null;
type SortDir = "asc" | "desc";
type SortEntry = { field: SortField; dir: SortDir };

const LIMIT = 20;

/* ===========================================================
   MAIN COMPONENT
=========================================================== */
const AdminSupplierPaymentsPage: React.FC = () => {
  const params = useParams();
  const supplierContextId = params.supplierId || null;

  const { user } = useAuth();
  const isSuperAdminUI = user?.role_id === 1;

  /* List state */
  const [loading, setLoading] = useState(false);
  const [payments, setPayments] = useState<any[]>([]);
  const [total, setTotal] = useState(0);

  /* Filters */
  const [supplierId, setSupplierId] = useState<string | null>(
    supplierContextId
  );
  const [invoiceId, setInvoiceId] = useState<string | null>(null);
  const [suppliers, setSuppliers] = useState<any[]>([]);
  const [invoices, setInvoices] = useState<any[]>([]);
  const [page, setPage] = useState(1);

  /* Sorting */
  const [sortStack, setSortStack] = useState<SortEntry[]>([]);

  /* Modal */
  const [modalOpen, setModalOpen] = useState(false);
  const [saving, setSaving] = useState(false);

  const [form, setForm] = useState<any>({
    id: "",
    supplier_id: "",
    invoice_id: "",
    payment_date: new Date().toISOString().slice(0, 10),
    amount: "",
    mode: "cash",
    reference: "",
  });

  const totalPages = Math.max(1, Math.ceil(total / LIMIT));

  /* ===========================================================
     LOAD SUPPLIERS
  =========================================================== */
  useEffect(() => {
    (async () => {
      try {
        const r = await listSuppliers({ limit: 500, offset: 0 });
        setSuppliers(r.suppliers || []);
      } catch (e) {
        console.error("Failed loading suppliers", e);
      }
    })();
  }, []);

  /* ===========================================================
     LOAD INVOICES (per supplier)
  =========================================================== */
  useEffect(() => {
    if (!supplierId) {
      setInvoices([]);
      return;
    }
    (async () => {
      try {
        const r = await listSupplierInvoices({
          supplier_id: supplierId,
          limit: 200,
        });
        setInvoices(r.invoices || []);
      } catch (e) {
        console.error("Failed loading invoices", e);
      }
    })();
  }, [supplierId]);

  /* ===========================================================
     LOAD PAYMENTS
  =========================================================== */
  const loadPayments = async () => {
    setLoading(true);
    try {
      const r = await listSupplierPayments({
        supplier_id: supplierId || undefined,
        invoice_id: invoiceId || undefined,
        limit: LIMIT,
        offset: (page - 1) * LIMIT,
      });

      let rows = r.payments || [];

      /* Multi-sort */
      if (sortStack.length) {
        const stackCopy = [...sortStack].reverse();
        rows = rows.sort((a, b) => {
          for (const s of stackCopy) {
            const A = a[s.field];
            const B = b[s.field];

            if (s.field === "amount") {
              if (+A < +B) return s.dir === "asc" ? -1 : 1;
              if (+A > +B) return s.dir === "asc" ? 1 : -1;
            } else {
              const tA = A ? new Date(A).getTime() : 0;
              const tB = B ? new Date(B).getTime() : 0;
              if (tA < tB) return s.dir === "asc" ? -1 : 1;
              if (tA > tB) return s.dir === "asc" ? 1 : -1;
            }
          }
          return 0;
        });
      }

      setPayments(rows);
      setTotal(r.total || 0);
    } catch (e) {
      toast.error("Failed loading payments");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    setPage(1);
  }, [supplierId, invoiceId]);

  useEffect(() => {
    loadPayments();
  }, [page, supplierId, invoiceId, sortStack]);

  /* ===========================================================
     SORTING
  =========================================================== */
  const toggleSort = (field: SortField, shiftKey = false) => {
    setSortStack((prev) => {
      const idx = prev.findIndex((x) => x.field === field);

      if (!shiftKey) {
        if (idx === 0) {
          const cur = prev[0];
          if (cur.dir === "asc") return [{ field, dir: "desc" }];
          return [];
        }
        return [{ field, dir: "asc" }];
      }

      /* Multi-sort (Shift key) */
      const copy = [...prev];
      if (idx === -1) {
        copy.push({ field, dir: "asc" });
        return copy;
      }
      const cur = copy[idx];
      if (cur.dir === "asc") copy[idx] = { field, dir: "desc" };
      else copy.splice(idx, 1);
      return copy;
    });
  };

  const getSortDir = (f: SortField) =>
    sortStack.find((s) => s.field === f)?.dir || null;

  /* ===========================================================
     CREATE / EDIT MODAL
  =========================================================== */
  const openCreateModal = () => {
    setForm({
      id: "",
      supplier_id: supplierId || "",
      invoice_id: "",
      payment_date: new Date().toISOString().slice(0, 10),
      amount: "",
      mode: "cash",
      reference: "",
    });
    setModalOpen(true);
  };

  const openEditModal = async (id: string) => {
    try {
      const r = await getSupplierPayment(id);
      const p = r.payment;

      setForm({
        id: p.id,
        supplier_id: p.supplier_id,
        invoice_id: p.invoice_id || "",
        payment_date: p.payment_date,
        amount: p.amount,
        mode: p.mode || "cash",
        reference: p.reference || "",
      });

      setModalOpen(true);
    } catch (e) {
      toast.error("Failed loading payment");
    }
  };

  /* ===========================================================
     SAVE PAYMENT
  =========================================================== */
  const handleSave = async (e?: any) => {
    e?.preventDefault();
    if (!form.supplier_id) return toast.error("Supplier required");
    if (!form.payment_date) return toast.error("Payment date required");
    if (!form.amount) return toast.error("Amount required");

    setSaving(true);
    try {
      if (form.id) {
        await updateSupplierPayment(form.id, form);
        toast.success("Payment updated");
      } else {
        await createSupplierPayment(form);
        toast.success("Payment added");
      }
      setModalOpen(false);
      loadPayments();
    } catch (err: any) {
      toast.error(err?.message || "Save failed");
    } finally {
      setSaving(false);
    }
  };

  /* ===========================================================
     DELETE PAYMENT
  =========================================================== */
  const handleDelete = async (id: string) => {
    if (!isSuperAdminUI) return toast.error("Only super-admin can delete");
    if (!confirm("Delete this payment?")) return;

    try {
      await deleteSupplierPayment(id);
      toast.success("Payment deleted");
      loadPayments();
    } catch {
      toast.error("Delete failed");
    }
  };

  /* ===========================================================
     UI
  =========================================================== */
  return (
    <div className="p-6">
      {/* HEADER */}
      <div className="mb-6 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Receipt size={22} />
          <div>
            <h1 className="text-lg font-semibold">Supplier Payments</h1>
            <p className="text-xs text-slate-500">
              Manage supplier payments — partial / full.
            </p>
          </div>
        </div>

        <button
          onClick={openCreateModal}
          className="rounded-full bg-slate-900 text-white px-4 py-2 text-sm"
        >
          <Plus size={14} className="inline-block mr-1" />
          Add Payment
        </button>
      </div>

      {/* FILTERS */}
      <div className="mb-4 flex items-center gap-3">
        {/* Supplier */}
        <select
          className="border rounded-lg px-3 py-2 text-sm"
          value={supplierId || ""}
          onChange={(e) => setSupplierId(e.target.value || null)}
          disabled={!!supplierContextId}
        >
          <option value="">All Suppliers</option>
          {suppliers.map((s) => (
            <option key={s.id} value={s.id}>
              {s.name}
            </option>
          ))}
        </select>

        {/* Invoice */}
        <select
          className="border rounded-lg px-3 py-2 text-sm"
          value={invoiceId || ""}
          onChange={(e) => setInvoiceId(e.target.value || null)}
        >
          <option value="">All Invoices</option>
          {invoices.map((inv) => (
            <option key={inv.id} value={inv.id}>
              {inv.invoice_number}
            </option>
          ))}
        </select>
      </div>

      {/* TABLE */}
      <div className="rounded-xl border overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-slate-100">
            <tr>
              <th
                className="px-3 py-2 cursor-pointer"
                onClick={(e) => toggleSort("payment_date", e.shiftKey)}
              >
                <div className="flex items-center gap-1">
                  Date
                  {getSortDir("payment_date") === "asc" && (
                    <ChevronUp size={14} />
                  )}
                  {getSortDir("payment_date") === "desc" && (
                    <ChevronDown size={14} />
                  )}
                </div>
              </th>
              <th className="px-3 py-2">Supplier</th>
              <th className="px-3 py-2">Invoice</th>

              <th
                className="px-3 py-2 cursor-pointer"
                onClick={(e) => toggleSort("amount", e.shiftKey)}
              >
                <div className="flex items-center gap-1">
                  Amount
                  {getSortDir("amount") === "asc" && <ChevronUp size={14} />}
                  {getSortDir("amount") === "desc" && (
                    <ChevronDown size={14} />
                  )}
                </div>
              </th>

              <th className="px-3 py-2">Mode</th>
              <th className="px-3 py-2">Reference</th>
              <th className="px-3 py-2 text-right">Actions</th>
            </tr>
          </thead>

          <tbody>
            {loading ? (
              <tr>
                <td colSpan={7} className="text-center py-6">
                  <Loader2 className="animate-spin inline mr-2" />
                  Loading…
                </td>
              </tr>
            ) : payments.length === 0 ? (
              <tr>
                <td
                  colSpan={7}
                  className="text-center py-6 text-slate-500"
                >
                  No payments found.
                </td>
              </tr>
            ) : (
              payments.map((p) => (
                <tr key={p.id} className="border-t">
                  <td className="px-3 py-2">
                    {new Date(p.payment_date).toLocaleDateString()}
                  </td>
                  <td className="px-3 py-2">{p.supplier_name}</td>
                  <td className="px-3 py-2">{p.invoice_number || "—"}</td>

                  <td className="px-3 py-2">₹ {+p.amount}</td>
                  <td className="px-3 py-2 capitalize">{p.mode}</td>
                  <td className="px-3 py-2">{p.reference || "—"}</td>

                  <td className="px-3 py-2 text-right">
                    <button
                      onClick={() => openEditModal(p.id)}
                      className="border rounded-lg px-2 py-1 mr-2"
                    >
                      <Edit2 size={14} />
                    </button>

                    <button
                      onClick={() => handleDelete(p.id)}
                      disabled={!isSuperAdminUI}
                      className="border border-rose-300 text-rose-600 rounded-lg px-2 py-1 disabled:opacity-50"
                    >
                      <Trash2 size={14} />
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* PAGINATION */}
      {totalPages > 1 && (
        <div className="mt-4 flex items-center justify-between text-sm">
          <button
            disabled={page <= 1}
            onClick={() => setPage((p) => p - 1)}
            className="border rounded-lg px-3 py-1"
          >
            Previous
          </button>

          <span>
            Page {page} of {totalPages} · {total} records
          </span>

          <button
            disabled={page >= totalPages}
            onClick={() => setPage((p) => p + 1)}
            className="border rounded-lg px-3 py-1"
          >
            Next
          </button>
        </div>
      )}

      {/* MODAL */}
      {modalOpen && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl p-6 max-w-lg w-full">
            <div className="mb-4 flex justify-between items-center">
              <h2 className="text-lg font-semibold">
                {form.id ? "Edit Payment" : "Add Payment"}
              </h2>
              <button onClick={() => setModalOpen(false)}>✕</button>
            </div>

            <form onSubmit={handleSave} className="space-y-4 text-sm">
              {/* Supplier */}
              <div>
                <label className="text-xs mb-1 block">Supplier</label>
                <select
                  className="border rounded-lg px-3 py-2 w-full"
                  value={form.supplier_id}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, supplier_id: e.target.value }))
                  }
                  required
                >
                  <option value="">Select</option>
                  {suppliers.map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.name}
                    </option>
                  ))}
                </select>
              </div>

              {/* Invoice */}
              <div>
                <label className="text-xs mb-1 block">Invoice (optional)</label>
                <select
                  className="border rounded-lg px-3 py-2 w-full"
                  value={form.invoice_id}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, invoice_id: e.target.value }))
                  }
                >
                  <option value="">None</option>
                  {invoices.map((inv) => (
                    <option key={inv.id} value={inv.id}>
                      {inv.invoice_number}
                    </option>
                  ))}
                </select>
              </div>

              {/* Date + Amount */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-xs block mb-1">Payment Date</label>
                  <input
                    type="date"
                    className="border rounded-lg px-3 py-2 w-full"
                    value={form.payment_date}
                    onChange={(e) =>
                      setForm((f) => ({
                        ...f,
                        payment_date: e.target.value,
                      }))
                    }
                    required
                  />
                </div>

                <div>
                  <label className="text-xs block mb-1">Amount</label>
                  <input
                    type="number"
                    className="border rounded-lg px-3 py-2 w-full"
                    value={form.amount}
                    onChange={(e) =>
                      setForm((f) => ({ ...f, amount: e.target.value }))
                    }
                    required
                  />
                </div>
              </div>

              {/* Mode + Reference */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-xs block mb-1">Mode</label>
                  <select
                    className="border rounded-lg px-3 py-2 w-full"
                    value={form.mode}
                    onChange={(e) =>
                      setForm((f) => ({ ...f, mode: e.target.value }))
                    }
                  >
                    <option value="cash">Cash</option>
                    <option value="bank">Bank Transfer</option>
                    <option value="cheque">Cheque</option>
                    <option value="online">Online</option>
                    <option value="other">Other</option>
                  </select>
                </div>

                <div>
                  <label className="text-xs block mb-1">Reference</label>
                  <input
                    className="border rounded-lg px-3 py-2 w-full"
                    value={form.reference}
                    onChange={(e) =>
                      setForm((f) => ({ ...f, reference: e.target.value }))
                    }
                  />
                </div>
              </div>

              {/* Actions */}
              <div className="flex justify-end gap-3 pt-3">
                <button
                  type="button"
                  onClick={() => setModalOpen(false)}
                  className="border rounded-full px-4 py-2"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="rounded-full bg-slate-900 text-white px-4 py-2"
                >
                  {saving ? (
                    <Loader2 className="animate-spin inline" size={14} />
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

export default AdminSupplierPaymentsPage;
