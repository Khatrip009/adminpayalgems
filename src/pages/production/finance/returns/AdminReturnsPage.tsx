// src/pages/AdminReturnsPage.tsx

import React, { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "react-hot-toast";
import {
  ArrowLeft,
  RefreshCw,
  Loader2,
  RotateCcw,
  Search,
  BadgeInfo,
} from "lucide-react";

import { AdminPageHeader } from "@/components/admin/AdminPageHeader";
import {
  listReturns,
  type ReturnRequest,
} from "@/api/finance/returns.api";

const RETURN_STATUS_COLORS: Record<string, string> = {
  requested:
    "border-amber-300 bg-amber-50 text-amber-700 dark:border-amber-700 dark:bg-amber-900/30 dark:text-amber-200",
  approved:
    "border-emerald-300 bg-emerald-50 text-emerald-700 dark:border-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-200",
  rejected:
    "border-rose-300 bg-rose-50 text-rose-700 dark:border-rose-700 dark:bg-rose-900/30 dark:text-rose-200",
  in_transit:
    "border-sky-300 bg-sky-50 text-sky-700 dark:border-sky-700 dark:bg-sky-900/30 dark:text-sky-200",
  received:
    "border-indigo-300 bg-indigo-50 text-indigo-700 dark:border-indigo-700 dark:bg-indigo-900/30 dark:text-indigo-200",
  completed:
    "border-emerald-300 bg-emerald-50 text-emerald-700 dark:border-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-200",
};

const AdminReturnsPage: React.FC = () => {
  const navigate = useNavigate();
  const [items, setItems] = useState<ReturnRequest[]>([]);
  const [loading, setLoading] = useState(false);
  const [q, setQ] = useState("");

  async function load() {
    setLoading(true);
    try {
      const res = await listReturns();
      setItems(res.returns || []);
    } catch (err) {
      console.error("Failed to load returns", err);
      toast.error("Failed to load returns");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
  }, []);

  const filtered = useMemo(() => {
    const search = q.trim().toLowerCase();
    if (!search) return items;
    return items.filter((r) => {
      const h = [
        r.id,
        r.order_number,
        r.type,
        r.reason_code,
        r.status,
      ]
        .filter(Boolean)
        .join(" ")
        .toLowerCase();
      return h.includes(search);
    });
  }, [items, q]);

  return (
    <div className="relative">
      <AdminPageHeader
        title="Returns & Replacements"
        subtitle="Handle jewellery returns, exchanges and repair requests."
        breadcrumbs={[
          { label: "Dashboard", path: "/" },
          { label: "Returns" },
        ]}
      />

      <div className="px-6 pt-4 pb-10 space-y-6">
        {/* Top bar */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3">
          <div className="relative w-full md:w-1/2">
            <Search
              className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500"
              size={18}
            />
            <input
              type="text"
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder="Search returns by order, id, reason…"
              className="w-full rounded-full border border-slate-300 bg-white py-3 pl-10 pr-3 text-sm text-slate-900 shadow-sm dark:border-slate-700 dark:bg-slate-900 dark:text-slate-50"
            />
          </div>

          <button
            onClick={load}
            disabled={loading}
            className="inline-flex items-center gap-2 rounded-full border border-slate-300 bg-white px-4 py-2.5 text-sm font-medium text-slate-800 shadow-sm hover:bg-slate-50 disabled:opacity-60 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100"
          >
            {loading ? <Loader2 className="animate-spin" size={16} /> : <RefreshCw size={16} />}
            Refresh
          </button>
        </div>

        {/* Table */}
        <div className="overflow-hidden rounded-2xl border border-slate-300 bg-white shadow-sm dark:border-slate-700 dark:bg-slate-900">
          <div className="overflow-x-auto">
            <table className="min-w-full text-left text-sm text-slate-800 dark:text-slate-100">
              <thead className="bg-slate-100 text-xs uppercase tracking-wide text-slate-600 dark:bg-slate-800 dark:text-slate-400">
                <tr>
                  <th className="px-6 py-3">Return</th>
                  <th className="px-6 py-3">Order</th>
                  <th className="px-6 py-3">Type</th>
                  <th className="px-6 py-3">Reason</th>
                  <th className="px-6 py-3">Status</th>
                  <th className="px-6 py-3">Created</th>
                  <th className="px-6 py-3 text-right">Action</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr>
                    <td colSpan={7} className="py-8 text-center text-lg">
                      <Loader2 className="mx-auto animate-spin" />
                      Loading@.
                    </td>
                  </tr>
                ) : filtered.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="py-8 text-center text-lg">
                      No return requests found.
                    </td>
                  </tr>
                ) : (
                  filtered.map((r) => (
                    <tr
                      key={r.id}
                      className="border-t border-slate-200 hover:bg-slate-50 dark:border-slate-700 dark:hover:bg-slate-800"
                    >
                      <td className="px-6 py-3 text-xs">
                        <div className="font-semibold text-sm">
                          #{r.id.slice(0, 8)}
                        </div>
                      </td>
                      <td className="px-6 py-3 text-xs">
                        {r.order_number ? `#${r.order_number}` : "—"}
                      </td>
                      <td className="px-6 py-3 text-xs capitalize">
                        {r.type}
                      </td>
                      <td className="px-6 py-3 text-xs">
                        {r.reason_code}
                      </td>
                      <td className="px-6 py-3">
                        <span
                          className={
                            "inline-flex items-center gap-1 rounded-full border px-3 py-1 text-xs font-medium " +
                            (RETURN_STATUS_COLORS[r.status] ||
                              "border-slate-300 bg-slate-100 text-slate-700 dark:border-slate-600 dark:bg-slate-900 dark:text-slate-200")
                          }
                        >
                          <BadgeInfo size={12} />
                          {r.status}
                        </span>
                      </td>
                      <td className="px-6 py-3 text-xs">
                        {new Date(r.created_at).toLocaleString()}
                      </td>
                      <td className="px-6 py-3 text-right">
                        <button
                          onClick={() => navigate(`/returns/${r.id}`)}
                          className="inline-flex items-center gap-1 rounded-full border border-slate-300 px-3 py-1.5 text-xs hover:bg-slate-100 dark:border-slate-700 dark:hover:bg-slate-800"
                        >
                          Details
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminReturnsPage;

