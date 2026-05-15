import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import {
  Activity,
  Eye,
  UserPlus,
  ShoppingBag,
  Users,
  Package,
  CreditCard,
  Bell,
  ArrowUpRight,
  Target,
  BarChart3,
  Tag,
  RefreshCw,
} from "lucide-react";

import { useAuth } from "@/context/AuthContext";
import { getDashboardSummary } from "@/api/crm/dashboard.api";

/* =====================================================
   Types (aligned with API response)
===================================================== */

interface DashboardData {
  visitors: {
    total: number;
    today: number;
    page_views_today: number;
    new_today: number;
  };
  leads: {
    stats: {
      total: number;
      today: number;
      last_24h: number;
      this_week: number;
    };
    latest: Lead[];
  };
  orders: {
    total: number;
    latest: Order[];
  };
  products: {
    total: number;
    published: number;
  };
  customers: {
    total: number;
    latest: Customer[];
  };
  notifications: NotificationItem[];
  promos: {
    total: number;
    active: number;
  };
  users: {
    total: number;
    active: number;
    admins: number;
  };
}

interface Lead {
  id: string;
  name: string;
  email?: string;
  phone?: string;
  status: string;
  created_at: string;
}

interface Order {
  id: string;
  order_number: string;
  grand_total: number;
  payment_status: string;
  status: string;
  customer_name?: string;
  customer_email?: string;
  placed_at: string;
}

interface Customer {
  id: string;
  name?: string;
  email?: string;
  created_at: string;
}

interface NotificationItem {
  id: string;
  title: string;
  body?: string;
  sent: boolean;
  created_at: string;
}

/* =====================================================
   Helpers
===================================================== */

const currency = (v?: number) =>
  `₹${Number(v || 0).toLocaleString("en-IN")}`;

const date = (v?: string) =>
  v
    ? new Date(v).toLocaleDateString("en-IN", {
        day: "2-digit",
        month: "short",
        year: "numeric",
      })
    : "—";

const statusColor = (status: string) => {
  switch (status?.toLowerCase()) {
    case "new": return "bg-blue-100 text-blue-800";
    case "contacted": return "bg-yellow-100 text-yellow-800";
    case "qualified": return "bg-purple-100 text-purple-800";
    case "converted": return "bg-green-100 text-green-800";
    case "lost": return "bg-red-100 text-red-800";
    default: return "bg-gray-100 text-gray-800";
  }
};

/* =====================================================
   KPI Card Component
===================================================== */

const KPI = ({
  title,
  value,
  sub,
  icon,
  accent = "bg-slate-100",
}: {
  title: string;
  value: string | number;
  sub?: string;
  icon: React.ReactNode;
  accent?: string;
}) => (
  <div className="relative rounded-2xl border bg-white p-4 shadow-sm transition hover:shadow-md">
    <div className="flex justify-between">
      <div>
        <p className="text-[11px] uppercase tracking-wide text-slate-500">
          {title}
        </p>
        <p className="mt-1 text-2xl font-semibold text-slate-900">
          {value ?? "—"}
        </p>
        {sub && (
          <p className="mt-1 text-[11px] text-slate-500 truncate">{sub}</p>
        )}
      </div>
      <div
        className={`flex h-10 w-10 items-center justify-center rounded-full ${accent}`}
      >
        {icon}
      </div>
    </div>
  </div>
);

/* =====================================================
   Loading Skeleton
===================================================== */

const Skeleton = () => (
  <div className="space-y-6 animate-pulse">
    {/* Welcome section skeleton */}
    <div className="rounded-2xl border bg-white p-5 shadow-sm">
      <div className="h-3 bg-gray-200 rounded w-24 mb-2" />
      <div className="h-5 bg-gray-200 rounded w-48 mb-3" />
      <div className="flex gap-2">
        <div className="h-4 bg-gray-200 rounded-full w-20" />
        <div className="h-4 bg-gray-200 rounded-full w-16" />
      </div>
    </div>

    {/* KPI cards skeleton */}
    <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-4">
      {[...Array(8)].map((_, i) => (
        <div key={i} className="rounded-2xl border bg-white p-4 shadow-sm">
          <div className="flex justify-between">
            <div className="space-y-2 flex-1">
              <div className="h-3 bg-gray-200 rounded w-16" />
              <div className="h-6 bg-gray-200 rounded w-20" />
              <div className="h-3 bg-gray-200 rounded w-24" />
            </div>
            <div className="h-10 w-10 rounded-full bg-gray-200" />
          </div>
        </div>
      ))}
    </div>

    {/* Recent orders skeleton */}
    <div className="rounded-2xl border bg-white p-5 shadow-sm space-y-3">
      <div className="h-4 bg-gray-200 rounded w-32" />
      {[...Array(3)].map((_, i) => (
        <div key={i} className="flex justify-between py-2 border-b last:border-0">
          <div className="space-y-1">
            <div className="h-4 bg-gray-200 rounded w-24" />
            <div className="h-3 bg-gray-200 rounded w-32" />
          </div>
          <div className="h-4 bg-gray-200 rounded w-16" />
        </div>
      ))}
    </div>
  </div>
);

/* =====================================================
   Main Dashboard Component
===================================================== */

const DashboardHome: React.FC = () => {
  const { user } = useAuth();
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchData = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await getDashboardSummary();
      if (res?.ok) {
        setData(res.data);
      } else {
        setError("Failed to load dashboard data.");
      }
    } catch {
      setError("Unable to connect. Please check your network.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const adminName = user?.full_name || user?.email || "Admin";
  const leads = data?.leads.stats;
  const orders = data?.orders.total || 0;
  const conversion =
    leads && leads.total > 0
      ? Math.round((orders / leads.total) * 100)
      : null;

  return (
    <div className="w-full pb-10">
      {/* Loading state */}
      {loading && !data && <Skeleton />}

      {/* Error state */}
      {error && !data && (
        <div className="rounded-xl border border-rose-200 bg-rose-50 px-4 py-6 text-center text-sm text-rose-700">
          <p className="mb-2">{error}</p>
          <button
            onClick={fetchData}
            className="inline-flex items-center gap-2 rounded-lg bg-rose-600 px-4 py-2 text-white transition hover:bg-rose-700"
          >
            <RefreshCw className="h-4 w-4" />
            Retry
          </button>
        </div>
      )}

      {/* Actual dashboard content */}
      {data && (
        <div className="space-y-6">
          {/* Welcome & Quick Stats */}
          <section className="rounded-2xl border bg-white p-5 shadow-sm">
            <p className="text-xs uppercase tracking-wide text-slate-500">
              Welcome back
            </p>
            <h2 className="text-lg font-semibold text-slate-900">
              {adminName}
            </h2>

            <div className="mt-3 flex flex-wrap gap-3 text-xs">
              {conversion !== null && (
                <span className="inline-flex items-center rounded-full bg-emerald-50 px-3 py-1 text-emerald-700">
                  <Target className="mr-1 h-3 w-3" />
                  Conversion {conversion}%
                </span>
              )}
              <span className="inline-flex items-center rounded-full bg-slate-100 px-3 py-1">
                <BarChart3 className="mr-1 h-3 w-3" />
                Orders {orders}
              </span>
              <span className="inline-flex items-center rounded-full bg-slate-100 px-3 py-1">
                <Users className="mr-1 h-3 w-3" />
                Users {data?.users.total}
              </span>
            </div>
          </section>

          {/* Primary KPIs */}
          <section className="grid gap-5 md:grid-cols-2 xl:grid-cols-4">
            <KPI
              title="Visitors Today"
              value={data.visitors.today}
              sub={`Total ${data.visitors.total}`}
              icon={<Eye className="h-5 w-5 text-sky-600" />}
              accent="bg-sky-100"
            />
            <KPI
              title="Leads This Week"
              value={leads?.this_week}
              sub={`Total ${leads?.total}`}
              icon={<UserPlus className="h-5 w-5 text-emerald-600" />}
              accent="bg-emerald-100"
            />
            <KPI
              title="Orders"
              value={orders}
              sub={`Latest ${data.orders.latest[0]?.order_number || "—"}`}
              icon={<ShoppingBag className="h-5 w-5 text-indigo-600" />}
              accent="bg-indigo-100"
            />
            <KPI
              title="Users"
              value={data.users.total}
              sub={`Active ${data.users.active} • Admins ${data.users.admins}`}
              icon={<Users className="h-5 w-5 text-slate-600" />}
            />
          </section>

          {/* Secondary KPIs */}
          <section className="grid gap-5 md:grid-cols-2 xl:grid-cols-4">
            <KPI
              title="Products"
              value={data.products.total}
              sub={`Published ${data.products.published}`}
              icon={<Package className="h-5 w-5 text-amber-600" />}
              accent="bg-amber-100"
            />
            <KPI
              title="Customers"
              value={data.customers.total}
              sub={data.customers.latest[0]?.name || "—"}
              icon={<CreditCard className="h-5 w-5 text-teal-600" />}
              accent="bg-teal-100"
            />
            <KPI
              title="Promo Codes"
              value={data.promos.total}
              sub={`Active ${data.promos.active}`}
              icon={<Tag className="h-5 w-5 text-fuchsia-600" />}
              accent="bg-fuchsia-100"
            />
            <KPI
              title="Notifications"
              value={data.notifications.length}
              sub="Recent campaigns"
              icon={<Bell className="h-5 w-5 text-rose-600" />}
              accent="bg-rose-100"
            />
          </section>

          {/* Latest Orders */}
          <section className="rounded-2xl border bg-white p-5 shadow-sm">
            <div className="mb-3 flex justify-between">
              <h3 className="text-sm font-semibold text-slate-900">
                Latest Orders
              </h3>
              <Link
                to="/orders"
                className="inline-flex items-center gap-1 text-xs font-medium text-sky-600 hover:text-sky-700"
              >
                View all <ArrowUpRight className="h-3 w-3" />
              </Link>
            </div>
            <div className="space-y-2">
              {data.orders.latest.length === 0 ? (
                <p className="text-xs text-slate-500">No recent orders</p>
              ) : (
                data.orders.latest.slice(0, 5).map((o) => (
                  <div
                    key={o.id}
                    className="flex items-center justify-between rounded-lg border px-3 py-2 text-xs hover:bg-gray-50 transition"
                  >
                    <div>
                      <div className="font-medium text-slate-900">
                        #{o.order_number}
                      </div>
                      <div className="text-[11px] text-slate-500">
                        {o.customer_name || "Guest"} · {date(o.placed_at)}
                      </div>
                    </div>
                    <div className="font-semibold text-slate-900">
                      {currency(o.grand_total)}
                    </div>
                  </div>
                ))
              )}
            </div>
          </section>

          {/* Latest Leads */}
          <section className="rounded-2xl border bg-white p-5 shadow-sm">
            <div className="mb-3 flex justify-between">
              <h3 className="text-sm font-semibold text-slate-900">
                Recent Leads
              </h3>
              <Link
                to="/leads"
                className="inline-flex items-center gap-1 text-xs font-medium text-sky-600 hover:text-sky-700"
              >
                View all <ArrowUpRight className="h-3 w-3" />
              </Link>
            </div>
            <div className="space-y-2">
              {data.leads.latest.length === 0 ? (
                <p className="text-xs text-slate-500">No recent leads</p>
              ) : (
                data.leads.latest.slice(0, 5).map((l) => (
                  <div
                    key={l.id}
                    className="flex items-center justify-between rounded-lg border px-3 py-2 text-xs hover:bg-gray-50 transition"
                  >
                    <div>
                      <div className="font-medium text-slate-900">{l.name}</div>
                      <div className="text-[11px] text-slate-500">
                        {l.email || l.phone || ""}
                      </div>
                    </div>
                    <span
                      className={`inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-medium ${statusColor(
                        l.status
                      )}`}
                    >
                      {l.status}
                    </span>
                  </div>
                ))
              )}
            </div>
          </section>

          {/* Quick Actions */}
          <section className="rounded-2xl border bg-white p-5 shadow-sm">
            <h3 className="text-sm font-semibold text-slate-900 mb-3">
              Quick Actions
            </h3>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              <Link
                to="/orders/new"
                className="flex items-center gap-2 rounded-xl border bg-indigo-50 px-4 py-3 text-xs font-medium text-indigo-700 hover:bg-indigo-100 transition"
              >
                <ShoppingBag className="h-4 w-4" /> New Order
              </Link>
              <Link
                to="/products/new"
                className="flex items-center gap-2 rounded-xl border bg-amber-50 px-4 py-3 text-xs font-medium text-amber-700 hover:bg-amber-100 transition"
              >
                <Package className="h-4 w-4" /> Add Product
              </Link>
              <Link
                to="/leads/new"
                className="flex items-center gap-2 rounded-xl border bg-emerald-50 px-4 py-3 text-xs font-medium text-emerald-700 hover:bg-emerald-100 transition"
              >
                <UserPlus className="h-4 w-4" /> Add Lead
              </Link>
              <Link
                to="/customers"
                className="flex items-center gap-2 rounded-xl border bg-teal-50 px-4 py-3 text-xs font-medium text-teal-700 hover:bg-teal-100 transition"
              >
                <CreditCard className="h-4 w-4" /> Customers
              </Link>
            </div>
          </section>

          {/* Refresh button */}
          <div className="flex justify-center">
            <button
              onClick={fetchData}
              className="inline-flex items-center gap-2 rounded-lg border bg-white px-4 py-2 text-xs font-medium text-slate-600 shadow-sm hover:bg-gray-50 transition disabled:opacity-50"
              disabled={loading}
            >
              <RefreshCw className={`h-4 w-4 ${loading ? "animate-spin" : ""}`} />
              Refresh Dashboard
            </button>
          </div>

          {/* Error banner (visible when data exists but subsequent refresh fails) */}
          {error && data && (
            <div className="rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-xs text-rose-700">
              {error}
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default DashboardHome;