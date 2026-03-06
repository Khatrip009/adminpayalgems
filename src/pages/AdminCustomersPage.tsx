// src/pages/AdminCustomersPage.tsx

import React, { useEffect, useMemo, useState } from "react";
import {
  Search,
  Filter,
  RefreshCw,
  Loader2,
  Users,
  Phone,
  Mail,
  Flag,
  Tag,
  CheckCircle2,
  AlertCircle,
  Edit2,
} from "lucide-react";
import { toast } from "react-hot-toast";

import { AdminPageHeader } from "@/components/admin/AdminPageHeader";
import { listCustomers, type Customer } from "@/api/masters/customers.api";
import CustomerPage from "@/pages/masters/customers/CustomerPage";

const PAGE_LIMIT = 20;

type PhoneVerifiedFilter = "" | "verified" | "unverified";

interface CustomersListParams {
  page?: number;
  limit?: number;
  q?: string;
}

const AdminCustomersPage: React.FC = () => {
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(false);

  const [q, setQ] = useState("");
  const [phoneFilter, setPhoneFilter] = useState<PhoneVerifiedFilter>("");

  // Modal state – now just holds selected customer ID
  const [modalOpen, setModalOpen] = useState(false);
  const [selectedCustomerId, setSelectedCustomerId] = useState<string | null>(
    null
  );

  const pageCount = useMemo(
    () => (total > 0 ? Math.ceil(total / PAGE_LIMIT) : 1),
    [total]
  );

  async function loadCustomers(opts?: CustomersListParams) {
    setLoading(true);
    try {
      const targetPage = opts?.page ?? page;
      const res = await listCustomers({
        page: targetPage,
        limit: PAGE_LIMIT,
        q,
      });
      setCustomers(res.customers || []);
      setTotal(res.total || 0);
      setPage(res.page || targetPage);
    } catch (err) {
      console.error("Failed to load customers", err);
      toast.error("Failed to load customers.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadCustomers({ page: 1 });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    loadCustomers({ page: 1 });
  };

  const filteredCustomers = useMemo(() => {
    return customers.filter((c) => {
      const search = q.trim().toLowerCase();
      if (search) {
        const haystack = [c.name, c.email, c.phone, c.company, c.country]
          .filter(Boolean)
          .join(" ")
          .toLowerCase();
        if (!haystack.includes(search)) return false;
      }

      if (phoneFilter === "verified" && !c.phone_verified) return false;
      if (phoneFilter === "unverified" && c.phone_verified) return false;

      return true;
    });
  }, [customers, q, phoneFilter]);

  const formatDate = (value?: string | null) => {
    if (!value) return "—";
    const d = new Date(value);
    if (Number.isNaN(d.getTime())) return "—";
    return d.toLocaleDateString();
  };

  const openEditModal = (c: Customer) => {
    setSelectedCustomerId(c.id);
    setModalOpen(true);
  };

  const resetModal = () => {
    setModalOpen(false);
    setSelectedCustomerId(null);
  };

  return (
    <div className="relative">
      <AdminPageHeader
        title="Customers"
        subtitle="View and manage Minal Gems customers, contact details and order history."
        breadcrumbs={[
          { label: "Dashboard", path: "/" },
          { label: "Customers" },
        ]}
        actions={
          <div className="flex items-center gap-2 text-xs text-slate-500 dark:text-slate-400">
            <AlertCircle size={14} />
            CRM-style profile, orders, analytics and addresses in one place.
          </div>
        }
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
                placeholder="Search customers by name, email, phone or company…"
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
            {/* Phone verified filter */}
            <select
              value={phoneFilter}
              onChange={(e) =>
                setPhoneFilter(e.target.value as PhoneVerifiedFilter)
              }
              className="rounded-full border border-slate-300 bg-white px-4 py-2.5 text-sm text-slate-800shadow-sm focus:border-sky-500 focus:ring-sky-300 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200"
            >
              <option value="">All phone status</option>
              <option value="verified">Phone verified only</option>
              <option value="unverified">Phone not verified</option>
            </select>

            <button
              onClick={() => loadCustomers({ page })}
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
                  <th className="px-6 py-4">Customer</th>
                  <th className="px-6 py-4">Contact</th>
                  <th className="px-6 py-4">Company / Country</th>
                  <th className="px-6 py-4">Tags</th>
                  <th className="px-6 py-4">Joined</th>
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
                ) : filteredCustomers.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="py-8 text-center text-lg">
                      No customers found
                    </td>
                  </tr>
                ) : (
                  filteredCustomers.map((c) => (
                    <tr
                      key={c.id}
                      className="border-t border-slate-200 hover:bg-slate-50 dark:border-slate-700 dark:hover:bg-slate-800"
                    >
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <span className="inline-flex h-9 w-9 items-center justify-center rounded-full bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-300">
                            <Users size={18} />
                          </span>
                          <div className="flex flex-col">
                            <span className="font-semibold">
                              {c.name || "—"}
                            </span>
                            <span className="text-xs text-slate-500">
                              ID: {c.id}
                            </span>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-sm">
                        <div className="flex flex-col gap-1">
                          <span className="flex items-center gap-1">
                            <Mail size={14} className="text-slate-400" />
                            {c.email || "—"}
                          </span>
                          <span className="flex items-center gap-1">
                            <Phone size={14} className="text-slate-400" />
                            {c.phone || "—"}
                            {c.phone && (
                              <span className="ml-2 inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-[11px] font-medium">
                                {c.phone_verified ? (
                                  <>
                                    <CheckCircle2
                                      size={11}
                                      className="text-emerald-500"
                                    />
                                    <span className="text-emerald-700 dark:text-emerald-300">
                                      Verified
                                    </span>
                                  </>
                                ) : (
                                  <>
                                    <AlertCircle
                                      size={11}
                                      className="text-amber-500"
                                    />
                                    <span className="text-amber-700 dark:text-amber-300">
                                      Not verified
                                    </span>
                                  </>
                                )}
                              </span>
                            )}
                          </span>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-sm">
                        <div className="flex flex-col gap-1">
                          <span>{c.company || "—"}</span>
                          <span className="flex items-center gap-1 text-xs text-slate-500">
                            <Flag size={12} />
                            {c.country || "—"}
                          </span>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-sm">
                        {c.tags && c.tags.length ? (
                          <div className="flex flex-wrap gap-1">
                            {c.tags.map((tagVal) => (
                              <span
                                key={tagVal}
                                className="inline-flex items-center gap-1 rounded-full bg-slate-100 px-2 py-0.5 text-[11px] font-medium text-slate-700 dark:bg-slate-800 dark:text-slate-200"
                              >
                                <Tag size={11} />
                                {tagVal}
                              </span>
                            ))}
                          </div>
                        ) : (
                          <span className="text-xs text-slate-400">—</span>
                        )}
                      </td>
                      <td className="px-6 py-4 text-sm">
                        {formatDate(c.created_at as any)}
                      </td>
                      <td className="px-6 py-4 text-right">
                        <button
                          onClick={() => openEditModal(c)}
                          className="inline-flex items-center gap-1 rounded-full border border-slate-300 px-3 py-1.5 text-sm hover:bg-slate-100 dark:border-slate-700 dark:hover:bg-slate-800"
                        >
                          <Edit2 size={14} /> View / Edit
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          <div className="flex items-center justify-between px-6 py-3 text-sm text-slate-600 dark:text-slate-400">
            <div>
              Page {page} of {pageCount} · {total} customers
              {filteredCustomers.length !== customers.length && (
                <span className="ml-2 text-xs text-slate-500">
                  (Filtered on this page: {filteredCustomers.length})
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
                  loadCustomers({ page: next });
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
                  loadCustomers({ page: next });
                }}
                className="rounded-full border border-slate-300 bg-white px-3 py-1.5 text-xs font-medium hover:bg-slate-50 disabled:opacity-50 dark:border-slate-700 dark:bg-slate-900"
              >
                Next
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* MODAL: CUSTOMER DETAIL (Profile / Orders / Addresses / Analytics) */}
      {modalOpen && selectedCustomerId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm">
          <CustomerPage customerId={selectedCustomerId} onClose={resetModal} />
        </div>
      )}
    </div>
  );
};

export default AdminCustomersPage;
