// src/pages/AdminSettlementPage.tsx

import React, { useEffect, useMemo, useState } from "react";
import {
  CreditCard,
  Wallet,
  RefreshCw,
  Loader2,
  Search,
  Filter,
  ArrowUpRight,
} from "lucide-react";
import { Link } from "react-router-dom";
import { toast } from "react-hot-toast";

import { AdminPageHeader } from "@/components/admin/AdminPageHeader";
import {
  listOrders,
  type OrderOverview,
} from "@/api/sales/orders.api";

const PAGE_LIMIT = 50;

const AdminSettlementPage: React.FC = () => {
  const [orders, setOrders] = useState<OrderOverview[]>([]);
  const [page, setPage] = useState<number>(1);
  const [total, setTotal] = useState<number>(0);
  const [loading, setLoading] = useState<boolean>(false);

  const [q, setQ] = useState("");
  const [paymentFilter, setPaymentFilter] = useState<
    "" | "paid" | "pending" | "failed" | "refunded"
  >("");
  const [statusFilter, setStatusFilter] = useState<
    "" | "completed" | "processing" | "cancelled"
  >("");

  const pageCount = useMemo(
    () => (total > 0 ? Math.ceil(total / PAGE_LIMIT) : 1),
    [total]
  );

  const formatCurrency = (value: number | null | undefined): string => {
    const n = Number.isFinite(value as number) ? Number(value) : 0;
    return `₹${n.toLocaleString("en-IN", { maximumFractionDigits: 0 })}`;
  };

  const formatDate = (value: string | null | undefined): string => {
    if (!value) return "—";
    const d = new Date(value);
    if (Number.isNaN(d.getTime())) return "—";
    return d.toLocaleDateString("en-IN", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    });
  };

  async function loadOrders(targetPage: number = 1) {
    try {
      setLoading(true);
      const res = await listOrders({
        page: targetPage,
        limit: PAGE_LIMIT,
      });
      setOrders(res.orders || []);
      setTotal(res.total || 0);
      setPage(res.page || targetPage);
    } catch (err) {
      console.error("[AdminSettlementPage] Failed to load orders", err);
      toast.error("Failed to load settlement data.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadOrders(1);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // Filtering is client-side; no extra call required
  };

  // Client-side filtered list for settlement table
  const filteredOrders = useMemo(() => {
    return orders.filter((o) => {
      const search = q.trim().toLowerCase();
      if (search) {
        const haystack = [
          o.order_number,
          o.customer_name,
          o.customer_email,
          o.status,
          o.payment_status,
        ]
          .filter(Boolean)
          .join(" ")
          .toLowerCase();
        if (!haystack.includes(search)) return false;
      }

      if (paymentFilter && o.payment_status !== paymentFilter) return false;
      if (statusFilter && o.status !== statusFilter) return false;

      return true;
    });
  }, [orders, q, paymentFilter, statusFilter]);

  // Settlement-style aggregates based on all orders (not only filtered)
  const totals = useMemo(() => {
    let totalPaid = 0;
    let totalPending = 0;
    let totalRefunded = 0;

    for (const o of orders) {
      const amount = Number(o.grand_total || 0);
      const payStatus = (o.payment_status || "").toLowerCase();

      if (payStatus === "paid") totalPaid += amount;
      else if (payStatus === "pending") totalPending += amount;
      else if (payStatus === "refunded" || payStatus === "failed")
        totalRefunded += amount;
    }

    return {
      totalPaid,
      totalPending,
      totalRefunded,
    };
  }, [orders]);

  return (
    <div className="relative">
      <AdminPageHeader
        title="Settlements"
        subtitle="High-level payout view based on order payments. Use this as a basis for reconciling with your payment gateway."
        breadcrumbs={[
          { label: "Dashboard", path: "/" },
          { label: "Settlements" },
        ]}
      />

      <div className="px-6 pt-4 pb-8 space-y-8">
        {/* Settlement summary cards */}
        <section className="grid gap-5 md:grid-cols-3">
          {/* Total paid */}
          <div className="relative overflow-hidden rounded-2xl border border-emerald-200 bg-emerald-50 p-4 shadow-sm dark:border-emerald-800 dark:bg-emerald-950/40">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-[11px] uppercase tracking-wide text-emerald-700 dark:text-emerald-300">
                  Settled amount (paid)
                </p>
                <p className="mt-1 text-2xl font-semibold text-emerald-900 dark:text-emerald-50">
                  {formatCurrency(totals.totalPaid)}
                </p>
                <p className="mt-1 text-[11px] text-emerald-800/80 dark:text-emerald-200/80">
                  Sum of all orders where payment status is{" "}
                  <span className="font-semibold">paid</span>.
                </p>
              </div>
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-emerald-100 text-emerald-700 dark:bg-emerald-900/70 dark:text-emerald-200">
                <Wallet className="h-5 w-5" />
              </div>
            </div>
          </div>

          {/* Pending */}
          <div className="relative overflow-hidden rounded-2xl border border-amber-200 bg-amber-50 p-4 shadow-sm dark:border-amber-800 dark:bg-amber-950/40">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-[11px] uppercase tracking-wide text-amber-700 dark:text-amber-300">
                  Pending payments
                </p>
                <p className="mt-1 text-2xl font-semibold text-amber-900 dark:text-amber-50">
                  {formatCurrency(totals.totalPending)}
                </p>
                <p className="mt-1 text-[11px] text-amber-800/80 dark:text-amber-200/80">
                  Orders with payment status{" "}
                  <span className="font-semibold">pending</span>.
                </p>
              </div>
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-amber-100 text-amber-700 dark:bg-amber-900/70 dark:text-amber-200">
                <CreditCard className="h-5 w-5" />
              </div>
            </div>
          </div>

          {/* Refunded / failed */}
          <div className="relative overflow-hidden rounded-2xl border border-rose-200 bg-rose-50 p-4 shadow-sm dark:border-rose-800 dark:bg-rose-950/40">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-[11px] uppercase tracking-wide text-rose-700 dark:text-rose-300">
                  Refunded / failed
                </p>
                <p className="mt-1 text-2xl font-semibold text-rose-900 dark:text-rose-50">
                  {formatCurrency(totals.totalRefunded)}
                </p>
                <p className="mt-1 text-[11px] text-rose-800/80 dark:text-rose-200/80">
                  Orders with payment status{" "}
                  <span className="font-semibold">refunded</span> or{" "}
                  <span className="font-semibold">failed</span>.
                </p>
              </div>
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-rose-100 text-rose-700 dark:bg-rose-900/70 dark:text-rose-200">
                <CreditCard className="h-5 w-5" />
              </div>
            </div>
          </div>
        </section>

        {/* Filters + refresh */}
        <section className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
          {/* Search + filters */}
          <form
            onSubmit={handleSearchSubmit}
            className="flex flex-1 items-center gap-3"
          >
            <div className="relative flex-1">
              <Search
                className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-500"
                size={18}
              />
              <input
                type="text"
                value={q}
                onChange={(e) => setQ(e.target.value)}
                placeholder="Search by order #, customer, email, status…"
                className="w-full rounded-full border border-slate-300 bg-white py-3 pl-10 pr-3 text-sm text-slate-900 shadow-sm focus:border-sky-500 focus:ring-sky-300 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-50"
              />
            </div>

            <button
              type="submit"
              className="flex items-center gap-2 rounded-full border border-slate-300 bg-white px-4 py-2.5 text-xs font-medium text-slate-700 shadow-sm hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200"
            >
              <Filter size={16} /> Apply
            </button>
          </form>

          <div className="flex flex-wrap items-center gap-2">
            {/* Payment filter */}
            <select
              value={paymentFilter}
              onChange={(e) =>
                setPaymentFilter(
                  e.target.value as
                    | ""
                    | "paid"
                    | "pending"
                    | "failed"
                    | "refunded"
                )
              }
              className="rounded-full border border-slate-300 bg-white px-4 py-2.5 text-xs text-slate-800 shadow-sm focus:border-sky-500 focus:ring-sky-300 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200"
            >
              <option value="">All payment status</option>
              <option value="paid">Paid</option>
              <option value="pending">Pending</option>
              <option value="failed">Failed</option>
              <option value="refunded">Refunded</option>
            </select>

            {/* Order status filter */}
            <select
              value={statusFilter}
              onChange={(e) =>
                setStatusFilter(
                  e.target.value as "" | "completed" | "processing" | "cancelled"
                )
              }
              className="rounded-full border border-slate-300 bg-white px-4 py-2.5 text-xs text-slate-800 shadow-sm focus:border-sky-500 focus:ring-sky-300 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200"
            >
              <option value="">All order status</option>
              <option value="completed">Completed</option>
              <option value="processing">Processing</option>
              <option value="cancelled">Cancelled</option>
            </select>

            <button
              type="button"
              onClick={() => loadOrders(page)}
              disabled={loading}
              className="flex items-center gap-2 rounded-full border border-slate-300 bg-white px-4 py-2.5 text-xs font-medium text-slate-800 shadow-sm hover:bg-slate-50 disabled:opacity-60 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200"
            >
              {loading ? (
                <Loader2 className="animate-spin" size={16} />
              ) : (
                <RefreshCw size={16} />
              )}
              Refresh
            </button>
          </div>
        </section>

        {/* Settlement table */}
        <section className="overflow-hidden rounded-2xl border border-slate-300 bg-white shadow-sm dark:border-slate-700 dark:bg-slate-900">
          <div className="overflow-x-auto">
            <table className="min-w-full text-left text-sm text-slate-800 dark:text-slate-200">
              <thead className="bg-slate-100 text-xs uppercase tracking-wide text-slate-600 dark:bg-slate-800 dark:text-slate-400">
                <tr>
                  <th className="px-6 py-3">Order</th>
                  <th className="px-6 py-3">Customer</th>
                  <th className="px-6 py-3">Placed</th>
                  <th className="px-6 py-3">Grand total</th>
                  <th className="px-6 py-3">Payment status</th>
                  <th className="px-6 py-3">Order status</th>
                  <th className="px-6 py-3 text-right">View</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr>
                    <td colSpan={7} className="py-8 text-center text-sm">
                      <Loader2 className="mx-auto mb-2 animate-spin" />
                      Loading settlement orders…
                    </td>
                  </tr>
                ) : filteredOrders.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="py-8 text-center text-sm">
                      No orders found for the current filters.
                    </td>
                  </tr>
                ) : (
                  filteredOrders.map((o) => (
                    <tr
                      key={o.id}
                      className="border-t border-slate-200 hover:bg-slate-50 dark:border-slate-700 dark:hover:bg-slate-800"
                    >
                      <td className="px-6 py-3 text-sm">
                        <div className="flex flex-col">
                          <span className="font-semibold text-slate-900 dark:text-slate-50">
                            #{o.order_number}
                          </span>
                          <span className="text-xs text-slate-500 dark:text-slate-400">
                            {o.currency || "INR"}
                          </span>
                        </div>
                      </td>
                      <td className="px-6 py-3 text-sm">
                        <div className="flex flex-col">
                          <span className="font-medium">
                            {o.customer_name || "Guest"}
                          </span>
                          <span className="text-xs text-slate-500 dark:text-slate-400">
                            {o.customer_email || "—"}
                          </span>
                        </div>
                      </td>
                      <td className="px-6 py-3 text-xs text-slate-500 dark:text-slate-400">
                        {formatDate(o.placed_at)}
                      </td>
                      <td className="px-6 py-3 text-sm font-semibold">
                        {formatCurrency(o.grand_total)}
                      </td>
                      <td className="px-6 py-3 text-xs">
                        <span
                          className={`inline-flex items-center rounded-full px-2.5 py-0.5 font-medium capitalize ${
                            o.payment_status === "paid"
                              ? "bg-emerald-50 text-emerald-700 border border-emerald-200 dark:bg-emerald-900/40 dark:text-emerald-200 dark:border-emerald-700"
                              : o.payment_status === "pending"
                              ? "bg-amber-50 text-amber-700 border border-amber-200 dark:bg-amber-900/40 dark:text-amber-200 dark:border-amber-700"
                              : o.payment_status === "refunded" ||
                                o.payment_status === "failed"
                              ? "bg-rose-50 text-rose-700 border border-rose-200 dark:bg-rose-900/40 dark:text-rose-200 dark:border-rose-700"
                              : "bg-slate-100 text-slate-700 border border-slate-200 dark:bg-slate-800 dark:text-slate-200 dark:border-slate-700"
                          }`}
                        >
                          {o.payment_status || "unknown"}
                        </span>
                      </td>
                      <td className="px-6 py-3 text-xs">
                        <span className="inline-flex items-center rounded-full bg-slate-100 px-2.5 py-0.5 font-medium capitalize text-slate-700 dark:bg-slate-800 dark:text-slate-200">
                          {o.status}
                        </span>
                      </td>
                      <td className="px-6 py-3 text-right text-xs">
                        <Link
                          to={`/orders/${o.id}`}
                          className="inline-flex items-center gap-1 rounded-full border border-slate-300 px-3 py-1.5 text-xs font-medium text-slate-700 hover:bg-slate-50 dark:border-slate-600 dark:text-slate-200 dark:hover:bg-slate-800"
                        >
                          Details
                          <ArrowUpRight className="h-3 w-3" />
                        </Link>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          {/* Pagination footer */}
          <div className="flex items-center justify-between px-6 py-3 text-xs text-slate-600 dark:text-slate-400">
            <div>
              Page {page} of {pageCount} · {total} orders
              {filteredOrders.length !== orders.length && (
                <span className="ml-2 text-[11px] text-slate-500">
                  (Filtered on this page: {filteredOrders.length})
                </span>
              )}
            </div>
            <div className="space-x-2">
              <button
                type="button"
                disabled={page <= 1 || loading}
                onClick={() => {
                  if (page <= 1) return;
                  const prev = page - 1;
                  loadOrders(prev);
                }}
                className="rounded-full border border-slate-300 bg-white px-3 py-1.5 text-xs font-medium hover:bg-slate-50 disabled:opacity-50 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200"
              >
                Previous
              </button>
              <button
                type="button"
                disabled={page >= pageCount || loading}
                onClick={() => {
                  if (page >= pageCount) return;
                  const next = page + 1;
                  loadOrders(next);
                }}
                className="rounded-full border border-slate-300 bg-white px-3 py-1.5 text-xs font-medium hover:bg-slate-50 disabled:opacity-50 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200"
              >
                Next
              </button>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
};

export default AdminSettlementPage;
