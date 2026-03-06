// src/pages/AdminPromoCodesPage.tsx

import React, { useEffect, useMemo, useState } from "react";
import {
  Search,
  Filter,
  RefreshCw,
  Loader2,
  Percent,
  Gift,
  Tag,
  CheckCircle2,
  Ban,
  Plus,
  Edit2,
} from "lucide-react";
import { toast } from "react-hot-toast";

import { AdminPageHeader } from "@/components/admin/AdminPageHeader";
import {
  listPromoCodes,
  createPromoCode,
  updatePromoCode,
  togglePromoCode,
  type PromoCode,
  type PromoType,
} from "@/api/sales/promo.api";

const PAGE_LIMIT = 20;

const PROMO_TYPE_LABELS: Record<PromoType, string> = {
  fixed: "Fixed amount",
  percent: "Percentage",
  free_shipping: "Free shipping",
};

interface PromoFormState {
  id?: string;
  code: string;
  description: string;
  type: PromoType;
  value: number;
  max_uses: number | "";
  max_uses_per_user: number | "";
  min_order_value: number | "";
  valid_from: string;
  valid_to: string;
  is_active: boolean;
}

const blankPromoForm: PromoFormState = {
  code: "",
  description: "",
  type: "percent",
  value: 10,
  max_uses: "",
  max_uses_per_user: "",
  min_order_value: "",
  valid_from: "",
  valid_to: "",
  is_active: true,
};

const AdminPromoCodesPage: React.FC = () => {
  const [promos, setPromos] = useState<PromoCode[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(false);

  const [q, setQ] = useState("");
  const [statusFilter, setStatusFilter] = useState<"" | "active" | "inactive">(
    ""
  );
  const [typeFilter, setTypeFilter] = useState<"" | PromoType>("");

  const [modalOpen, setModalOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState<PromoFormState>(blankPromoForm);

  const pageCount = useMemo(
    () => (total > 0 ? Math.ceil(total / PAGE_LIMIT) : 1),
    [total]
  );

  async function loadPromos(targetPage: number = 1) {
    setLoading(true);
    try {
      const res = await listPromoCodes({
        page: targetPage,
        limit: PAGE_LIMIT,
        q,
      });
      setPromos(res.promos || []);
      setTotal(res.total || 0);
      setPage(res.page || targetPage);
    } catch (err) {
      console.error("Failed to load promo codes", err);
      toast.error("Failed to load promo codes.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadPromos(1);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    loadPromos(1);
  };

  const filteredPromos = useMemo(() => {
    return promos.filter((p) => {
      const search = q.trim().toLowerCase();
      if (search) {
        const haystack = [
          p.code,
          p.description,
          p.type,
        ]
          .filter(Boolean)
          .join(" ")
          .toLowerCase();
        if (!haystack.includes(search)) return false;
      }

      if (statusFilter === "active" && !p.is_active) return false;
      if (statusFilter === "inactive" && p.is_active) return false;

      if (typeFilter && p.type !== typeFilter) return false;

      return true;
    });
  }, [promos, q, statusFilter, typeFilter]);

  const formatMoneyValue = (p: PromoCode) => {
    if (p.type === "percent") {
      return `${p.value}%`;
    }
    if (p.type === "fixed") {
      return `₹${Number(p.value).toLocaleString()}`;
    }
    return "—";
  };

  const formatDate = (value?: string | null) => {
    if (!value) return "—";
    const d = new Date(value);
    if (Number.isNaN(d.getTime())) return "—";
    return d.toLocaleDateString();
  };

  const openCreateModal = () => {
    setForm(blankPromoForm);
    setModalOpen(true);
  };

  const openEditModal = (promo: PromoCode) => {
    setForm({
      id: promo.id,
      code: promo.code,
      description: promo.description || "",
      type: promo.type,
      value: Number(promo.value),
      max_uses:
        promo.max_uses == null ? "" : Number(promo.max_uses),
      max_uses_per_user:
        promo.max_uses_per_user == null
          ? ""
          : Number(promo.max_uses_per_user),
      min_order_value:
        promo.min_order_value == null
          ? ""
          : Number(promo.min_order_value),
      valid_from: promo.valid_from || "",
      valid_to: promo.valid_to || "",
      is_active: promo.is_active,
    });
    setModalOpen(true);
  };

  const handleToggleActive = async (promo: PromoCode) => {
    try {
      const res = await togglePromoCode(promo.id, !promo.is_active);
      setPromos((prev) =>
        prev.map((x) => (x.id === promo.id ? res.promo : x))
      );
      toast.success(
        res.promo.is_active
          ? "Promo activated."
          : "Promo deactivated."
      );
    } catch (err) {
      console.error("Failed to toggle promo code", err);
      toast.error("Failed to update promo status.");
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.code.trim()) {
      toast.error("Promo code is required.");
      return;
    }

    setSaving(true);
    try {
      const payload = {
        code: form.code.trim().toUpperCase(),
        description: form.description || undefined,
        type: form.type,
        value: Number(form.value || 0),
        max_uses:
          form.max_uses === "" ? null : Number(form.max_uses),
        max_uses_per_user:
          form.max_uses_per_user === ""
            ? null
            : Number(form.max_uses_per_user),
        min_order_value:
          form.min_order_value === ""
            ? null
            : Number(form.min_order_value),
        valid_from: form.valid_from || null,
        valid_to: form.valid_to || null,
        is_active: form.is_active,
      };

      if (form.id) {
        const res = await updatePromoCode(form.id, payload);
        setPromos((prev) =>
          prev.map((p) => (p.id === form.id ? res.promo : p))
        );
        toast.success("Promo code updated.");
      } else {
        const res = await createPromoCode(payload);
        setPromos((prev) => [res.promo, ...prev]);
        setTotal((t) => t + 1);
        toast.success("Promo code created.");
      }

      setModalOpen(false);
      setForm(blankPromoForm);
    } catch (err: any) {
      console.error("Failed to save promo code", err);
      if (err?.error === "code_already_exists") {
        toast.error("Promo code already exists.");
      } else {
        toast.error("Failed to save promo code.");
      }
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="relative">
      <AdminPageHeader
        title="Promo Codes"
        subtitle="Manage discount codes and promotions for Minal Gems."
        breadcrumbs={[
          { label: "Dashboard", path: "/" },
          { label: "Promo Codes" },
        ]}
        actions={
          <button
            onClick={openCreateModal}
            className="flex items-center gap-2 rounded-full bg-gradient-to-r from-emerald-500 via-teal-500 to-sky-500 px-5 py-2.5 text-sm font-semibold text-white shadow-md hover:brightness-110"
          >
            <Plus size={16} /> New Promo
          </button>
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
                placeholder="Search by code or description…"
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
              onChange={(e) =>
                setStatusFilter(e.target.value as any)
              }
              className="rounded-full border border-slate-300 bg-white px-4 py-2.5 text-sm text-slate-800 shadow-sm focus:border-sky-500 focus:ring-sky-300 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200"
            >
              <option value="">All status</option>
              <option value="active">Active only</option>
              <option value="inactive">Inactive only</option>
            </select>

            {/* Type filter */}
            <select
              value={typeFilter}
              onChange={(e) =>
                setTypeFilter(
                  e.target.value
                    ? (e.target.value as PromoType)
                    : ""
                )
              }
              className="rounded-full border border-slate-300 bg-white px-4 py-2.5 text-sm text-slate-800 shadow-sm focus:border-sky-500 focus:ring-sky-300 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200"
            >
              <option value="">All types</option>
              <option value="percent">Percentage</option>
              <option value="fixed">Fixed amount</option>
              <option value="free_shipping">Free shipping</option>
            </select>

            <button
              onClick={() => loadPromos(page)}
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
                  <th className="px-6 py-4">Code</th>
                  <th className="px-6 py-4">Details</th>
                  <th className="px-6 py-4">Limits</th>
                  <th className="px-6 py-4">Validity</th>
                  <th className="px-6 py-4">Status</th>
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
                ) : filteredPromos.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="py-8 text-center text-lg">
                      No promo codes found
                    </td>
                  </tr>
                ) : (
                  filteredPromos.map((p) => (
                    <tr
                      key={p.id}
                      className="border-t border-slate-200 hover:bg-slate-50 dark:border-slate-700 dark:hover:bg-slate-800"
                    >
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-2">
                          <span className="inline-flex h-8 w-8 items-center justify-center rounded-full bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-300">
                            <Gift size={16} />
                          </span>
                          <div className="flex flex-col">
                            <span className="font-semibold tracking-wide">
                              {p.code}
                            </span>
                            <span className="text-xs text-slate-500">
                              {PROMO_TYPE_LABELS[p.type]}
                            </span>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-sm">
                        <div className="flex flex-col gap-1">
                          <span className="font-medium">
                            {formatMoneyValue(p)}
                          </span>
                          {p.description && (
                            <span className="text-xs text-slate-500 line-clamp-2">
                              {p.description}
                            </span>
                          )}
                        </div>
                      </td>
                      <td className="px-6 py-4 text-sm">
                        <div className="flex flex-col gap-1 text-xs">
                          <span>
                            <Tag className="inline mr-1" size={12} />
                            Min order:{" "}
                            {p.min_order_value != null
                              ? `₹${Number(
                                  p.min_order_value
                                ).toLocaleString()}`
                              : "—"}
                          </span>
                          <span>
                            Global uses:{" "}
                            {p.max_uses != null
                              ? `${p.used_count}/${p.max_uses}`
                              : `${p.used_count} used`}
                          </span>
                          <span>
                            Per user:{" "}
                            {p.max_uses_per_user != null
                              ? `${p.max_uses_per_user}`
                              : "Unlimited"}
                          </span>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-sm">
                        <div className="flex flex-col gap-1 text-xs">
                          <span>
                            From: {formatDate(p.valid_from)}
                          </span>
                          <span>To: {formatDate(p.valid_to)}</span>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <button
                          onClick={() => handleToggleActive(p)}
                          className={`inline-flex items-center gap-1 rounded-full px-3 py-1 text-xs font-medium ${
                            p.is_active
                              ? "border-emerald-300 bg-emerald-50 text-emerald-700 dark:border-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-200"
                              : "border-slate-300 bg-slate-100 text-slate-600 dark:border-slate-600 dark:bg-slate-900 dark:text-slate-300"
                          }`}
                        >
                          {p.is_active ? (
                            <>
                              <CheckCircle2 size={14} /> Active
                            </>
                          ) : (
                            <>
                              <Ban size={14} /> Inactive
                            </>
                          )}
                        </button>
                      </td>
                      <td className="px-6 py-4 text-right">
                        <button
                          onClick={() => openEditModal(p)}
                          className="inline-flex items-center gap-1 rounded-full border border-slate-300 px-3 py-1.5 text-sm hover:bg-slate-100 dark:border-slate-700 dark:hover:bg-slate-800"
                        >
                          <Edit2 size={14} /> Edit
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
              Page {page} of {pageCount} · {total} promo codes
              {filteredPromos.length !== promos.length && (
                <span className="ml-2 text-xs text-slate-500">
                  (Filtered on this page: {filteredPromos.length})
                </span>
              )}
            </div>
            <div className="space-x-2">
              <button
                disabled={page <= 1 || loading}
                onClick={() => {
                  if (page <= 1) return;
                  const next = page - 1;
                  loadPromos(next);
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
                  loadPromos(next);
                }}
                className="rounded-full border border-slate-300 bg-white px-3 py-1.5 text-xs font-medium hover:bg-slate-50 disabled:opacity-50 dark:border-slate-700 dark:bg-slate-900"
              >
                Next
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* MODAL: CREATE / EDIT PROMO */}
      {modalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm">
          <div className="w-full max-w-2xl rounded-2xl border border-slate-300 bg-white p-6 shadow-xl dark:border-slate-700 dark:bg-slate-950">
            {/* HEADER */}
            <div className="mb-6 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Gift className="h-8 w-8 text-emerald-500" />
                <div>
                  <h2 className="text-xl font-semibold text-slate-900 dark:text-white">
                    {form.id ? "Edit Promo Code" : "Create Promo Code"}
                  </h2>
                  <p className="text-sm text-slate-500 dark:text-slate-400">
                    Configure discounts and usage limits for this promotion.
                  </p>
                </div>
              </div>
              <button
                onClick={() => setModalOpen(false)}
                className="rounded-full border border-slate-300 px-3 py-1 text-sm hover:bg-slate-100 dark:border-slate-700 dark:hover:bg-slate-800"
              >
                Close
              </button>
            </div>

            {/* FORM */}
            <form onSubmit={handleSubmit} className="space-y-4 text-sm">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="mb-1 block text-xs font-medium">
                    Promo Code *
                  </label>
                  <input
                    value={form.code}
                    onChange={(e) =>
                      setForm((f) => ({
                        ...f,
                        code: e.target.value.toUpperCase(),
                      }))
                    }
                    placeholder="WELCOME10"
                    className="w-full rounded-lg border border-slate-300 bg-slate-50 px-3 py-2 text-sm dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100"
                    required
                  />
                </div>
                <div>
                  <label className="mb-1 block text-xs font-medium">
                    Type *
                  </label>
                  <select
                    value={form.type}
                    onChange={(e) =>
                      setForm((f) => ({
                        ...f,
                        type: e.target.value as PromoType,
                      }))
                    }
                    className="w-full rounded-lg border border-slate-300 bg-slate-50 px-3 py-2 text-sm dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100"
                  >
                    <option value="percent">Percentage</option>
                    <option value="fixed">Fixed amount</option>
                    <option value="free_shipping">Free shipping</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-3 gap-4">
                <div>
                  <label className="mb-1 block text-xs font-medium">
                    Value {form.type === "percent" ? "(%)" : ""}
                  </label>
                  <div className="relative">
                    <Percent
                      size={14}
                      className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-slate-400"
                    />
                    <input
                      type="number"
                      min={0}
                      value={form.value}
                      onChange={(e) =>
                        setForm((f) => ({
                          ...f,
                          value: Number(e.target.value || 0),
                        }))
                      }
                      disabled={form.type === "free_shipping"}
                      className="w-full rounded-lg border border-slate-300 bg-slate-50 px-3 py-2 pr-8 text-sm dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100 disabled:bg-slate-100 dark:disabled:bg-slate-800"
                    />
                  </div>
                </div>
                <div>
                  <label className="mb-1 block text-xs font-medium">
                    Min Order Value (₹)
                  </label>
                  <input
                    type="number"
                    min={0}
                    value={form.min_order_value}
                    onChange={(e) =>
                      setForm((f) => ({
                        ...f,
                        min_order_value: e.target.value
                          ? Number(e.target.value)
                          : "",
                      }))
                    }
                    className="w-full rounded-lg border border-slate-300 bg-slate-50 px-3 py-2 text-sm dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100"
                  />
                </div>
                <div className="flex items-center gap-2 pt-5">
                  <input
                    id="promo_is_active"
                    type="checkbox"
                    checked={form.is_active}
                    onChange={(e) =>
                      setForm((f) => ({
                        ...f,
                        is_active: e.target.checked,
                      }))
                    }
                    className="h-4 w-4 rounded border-slate-300 text-emerald-600 focus:ring-emerald-500 dark:border-slate-600"
                  />
                  <label
                    htmlFor="promo_is_active"
                    className="text-xs text-slate-700 dark:text-slate-200"
                  >
                    Active
                  </label>
                </div>
              </div>

              <div className="grid grid-cols-3 gap-4">
                <div>
                  <label className="mb-1 block text-xs font-medium">
                    Max Global Uses
                  </label>
                  <input
                    type="number"
                    min={0}
                    value={form.max_uses}
                    onChange={(e) =>
                      setForm((f) => ({
                        ...f,
                        max_uses: e.target.value
                          ? Number(e.target.value)
                          : "",
                      }))
                    }
                    className="w-full rounded-lg border border-slate-300 bg-slate-50 px-3 py-2 text-sm dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100"
                  />
                </div>
                <div>
                  <label className="mb-1 block text-xs font-medium">
                    Max Uses Per User
                  </label>
                  <input
                    type="number"
                    min={0}
                    value={form.max_uses_per_user}
                    onChange={(e) =>
                      setForm((f) => ({
                        ...f,
                        max_uses_per_user: e.target.value
                          ? Number(e.target.value)
                          : "",
                      }))
                    }
                    className="w-full rounded-lg border border-slate-300 bg-slate-50 px-3 py-2 text-sm dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100"
                  />
                </div>
                <div>
                  <label className="mb-1 block text-xs font-medium">
                    Valid From (ISO / any parsable)
                  </label>
                  <input
                    type="text"
                    placeholder="optional"
                    value={form.valid_from}
                    onChange={(e) =>
                      setForm((f) => ({
                        ...f,
                        valid_from: e.target.value,
                      }))
                    }
                    className="w-full rounded-lg border border-slate-300 bg-slate-50 px-3 py-2 text-xs dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100"
                  />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-4">
                <div>
                  <label className="mb-1 block text-xs font-medium">
                    Valid To (ISO / any parsable)
                  </label>
                  <input
                    type="text"
                    placeholder="optional"
                    value={form.valid_to}
                    onChange={(e) =>
                      setForm((f) => ({
                        ...f,
                        valid_to: e.target.value,
                      }))
                    }
                    className="w-full rounded-lg border border-slate-300 bg-slate-50 px-3 py-2 text-xs dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100"
                  />
                </div>
                <div className="col-span-2">
                  <label className="mb-1 block text-xs font-medium">
                    Description
                  </label>
                  <textarea
                    rows={2}
                    value={form.description}
                    onChange={(e) =>
                      setForm((f) => ({
                        ...f,
                        description: e.target.value,
                      }))
                    }
                    className="w-full rounded-lg border border-slate-300 bg-slate-50 px-3 py-2 text-sm dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100"
                  />
                </div>
              </div>

              <div className="flex items-center justify-between pt-3">
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  Percentage promos use value as %, fixed promos use
                  value as currency.
                </p>
                <div className="flex items-center gap-3">
                  <button
                    type="button"
                    onClick={() => setModalOpen(false)}
                    className="rounded-full border border-slate-300 bg-white px-5 py-2 text-xs font-medium hover:bg-slate-100 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={saving}
                    className="inline-flex items-center gap-2 rounded-full bg-slate-900 px-5 py-2 text-xs font-semibold text-white hover:bg-slate-800 disabled:opacity-60 dark:bg-slate-100 dark:text-slate-900"
                  >
                    {saving ? (
                      <Loader2 className="animate-spin" size={14} />
                    ) : form.id ? (
                      <>
                        <Edit2 size={14} /> Save Changes
                      </>
                    ) : (
                      <>
                        <Plus size={14} /> Create Promo
                      </>
                    )}
                  </button>
                </div>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminPromoCodesPage;
