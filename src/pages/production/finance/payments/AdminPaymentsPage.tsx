// src/pages/AdminPaymentsPage.tsx

import React, { useEffect, useMemo, useState } from "react";
import {
  CreditCard,
  RefreshCw,
  Loader2,
  DollarSign,
  Receipt,
  RotateCcw,
  FileText,
  Eye,
  Search,
  Filter,
} from "lucide-react";

import { useNavigate } from "react-router-dom";
import { toast } from "react-hot-toast";

import { AdminPageHeader } from "@/components/admin/AdminPageHeader";

import {
  listPayments,
  listRefunds,
  listInvoices,
  listSettlements,
  type Payment,
  type Refund,
  type Invoice,
  type Settlement,
} from "@/api/inventory/payments.api";

import { getOrderById } from "@/api/sales/orders.api";

const PAGE_LIMIT = 30;

const money = (amount: number, cur = "INR") =>
  `${cur} ${Number(amount || 0).toLocaleString()}`;

const dateFmt = (v?: string | null) => {
  if (!v) return "—";
  const d = new Date(v);
  if (Number.isNaN(d.getTime())) return "—";
  return d.toLocaleString();
};

const badgeClass = (status: string) => {
  const s = (status || "").toLowerCase();
  if (["paid", "success", "completed"].includes(s))
    return "border-emerald-300 bg-emerald-50 text-emerald-700 dark:border-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-200";

  if (["failed", "cancelled", "refused"].includes(s))
    return "border-rose-300 bg-rose-50 text-rose-700 dark:border-rose-700 dark:bg-rose-900/30 dark:text-rose-200";

  if (["pending", "created"].includes(s))
    return "border-slate-300 bg-slate-100 text-slate-700 dark:border-slate-600 dark:bg-slate-900 dark:text-slate-200";

  return "border-slate-300 bg-slate-100 text-slate-700 dark:border-slate-600 dark:bg-slate-900 dark:text-slate-200";
};

const AdminPaymentsPage: React.FC = () => {
  const navigate = useNavigate();

  const [payments, setPayments] = useState<Payment[]>([]);
  const [refunds, setRefunds] = useState<Refund[]>([]);
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [settlements, setSettlements] = useState<Settlement[]>([]);

  const [loading, setLoading] = useState(false);
  const [tab, setTab] = useState<"payments" | "refunds" | "invoices" | "settlements">("payments");

  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);

  const [search, setSearch] = useState("");

  async function loadAll(p = 1) {
    setLoading(true);
    try {
      const pRes = await listPayments({ page: p, limit: PAGE_LIMIT });
      setPayments(pRes.payments);
      setTotal(pRes.total);
      setPage(pRes.page);

      const rRes = await listRefunds();
      setRefunds(rRes.refunds);

      const iRes = await listInvoices();
      setInvoices(iRes.invoices);

      const sRes = await listSettlements();
      setSettlements(sRes.settlements);
    } catch (err) {
      console.error("Failed to load payment data", err);
      toast.error("Failed to load payment dashboard.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadAll(1);
  }, []);

  const filteredPayments = useMemo(() => {
    const q = search.toLowerCase().trim();
    if (!q) return payments;

    return payments.filter((p) => {
      const h = [
        p.order_number,
        p.provider,
        p.status,
        p.id,
        p.provider_payment_id,
      ]
        .filter(Boolean)
        .join(" ")
        .toLowerCase();
      return h.includes(q);
    });
  }, [payments, search]);

  const filteredRefunds = useMemo(() => {
    const q = search.toLowerCase().trim();
    if (!q) return refunds;

    return refunds.filter((r) => {
      const h = [
        r.id,
        r.status,
        r.reason,
        r.order_number,
      ]
        .filter(Boolean)
        .join(" ")
        .toLowerCase();
      return h.includes(q);
    });
  }, [refunds, search]);

  const filteredInvoices = useMemo(() => {
    const q = search.toLowerCase().trim();
    if (!q) return invoices;

    return invoices.filter((i) => {
      const h = [
        i.id,
        i.invoice_number,
        i.order_number,
        i.status,
      ]
        .filter(Boolean)
        .join(" ")
        .toLowerCase();
      return h.includes(q);
    });
  }, [invoices, search]);

  const filteredSettlements = useMemo(() => {
    const q = search.toLowerCase().trim();
    if (!q) return settlements;

    return settlements.filter((s) => {
      const h = [
        s.id,
        s.provider,
        s.reference_id,
      ]
        .filter(Boolean)
        .join(" ")
        .toLowerCase();
      return h.includes(q);
    });
  }, [settlements, search]);


  /* -----------------------------
     Quick Stats Cards
  ----------------------------- */
  const totalReceived = payments
    .filter((p) => p.status === "paid")
    .reduce((acc, x) => acc + (x.amount || 0), 0);

  const totalRefunded = refunds.reduce((acc, x) => acc + (x.amount || 0), 0);

  const invoiceTotal = invoices.reduce((acc, x) => acc + (x.grand_total || 0), 0);

  const settlementTotal = settlements.reduce((acc, x) => acc + (x.amount || 0), 0);


  /* -----------------------------
     UI
  ----------------------------- */
  return (
    <div className="relative">
      <AdminPageHeader
        title="Financial Overview"
        subtitle="Transactions, invoices, settlements & refunds"
        breadcrumbs={[
          { label: "Dashboard", path: "/" },
          { label: "Payments" },
        ]}
      />

      <div className="px-6 pt-4 pb-10 space-y-10">

        {/* =======================
            KPIs
        ======================= */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <div className="rounded-2xl border border-slate-300 bg-white p-6 shadow-sm dark:border-slate-700 dark:bg-slate-900">
            <div className="flex items-center gap-3">
              <CreditCard className="text-emerald-500" />
              <div className="text-xl font-bold">{money(totalReceived)}</div>
            </div>
            <div className="text-sm text-slate-500 mt-1">Total Payments Received</div>
          </div>

          <div className="rounded-2xl border border-slate-300 bg-white p-6 shadow-sm dark:border-slate-700 dark:bg-slate-900">
            <div className="flex items-center gap-3">
              <RotateCcw className="text-rose-500" />
              <div className="text-xl font-bold">{money(totalRefunded)}</div>
            </div>
            <div className="text-sm text-slate-500 mt-1">Total Refunds Issued</div>
          </div>

          <div className="rounded-2xl border border-slate-300 bg-white p-6 shadow-sm dark:border-slate-700 dark:bg-slate-900">
            <div className="flex items-center gap-3">
              <FileText className="text-blue-500" />
              <div className="text-xl font-bold">{money(invoiceTotal)}</div>
            </div>
            <div className="text-sm text-slate-500 mt-1">Invoice Total</div>
          </div>

          <div className="rounded-2xl border border-slate-300 bg-white p-6 shadow-sm dark:border-slate-700 dark:bg-slate-900">
            <div className="flex items-center gap-3">
              <DollarSign className="text-amber-500" />
              <div className="text-xl font-bold">{money(settlementTotal)}</div>
            </div>
            <div className="text-sm text-slate-500 mt-1">Settlement Total</div>
          </div>
        </div>

        {/* =======================
            Search + Tabs
        ======================= */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          {/* Search bar */}
          <div className="relative w-full md:w-1/2">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" size={18} />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search payments, orders, invoices…"
              className="w-full rounded-full border border-slate-300 bg-white py-3 pl-10 pr-3 text-base text-slate-900 shadow-sm dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100"
            />
          </div>

          <div className="flex items-center gap-2">
            <button
              className={`px-4 py-2.5 rounded-full border text-sm font-medium ${tab === "payments"
                ? "bg-sky-600 text-white border-sky-600"
                : "bg-white border-slate-300 dark:bg-slate-900 dark:border-slate-700"
                }`}
              onClick={() => setTab("payments")}
            >
              Payments
            </button>

            <button
              className={`px-4 py-2.5 rounded-full border text-sm font-medium ${tab === "refunds"
                ? "bg-sky-600 text-white border-sky-600"
                : "bg-white border-slate-300 dark:bg-slate-900 dark:border-slate-700"
                }`}
              onClick={() => setTab("refunds")}
            >
              Refunds
            </button>

            <button
              className={`px-4 py-2.5 rounded-full border text-sm font-medium ${tab === "invoices"
                ? "bg-sky-600 text-white border-sky-600"
                : "bg-white border-slate-300 dark:bg-slate-900 dark:border-slate-700"
                }`}
              onClick={() => setTab("invoices")}
            >
              Invoices
            </button>

            <button
              className={`px-4 py-2.5 rounded-full border text-sm font-medium ${tab === "settlements"
                ? "bg-sky-600 text-white border-sky-600"
                : "bg-white border-slate-300 dark:bg-slate-900 dark:border-slate-700"
                }`}
              onClick={() => setTab("settlements")}
            >
              Settlements
            </button>

            <button
              onClick={() => loadAll(page)}
              className="flex items-center gap-2 rounded-full border border-slate-300 bg-white px-4 py-2.5 text-sm font-medium hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200"
            >
              {loading ? <Loader2 className="animate-spin" size={16} /> : <RefreshCw size={16} />}
              Refresh
            </button>
          </div>
        </div>

        {/* =======================
            TABLE CONTENT
        ======================= */}

        {tab === "payments" && (
          <PaymentTable payments={filteredPayments} loading={loading} navigate={navigate} />
        )}

        {tab === "refunds" && (
          <RefundTable refunds={filteredRefunds} loading={loading} />
        )}

        {tab === "invoices" && (
          <InvoiceTable invoices={filteredInvoices} loading={loading} navigate={navigate} />
        )}

        {tab === "settlements" && (
          <SettlementTable settlements={filteredSettlements} loading={loading} />
        )}
      </div>
    </div>
  );
};

export default AdminPaymentsPage;



/* ============================================================================
   SUB-COMPONENTS
   ============================================================================ */

function PaymentTable({
  payments,
  loading,
  navigate,
}: {
  payments: Payment[];
  loading: boolean;
  navigate: any;
}) {
  return (
    <div className="overflow-hidden rounded-2xl border border-slate-300 bg-white shadow-sm dark:border-slate-700 dark:bg-slate-900">
      <div className="overflow-x-auto">
        <table className="min-w-full text-left text-base text-slate-800 dark:text-slate-200">
          <thead className="bg-slate-100 text-sm uppercase tracking-wide text-slate-600 dark:bg-slate-800 dark:text-slate-400">
            <tr>
              <th className="px-6 py-4">Payment</th>
              <th className="px-6 py-4">Order</th>
              <th className="px-6 py-4">Amount</th>
              <th className="px-6 py-4">Status</th>
              <th className="px-6 py-4">Created</th>
              <th className="px-6 py-4 text-right">Action</th>
            </tr>
          </thead>

          <tbody>
            {loading ? (
              <tr>
                <td colSpan={6} className="py-8 text-center text-lg">
                  <Loader2 className="mx-auto animate-spin" />
                  Loading...
                </td>
              </tr>
            ) : payments.length === 0 ? (
              <tr>
                <td colSpan={6} className="py-8 text-center text-lg">
                  No payments found
                </td>
              </tr>
            ) : (
              payments.map((p) => (
                <tr
                  key={p.id}
                  className="border-t border-slate-200 hover:bg-slate-50 dark:border-slate-700 dark:hover:bg-slate-800"
                >
                  <td className="px-6 py-4">
                    <div className="font-semibold">{p.provider}</div>
                    <div className="text-xs text-slate-500">{p.id}</div>
                  </td>

                  <td className="px-6 py-4">
                    {p.order_number ? (
                      <button
                        onClick={() => navigate(`/orders/${p.order_id}`)}
                        className="text-sky-600 hover:underline"
                      >
                        #{p.order_number}
                      </button>
                    ) : (
                      "—"
                    )}
                  </td>

                  <td className="px-6 py-4 font-medium">{money(p.amount, p.currency)}</td>

                  <td className="px-6 py-4">
                    <span
                      className={`inline-flex items-center gap-1 rounded-full border px-2.5 py-1 text-xs font-medium ${badgeClass(
                        p.status
                      )}`}
                    >
                      <CreditCard size={12} />
                      {p.status}
                    </span>
                  </td>

                  <td className="px-6 py-4 text-sm">{dateFmt(p.created_at)}</td>

                  <td className="px-6 py-4 text-right">
                    <button
                      onClick={() => navigate(`/payments/${p.id}`)}
                      className="inline-flex items-center gap-1 rounded-full border border-slate-300 px-3 py-1.5 text-sm hover:bg-slate-100 dark:border-slate-700 dark:hover:bg-slate-800"
                    >
                      <Eye size={14} /> View
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}


function RefundTable({ refunds, loading }: { refunds: Refund[]; loading: boolean }) {
  return (
    <div className="overflow-hidden rounded-2xl border border-slate-300 bg-white shadow-sm dark:border-slate-700 dark:bg-slate-900">
      <div className="overflow-x-auto">
        <table className="min-w-full text-left text-base text-slate-800 dark:text-slate-200">
          <thead className="bg-slate-100 text-sm uppercase tracking-wide text-slate-600 dark:bg-slate-800 dark:text-slate-400">
            <tr>
              <th className="px-6 py-4">Refund</th>
              <th className="px-6 py-4">Order</th>
              <th className="px-6 py-4">Amount</th>
              <th className="px-6 py-4">Status</th>
              <th className="px-6 py-4">Issued</th>
            </tr>
          </thead>

          <tbody>
            {loading ? (
              <tr>
                <td colSpan={6} className="py-8 text-center text-lg">
                  <Loader2 className="mx-auto animate-spin" />
                  Loading...
                </td>
              </tr>
            ) : refunds.length === 0 ? (
              <tr>
                <td colSpan={6} className="py-8 text-center text-lg">
                  No refunds found
                </td>
              </tr>
            ) : (
              refunds.map((r) => (
                <tr
                  key={r.id}
                  className="border-t border-slate-200 hover:bg-slate-50 dark:border-slate-700 dark:hover:bg-slate-800"
                >
                  <td className="px-6 py-4">
                    <div className="font-semibold">{r.id.slice(0, 10)}...</div>
                  </td>

                  <td className="px-6 py-4">
                    {r.order_number ? (
                      <span className="text-sky-600">#{r.order_number}</span>
                    ) : (
                      "—"
                    )}
                  </td>

                  <td className="px-6 py-4 font-medium">{money(r.amount, r.currency)}</td>

                  <td className="px-6 py-4">
                    <span
                      className={`inline-flex items-center gap-1 rounded-full border px-2.5 py-1 text-xs font-medium ${badgeClass(
                        r.status
                      )}`}
                    >
                      <RotateCcw size={12} />
                      {r.status}
                    </span>
                  </td>

                  <td className="px-6 py-4 text-sm">{dateFmt(r.created_at)}</td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}


function InvoiceTable({
  invoices,
  loading,
  navigate,
}: {
  invoices: Invoice[];
  loading: boolean;
  navigate: any;
}) {
  return (
    <div className="overflow-hidden rounded-2xl border border-slate-300 bg-white shadow-sm dark:border-slate-700 dark:bg-slate-900">
      <div className="overflow-x-auto">
        <table className="min-w-full text-left text-base text-slate-800 dark:text-slate-200">
          <thead className="bg-slate-100 text-sm uppercase tracking-wide text-slate-600 dark:bg-slate-800 dark:text-slate-400">
            <tr>
              <th className="px-6 py-4">Invoice</th>
              <th className="px-6 py-4">Order</th>
              <th className="px-6 py-4">Total</th>
              <th className="px-6 py-4">Status</th>
              <th className="px-6 py-4">Issued</th>
              <th className="px-6 py-4 text-right">Action</th>
            </tr>
          </thead>

          <tbody>
            {loading ? (
              <tr>
                <td colSpan={6} className="py-8 text-center text-lg">
                  <Loader2 className="mx-auto animate-spin" />
                  Loading...
                </td>
              </tr>
            ) : invoices.length === 0 ? (
              <tr>
                <td colSpan={6} className="py-8 text-center text-lg">
                  No invoices found
                </td>
              </tr>
            ) : (
              invoices.map((i) => (
                <tr
                  key={i.id}
                  className="border-t border-slate-200 hover:bg-slate-50 dark:border-slate-700 dark:hover:bg-slate-800"
                >
                  <td className="px-6 py-4">
                    <div className="font-semibold">{i.invoice_number}</div>
                    <div className="text-xs text-slate-500">{i.id}</div>
                  </td>

                  <td className="px-6 py-4">
                    {i.order_number ? (
                      <button
                        onClick={() => navigate(`/orders/${i.order_id}`)}
                        className="text-sky-600 hover:underline"
                      >
                        #{i.order_number}
                      </button>
                    ) : (
                      "—"
                    )}
                  </td>

                  <td className="px-6 py-4 font-medium">
                    {money(i.grand_total, i.currency)}
                  </td>

                  <td className="px-6 py-4">
                    <span
                      className={`inline-flex items-center gap-1 rounded-full border px-2.5 py-1 text-xs font-medium ${badgeClass(
                        i.status
                      )}`}
                    >
                      <FileText size={12} />
                      {i.status}
                    </span>
                  </td>

                  <td className="px-6 py-4 text-sm">{dateFmt(i.issued_at)}</td>

                  <td className="px-6 py-4 text-right">
                    <button
                      onClick={() => navigate(`/invoices/${i.id}`)}
                      className="inline-flex items-center gap-1 rounded-full border border-slate-300 px-3 py-1.5 text-sm hover:bg-slate-100 dark:border-slate-700 dark:hover:bg-slate-800"
                    >
                      <Eye size={14} /> View
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}


function SettlementTable({
  settlements,
  loading,
}: {
  settlements: Settlement[];
  loading: boolean;
}) {
  return (
    <div className="overflow-hidden rounded-2xl border border-slate-300 bg-white shadow-sm dark:border-slate-700 dark:bg-slate-900">
      <div className="overflow-x-auto">
        <table className="min-w-full text-left text-base text-slate-800 dark:text-slate-200">
          <thead className="bg-slate-100 text-sm uppercase tracking-wide text-slate-600 dark:bg-slate-800 dark:text-slate-400">
            <tr>
              <th className="px-6 py-4">Provider</th>
              <th className="px-6 py-4">Reference</th>
              <th className="px-6 py-4">Amount</th>
              <th className="px-6 py-4">Date</th>
            </tr>
          </thead>

          <tbody>
            {loading ? (
              <tr>
                <td colSpan={4} className="py-8 text-center text-lg">
                  <Loader2 className="mx-auto animate-spin" />
                  Loading...
                </td>
              </tr>
            ) : settlements.length === 0 ? (
              <tr>
                <td colSpan={4} className="py-8 text-center text-lg">
                  No settlement records found
                </td>
              </tr>
            ) : (
              settlements.map((s) => (
                <tr
                  key={s.id}
                  className="border-t border-slate-200 hover:bg-slate-50 dark:border-slate-700 dark:hover:bg-slate-800"
                >
                  <td className="px-6 py-4">{s.provider}</td>
                  <td className="px-6 py-4">{s.reference_id || "—"}</td>
                  <td className="px-6 py-4 font-medium">{money(s.amount, s.currency)}</td>
                  <td className="px-6 py-4 text-sm">{dateFmt(s.settlement_date)}</td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
