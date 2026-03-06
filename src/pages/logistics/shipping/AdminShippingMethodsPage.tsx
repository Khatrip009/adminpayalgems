// src/pages/AdminShippingMethodsPage.tsx

import React, { useEffect, useMemo, useState } from "react";
import {
  Truck,
  Search,
  Filter,
  RefreshCw,
  Loader2,
  Plus,
  Edit2,
  Trash2,
  CheckCircle2,
  Ban,
  Settings2,
} from "lucide-react";
import { toast } from "react-hot-toast";

import { AdminPageHeader } from "@/components/admin/AdminPageHeader";
import {
  listShippingMethods,
  createShippingMethod,
  updateShippingMethod,
  deleteShippingMethod,
  type ShippingMethod,
} from "@/api/logistics/shipments.api";

interface MethodFormState {
  id?: string;
  code: string;
  name: string;
  description: string;
  base_rate: number;
  is_active: boolean;
  // we still keep this internally as a string, but UI is table-based
  rate_config: string;
}

const blankMethodForm: MethodFormState = {
  code: "",
  name: "",
  description: "",
  base_rate: 0,
  is_active: true,
  rate_config: "",
};

const PAGE_LIMIT = 20;

type StatusFilter = "" | "active" | "inactive";
type PricingMode = "none" | "tiers" | "free_over";

interface TierRow {
  id: number;
  maxTotal: string; // string for easy input binding
  rate: string;
}

const formatMoney = (amount: number) =>
  `₹${Number(amount || 0).toLocaleString()}`;

const formatDate = (value?: string | null) => {
  if (!value) return "—";
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return "—";
  return d.toLocaleDateString();
};

// Try to interpret rate_config to show a friendly summary in the table
const getConfigSummaryLabel = (rateConfig: any): string => {
  if (!rateConfig) return "Flat base rate only";

  try {
    if (Array.isArray(rateConfig.tiers) && rateConfig.tiers.length > 0) {
      return "Tiered by order total";
    }
    if (rateConfig.freeOverAmount) {
      return `Free over ${formatMoney(rateConfig.freeOverAmount)}`;
    }
    return "Custom advanced config";
  } catch {
    return "Custom advanced config";
  }
};

const AdminShippingMethodsPage: React.FC = () => {
  const [methods, setMethods] = useState<ShippingMethod[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(false);

  const [q, setQ] = useState("");
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("");

  const [modalOpen, setModalOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState<MethodFormState>(blankMethodForm);

  // Advanced pricing UI state
  const [pricingMode, setPricingMode] = useState<PricingMode>("none");
  const [tierRows, setTierRows] = useState<TierRow[]>([]);
  const [freeOverAmount, setFreeOverAmount] = useState<string>("");
  const [freeFallbackRate, setFreeFallbackRate] = useState<string>("");

  const pageCount = useMemo(
    () => (total > 0 ? Math.ceil(total / PAGE_LIMIT) : 1),
    [total]
  );

  async function loadMethods(targetPage: number = 1) {
    setLoading(true);
    try {
      const res = await listShippingMethods({
        page: targetPage,
        limit: PAGE_LIMIT,
        q,
      });
      setMethods(res.methods || []);
      setTotal(res.total || 0);
      setPage(res.page || targetPage);
    } catch (err) {
      console.error("Failed to load shipping methods", err);
      toast.error("Failed to load shipping methods.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadMethods(1);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    loadMethods(1);
  };

  const filteredMethods = useMemo(() => {
    return methods.filter((m) => {
      const search = q.trim().toLowerCase();
      if (search) {
        const haystack = [m.code, m.name, m.description]
          .filter(Boolean)
          .join(" ")
          .toLowerCase();
        if (!haystack.includes(search)) return false;
      }

      if (statusFilter === "active" && !m.is_active) return false;
      if (statusFilter === "inactive" && m.is_active) return false;

      return true;
    });
  }, [methods, q, statusFilter]);

  const resetAdvancedPricingState = () => {
    setPricingMode("none");
    setTierRows([]);
    setFreeOverAmount("");
    setFreeFallbackRate("");
  };

  const openCreateModal = () => {
    setForm(blankMethodForm);
    resetAdvancedPricingState();
    setModalOpen(true);
  };

  const openEditModal = (m: ShippingMethod) => {
    setForm({
      id: m.id,
      code: m.code,
      name: m.name,
      description: m.description || "",
      base_rate: Number(m.base_rate || 0),
      is_active: m.is_active,
      rate_config: m.rate_config ? JSON.stringify(m.rate_config, null, 2) : "",
    });

    resetAdvancedPricingState();

    const cfg: any = m.rate_config || null;
    if (cfg && Array.isArray(cfg.tiers)) {
      setPricingMode("tiers");
      setTierRows(
        cfg.tiers.map((t: any, idx: number) => ({
          id: Date.now() + idx,
          maxTotal:
            t.maxTotal === null || t.maxTotal === undefined
              ? ""
              : String(t.maxTotal),
          rate: t.rate !== undefined ? String(t.rate) : "",
        }))
      );
    } else if (cfg && (cfg.freeOverAmount || cfg.freeOverAmount === 0)) {
      setPricingMode("free_over");
      setFreeOverAmount(
        cfg.freeOverAmount !== null && cfg.freeOverAmount !== undefined
          ? String(cfg.freeOverAmount)
          : ""
      );
      setFreeFallbackRate(
        cfg.fallbackRate !== undefined ? String(cfg.fallbackRate) : ""
      );
    } else {
      setPricingMode("none");
    }

    setModalOpen(true);
  };

  const handleDelete = async (m: ShippingMethod) => {
    if (!window.confirm(`Delete shipping method "${m.name}"?`)) return;
    try {
      await deleteShippingMethod(m.id);
      setMethods((prev) => prev.filter((x) => x.id !== m.id));
      setTotal((t) => Math.max(0, t - 1));
      toast.success("Shipping method deleted.");
    } catch (err) {
      console.error("Failed to delete shipping method", err);
      toast.error("Failed to delete shipping method.");
    }
  };

  const handleToggleActive = async (m: ShippingMethod) => {
    try {
      const res = await updateShippingMethod(m.id, {
        is_active: !m.is_active,
      });
      setMethods((prev) =>
        prev.map((x) => (x.id === m.id ? res.method : x))
      );
      toast.success(
        res.method.is_active
          ? "Shipping method activated."
          : "Shipping method deactivated."
      );
    } catch (err) {
      console.error("Failed to toggle shipping method", err);
      toast.error("Failed to update shipping method.");
    }
  };

  const addTierRow = () => {
    setTierRows((prev) => [
      ...prev,
      { id: Date.now(), maxTotal: "", rate: "" },
    ]);
  };

  const updateTierRow = (
    id: number,
    field: "maxTotal" | "rate",
    value: string
  ) => {
    setTierRows((prev) =>
      prev.map((row) =>
        row.id === id ? { ...row, [field]: value } : row
      )
    );
  };

  const removeTierRow = (id: number) => {
    setTierRows((prev) => prev.filter((row) => row.id !== id));
  };

  const buildRateConfigFromUI = () => {
    if (pricingMode === "none") {
      return null;
    }

    if (pricingMode === "tiers") {
      const tiers = tierRows
        .map((row) => {
          const maxTotal =
            row.maxTotal.trim() === ""
              ? null
              : Number(row.maxTotal.trim());
          const rate = Number(row.rate.trim() || 0);
          if (Number.isNaN(rate)) return null;
          return { maxTotal, rate };
        })
        .filter(Boolean) as { maxTotal: number | null; rate: number }[];

      if (!tiers.length) return null;
      return { tiers };
    }

    if (pricingMode === "free_over") {
      const freeAmt =
        freeOverAmount.trim() === ""
          ? null
          : Number(freeOverAmount.trim());
      const fallback = Number(freeFallbackRate.trim() || 0);
      if (freeAmt === null && !fallback) return null;
      return {
        freeOverAmount: freeAmt,
        fallbackRate: fallback,
      };
    }

    return null;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.code.trim() || !form.name.trim()) {
      toast.error("Code and Display Name are required.");
      return;
    }

    const rateConfig = buildRateConfigFromUI();
    const rateConfigJson = rateConfig ? JSON.stringify(rateConfig) : "";

    setSaving(true);
    try {
      const payload = {
        code: form.code.trim().toUpperCase(),
        name: form.name.trim(),
        description: form.description.trim() || null,
        base_rate: Number(form.base_rate || 0),
        is_active: form.is_active,
        rate_config: rateConfig,
      };

      if (form.id) {
        const res = await updateShippingMethod(form.id, payload);
        setMethods((prev) =>
          prev.map((x) => (x.id === form.id ? res.method : x))
        );
        toast.success("Shipping method updated.");
      } else {
        const res = await createShippingMethod(payload);
        setMethods((prev) => [res.method, ...prev]);
        setTotal((t) => t + 1);
        toast.success("Shipping method created.");
      }

      setForm((f) => ({ ...f, rate_config: rateConfigJson }));
      setModalOpen(false);
      resetAdvancedPricingState();
    } catch (err: any) {
      console.error("Failed to save shipping method", err);
      toast.error("Failed to save shipping method.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="relative">
      <AdminPageHeader
        title="Shipping Methods"
        subtitle="Configure how customers see and pay for shipping at checkout."
        breadcrumbs={[
          { label: "Dashboard", path: "/" },
          { label: "Shipping Methods" },
        ]}
        actions={
          <button
            onClick={openCreateModal}
            className="flex items-center gap-2 rounded-full bg-gradient-to-r from-emerald-500 via-teal-500 to-sky-500 px-5 py-2.5 text-sm font-semibold text-white shadow-md hover:brightness-110"
          >
            <Plus size={16} /> New Method
          </button>
        }
      />

      <div className="px-6 pt-4 pb-8 space-y-6">
        {/* INFO BANNER */}
        <div className="flex items-start gap-3 rounded-2xl border border-sky-200 bg-sky-50 px-4 py-3 text-xs text-slate-700 dark:border-sky-700/60 dark:bg-sky-900/30 dark:text-slate-100">
          <Truck size={16} className="mt-0.5 text-sky-600 dark:text-sky-300" />
          <div>
            <div className="font-semibold text-slate-800 dark:text-slate-50">
              How shipping methods work
            </div>
            <ul className="mt-1 list-disc space-y-0.5 pl-4">
              <li>
                Each method appears at checkout with a <b>name</b> and{" "}
                <b>price</b> (for example: “Standard Shipping — ₹199”).
              </li>
              <li>
                You can keep it simple with a fixed <b>Base rate</b> or use{" "}
                <b>Advanced pricing</b> for tiered or free-shipping rules.
              </li>
              <li>
                Non-technical users can just set Name + Base rate and ignore
                advanced options.
              </li>
            </ul>
          </div>
        </div>

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
                placeholder="Search by code, name or description…"
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
            <select
              value={statusFilter}
              onChange={(e) =>
                setStatusFilter(e.target.value as StatusFilter)
              }
              className="rounded-full border border-slate-300 bg-white px-4 py-2.5 text-sm text-slate-800 shadow-sm focus:border-sky-500 focus:ring-sky-300 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200"
            >
              <option value="">All status</option>
              <option value="active">Active only</option>
              <option value="inactive">Inactive only</option>
            </select>

            <button
              onClick={() => loadMethods(page)}
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
            <table className="min-w-full text-left text-sm text-slate-800 dark:text-slate-200">
              <thead className="bg-slate-100 text-xs uppercase tracking-wide text-slate-600 dark:bg-slate-800 dark:text-slate-400">
                <tr>
                  <th className="px-6 py-3">Method</th>
                  <th className="px-6 py-3">Base Rate</th>
                  <th className="px-6 py-3">Config Summary</th>
                  <th className="px-6 py-3">Created</th>
                  <th className="px-6 py-3">Status</th>
                  <th className="px-6 py-3 text-right">Actions</th>
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
                ) : filteredMethods.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="py-8 text-center text-lg">
                      No shipping methods found
                    </td>
                  </tr>
                ) : (
                  filteredMethods.map((m) => (
                    <tr
                      key={m.id}
                      className="border-t border-slate-200 hover:bg-slate-50 dark:border-slate-700 dark:hover:bg-slate-800"
                    >
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <span className="inline-flex h-8 w-8 items-center justify-center rounded-full bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-300">
                            <Truck size={16} />
                          </span>
                          <div className="flex flex-col">
                            <span className="font-semibold">{m.name}</span>
                            <span className="text-xs text-slate-500">
                              Code: {m.code}
                            </span>
                            {m.description && (
                              <span className="text-xs text-slate-500 line-clamp-2">
                                {m.description}
                              </span>
                            )}
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-sm font-semibold">
                        {formatMoney(Number(m.base_rate || 0))}
                      </td>
                      <td className="px-6 py-4 text-xs text-slate-600 dark:text-slate-300">
                        {getConfigSummaryLabel(m.rate_config)}
                      </td>
                      <td className="px-6 py-4 text-xs text-slate-500">
                        {formatDate(m.created_at)}
                      </td>
                      <td className="px-6 py-4">
                        <button
                          onClick={() => handleToggleActive(m)}
                          className={`inline-flex items-center gap-1 rounded-full px-3 py-1 text-xs font-medium ${
                            m.is_active
                              ? "border-emerald-300 bg-emerald-50 text-emerald-700 dark:border-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-200"
                              : "border-slate-300 bg-slate-100 text-slate-600 dark:border-slate-600 dark:bg-slate-900 dark:text-slate-300"
                          }`}
                        >
                          {m.is_active ? (
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
                      <td className="px-6 py-4 text-right space-x-2">
                        <button
                          onClick={() => openEditModal(m)}
                          className="inline-flex items-center gap-1 rounded-full border border-slate-300 px-3 py-1.5 text-xs hover:bg-slate-100 dark:border-slate-700 dark:hover:bg-slate-800"
                        >
                          <Edit2 size={12} /> Edit
                        </button>
                        <button
                          onClick={() => handleDelete(m)}
                          className="inline-flex items-center gap-1 rounded-full border border-rose-300 bg-rose-50 px-3 py-1.5 text-xs text-rose-700 hover:bg-rose-100 dark:border-rose-700 dark:bg-rose-900/40 dark:text-rose-200"
                        >
                          <Trash2 size={12} /> Delete
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
              Page {page} of {pageCount} · {total} methods
              {filteredMethods.length !== methods.length && (
                <span className="ml-2 text-xs text-slate-500">
                  (Filtered on this page: {filteredMethods.length})
                </span>
              )}
            </div>
            <div className="space-x-2">
              <button
                disabled={page <= 1 || loading}
                onClick={() => {
                  if (page <= 1) return;
                  const next = page - 1;
                  loadMethods(next);
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
                  loadMethods(next);
                }}
                className="rounded-full border border-slate-300 bg-white px-3 py-1.5 text-xs font-medium hover:bg-slate-50 disabled:opacity-50 dark:border-slate-700 dark:bg-slate-900"
              >
                Next
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* MODAL: CREATE / EDIT METHOD */}
      {modalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm">
          <div className="w-full max-w-3xl rounded-2xl border border-slate-300 bg-white shadow-xl dark:border-slate-700 dark:bg-slate-950">
            {/* scrollable content */}
            <div className="max-h-[90vh] overflow-y-auto p-6">
              {/* HEADER with logo */}
              <div className="mb-5 flex items-center justify-between gap-4">
                <div className="flex items-center gap-4">
                  <img
                    src="/logo_minalgems.png"
                    alt="Minal Gems"
                    className="h-auto w-64 rounded-lg object-contain bg-white"
                  />
                  <div>
                    <h2 className="text-xl font-semibold text-slate-900 dark:text-white">
                      {form.id
                        ? "Edit Shipping Method"
                        : "Create Shipping Method"}
                    </h2>
                    <p className="text-xs text-slate-500 dark:text-slate-400">
                      Fill in the basic details. You can keep it simple (flat
                      rate) or add advanced rules without touching any code.
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => {
                    setModalOpen(false);
                    resetAdvancedPricingState();
                  }}
                  className="rounded-full border border-slate-300 px-3 py-1 text-sm hover:bg-slate-100 dark:border-slate-700 dark:hover:bg-slate-800"
                >
                  Close
                </button>
              </div>

              {/* FORM */}
              <form onSubmit={handleSubmit} className="space-y-5 text-sm">
                {/* SECTION 1: BASIC INFO */}
                <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4 dark:border-slate-700 dark:bg-slate-900/40">
                  <div className="mb-3 text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">
                    1. Basic Information
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="mb-1 block text-xs font-medium">
                        Code <span className="text-rose-500">*</span>
                      </label>
                      <input
                        value={form.code}
                        onChange={(e) =>
                          setForm((f) => ({
                            ...f,
                            code: e.target.value.toUpperCase(),
                          }))
                        }
                        placeholder="STANDARD"
                        className="w-full rounded-lg border border-slate-300 bg-slate-50 px-3 py-2 text-sm dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100"
                        required
                      />
                      <p className="mt-1 text-[11px] text-slate-500 dark:text-slate-400">
                        Internal code (UPPERCASE). Used by the system and
                        developers, not shown to customers.
                      </p>
                    </div>
                    <div>
                      <label className="mb-1 block text-xs font-medium">
                        Display Name <span className="text-rose-500">*</span>
                      </label>
                      <input
                        value={form.name}
                        onChange={(e) =>
                          setForm((f) => ({ ...f, name: e.target.value }))
                        }
                        placeholder="Standard Shipping (3–7 days)"
                        className="w-full rounded-lg border border-slate-300 bg-slate-50 px-3 py-2 text-sm dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100"
                        required
                      />
                      <p className="mt-1 text-[11px] text-slate-500 dark:text-slate-400">
                        This is exactly what customers will see at checkout.
                      </p>
                    </div>
                  </div>

                  <div className="mt-3">
                    <label className="mb-1 block text-xs font-medium">
                      Description (optional)
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
                      placeholder="Example: Delivered within 5–7 working days. Tracking available."
                      className="w-full rounded-lg border border-slate-300 bg-slate-50 px-3 py-2 text-sm dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100"
                    />
                    <p className="mt-1 text-[11px] text-slate-500 dark:text-slate-400">
                      Optional helper text that can describe delivery speed or
                      coverage.
                    </p>
                  </div>
                </div>

                {/* SECTION 2: BASIC PRICING */}
                <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4 dark:border-slate-700 dark:bg-slate-900/40">
                  <div className="mb-3 flex items-center justify-between">
                    <div className="text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">
                      2. Basic Pricing
                    </div>
                    <div className="flex items-center gap-2 text-[11px] text-slate-500 dark:text-slate-400">
                      <span
                        className={`inline-flex items-center gap-1 rounded-full border px-2 py-0.5 ${
                          form.is_active
                            ? "border-emerald-300 bg-emerald-50 text-emerald-700 dark:border-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-200"
                            : "border-slate-300 bg-slate-100 text-slate-600 dark:border-slate-600 dark:bg-slate-900 dark:text-slate-300"
                        }`}
                      >
                        {form.is_active ? (
                          <>
                            <CheckCircle2 size={12} /> Active
                          </>
                        ) : (
                          <>
                            <Ban size={12} /> Inactive
                          </>
                        )}
                      </span>
                      <label className="inline-flex items-center gap-1">
                        <input
                          id="shipping_method_is_active"
                          type="checkbox"
                          checked={form.is_active}
                          onChange={(e) =>
                            setForm((f) => ({
                              ...f,
                              is_active: e.target.checked,
                            }))
                          }
                          className="h-3 w-3 rounded border-slate-300 text-emerald-600 focus:ring-emerald-500 dark:border-slate-600"
                        />
                        <span>Available at checkout</span>
                      </label>
                    </div>
                  </div>

                  <div className="grid grid-cols-3 gap-4">
                    <div>
                      <label className="mb-1 block text-xs font-medium">
                        Base Rate (₹)
                      </label>
                      <input
                        type="number"
                        min={0}
                        value={form.base_rate}
                        onChange={(e) =>
                          setForm((f) => ({
                            ...f,
                            base_rate: Number(e.target.value || 0),
                          }))
                        }
                        className="w-full rounded-lg border border-slate-300 bg-slate-50 px-3 py-2 text-sm dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100"
                      />
                      <p className="mt-1 text-[11px] text-slate-500 dark:text-slate-400">
                        Default price for this method. If you do not use
                        advanced pricing, this is the final price.
                      </p>
                    </div>
                    <div className="col-span-2">
                      <label className="mb-1 block text-xs font-medium">
                        Checkout Preview
                      </label>
                      <div className="rounded-xl border border-dashed border-slate-300 bg-white px-3 py-2 text-xs text-slate-700 dark:border-slate-600 dark:bg-slate-900 dark:text-slate-200">
                        <div className="flex items-center justify-between">
                          <span>
                            {form.name || "Standard Shipping (3–7 days)"}
                          </span>
                          <span className="font-semibold">
                            {formatMoney(form.base_rate || 0)}
                          </span>
                        </div>
                        <div className="mt-1 text-[10px] text-slate-500">
                          Example of how this might look in the checkout list.
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* SECTION 3: ADVANCED PRICING (TABLE-BASED) */}
                <div className="rounded-2xl border border-slate-200 bg-white p-4 dark:border-slate-700 dark:bg-slate-900">
                  <div className="mb-2 flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Settings2 size={14} className="text-slate-500" />
                      <div className="text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">
                        3. Advanced Pricing (optional)
                      </div>
                    </div>
                    <div className="text-[11px] text-slate-500 dark:text-slate-400">
                      Choose one style (or none)
                    </div>
                  </div>

                  <p className="mb-3 text-[11px] text-slate-500 dark:text-slate-400">
                    Leave this section empty if you only want the flat{" "}
                    <b>Base rate</b>. If you need automatic discounts based on
                    order value, choose a mode below. The system will generate
                    the JSON automatically.
                  </p>

                  {/* Pricing mode selector */}
                  <div className="mb-3 flex flex-wrap gap-3 text-xs">
                    <label className="inline-flex items-center gap-2 rounded-full border border-slate-300 bg-slate-50 px-3 py-1.5 dark:border-slate-600 dark:bg-slate-800">
                      <input
                        type="radio"
                        name="pricing_mode"
                        value="none"
                        checked={pricingMode === "none"}
                        onChange={() => setPricingMode("none")}
                      />
                      <span>
                        Flat base rate only{" "}
                        <span className="text-[10px] text-slate-500">
                          (simplest)
                        </span>
                      </span>
                    </label>

                    <label className="inline-flex items-center gap-2 rounded-full border border-slate-300 bg-slate-50 px-3 py-1.5 dark:border-slate-600 dark:bg-slate-800">
                      <input
                        type="radio"
                        name="pricing_mode"
                        value="tiers"
                        checked={pricingMode === "tiers"}
                        onChange={() => setPricingMode("tiers")}
                      />
                      <span>
                        Tiered by order total{" "}
                        <span className="text-[10px] text-slate-500">
                          (e.g. cheaper shipping for big orders)
                        </span>
                      </span>
                    </label>

                    <label className="inline-flex items-center gap-2 rounded-full border border-slate-300 bg-slate-50 px-3 py-1.5 dark:border-slate-600 dark:bg-slate-800">
                      <input
                        type="radio"
                        name="pricing_mode"
                        value="free_over"
                        checked={pricingMode === "free_over"}
                        onChange={() => setPricingMode("free_over")}
                      />
                      <span>
                        Free over threshold{" "}
                        <span className="text-[10px] text-slate-500">
                          (common for promos)
                        </span>
                      </span>
                    </label>
                  </div>

                  {/* TIERED TABLE */}
                  {pricingMode === "tiers" && (
                    <div className="space-y-2 text-xs">
                      <div className="flex items-center justify-between">
                        <span className="font-semibold">
                          Tiered pricing by order total (₹)
                        </span>
                        <button
                          type="button"
                          onClick={addTierRow}
                          className="inline-flex items-center gap-1 rounded-full border border-slate-300 bg-slate-50 px-3 py-1 hover:bg-slate-100 dark:border-slate-600 dark:bg-slate-800 dark:hover:bg-slate-700"
                        >
                          <Plus size={12} /> Add tier
                        </button>
                      </div>
                      <p className="text-[11px] text-slate-500 dark:text-slate-400">
                        Example: Up to ₹5,000 → ₹199, up to ₹10,000 → ₹99,
                        above that → ₹0 (free).
                      </p>

                      <div className="overflow-x-auto rounded-xl border border-slate-200 dark:border-slate-700">
                        <table className="min-w-full text-left text-[11px]">
                          <thead className="bg-slate-100 text-[10px] uppercase tracking-wide text-slate-600 dark:bg-slate-800 dark:text-slate-400">
                            <tr>
                              <th className="px-3 py-2">
                                Up to order total (₹)
                              </th>
                              <th className="px-3 py-2">Shipping rate (₹)</th>
                              <th className="px-3 py-2 text-right">
                                Remove
                              </th>
                            </tr>
                          </thead>
                          <tbody>
                            {tierRows.length === 0 ? (
                              <tr>
                                <td
                                  colSpan={3}
                                  className="px-3 py-3 text-center text-slate-500"
                                >
                                  No tiers defined yet. Click “Add tier” to
                                  start.
                                </td>
                              </tr>
                            ) : (
                              tierRows.map((row) => (
                                <tr
                                  key={row.id}
                                  className="border-t border-slate-200 dark:border-slate-700"
                                >
                                  <td className="px-3 py-2">
                                    <input
                                      type="number"
                                      min={0}
                                      value={row.maxTotal}
                                      onChange={(e) =>
                                        updateTierRow(
                                          row.id,
                                          "maxTotal",
                                          e.target.value
                                        )
                                      }
                                      placeholder="e.g. 5000, leave blank for 'above'"
                                      className="w-full rounded-md border border-slate-300 bg-slate-50 px-2 py-1 text-[11px] dark:border-slate-600 dark:bg-slate-900 dark:text-slate-100"
                                    />
                                  </td>
                                  <td className="px-3 py-2">
                                    <input
                                      type="number"
                                      min={0}
                                      value={row.rate}
                                      onChange={(e) =>
                                        updateTierRow(
                                          row.id,
                                          "rate",
                                          e.target.value
                                        )
                                      }
                                      placeholder="e.g. 199"
                                      className="w-full rounded-md border border-slate-300 bg-slate-50 px-2 py-1 text-[11px] dark:border-slate-600 dark:bg-slate-900 dark:text-slate-100"
                                    />
                                  </td>
                                  <td className="px-3 py-2 text-right">
                                    <button
                                      type="button"
                                      onClick={() => removeTierRow(row.id)}
                                      className="inline-flex items-center gap-1 rounded-full border border-rose-300 bg-rose-50 px-2 py-0.5 text-[10px] text-rose-700 hover:bg-rose-100 dark:border-rose-700 dark:bg-rose-900/40 dark:text-rose-200"
                                    >
                                      <Trash2 size={10} /> Remove
                                    </button>
                                  </td>
                                </tr>
                              ))
                            )}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  )}

                  {/* FREE OVER THRESHOLD */}
                  {pricingMode === "free_over" && (
                    <div className="mt-3 space-y-2 text-xs">
                      <span className="font-semibold">
                        Free shipping for orders over a certain amount
                      </span>
                      <p className="text-[11px] text-slate-500 dark:text-slate-400">
                        Example: Free shipping above ₹10,000, otherwise charge
                        ₹199.
                      </p>
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <label className="mb-1 block text-[11px] font-medium">
                            Free shipping above (₹)
                          </label>
                          <input
                            type="number"
                            min={0}
                            value={freeOverAmount}
                            onChange={(e) =>
                              setFreeOverAmount(e.target.value)
                            }
                            placeholder="e.g. 10000"
                            className="w-full rounded-md border border-slate-300 bg-slate-50 px-2 py-1 text-[11px] dark:border-slate-600 dark:bg-slate-900 dark:text-slate-100"
                          />
                        </div>
                        <div>
                          <label className="mb-1 block text-[11px] font-medium">
                            Shipping rate below this (₹)
                          </label>
                          <input
                            type="number"
                            min={0}
                            value={freeFallbackRate}
                            onChange={(e) =>
                              setFreeFallbackRate(e.target.value)
                            }
                            placeholder="e.g. 199"
                            className="w-full rounded-md border border-slate-300 bg-slate-50 px-2 py-1 text-[11px] dark:border-slate-600 dark:bg-slate-900 dark:text-slate-100"
                          />
                        </div>
                      </div>
                    </div>
                  )}

                  {pricingMode === "none" && (
                    <p className="mt-2 text-[11px] text-slate-500 dark:text-slate-400">
                      No advanced pricing selected. Customers will always see
                      the Base rate.
                    </p>
                  )}
                </div>

                {/* FOOTER BUTTONS */}
                <div className="flex items-center justify-between pt-1">
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    You can always come back and adjust pricing or rules later.
                  </p>
                  <div className="flex items-center gap-3">
                    <button
                      type="button"
                      onClick={() => {
                        setModalOpen(false);
                        resetAdvancedPricingState();
                      }}
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
                          <Plus size={14} /> Create Method
                        </>
                      )}
                    </button>
                  </div>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminShippingMethodsPage;
