// src/pages/CustomerPage.tsx

import React, { useEffect, useMemo, useState } from "react";
import {
  Users,
  Phone,
  Mail,
  Flag,
  Tag,
  CheckCircle2,
  AlertCircle,
  Ban,
  Edit2,
  Package,
  CreditCard,
  Truck,
  MapPin,
  Loader2,
  BarChart2,
  Activity,
  CalendarClock,
} from "lucide-react";
import { toast } from "react-hot-toast";
import {
  getCustomerFull,
  updateCustomer,
  type Customer,
  type CustomerOrder,
  type CustomerAddress,
} from "@/api/masters/customers.api";

import {
  ResponsiveContainer,
  LineChart,
  Line,
  CartesianGrid,
  XAxis,
  YAxis,
  Tooltip,
  BarChart,
  Bar,
  Legend,
} from "recharts";

type CustomerDetailTab = "profile" | "orders" | "addresses" | "analytics";

interface CustomerFormState {
  id?: string;
  email: string;
  name: string;
  phone: string;
  company: string;
  country: string;
  phone_verified: boolean;
  notes: string;
  tags: string; // comma separated in UI
  metadata: any;
}

const blankCustomerForm: CustomerFormState = {
  email: "",
  name: "",
  phone: "",
  company: "",
  country: "",
  phone_verified: false,
  notes: "",
  tags: "",
  metadata: {},
};

export interface CustomerPageProps {
  customerId: string;
  onClose: () => void;
}

/**
 * Helper formatters
 */
const formatDate = (value?: string | null) => {
  if (!value) return "—";
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return "—";
  return d.toLocaleDateString();
};

const formatDateTime = (value?: string | null) => {
  if (!value) return "—";
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return "—";
  return d.toLocaleString();
};

const formatMoney = (amount: number) =>
  `₹${Number(amount || 0).toLocaleString()}`;

const getStatusBadgeClass = (status: string) => {
  const s = (status || "").toLowerCase();
  if (["completed", "fulfilled", "delivered", "paid"].includes(s)) {
    return "border-emerald-300 bg-emerald-50 text-emerald-700 dark:border-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-200";
  }
  if (["cancelled", "failed", "refunded"].includes(s)) {
    return "border-rose-300 bg-rose-50 text-rose-700 dark:border-rose-700 dark:bg-rose-900/30 dark:text-rose-200";
  }
  if (["processing", "pending", "shipped"].includes(s)) {
    return "border-sky-300 bg-sky-50 text-sky-700 dark:border-sky-700 dark:bg-sky-900/30 dark:text-sky-200";
  }
  return "border-slate-300 bg-slate-100 text-slate-700 dark:border-slate-600 dark:bg-slate-900 dark:text-slate-200";
};

/**
 * Analytics helpers
 */
interface CustomerAnalytics {
  ltv: number;
  aov: number;
  totalOrders: number;
  totalItems: number;
  firstOrderDate: string | null;
  lastOrderDate: string | null;
  rScore: number;
  fScore: number;
  mScore: number;
  ordersByMonth: { month: string; revenue: number; items: number }[];
}

const calculateAnalytics = (orders: CustomerOrder[]): CustomerAnalytics => {
  if (!orders || orders.length === 0) {
    return {
      ltv: 0,
      aov: 0,
      totalOrders: 0,
      totalItems: 0,
      firstOrderDate: null,
      lastOrderDate: null,
      rScore: 0,
      fScore: 0,
      mScore: 0,
      ordersByMonth: [],
    };
  }

  const sortedByDate = [...orders].sort((a, b) => {
    const da = a.placed_at ? new Date(a.placed_at).getTime() : 0;
    const db = b.placed_at ? new Date(b.placed_at).getTime() : 0;
    return da - db;
  });

  const totalOrders = orders.length;
  const totalItems = orders.reduce(
    (sum, o) => sum + (o.items_count || 0),
    0
  );
  const ltv = orders.reduce(
    (sum, o) => sum + Number(o.grand_total || 0),
    0
  );
  const aov = totalOrders > 0 ? ltv / totalOrders : 0;

  const firstOrderDate = sortedByDate[0]?.placed_at || null;
  const lastOrderDate = sortedByDate[sortedByDate.length - 1]?.placed_at || null;

  // Recency: days since last order
  let rScore = 1;
  if (lastOrderDate) {
    const now = new Date();
    const last = new Date(lastOrderDate);
    const diffDays = Math.floor(
      (now.getTime() - last.getTime()) / (1000 * 60 * 60 * 24)
    );
    if (diffDays <= 30) rScore = 5;
    else if (diffDays <= 60) rScore = 4;
    else if (diffDays <= 120) rScore = 3;
    else if (diffDays <= 365) rScore = 2;
    else rScore = 1;
  }

  // Frequency: number of orders
  let fScore = 1;
  if (totalOrders >= 20) fScore = 5;
  else if (totalOrders >= 10) fScore = 4;
  else if (totalOrders >= 5) fScore = 3;
  else if (totalOrders >= 2) fScore = 2;
  else fScore = 1;

  // Monetary: LTV / AOV
  let mScore = 1;
  if (ltv >= 200000) mScore = 5;
  else if (ltv >= 100000) mScore = 4;
  else if (ltv >= 50000) mScore = 3;
  else if (ltv >= 20000) mScore = 2;
  else mScore = 1;

  // Aggregate per month (YYYY-MM)
  const monthMap: Record<string, { revenue: number; items: number }> = {};
  for (const o of orders) {
    if (!o.placed_at) continue;
    const d = new Date(o.placed_at);
    if (Number.isNaN(d.getTime())) continue;
    const monthKey = `${d.getFullYear()}-${String(
      d.getMonth() + 1
    ).padStart(2, "0")}`;
    if (!monthMap[monthKey]) {
      monthMap[monthKey] = { revenue: 0, items: 0 };
    }
    monthMap[monthKey].revenue += Number(o.grand_total || 0);
    monthMap[monthKey].items += Number(o.items_count || 0);
  }

  const ordersByMonth = Object.entries(monthMap)
    .sort(([a], [b]) => (a < b ? -1 : 1))
    .map(([month, value]) => ({
      month,
      revenue: value.revenue,
      items: value.items,
    }));

  return {
    ltv,
    aov,
    totalOrders,
    totalItems,
    firstOrderDate,
    lastOrderDate,
    rScore,
    fScore,
    mScore,
    ordersByMonth,
  };
};

const CustomerPage: React.FC<CustomerPageProps> = ({ customerId, onClose }) => {
  const [activeTab, setActiveTab] = useState<CustomerDetailTab>("profile");
  const [modalLoading, setModalLoading] = useState(false);
  const [saving, setSaving] = useState(false);

  const [form, setForm] = useState<CustomerFormState>(blankCustomerForm);
  const [detailCustomer, setDetailCustomer] = useState<Customer | null>(null);
  const [detailCurrentOrder, setDetailCurrentOrder] =
    useState<CustomerOrder | null>(null);
  const [detailOrders, setDetailOrders] = useState<CustomerOrder[]>([]);
  const [detailOrdersPage, setDetailOrdersPage] = useState(1);
  const [detailOrdersTotalPages, setDetailOrdersTotalPages] = useState(1);
  const [detailAddresses, setDetailAddresses] = useState<CustomerAddress[]>([]);

  // Load full customer on mount / customerId change
  useEffect(() => {
    const load = async () => {
      setModalLoading(true);
      try {
        const res = await getCustomerFull(customerId, 1);

        const customer = res.customer as Customer;
        const tagsArr: string[] = customer.tags || [];
        const notesStr: string = customer.notes || "";

        setDetailCustomer(customer);
        setDetailCurrentOrder(res.current_order || null);
        setDetailOrders(res.orders || []);
        setDetailOrdersPage(res.page || 1);
        setDetailOrdersTotalPages(res.total_pages || 1);
        setDetailAddresses(res.addresses || []);

        setForm({
          id: customer.id,
          email: customer.email || "",
          name: customer.name || "",
          phone: customer.phone || "",
          company: customer.company || "",
          country: customer.country || "",
          phone_verified: Boolean(customer.phone_verified),
          notes: notesStr,
          tags: tagsArr.join(", "),
          metadata: customer.metadata || {},
        });
      } catch (err) {
        console.error("Failed to load customer full detail", err);
        toast.error("Failed to load customer details.");
        onClose();
      } finally {
        setModalLoading(false);
      }
    };

    if (customerId) {
      load();
    }
  }, [customerId, onClose]);

  const loadOrdersPageForCustomer = async (pageNum: number) => {
    if (!detailCustomer) return;
    try {
      setModalLoading(true);
      const res = await getCustomerFull(detailCustomer.id, pageNum);
      setDetailCurrentOrder(res.current_order || null);
      setDetailOrders(res.orders || []);
      setDetailOrdersPage(res.page || pageNum);
      setDetailOrdersTotalPages(res.total_pages || 1);
      // keep customer + addresses from previous load
    } catch (err) {
      console.error("Failed to load customer orders page", err);
      toast.error("Failed to load more orders.");
    } finally {
      setModalLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.id) {
      toast.error("Missing customer id.");
      return;
    }

    setSaving(true);
    try {
      const cleanTags = form.tags
        .split(",")
        .map((t) => t.trim())
        .filter(Boolean);

      const payload: Partial<Customer> = {
        email: form.email || null,
        name: form.name || null,
        phone: form.phone || null,
        company: form.company || null,
        country: form.country || null,
        phone_verified: form.phone_verified,
        notes: form.notes || null,
        tags: cleanTags,
        metadata: form.metadata || {},
      };

      const res = await updateCustomer(form.id, payload);
      const updated = res.customer as Customer;

      setDetailCustomer(updated);

      toast.success("Customer updated.");
    } catch (err) {
      console.error("Failed to update customer", err);
      toast.error("Failed to update customer.");
    } finally {
      setSaving(false);
    }
  };

  const analytics = useMemo(
    () => calculateAnalytics(detailOrders),
    [detailOrders]
  );

  const rfmSegmentLabel = useMemo(() => {
    const scoreSum = analytics.rScore + analytics.fScore + analytics.mScore;
    if (scoreSum >= 13) return "Top / VIP Customer";
    if (scoreSum >= 10) return "High value";
    if (scoreSum >= 7) return "Medium";
    if (scoreSum >= 4) return "Low";
    return "Dormant / At-risk";
  }, [analytics.rScore, analytics.fScore, analytics.mScore]);

  return (
    <div className="w-full max-w-5xl rounded-2xl border border-slate-300 bg-white p-6 shadow-xl dark:border-slate-700 dark:bg-slate-950">
      {/* HEADER */}
      <div className="mb-5 flex items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-3">
            <img
              src="/logo_minalgems.png"
              alt="Minal Gems"
              className="h-auto w-64 rounded-lg object-contain bg-white"
            />
            <div>
              <h2 className="text-xl font-semibold text-slate-900 dark:text-white">
                {form.name || "Customer details"}
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Edit profile, review orders, analytics and manage addresses for
                this customer.
              </p>
            </div>
          </div>
        </div>
        <button
          onClick={onClose}
          className="rounded-full border border-slate-300 px-3 py-1 text-sm hover:bg-slate-100 dark:border-slate-700 dark:hover:bg-slate-800"
        >
          Close
        </button>
      </div>

      {/* TABS */}
      <div className="mb-4 flex items-center gap-2 border-b border-slate-200 pb-1 dark:border-slate-700">
        {(
          [
            { id: "profile", label: "Profile" },
            { id: "orders", label: "Orders" },
            { id: "addresses", label: "Addresses" },
            { id: "analytics", label: "Analytics" },
          ] as { id: CustomerDetailTab; label: string }[]
        ).map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`rounded-full px-4 py-1.5 text-xs font-medium ${
              activeTab === tab.id
                ? "bg-slate-900 text-white dark:bg-slate-100 dark:text-slate-900"
                : "text-slate-600 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-800"
            }`}
          >
            {tab.label}
          </button>
        ))}

        <div className="ml-auto flex items-center gap-2 text-[11px] text-slate-500 dark:text-slate-400">
          <Users size={12} />
          <span>{detailCustomer?.email || "—"}</span>
        </div>
      </div>

      {modalLoading ? (
        <div className="flex items-center justify-center py-10 text-slate-500">
          <Loader2 className="mr-2 animate-spin" size={18} />
          Loading customer…
        </div>
      ) : (
        <>
          {/* PROFILE TAB */}
          {activeTab === "profile" && (
            <form onSubmit={handleSubmit} className="space-y-5 text-sm">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="mb-1 block text-xs font-medium">
                    Full Name
                  </label>
                  <input
                    value={form.name}
                    onChange={(e) =>
                      setForm((f) => ({ ...f, name: e.target.value }))
                    }
                    className="w-full rounded-lg border border-slate-300 bg-slate-50 px-3 py-2 text-sm dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100"
                  />
                </div>
                <div>
                  <label className="mb-1 block text-xs font-medium">
                    Email
                  </label>
                  <input
                    type="email"
                    value={form.email}
                    onChange={(e) =>
                      setForm((f) => ({ ...f, email: e.target.value }))
                    }
                    className="w-full rounded-lg border border-slate-300 bg-slate-50 px-3 py-2 text-sm dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="mb-1 block text-xs font-medium">
                    Phone
                  </label>
                  <input
                    value={form.phone}
                    onChange={(e) =>
                      setForm((f) => ({ ...f, phone: e.target.value }))
                    }
                    className="w-full rounded-lg border border-slate-300 bg-slate-50 px-3 py-2 text-sm dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100"
                  />
                </div>
                <div className="flex items-center gap-2 pt-6">
                  <input
                    id="cust_phone_verified"
                    type="checkbox"
                    checked={form.phone_verified}
                    onChange={(e) =>
                      setForm((f) => ({
                        ...f,
                        phone_verified: e.target.checked,
                      }))
                    }
                    className="h-4 w-4 rounded border-slate-300 text-emerald-600 focus:ring-emerald-500 dark:border-slate-600"
                  />
                  <label
                    htmlFor="cust_phone_verified"
                    className="text-xs text-slate-700 dark:text-slate-200"
                  >
                    Phone verified
                  </label>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="mb-1 block text-xs font-medium">
                    Company
                  </label>
                  <input
                    value={form.company}
                    onChange={(e) =>
                      setForm((f) => ({ ...f, company: e.target.value }))
                    }
                    className="w-full rounded-lg border border-slate-300 bg-slate-50 px-3 py-2 text-sm dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100"
                  />
                </div>
                <div>
                  <label className="mb-1 block text-xs font-medium">
                    Country
                  </label>
                  <input
                    value={form.country}
                    onChange={(e) =>
                      setForm((f) => ({ ...f, country: e.target.value }))
                    }
                    className="w-full rounded-lg border border-slate-300 bg-slate-50 px-3 py-2 text-sm dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100"
                  />
                </div>
              </div>

              {/* Tags & notes */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="mb-1 block text-xs font-medium">
                    Tags (comma separated)
                  </label>
                  <input
                    value={form.tags}
                    onChange={(e) =>
                      setForm((f) => ({ ...f, tags: e.target.value }))
                    }
                    placeholder="VIP, High value, WhatsApp"
                    className="w-full rounded-lg border border-slate-300 bg-slate-50 px-3 py-2 text-sm dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100"
                  />
                  <p className="mt-1 text-[11px] text-slate-500 dark:text-slate-400">
                    Stored as an array in customers.tags.
                  </p>
                </div>
                <div>
                  <label className="mb-1 block text-xs font-medium">
                    Internal Notes
                  </label>
                  <textarea
                    rows={3}
                    value={form.notes}
                    onChange={(e) =>
                      setForm((f) => ({ ...f, notes: e.target.value }))
                    }
                    className="w-full rounded-lg border border-slate-300 bg-slate-50 px-3 py-2 text-sm dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100"
                  />
                  <p className="mt-1 text-[11px] text-slate-500 dark:text-slate-400">
                    Internal only. Later you can switch to a dedicated
                    /customers/:id/notes endpoint for timestamped notes.
                  </p>
                </div>
              </div>

              <div className="flex items-center justify-between pt-3">
                <p className="flex items-center gap-2 text-xs text-slate-500 dark:text-slate-400">
                  <Ban size={12} />
                  Blocking logic can be implemented via metadata.blocked
                  (customer-level flag).
                </p>
                <div className="flex items-center gap-3">
                  <button
                    type="button"
                    onClick={onClose}
                    className="rounded-full border border-slate-300 bg-white px-5 py-2 text-xs font-medium hover:bg-slate-100 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200"
                  >
                    Close
                  </button>
                  <button
                    type="submit"
                    disabled={saving}
                    className="inline-flex items-center gap-2 rounded-full bg-slate-900 px-5 py-2 text-xs font-semibold text-white hover:bg-slate-800 disabled:opacity-60 dark:bg-slate-100 dark:text-slate-900"
                  >
                    {saving ? (
                      <Loader2 className="animate-spin" size={14} />
                    ) : (
                      <>
                        <Edit2 size={14} /> Save Changes
                      </>
                    )}
                  </button>
                </div>
              </div>
            </form>
          )}

          {/* ORDERS TAB */}
          {activeTab === "orders" && (
            <div className="space-y-5 text-sm">
              {/* CURRENT ORDER CARD */}
              <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4 dark:border-slate-700 dark:bg-slate-900/40">
                <div className="mb-2 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Package size={16} className="text-slate-500" />
                    <h3 className="text-sm font-semibold text-slate-800 dark:text-slate-100">
                      Current order
                    </h3>
                  </div>
                  {detailCurrentOrder?.id && (
                    <span className="text-xs text-slate-500">
                      Order ID: {detailCurrentOrder.id}
                    </span>
                  )}
                </div>
                {detailCurrentOrder ? (
                  <div className="grid grid-cols-1 gap-3 md:grid-cols-3">
                    <div className="space-y-1">
                      <div className="text-xs text-slate-500">
                        Status overview
                      </div>
                      <div className="flex flex-wrap gap-1">
                        <span
                          className={
                            "inline-flex items-center gap-1 rounded-full border px-2 py-1 text-[11px] font-medium " +
                            getStatusBadgeClass(detailCurrentOrder.status)
                          }
                        >
                          <Package size={11} />
                          {detailCurrentOrder.status}
                        </span>
                        <span
                          className={
                            "inline-flex items-center gap-1 rounded-full border px-2 py-1 text-[11px] font-medium " +
                            getStatusBadgeClass(
                              detailCurrentOrder.payment_status || ""
                            )
                          }
                        >
                          <CreditCard size={11} />
                          {detailCurrentOrder.payment_status || "—"}
                        </span>
                        <span
                          className={
                            "inline-flex items-center gap-1 rounded-full border px-2 py-1 text-[11px] font-medium " +
                            getStatusBadgeClass(
                              detailCurrentOrder.fulfillment_status || ""
                            )
                          }
                        >
                          <Truck size={11} />
                          {detailCurrentOrder.fulfillment_status || "—"}
                        </span>
                      </div>
                    </div>
                    <div className="space-y-1">
                      <div className="text-xs text-slate-500">Totals</div>
                      <div className="text-base font-semibold">
                        {formatMoney(detailCurrentOrder.grand_total)}
                      </div>
                      <div className="text-[11px] text-slate-500">
                        Items: {detailCurrentOrder.items_count} · Subtotal:{" "}
                        {formatMoney(detailCurrentOrder.subtotal)} · Shipping:{" "}
                        {formatMoney(detailCurrentOrder.shipping_total)}
                      </div>
                    </div>
                    <div className="space-y-1">
                      <div className="text-xs text-slate-500">
                        Shipping / timeline
                      </div>
                      <div className="space-y-0.5 text-[11px] text-slate-500">
                        <div>
                          Placed:{" "}
                          {formatDateTime(detailCurrentOrder.placed_at)}
                        </div>
                        <div>
                          Shipped:{" "}
                          {formatDateTime(detailCurrentOrder.shipped_at)}
                        </div>
                        <div>
                          Completed:{" "}
                          {formatDateTime(detailCurrentOrder.completed_at)}
                        </div>
                        {detailCurrentOrder.shipments &&
                          detailCurrentOrder.shipments.length > 0 && (
                            <div className="mt-1">
                              {detailCurrentOrder.shipments[0]
                                .tracking_number && (
                                <span>
                                  Tracking:{" "}
                                  {
                                    detailCurrentOrder.shipments[0]
                                      .tracking_number
                                  }
                                </span>
                              )}
                            </div>
                          )}
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="text-xs text-slate-500">
                    No active/current order found for this customer.
                  </div>
                )}
              </div>

              {/* ORDER HISTORY LIST */}
              <div className="rounded-2xl border border-slate-200 bg-white dark:border-slate-700 dark:bg-slate-900">
                <div className="flex items-center justify-between border-b border-slate-200 px-4 py-3 text-sm font-medium text-slate-700 dark:border-slate-700 dark:text-slate-200">
                  <span>Order history</span>
                  <span className="text-xs text-slate-500">
                    Page {detailOrdersPage} of {detailOrdersTotalPages}
                  </span>
                </div>
                {detailOrders.length === 0 ? (
                  <div className="px-4 py-6 text-sm text-slate-500">
                    No orders found for this customer.
                  </div>
                ) : (
                  <div className="divide-y divide-slate-200 dark:divide-slate-800">
                    {detailOrders.map((o) => (
                      <div key={o.id} className="px-4 py-3 text-sm">
                        <div className="flex flex-col gap-2 md:flex-row md:items-start md:justify-between">
                          <div className="flex items-start gap-3">
                            <span className="mt-1 inline-flex h-8 w-8 items-center justify-center rounded-full bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-300">
                              <Package size={16} />
                            </span>
                            <div>
                              <div className="flex items-center gap-2">
                                <span className="text-sm font-semibold">
                                  Order #{o.id}
                                </span>
                                <span className="text-[11px] text-slate-500">
                                  {formatDateTime(o.placed_at)}
                                </span>
                              </div>
                              <div className="mt-1 flex flex-wrap gap-1">
                                <span
                                  className={
                                    "inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-[11px] font-medium " +
                                    getStatusBadgeClass(o.status)
                                  }
                                >
                                  <Package size={11} />
                                  {o.status}
                                </span>
                                <span
                                  className={
                                    "inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-[11px] font-medium " +
                                    getStatusBadgeClass(
                                      o.payment_status || ""
                                    )
                                  }
                                >
                                  <CreditCard size={11} />
                                  {o.payment_status || "—"}
                                </span>
                                <span
                                  className={
                                    "inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-[11px] font-medium " +
                                    getStatusBadgeClass(
                                      o.fulfillment_status || ""
                                    )
                                  }
                                >
                                  <Truck size={11} />
                                  {o.fulfillment_status || "—"}
                                </span>
                              </div>
                              <div className="mt-1 text-[11px] text-slate-500">
                                Total:{" "}
                                <span className="font-semibold">
                                  {formatMoney(o.grand_total)}
                                </span>{" "}
                                · Items: {o.items_count}
                              </div>
                            </div>
                          </div>

                          <div className="mt-2 grid flex-1 grid-cols-1 gap-2 md:mt-0 md:grid-cols-2">
                            <div className="text-xs text-slate-500 dark:text-slate-400">
                              <div className="mb-1 font-semibold">Items</div>
                              {o.items && o.items.length ? (
                                <ul className="space-y-0.5">
                                  {o.items.slice(0, 3).map((it) => (
                                    <li key={it.id}>
                                      {it.title || "Item"} × {it.quantity} —{" "}
                                      {formatMoney(it.line_total)}
                                    </li>
                                  ))}
                                  {o.items.length > 3 && (
                                    <li>+ {o.items.length - 3} more…</li>
                                  )}
                                </ul>
                              ) : (
                                <div>—</div>
                              )}
                            </div>
                            <div className="text-xs text-slate-500 dark:text-slate-400">
                              <div className="mb-1 font-semibold">
                                Shipments
                              </div>
                              {o.shipments && o.shipments.length ? (
                                <ul className="space-y-0.5">
                                  {o.shipments.map((s) => (
                                    <li key={s.id}>
                                      <span className="inline-flex items-center gap-1">
                                        <Truck size={11} />
                                        <span>{s.status}</span>
                                      </span>
                                      {s.carrier && <span> · {s.carrier}</span>}
                                      {s.tracking_number && (
                                        <span> · #{s.tracking_number}</span>
                                      )}
                                    </li>
                                  ))}
                                </ul>
                              ) : (
                                <div>—</div>
                              )}
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}

                {/* Orders pagination */}
                <div className="flex items-center justify-between border-t border-slate-200 px-4 py-2 text-xs text-slate-500 dark:border-slate-700 dark:text-slate-400">
                  <div>
                    Page {detailOrdersPage} of {detailOrdersTotalPages}
                  </div>
                  <div className="space-x-2">
                    <button
                      disabled={detailOrdersPage <= 1 || modalLoading}
                      onClick={() => {
                        const next = detailOrdersPage - 1;
                        if (next < 1) return;
                        loadOrdersPageForCustomer(next);
                      }}
                      className="rounded-full border border-slate-300 bg-white px-3 py-1.5 text-[11px] font-medium hover:bg-slate-50 disabled:opacity-50 dark:border-slate-700 dark:bg-slate-900"
                    >
                      Previous
                    </button>
                    <button
                      disabled={
                        detailOrdersPage >= detailOrdersTotalPages ||
                        modalLoading
                      }
                      onClick={() => {
                        const next = detailOrdersPage + 1;
                        if (next > detailOrdersTotalPages) return;
                        loadOrdersPageForCustomer(next);
                      }}
                      className="rounded-full border border-slate-300 bg-white px-3 py-1.5 text-[11px] font-medium hover:bg-slate-50 disabled:opacity-50 dark:border-slate-700 dark:bg-slate-900"
                    >
                      Next
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* ADDRESSES TAB */}
          {activeTab === "addresses" && (
            <div className="space-y-4 text-sm">
              {detailAddresses.length === 0 ? (
                <div className="rounded-2xl border border-slate-200 bg-white px-4 py-6 text-sm text-slate-500 dark:border-slate-700 dark:bg-slate-900">
                  This customer has no saved addresses.
                </div>
              ) : (
                <div className="grid gap-4 md:grid-cols-2">
                  {detailAddresses.map((addr) => (
                    <div
                      key={addr.id}
                      className="rounded-2xl border border-slate-200 bg-white p-4 text-sm shadow-sm dark:border-slate-700 dark:bg-slate-900"
                    >
                      <div className="mb-2 flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <MapPin size={16} className="text-slate-500" />
                          <div className="font-semibold">
                            {addr.label || "Address"}
                          </div>
                        </div>
                        <div className="flex flex-wrap gap-1 text-[10px]">
                          {addr.is_default_shipping && (
                            <span className="rounded-full bg-sky-50 px-2 py-0.5 font-medium text-sky-700 dark:bg-sky-900/40 dark:text-sky-200">
                              Default shipping
                            </span>
                          )}
                          {addr.is_default_billing && (
                            <span className="rounded-full bg-emerald-50 px-2 py-0.5 font-medium text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-200">
                              Default billing
                            </span>
                          )}
                        </div>
                      </div>
                      <div className="space-y-0.5 text-xs text-slate-600 dark:text-slate-300">
                        <div>{addr.full_name || detailCustomer?.name}</div>
                        {addr.phone && <div>{addr.phone}</div>}
                        <div>
                          {addr.line1}
                          {addr.line2 ? `, ${addr.line2}` : ""}
                        </div>
                        <div>
                          {addr.city}
                          {addr.state ? `, ${addr.state}` : ""}{" "}
                          {addr.postal_code ? `- ${addr.postal_code}` : ""}
                        </div>
                        <div>{addr.country}</div>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              <p className="flex items-center gap-1 text-[11px] text-slate-500 dark:text-slate-400">
                <AlertCircle size={11} />
                Address editing / creation for admin can be wired later to the
                customer-addresses routes once you finalize the admin endpoints.
              </p>
            </div>
          )}

          {/* ANALYTICS TAB */}
          {activeTab === "analytics" && (
            <div className="space-y-6 text-sm">
              {/* Top metrics */}
              <div className="grid gap-4 md:grid-cols-4">
                <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4 dark:border-slate-700 dark:bg-slate-900/40">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-medium text-slate-500">
                      LTV (Lifetime Value)
                    </span>
                    <CreditCard size={14} className="text-slate-400" />
                  </div>
                  <div className="mt-2 text-lg font-semibold">
                    {formatMoney(analytics.ltv)}
                  </div>
                  <div className="mt-1 text-[11px] text-slate-500">
                    Sum of all order grand totals.
                  </div>
                </div>

                <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4 dark:border-slate-700 dark:bg-slate-900/40">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-medium text-slate-500">
                      AOV (Average Order Value)
                    </span>
                    <BarChart2 size={14} className="text-slate-400" />
                  </div>
                  <div className="mt-2 text-lg font-semibold">
                    {analytics.totalOrders > 0
                      ? formatMoney(analytics.aov)
                      : "—"}
                  </div>
                  <div className="mt-1 text-[11px] text-slate-500">
                    LTV / total orders.
                  </div>
                </div>

                <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4 dark:border-slate-700 dark:bg-slate-900/40">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-medium text-slate-500">
                      Total Orders
                    </span>
                    <Package size={14} className="text-slate-400" />
                  </div>
                  <div className="mt-2 text-lg font-semibold">
                    {analytics.totalOrders}
                  </div>
                  <div className="mt-1 text-[11px] text-slate-500">
                    All orders (any status).
                  </div>
                </div>

                <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4 dark:border-slate-700 dark:bg-slate-900/40">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-medium text-slate-500">
                      Total Items Purchased
                    </span>
                    <Activity size={14} className="text-slate-400" />
                  </div>
                  <div className="mt-2 text-lg font-semibold">
                    {analytics.totalItems}
                  </div>
                  <div className="mt-1 text-[11px] text-slate-500">
                    Sum of items_count across orders.
                  </div>
                </div>
              </div>

              {/* RFM + dates */}
              <div className="grid gap-4 md:grid-cols-3">
                <div className="rounded-2xl border border-slate-200 bg-white p-4 dark:border-slate-700 dark:bg-slate-900">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-medium text-slate-500">
                      RFM Scores
                    </span>
                    <Activity size={14} className="text-slate-400" />
                  </div>
                  <div className="mt-3 flex items-center gap-2">
                    <span className="inline-flex flex-col rounded-xl bg-slate-100 px-3 py-2 text-xs font-semibold text-slate-800 dark:bg-slate-800 dark:text-slate-50">
                      <span className="text-[10px] uppercase text-slate-500">
                        R
                      </span>
                      <span className="text-base">{analytics.rScore}</span>
                    </span>
                    <span className="inline-flex flex-col rounded-xl bg-slate-100 px-3 py-2 text-xs font-semibold text-slate-800 dark:bg-slate-800 dark:text-slate-50">
                      <span className="text-[10px] uppercase text-slate-500">
                        F
                      </span>
                      <span className="text-base">{analytics.fScore}</span>
                    </span>
                    <span className="inline-flex flex-col rounded-xl bg-slate-100 px-3 py-2 text-xs font-semibold text-slate-800 dark:bg-slate-800 dark:text-slate-50">
                      <span className="text-[10px] uppercase text-slate-500">
                        M
                      </span>
                      <span className="text-base">{analytics.mScore}</span>
                    </span>
                  </div>
                  <div className="mt-2 text-[11px] text-slate-500">
                    Segment:{" "}
                    <span className="font-medium text-slate-700 dark:text-slate-200">
                      {rfmSegmentLabel}
                    </span>
                  </div>
                  <ul className="mt-2 space-y-1 text-[11px] text-slate-500">
                    <li>R: Recency (days since last order).</li>
                    <li>F: Frequency (number of orders).</li>
                    <li>M: Monetary (lifetime spend).</li>
                  </ul>
                </div>

                <div className="rounded-2xl border border-slate-200 bg-white p-4 dark:border-slate-700 dark:bg-slate-900">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-medium text-slate-500">
                      First & Last Order
                    </span>
                    <CalendarClock size={14} className="text-slate-400" />
                  </div>
                  <div className="mt-3 space-y-1 text-[13px] text-slate-700 dark:text-slate-200">
                    <div>
                      First order:{" "}
                      <span className="font-semibold">
                        {analytics.firstOrderDate
                          ? formatDateTime(analytics.firstOrderDate)
                          : "—"}
                      </span>
                    </div>
                    <div>
                      Last order:{" "}
                      <span className="font-semibold">
                        {analytics.lastOrderDate
                          ? formatDateTime(analytics.lastOrderDate)
                          : "—"}
                      </span>
                    </div>
                  </div>
                  <div className="mt-2 text-[11px] text-slate-500">
                    Helps understand customer lifecycle and recency.
                  </div>
                </div>

                <div className="rounded-2xl border border-slate-200 bg-white p-4 dark:border-slate-700 dark:bg-slate-900">
                  <div className="text-xs font-medium text-slate-500">
                    Quick interpretation
                  </div>
                  <div className="mt-2 text-[11px] text-slate-500">
                    Use these metrics to decide:
                  </div>
                  <ul className="mt-2 list-disc space-y-1 pl-5 text-[11px] text-slate-500">
                    <li>Who to prioritise for WhatsApp follow-ups.</li>
                    <li>Who should get high-value promotions or early access.</li>
                    <li>Which customers are at risk of churning (low R score).</li>
                  </ul>
                </div>
              </div>

              {/* Charts */}
              <div className="grid gap-4 md:grid-cols-2">
                <div className="rounded-2xl border border-slate-200 bg-white p-4 dark:border-slate-700 dark:bg-slate-900">
                  <div className="mb-2 flex items-center justify-between">
                    <span className="text-xs font-medium text-slate-500">
                      Revenue over time
                    </span>
                  </div>
                  {analytics.ordersByMonth.length === 0 ? (
                    <div className="py-6 text-center text-xs text-slate-500">
                      Not enough order history to show chart.
                    </div>
                  ) : (
                    <div className="h-52">
                      <ResponsiveContainer width="100%" height="100%">
                        <LineChart data={analytics.ordersByMonth}>
                          <CartesianGrid strokeDasharray="3 3" />
                          <XAxis dataKey="month" />
                          <YAxis />
                          <Tooltip
                            formatter={(value: any) =>
                              formatMoney(Number(value))
                            }
                          />
                          <Legend />
                          <Line
                            type="monotone"
                            dataKey="revenue"
                            dot={false}
                          />
                        </LineChart>
                      </ResponsiveContainer>
                    </div>
                  )}
                </div>

                <div className="rounded-2xl border border-slate-200 bg-white p-4 dark:border-slate-700 dark:bg-slate-900">
                  <div className="mb-2 flex items-center justify-between">
                    <span className="text-xs font-medium text-slate-500">
                      Items purchased over time
                    </span>
                  </div>
                  {analytics.ordersByMonth.length === 0 ? (
                    <div className="py-6 text-center text-xs text-slate-500">
                      Not enough order history to show chart.
                    </div>
                  ) : (
                    <div className="h-52">
                      <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={analytics.ordersByMonth}>
                          <CartesianGrid strokeDasharray="3 3" />
                          <XAxis dataKey="month" />
                          <YAxis />
                          <Tooltip />
                          <Legend />
                          <Bar dataKey="items" />
                        </BarChart>
                      </ResponsiveContainer>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
};

export default CustomerPage;
