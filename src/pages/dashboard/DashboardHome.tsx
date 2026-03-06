import React, { useEffect, useState } from "react";
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
  TrendingUp,
  TrendingDown,
  Target,
  BarChart3,
  Layers,
  Tag,
} from "lucide-react";

import { useAuth } from "@/context/AuthContext";
import { AdminPageHeader } from "@/components/admin/AdminPageHeader";
import { getDashboardSummary } from "@/api/crm/dashboard.api";

/* =====================================================
   Types (backend-aligned)
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

/* =====================================================
   KPI Card
===================================================== */

const KPI = ({
  title,
  value,
  sub,
  icon,
  accent = "bg-slate-100",
}: any) => (
  <div className="relative rounded-2xl border bg-white p-4 shadow-sm">
    <div className="flex justify-between">
      <div>
        <p className="text-[11px] uppercase tracking-wide text-slate-500">
          {title}
        </p>
        <p className="mt-1 text-2xl font-semibold text-slate-900">
          {value ?? "—"}
        </p>
        {sub && (
          <p className="mt-1 text-[11px] text-slate-500">{sub}</p>
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
   Dashboard
===================================================== */

const DashboardHome: React.FC = () => {
  const { user } = useAuth();
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let alive = true;
    (async () => {
      try {
        const res = await getDashboardSummary();
        if (alive && res?.ok) setData(res.data);
      } catch {
        if (alive) setError("Failed to load dashboard summary.");
      } finally {
        if (alive) setLoading(false);
      }
    })();
    return () => {
      alive = false;
    };
  }, []);

  const adminName =
    user?.full_name || user?.email || "Admin";

  const leads = data?.leads.stats;
  const orders = data?.orders.total || 0;

  const conversion =
    leads && leads.total > 0
      ? Math.round((orders / leads.total) * 100)
      : null;

  /* =====================================================
     Render
  ===================================================== */

  return (
    <div className="w-full">
      <AdminPageHeader
        title="Dashboard"
        subtitle="Live business overview across visitors, leads, orders and operations."
        breadcrumbs={[{ label: "Dashboard" }]}
      />

      {loading && (
        <div className="absolute inset-x-0 top-16 z-20 flex justify-center">
          <div className="inline-flex items-center rounded-full bg-slate-900 px-4 py-1.5 text-xs text-white shadow">
            <Activity className="mr-2 h-3 w-3 animate-spin text-emerald-400" />
            Loading dashboard…
          </div>
        </div>
      )}

      <div className="space-y-6 px-6 pb-10 pt-4">

        {/* Welcome */}
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
          </div>
        </section>

        {/* Primary KPIs */}
        <section className="grid gap-5 md:grid-cols-2 xl:grid-cols-4">
          <KPI
            title="Visitors Today"
            value={data?.visitors.today}
            sub={`Total ${data?.visitors.total}`}
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
            sub={`Latest ${
              data?.orders.latest[0]?.order_number || "—"
            }`}
            icon={<ShoppingBag className="h-5 w-5 text-indigo-600" />}
            accent="bg-indigo-100"
          />

          <KPI
            title="Users"
            value={data?.users.total}
            sub={`Active ${data?.users.active} • Admins ${data?.users.admins}`}
            icon={<Users className="h-5 w-5 text-slate-600" />}
          />
        </section>

        {/* Secondary KPIs */}
        <section className="grid gap-5 md:grid-cols-2 xl:grid-cols-4">
          <KPI
            title="Products"
            value={data?.products.total}
            sub={`Published ${data?.products.published}`}
            icon={<Package className="h-5 w-5 text-amber-600" />}
            accent="bg-amber-100"
          />
          <KPI
            title="Customers"
            value={data?.customers.total}
            sub={data?.customers.latest[0]?.name || "—"}
            icon={<CreditCard className="h-5 w-5 text-teal-600" />}
            accent="bg-teal-100"
          />
          <KPI
            title="Promo Codes"
            value={data?.promos.total}
            sub={`Active ${data?.promos.active}`}
            icon={<Tag className="h-5 w-5 text-fuchsia-600" />}
            accent="bg-fuchsia-100"
          />
          <KPI
            title="Notifications"
            value={data?.notifications.length}
            sub="Recent campaigns"
            icon={<Bell className="h-5 w-5 text-rose-600" />}
            accent="bg-rose-100"
          />
        </section>

        {/* Latest Orders */}
        <section className="rounded-2xl border bg-white p-5 shadow-sm">
          <Header title="Latest Orders" link="/orders" />
          {data?.orders.latest.map((o) => (
            <Row
              key={o.id}
              left={`#${o.order_number}`}
              right={currency(o.grand_total)}
              sub={`${o.customer_name || "Guest"} · ${date(o.placed_at)}`}
            />
          ))}
        </section>

        {/* Latest Leads */}
        <section className="rounded-2xl border bg-white p-5 shadow-sm">
          <Header title="Recent Leads" link="/leads" />
          {data?.leads.latest.map((l) => (
            <Row
              key={l.id}
              left={l.name}
              right={l.status}
              sub={`${l.email || ""} ${l.phone || ""}`}
            />
          ))}
        </section>

        {/* Error */}
        {error && (
          <div className="rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-xs text-rose-700">
            {error}
          </div>
        )}
      </div>
    </div>
  );
};

/* =====================================================
   Small blocks
===================================================== */

const Header = ({ title, link }: any) => (
  <div className="mb-3 flex justify-between">
    <h3 className="text-sm font-semibold text-slate-900">
      {title}
    </h3>
    <a
      href={link}
      className="inline-flex items-center gap-1 text-xs font-medium text-sky-600"
    >
      View all <ArrowUpRight className="h-3 w-3" />
    </a>
  </div>
);

const Row = ({ left, right, sub }: any) => (
  <div className="flex items-center justify-between rounded-lg border px-3 py-2 text-xs">
    <div>
      <div className="font-medium text-slate-900">{left}</div>
      <div className="text-[11px] text-slate-500">{sub}</div>
    </div>
    <div className="font-semibold text-slate-900">{right}</div>
  </div>
);

export default DashboardHome;
