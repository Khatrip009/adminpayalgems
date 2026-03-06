// src/pages/AdminInvoicesPage.tsx

import React, { useEffect, useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  FileText,
  Search,
  RefreshCcw,
  ArrowRight,
  Loader2,
  CreditCard,
} from "lucide-react";

import { AdminPageHeader } from "@/components/admin/AdminPageHeader";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/Button";

import { getAllInvoices, type Invoice } from "@/api/inventory/payments.api";

const money = (a: number, c = "INR") =>
  `${c} ${Number(a || 0).toLocaleString()}`;

const dt = (v?: string | null) => {
  if (!v) return "—";
  const d = new Date(v);
  if (Number.isNaN(d.getTime())) return "—";
  return d.toLocaleString();
};

const AdminInvoicesPage: React.FC = () => {
  const navigate = useNavigate();

  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [refreshing, setRefreshing] = useState(false);

  async function load() {
    try {
      setLoading(true);
      const res = await getAllInvoices();
      if (res.ok && Array.isArray(res.invoices)) {
        setInvoices(res.invoices);
      }
    } catch (err) {
      console.error("Failed to load invoices", err);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
  }, []);

  async function handleRefresh() {
    setRefreshing(true);
    await load();
    setRefreshing(false);
  }

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return invoices.filter((inv: any) => {
      const st = (inv.status || "").toLowerCase();
      const invNo = (inv.invoice_number || "").toLowerCase();
      const orderNo = (inv.order_number || "").toLowerCase();
      const customerName = (inv.customer_name || "").toLowerCase();

      if (statusFilter !== "all" && st !== statusFilter) return false;

      if (!q) return true;
      return (
        invNo.includes(q) ||
        orderNo.includes(q) ||
        customerName.includes(q) ||
        (inv.id || "").toString().toLowerCase().includes(q)
      );
    });
  }, [invoices, search, statusFilter]);

  return (
    <div className="space-y-6 p-6">
      <AdminPageHeader
        title="Invoices"
        subtitle="All generated invoices with totals, payment links and status."
        breadcrumbs={[
          { label: "Dashboard", path: "/" },
          { label: "Payments", path: "/payments" },
          { label: "Invoices", path: "/invoices" },
        ]}
        right={
          <Button
            variant="outline"
            className="inline-flex items-center gap-2"
            onClick={handleRefresh}
            disabled={refreshing}
          >
            {refreshing ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <RefreshCcw className="h-4 w-4" />
            )}
            Refresh
          </Button>
        }
      />

      {/* Filters */}
      <Card>
        <CardContent className="flex flex-col gap-3 pt-4 md:flex-row md:items-center md:justify-between">
          <div className="flex flex-1 items-center gap-2">
            <div className="relative w-full max-w-md">
              <Search className="pointer-events-none absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search by invoice no, order no, customer..."
                className="w-full rounded-full border border-slate-200 bg-white py-2 pl-9 pr-4 text-sm outline-none ring-0 focus:border-sky-500 focus:ring-2 focus:ring-sky-100 dark:border-slate-700 dark:bg-slate-900"
              />
            </div>
          </div>

          <div className="flex items-center gap-2">
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="rounded-full border border-slate-200 bg-white px-3 py-1.5 text-sm dark:border-slate-700 dark:bg-slate-900"
            >
              <option value="all">All statuses</option>
              <option value="issued">Issued</option>
              <option value="paid">Paid</option>
              <option value="cancelled">Cancelled</option>
            </select>
          </div>
        </CardContent>
      </Card>

      {/* Table */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <div className="flex items-center gap-2">
            <FileText className="text-sky-500" />
            <CardTitle>Invoice List</CardTitle>
          </div>
          <div className="flex items-center gap-2 text-xs text-slate-500">
            <CreditCard className="h-3 w-3" />
            <span>{filtered.length} invoice(s)</span>
          </div>
        </CardHeader>

        <CardContent className="overflow-x-auto">
          {loading ? (
            <div className="flex h-40 items-center justify-center">
              <Loader2 className="h-6 w-6 animate-spin text-slate-400" />
            </div>
          ) : filtered.length === 0 ? (
            <div className="py-10 text-center text-sm text-slate-500">
              No invoices found.
            </div>
          ) : (
            <table className="min-w-full text-left text-sm text-slate-800 dark:text-slate-100">
              <thead className="bg-slate-100 text-xs uppercase tracking-wide text-slate-600 dark:bg-slate-800 dark:text-slate-400">
                <tr>
                  <th className="px-4 py-3">Invoice</th>
                  <th className="px-4 py-3">Order</th>
                  <th className="px-4 py-3">Date</th>
                  <th className="px-4 py-3">Status</th>
                  <th className="px-4 py-3 text-right">Total</th>
                  <th className="px-4 py-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((inv: any) => (
                  <tr
                    key={inv.id}
                    className="border-t border-slate-200/80 hover:bg-slate-50 dark:border-slate-700 dark:hover:bg-slate-800"
                  >
                    <td className="px-4 py-3">
                      <div className="flex flex-col">
                        <span className="font-medium">
                          {inv.invoice_number || inv.id?.slice(0, 8)}
                        </span>
                        <span className="text-xs text-slate-500">
                          {inv.id}
                        </span>
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      {inv.order_number ? (
                        <button
                          type="button"
                          onClick={() =>
                            navigate(`/orders/${inv.order_id}`)
                          }
                          className="text-xs font-medium text-sky-600 hover:underline"
                        >
                          #{inv.order_number}
                        </button>
                      ) : (
                        <span className="text-xs text-slate-400">—</span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-xs">
                      {dt(inv.invoice_date || inv.created_at)}
                    </td>
                    <td className="px-4 py-3 text-xs">
                      <span className="inline-flex rounded-full border border-slate-300 px-2 py-0.5 text-[11px] font-medium capitalize dark:border-slate-600">
                        {inv.status || "issued"}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-right text-sm font-semibold">
                      {money(
                        Number(inv.grand_total || 0),
                        (inv as any).currency || "INR"
                      )}
                    </td>
                    <td className="px-4 py-3 text-right">
                      <Link
                        to={`/invoices/${inv.id}`}
                        className="inline-flex items-center gap-1 text-xs font-medium text-sky-600 hover:underline"
                      >
                        View <ArrowRight className="h-3 w-3" />
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default AdminInvoicesPage;
