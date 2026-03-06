// src/pages/AdminOrdersPage.tsx

import React, { useEffect, useMemo, useState } from "react";
import {
  Search,
  Filter,
  RefreshCw,
  Loader2,
  Package,
  CreditCard,
  Truck,
  Eye,
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import { toast } from "react-hot-toast";

import { AdminPageHeader } from "@/components/admin/AdminPageHeader";

import {
  listOrders,
  type OrderOverview,
  ORDER_STATUS_OPTIONS,
  PAYMENT_STATUS_OPTIONS,
  FULFILLMENT_STATUS_OPTIONS,
} from "@/api/sales/orders.api";

const PAGE_LIMIT = 20;

// Helper: resolve primary key from OrderOverview
function getOrderId(o: OrderOverview): string | undefined {
  // Support both "id" and "order_id" coming from the backend view
  return (o as any).id || (o as any).order_id || undefined;
}

const AdminOrdersPage: React.FC = () => {
  const navigate = useNavigate();

  const [orders, setOrders] = useState<OrderOverview[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(false);

  const [q, setQ] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("");
  const [paymentFilter, setPaymentFilter] = useState<string>("");
  const [fulfillmentFilter, setFulfillmentFilter] = useState<string>("");

  async function loadOrders(opts?: { page?: number }) {
    setLoading(true);
    try {
      const targetPage = opts?.page ?? page;
      const res = await listOrders({ page: targetPage, limit: PAGE_LIMIT });
      setOrders(res.orders || []);
      setTotal(res.total || 0);
      setPage(res.page || targetPage);
    } catch (err) {
      console.error("Failed to load orders", err);
      toast.error("Failed to load orders.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadOrders({ page: 1 });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // filtering is client-side (useMemo), so nothing else to do
  };

  const filteredOrders = useMemo(() => {
    return orders.filter((o) => {
      const search = q.trim().toLowerCase();
      if (search) {
        const orderId = getOrderId(o) || "";
        const haystack = [
          o.order_number,
          o.customer_name,
          o.customer_email,
          orderId,
        ]
          .filter(Boolean)
          .join(" ")
          .toLowerCase();
        if (!haystack.includes(search)) return false;
      }

      if (statusFilter && o.status !== statusFilter) return false;
      if (paymentFilter && o.payment_status !== paymentFilter) return false;
      if (fulfillmentFilter && o.fulfillment_status !== fulfillmentFilter)
        return false;

      return true;
    });
  }, [orders, q, statusFilter, paymentFilter, fulfillmentFilter]);

  const pageCount = useMemo(
    () => (total > 0 ? Math.ceil(total / PAGE_LIMIT) : 1),
    [total]
  );

  const formatMoney = (amount: number, currency?: string) => {
    const cur = currency || "INR";
    return `${cur} ${Number(amount || 0).toLocaleString()}`;
  };

  const formatDateTime = (value?: string | null) => {
    if (!value) return "—";
    const d = new Date(value);
    if (Number.isNaN(d.getTime())) return "—";
    return d.toLocaleString();
  };

  const getStatusBadgeClass = (status: string) => {
    const s = (status || "").toLowerCase();
    if (s === "completed" || s === "paid" || s === "fulfilled") {
      return "border-emerald-300 bg-emerald-50 text-emerald-700 dark:border-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-200";
    }
    if (s === "cancelled" || s === "failed") {
      return "border-rose-300 bg-rose-50 text-rose-700 dark:border-rose-700 dark:bg-rose-900/30 dark:text-rose-200";
    }
    if (s === "processing" || s === "shipped") {
      return "border-sky-300 bg-sky-50 text-sky-700 dark:border-sky-700 dark:bg-sky-900/30 dark:text-sky-200";
    }
    return "border-slate-300 bg-slate-100 text-slate-700 dark:border-slate-600 dark:bg-slate-900 dark:text-slate-200";
  };

  const handleViewOrder = (o: OrderOverview) => {
    const orderId = getOrderId(o);
    if (!orderId) {
      console.warn("Missing order id for order row", o);
      toast.error("Order ID missing in data.");
      return;
    }
    navigate(`/orders/${orderId}`);
  };

  return (
    <div className="relative">
      <AdminPageHeader
        title="Orders"
        subtitle="Monitor orders, payments and fulfillment for Minal Gems."
        breadcrumbs={[
          { label: "Dashboard", path: "/" },
          { label: "Orders" },
        ]}
      />

      <div className="px-6 pt-4 pb-8 space-y-8">
        {/* FILTER BAR */}
        <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
          <form
            onSubmit={handleSearchSubmit}
            className="flex flex-1 items-center gap-3"
          >
            <div className="relative flex-1">
              <Search
                className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500"
                size={18}
              />
              <input
                type="text"
                value={q}
                onChange={(e) => setQ(e.target.value)}
                placeholder="Search orders by number, customer or email…"
                className="w-full rounded-full border border-slate-300 bg-white py-3 pl-10 pr-3 text-base text-slate-900 shadow-sm focus:border-sky-500 focus:ring-sky-300 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-50"
              />
            </div>

            <button
              type="submit"
              className="flex items-center gap-2 rounded-full border border-slate-300 bg-white px-4 py-2.5 text-sm font-medium text-slate-700 shadow-sm hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200"
            >
              <Filter size={16} /> Apply
            </button>
          </form>

          <div className="flex flex-wrap items-center gap-2">
            {/* Status filter */}
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="rounded-full border border-slate-300 bg-white px-4 py-2.5 text-sm text-slate-800 shadow-sm focus:border-sky-500 focus:ring-sky-300 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200"
            >
              <option value="">All order status</option>
              {ORDER_STATUS_OPTIONS.map((s) => (
                <option key={s} value={s}>
                  {s}
                </option>
              ))}
            </select>

            {/* Payment filter */}
            <select
              value={paymentFilter}
              onChange={(e) => setPaymentFilter(e.target.value)}
              className="rounded-full border border-slate-300 bg-white px-4 py-2.5 text-sm text-slate-800 shadow-sm focus:border-sky-500 focus:ring-sky-300 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200"
            >
              <option value="">All payment status</option>
              {PAYMENT_STATUS_OPTIONS.map((s) => (
                <option key={s} value={s}>
                  {s}
                </option>
              ))}
            </select>

            {/* Fulfillment filter */}
            <select
              value={fulfillmentFilter}
              onChange={(e) => setFulfillmentFilter(e.target.value)}
              className="rounded-full border border-slate-300 bg-white px-4 py-2.5 text-sm text-slate-800 shadow-sm focus:border-sky-500 focus:ring-sky-300 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200"
            >
              <option value="">All fulfillment</option>
              {FULFILLMENT_STATUS_OPTIONS.map((s) => (
                <option key={s} value={s}>
                  {s}
                </option>
              ))}
            </select>

            <button
              onClick={() => loadOrders({ page })}
              disabled={loading}
              className="flex items-center gap-2 rounded-full border border-slate-300 bg-white px-4 py-2.5 text-sm font-medium text-slate-800 shadow-sm hover:bg-slate-50 disabled:opacity-60 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200"
            >
              {loading ? (
                <Loader2 className="animate-spin" size={16} />
              ) : (
                <RefreshCw size={16} />
              )}
              Refresh
            </button>
          </div>
        </div>

        {/* TABLE */}
        <div className="overflow-hidden rounded-2xl border border-slate-300 bg-white shadow-sm dark:border-slate-700 dark:bg-slate-900">
          <div className="overflow-x-auto">
            <table className="min-w-full text-left text-base text-slate-800 dark:text-slate-200">
              <thead className="bg-slate-100 text-sm uppercase tracking-wide text-slate-600 dark:bg-slate-800 dark:text-slate-400">
                <tr>
                  <th className="px-6 py-4">Order</th>
                  <th className="px-6 py-4">Customer</th>
                  <th className="px-6 py-4">Total</th>
                  <th className="px-6 py-4">Status</th>
                  <th className="px-6 py-4">Placed</th>
                  <th className="px-6 py-4 text-right">Actions</th>
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
                ) : filteredOrders.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="py-8 text-center text-lg">
                      No orders found
                    </td>
                  </tr>
                ) : (
                  filteredOrders.map((o, index) => {
                    const orderId = getOrderId(o);
                    const displayOrderId =
                      o.order_number ||
                      (orderId ? orderId.slice(0, 8) : "Unknown");

                    return (
                      <tr
                        key={orderId || o.order_number || `order-row-${index}`}
                        className="border-t border-slate-200 hover:bg-slate-50 dark:border-slate-700 dark:hover:bg-slate-800"
                      >
                        <td className="px-6 py-4">
                          <div className="flex flex-col gap-1">
                            <div className="flex items-center gap-2">
                              <span className="inline-flex h-8 w-8 items-center justify-center rounded-full bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-300">
                                <Package size={16} />
                              </span>
                              <div className="flex flex-col">
                                <span className="font-semibold">
                                  #{displayOrderId}
                                </span>
                                {orderId && (
                                  <span className="text-xs text-slate-500">
                                    {orderId}
                                  </span>
                                )}
                              </div>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4 text-sm">
                          {o.customer_name ? (
                            <div className="flex flex-col gap-0.5">
                              <span className="font-medium">
                                {o.customer_name}
                              </span>
                              {o.customer_email && (
                                <span className="text-xs text-slate-500">
                                  {o.customer_email}
                                </span>
                              )}
                            </div>
                          ) : o.customer_email ? (
                            <span className="text-sm text-slate-600">
                              {o.customer_email}
                            </span>
                          ) : (
                            <span className="text-sm text-slate-400">—</span>
                          )}
                        </td>
                        <td className="px-6 py-4">
                          <div className="text-base font-semibold">
                            {formatMoney(o.grand_total, o.currency)}
                          </div>
                          <div className="text-xs text-slate-500">
                            {o.items_count || 0} item
                            {(o.items_count || 0) === 1 ? "" : "s"}
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex flex-col gap-1 text-xs">
                            <span
                              className={
                                "inline-flex w-fit items-center gap-1 rounded-full border px-2.5 py-1 font-medium " +
                                getStatusBadgeClass(o.status)
                              }
                            >
                              <Package size={12} />
                              {o.status}
                            </span>
                            <span
                              className={
                                "inline-flex w-fit items-center gap-1 rounded-full border px-2.5 py-1 font-medium " +
                                getStatusBadgeClass(o.payment_status)
                              }
                            >
                              <CreditCard size={12} />
                              {o.payment_status}
                            </span>
                            <span
                              className={
                                "inline-flex w-fit items-center gap-1 rounded-full border px-2.5 py-1 font-medium " +
                                getStatusBadgeClass(o.fulfillment_status)
                              }
                            >
                              <Truck size={12} />
                              {o.fulfillment_status}
                            </span>
                          </div>
                        </td>
                        <td className="px-6 py-4 text-sm">
                          {formatDateTime(o.placed_at)}
                        </td>
                        <td className="px-6 py-4 text-right">
                          <button
                            onClick={() => handleViewOrder(o)}
                            className="inline-flex items-center gap-1 rounded-full border border-slate-300 px-3 py-1.5 text-sm hover:bg-slate-100 dark:border-slate-700 dark:hover:bg-slate-800"
                          >
                            <Eye size={14} /> View
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
          <div className="flex items-center justify-between px-6 py-3 text-sm text-slate-600 dark:text-slate-400">
            <div>
              Page {page} of {pageCount} · {total} orders
              {filteredOrders.length !== orders.length && (
                <span className="ml-2 text-xs text-slate-500">
                  (Filtered on this page: {filteredOrders.length})
                </span>
              )}
            </div>
            <div className="space-x-2">
              <button
                disabled={page <= 1 || loading}
                onClick={() => {
                  if (page <= 1) return;
                  const next = page - 1;
                  setPage(next);
                  loadOrders({ page: next });
                }}
                className="rounded-full border border-slate-300 bg-white px-3 py-1.5 text-xs font-medium hover:bg-slate-50 disabled:opacity-50 dark:border-slate-700 dark:bg-slate-900"
              >
                Previous
              </button>
              <button
                disabled={page >= pageCount || loading}
                onClick={() => {
                  if (page >= pageCount) return;
                  const next = page + 1;
                  setPage(next);
                  loadOrders({ page: next });
                }}
                className="rounded-full border border-slate-300 bg-white px-3 py-1.5 text-xs font-medium hover:bg-slate-50 disabled:opacity-50 dark:border-slate-700 dark:bg-slate-900"
              >
                Next
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminOrdersPage;
