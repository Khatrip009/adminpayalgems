// src/pages/AdminShippingRulesPage.tsx

import React, { useEffect, useMemo, useState } from "react";
import {
  Scale,
  ArrowUpDown,
  RefreshCw,
  Loader2,
  Plus,
  Edit2,
  Trash2,
  AlertCircle,
  Search,
  Filter,
} from "lucide-react";
import { toast } from "react-hot-toast";

import { AdminPageHeader } from "@/components/admin/AdminPageHeader";
import {
  listShippingRules,
  createShippingRule,
  updateShippingRule,
  deleteShippingRule,
  type ShippingRule,
} from "@/api/logistics/shipments.api";

type RuleType = "flat" | "weight" | "order_value";

interface RuleFormState {
  id?: string;
  name: string;
  type: RuleType;
  amount: number;
  min_order_value: number | "";
  max_order_value: number | "";
  min_weight: number | "";
  max_weight: number | "";
  active: boolean;
}

const blankRuleForm: RuleFormState = {
  name: "",
  type: "flat",
  amount: 0,
  min_order_value: "",
  max_order_value: "",
  min_weight: "",
  max_weight: "",
  active: true,
};

const formatMoney = (amount: number) =>
  `₹${Number(amount || 0).toLocaleString()}`;

const ruleTypeLabel = (t: RuleType) => {
  if (t === "flat") return "Flat rate";
  if (t === "weight") return "By weight";
  if (t === "order_value") return "By order value";
  return t;
};

const describeRange = (r: ShippingRule) => {
  const parts: string[] = [];
  if (r.type === "order_value") {
    if (r.min_order_value != null)
      parts.push(`Order ≥ ${formatMoney(Number(r.min_order_value))}`);
    if (r.max_order_value != null)
      parts.push(`Order ≤ ${formatMoney(Number(r.max_order_value))}`);
  }
  if (r.type === "weight") {
    if (r.min_weight != null) parts.push(`Weight ≥ ${Number(r.min_weight)} g`);
    if (r.max_weight != null) parts.push(`Weight ≤ ${Number(r.max_weight)} g`);
  }
  return parts.length ? parts.join(" · ") : "Applies to all orders";
};

const AdminShippingRulesPage: React.FC = () => {
  const [rules, setRules] = useState<ShippingRule[]>([]);
  const [loading, setLoading] = useState(false);

  // Filters
  const [q, setQ] = useState("");
  const [typeFilter, setTypeFilter] = useState<"" | RuleType>("");
  const [activeFilter, setActiveFilter] = useState<"" | "active" | "inactive">(
    ""
  );

  // Modal + form
  const [modalOpen, setModalOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState<RuleFormState>(blankRuleForm);

  async function loadRules() {
    setLoading(true);
    try {
      const res = await listShippingRules();
      setRules(res.rules || []);
    } catch (err) {
      console.error("Failed to load shipping rules", err);
      toast.error("Failed to load shipping rules.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadRules();
  }, []);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // Filtering is client-side via useMemo
  };

  const openCreateModal = () => {
    setForm(blankRuleForm);
    setModalOpen(true);
  };

  const openEditModal = (r: ShippingRule) => {
    setForm({
      id: r.id,
      name: r.name,
      type: r.type as RuleType,
      amount: Number(r.amount),
      min_order_value:
        r.min_order_value == null ? "" : Number(r.min_order_value),
      max_order_value:
        r.max_order_value == null ? "" : Number(r.max_order_value),
      min_weight: r.min_weight == null ? "" : Number(r.min_weight),
      max_weight: r.max_weight == null ? "" : Number(r.max_weight),
      active: r.active,
    });
    setModalOpen(true);
  };

  const handleDelete = async (r: ShippingRule) => {
    if (!window.confirm(`Delete shipping rule "${r.name}"?`)) return;
    try {
      await deleteShippingRule(r.id);
      setRules((prev) => prev.filter((x) => x.id !== r.id));
      toast.success("Shipping rule deleted.");
    } catch (err) {
      console.error("Failed to delete shipping rule", err);
      toast.error("Failed to delete shipping rule.");
    }
  };

  const handleToggleActive = async (r: ShippingRule) => {
    try {
      const res = await updateShippingRule(r.id, { active: !r.active });
      setRules((prev) => prev.map((x) => (x.id === r.id ? res.rule : x)));
      toast.success(res.rule.active ? "Rule enabled." : "Rule disabled.");
    } catch (err) {
      console.error("Failed to toggle rule", err);
      toast.error("Failed to toggle rule.");
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name.trim()) {
      toast.error("Rule name is required.");
      return;
    }

    setSaving(true);
    try {
      const payload = {
        name: form.name.trim(),
        type: form.type,
        amount: Number(form.amount || 0),
        min_order_value:
          form.min_order_value === "" ? null : Number(form.min_order_value),
        max_order_value:
          form.max_order_value === "" ? null : Number(form.max_order_value),
        min_weight: form.min_weight === "" ? null : Number(form.min_weight),
        max_weight: form.max_weight === "" ? null : Number(form.max_weight),
        active: form.active,
      };

      if (form.id) {
        const res = await updateShippingRule(form.id, payload);
        setRules((prev) =>
          prev.map((x) => (x.id === form.id ? res.rule : x))
        );
        toast.success("Shipping rule updated.");
      } else {
        const res = await createShippingRule(payload);
        setRules((prev) => [...prev, res.rule]);
        toast.success("Shipping rule created.");
      }

      setModalOpen(false);
      setForm(blankRuleForm);
    } catch (err) {
      console.error("Failed to save shipping rule", err);
      toast.error("Failed to save shipping rule.");
    } finally {
      setSaving(false);
    }
  };

  // Client-side filtering
  const filteredRules = useMemo(() => {
    return rules.filter((r) => {
      const search = q.trim().toLowerCase();
      if (search) {
        const haystack = [r.name, r.type]
          .filter(Boolean)
          .join(" ")
          .toLowerCase();
        if (!haystack.includes(search)) return false;
      }

      if (typeFilter && r.type !== typeFilter) return false;

      if (activeFilter === "active" && !r.active) return false;
      if (activeFilter === "inactive" && r.active) return false;

      return true;
    });
  }, [rules, q, typeFilter, activeFilter]);

  return (
    <div className="relative">
      <AdminPageHeader
        title="Shipping Rules"
        subtitle="Define how shipping fees adjust based on order value or weight."
        breadcrumbs={[
          { label: "Dashboard", path: "/" },
          { label: "Shipping Rules" },
        ]}
        actions={
          <button
            onClick={openCreateModal}
            className="flex items-center gap-2 rounded-full bg-gradient-to-r from-sky-500 via-indigo-500 to-violet-500 px-5 py-2.5 text-sm font-semibold text-white shadow-md hover:brightness-110"
          >
            <Plus size={16} /> New Rule
          </button>
        }
      />

      <div className="px-6 pt-4 pb-8 space-y-8">
        {/* INFO ROW */}
        <div className="flex flex-col gap-3 rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-xs text-slate-800 dark:border-amber-700/70 dark:bg-amber-900/20 dark:text-slate-100 md:flex-row md:items-center md:justify-between">
          <div className="flex items-start gap-2">
            <AlertCircle size={16} className="mt-0.5 text-amber-500" />
            <div>
              <div className="font-semibold">How shipping rules work</div>
              <ul className="mt-1 list-disc space-y-0.5 pl-4">
                <li>
                  Use <b>Flat rate</b> to add a simple extra fee, independent
                  of order value or weight.
                </li>
                <li>
                  Use <b>By order value</b> to apply fees only for certain cart
                  totals (e.g. small orders).
                </li>
                <li>
                  Use <b>By weight</b> to charge extra for heavier shipments.
                </li>
              </ul>
            </div>
          </div>
          <button
            onClick={loadRules}
            disabled={loading}
            className="inline-flex items-center gap-2 self-start rounded-full border border-slate-300 bg-white px-4 py-2 text-xs font-medium text-slate-800 shadow-sm hover:bg-slate-50 disabled:opacity-60 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200"
          >
            {loading ? (
              <Loader2 className="animate-spin" size={14} />
            ) : (
              <RefreshCw size={14} />
            )}
            Refresh
          </button>
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
                placeholder="Search rules by name or type…"
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
            {/* Type filter */}
            <select
              value={typeFilter}
              onChange={(e) =>
                setTypeFilter(
                  e.target.value ? (e.target.value as RuleType) : ""
                )
              }
              className="rounded-full border border-slate-300 bg-white px-4 py-2.5 text-sm text-slate-800 shadow-sm focus:border-sky-500 focus:ring-sky-300 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200"
            >
              <option value="">All types</option>
              <option value="flat">Flat rate</option>
              <option value="order_value">By order value</option>
              <option value="weight">By weight</option>
            </select>

            {/* Active filter */}
            <select
              value={activeFilter}
              onChange={(e) =>
                setActiveFilter(e.target.value as "" | "active" | "inactive")
              }
              className="rounded-full border border-slate-300 bg-white px-4 py-2.5 text-sm text-slate-800 shadow-sm focus:border-sky-500 focus:ring-sky-300 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200"
            >
              <option value="">All status</option>
              <option value="active">Active only</option>
              <option value="inactive">Inactive only</option>
            </select>
          </div>
        </div>

        {/* TABLE */}
        <div className="overflow-hidden rounded-2xl border border-slate-300 bg-white shadow-sm dark:border-slate-700 dark:bg-slate-900">
          <div className="overflow-x-auto">
            <table className="min-w-full text-left text-sm text-slate-800 dark:text-slate-200">
              <thead className="bg-slate-100 text-xs uppercase tracking-wide text-slate-600 dark:bg-slate-800 dark:text-slate-400">
                <tr>
                  <th className="px-6 py-3">Rule</th>
                  <th className="px-6 py-3">Type / Amount</th>
                  <th className="px-6 py-3">Range</th>
                  <th className="px-6 py-3">Active</th>
                  <th className="px-6 py-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr>
                    <td colSpan={5} className="py-8 text-center text-lg">
                      <Loader2 className="mx-auto animate-spin" />
                      Loading...
                    </td>
                  </tr>
                ) : filteredRules.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="py-8 text-center text-lg">
                      No shipping rules configured
                    </td>
                  </tr>
                ) : (
                  filteredRules.map((r) => (
                    <tr
                      key={r.id}
                      className="border-t border-slate-200 hover:bg-slate-50 dark:border-slate-700 dark:hover:bg-slate-800"
                    >
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <span className="inline-flex h-8 w-8 items-center justify-center rounded-full bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-300">
                            {r.type === "order_value" ? (
                              <ArrowUpDown size={16} />
                            ) : (
                              <Scale size={16} />
                            )}
                          </span>
                          <div className="flex flex-col">
                            <span className="font-semibold">{r.name}</span>
                            <span className="text-xs text-slate-500">
                              {ruleTypeLabel(r.type as RuleType)}
                            </span>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-sm">
                        {r.type === "flat"
                          ? `Flat ${formatMoney(Number(r.amount))}`
                          : r.type === "order_value"
                          ? `Extra ${formatMoney(Number(r.amount))}`
                          : `${Number(r.amount)} ₹ per weight unit`}
                      </td>
                      <td className="px-6 py-4 text-xs text-slate-500">
                        {describeRange(r)}
                      </td>
                      <td className="px-6 py-4 text-sm">
                        {r.active ? (
                          <span className="inline-flex items-center rounded-full border border-emerald-300 bg-emerald-50 px-2.5 py-1 text-xs font-medium text-emerald-700 dark:border-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-200">
                            Active
                          </span>
                        ) : (
                          <span className="inline-flex items-center rounded-full border border-slate-300 bg-slate-100 px-2.5 py-1 text-xs font-medium text-slate-600 dark:border-slate-600 dark:bg-slate-900 dark:text-slate-300">
                            Inactive
                          </span>
                        )}
                      </td>
                      <td className="px-6 py-4 text-right space-x-2">
                        <button
                          onClick={() => handleToggleActive(r)}
                          className="inline-flex items-center gap-1 rounded-full border border-slate-300 px-3 py-1.5 text-xs hover:bg-slate-100 dark:border-slate-700 dark:hover:bg-slate-800"
                        >
                          {r.active ? "Disable" : "Enable"}
                        </button>
                        <button
                          onClick={() => openEditModal(r)}
                          className="inline-flex items-center gap-1 rounded-full border border-slate-300 px-3 py-1.5 text-xs hover:bg-slate-100 dark:border-slate-700 dark:hover:bg-slate-800"
                        >
                          <Edit2 size={12} /> Edit
                        </button>
                        <button
                          onClick={() => handleDelete(r)}
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

          {/* FOOTER SUMMARY */}
          <div className="flex items-center justify-between px-6 py-3 text-sm text-slate-600 dark:text-slate-400">
            <div>
              Showing {filteredRules.length} of {rules.length} shipping rules
            </div>
          </div>
        </div>
      </div>

      {/* MODAL: CREATE / EDIT RULE */}
      {modalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm">
          <div className="w-full max-w-3xl rounded-2xl border border-slate-300 bg-white shadow-xl dark:border-slate-700 dark:bg-slate-950">
            {/* Scrollable content */}
            <div className="max-h-[90vh] overflow-y-auto p-6">
              {/* HEADER with logo */}
              <div className="mb-6 flex items-center justify-between gap-4">
                <div className="flex items-center gap-4">
                  <img
                    src="/logo_minalgems.png"
                    alt="Minal Gems"
                    className="h-auto w-64 rounded-lg object-contain bg-white"
                  />
                  <div className="flex flex-col gap-1">
                    <h2 className="text-xl font-semibold text-slate-900 dark:text-white">
                      {form.id
                        ? "Edit Shipping Rule"
                        : "Create Shipping Rule"}
                    </h2>
                    <p className="text-xs text-slate-500 dark:text-slate-400">
                      Define simple rules that increase or decrease shipping
                      cost based on order value or total weight. Non-technical
                      users can fill in only the relevant fields.
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
              <form onSubmit={handleSubmit} className="space-y-5 text-sm">
                {/* SECTION 1: BASIC INFO */}
                <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4 dark:border-slate-700 dark:bg-slate-900/40">
                  <div className="mb-3 text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">
                    1. Basic Information
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="mb-1 block text-xs font-medium">
                        Rule Name <span className="text-rose-500">*</span>
                      </label>
                      <input
                        value={form.name}
                        onChange={(e) =>
                          setForm((f) => ({ ...f, name: e.target.value }))
                        }
                        placeholder="Free shipping over 10,000"
                        className="w-full rounded-lg border border-slate-300 bg-slate-50 px-3 py-2 text-sm dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100"
                        required
                      />
                      <p className="mt-1 text-[11px] text-slate-500 dark:text-slate-400">
                        A short description so you can recognize this rule
                        later.
                      </p>
                    </div>
                    <div>
                      <label className="mb-1 block text-xs font-medium">
                        Rule Type <span className="text-rose-500">*</span>
                      </label>
                      <select
                        value={form.type}
                        onChange={(e) =>
                          setForm((f) => ({
                            ...f,
                            type: e.target.value as RuleType,
                          }))
                        }
                        className="w-full rounded-lg border border-slate-300 bg-slate-50 px-3 py-2 text-sm dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100"
                      >
                        <option value="flat">Flat rate (simple extra fee)</option>
                        <option value="order_value">
                          By order value (cart total)
                        </option>
                        <option value="weight">
                          By weight (total shipment weight)
                        </option>
                      </select>
                      <p className="mt-1 text-[11px] text-slate-500 dark:text-slate-400">
                        This decides which fields below are used.
                      </p>
                    </div>
                  </div>
                </div>

                {/* SECTION 2: AMOUNT + ACTIVE */}
                <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4 dark:border-slate-700 dark:bg-slate-900/40">
                  <div className="mb-3 flex items-center justify-between">
                    <div className="text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">
                      2. Amount & Status
                    </div>
                    <div className="flex items-center gap-2 text-[11px] text-slate-500 dark:text-slate-400">
                      <label className="inline-flex items-center gap-2">
                        <input
                          id="shipping_rule_active"
                          type="checkbox"
                          checked={form.active}
                          onChange={(e) =>
                            setForm((f) => ({ ...f, active: e.target.checked }))
                          }
                          className="h-4 w-4 rounded border-slate-300 text-emerald-600 focus:ring-emerald-500 dark:border-slate-600"
                        />
                        <span>Active (apply this rule at checkout)</span>
                      </label>
                    </div>
                  </div>

                  <div className="grid grid-cols-3 gap-4">
                    <div>
                      <label className="mb-1 block text-xs font-medium">
                        Amount
                      </label>
                      <input
                        type="number"
                        min={0}
                        value={form.amount}
                        onChange={(e) =>
                          setForm((f) => ({
                            ...f,
                            amount: Number(e.target.value || 0),
                          }))
                        }
                        className="w-full rounded-lg border border-slate-300 bg-slate-50 px-3 py-2 text-sm dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100"
                      />
                      <p className="mt-1 text-[11px] text-slate-500 dark:text-slate-400">
                        For flat / value rules this is a fixed amount (₹). For
                        weight rules it is the rate per weight unit.
                      </p>
                    </div>
                    <div className="col-span-2">
                      <label className="mb-1 block text-xs font-medium">
                        Example interpretation
                      </label>
                      <div className="rounded-xl border border-dashed border-slate-300 bg-white px-3 py-2 text-[11px] text-slate-700 dark:border-slate-600 dark:bg-slate-900 dark:text-slate-200">
                        {form.type === "flat" && (
                          <p>
                            Adds a flat extra fee of{" "}
                            <b>{formatMoney(form.amount || 0)}</b> when this
                            rule matches.
                          </p>
                        )}
                        {form.type === "order_value" && (
                          <p>
                            When the order value is inside the range you set
                            below, this rule adds{" "}
                            <b>{formatMoney(form.amount || 0)}</b> to shipping.
                          </p>
                        )}
                        {form.type === "weight" && (
                          <p>
                            When the total shipment weight is inside the range
                            below, this rule charges{" "}
                            <b>{form.amount || 0} ₹</b> per configured weight
                            unit.
                          </p>
                        )}
                      </div>
                    </div>
                  </div>
                </div>

                {/* SECTION 3: RANGES */}
                <div className="rounded-2xl border border-slate-200 bg-white p-4 dark:border-slate-700 dark:bg-slate-900">
                  <div className="mb-2 text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">
                    3. Range (when should this rule apply?)
                  </div>
                  <p className="mb-3 text-[11px] text-slate-500 dark:text-slate-400">
                    Leave fields empty if you want the rule to apply to{" "}
                    <b>all</b> orders for that type.
                  </p>

                  {/* Order value range */}
                  <div className="grid grid-cols-2 gap-4 mb-4">
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
                        disabled={form.type === "weight"}
                        className="w-full rounded-lg border border-slate-300 bg-slate-50 px-3 py-2 text-sm dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100 disabled:bg-slate-100 dark:disabled:bg-slate-800"
                      />
                    </div>
                    <div>
                      <label className="mb-1 block text-xs font-medium">
                        Max Order Value (₹)
                      </label>
                      <input
                        type="number"
                        min={0}
                        value={form.max_order_value}
                        onChange={(e) =>
                          setForm((f) => ({
                            ...f,
                            max_order_value: e.target.value
                              ? Number(e.target.value)
                              : "",
                          }))
                        }
                        disabled={form.type === "weight"}
                        className="w-full rounded-lg border border-slate-300 bg-slate-50 px-3 py-2 text-sm dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100 disabled:bg-slate-100 dark:disabled:bg-slate-800"
                      />
                    </div>
                  </div>

                  {/* Weight range */}
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="mb-1 block text-xs font-medium">
                        Min Weight (g)
                      </label>
                      <input
                        type="number"
                        min={0}
                        value={form.min_weight}
                        onChange={(e) =>
                          setForm((f) => ({
                            ...f,
                            min_weight: e.target.value
                              ? Number(e.target.value)
                              : "",
                          }))
                        }
                        disabled={
                          form.type === "order_value" || form.type === "flat"
                        }
                        className="w-full rounded-lg border border-slate-300 bg-slate-50 px-3 py-2 text-sm dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100 disabled:bg-slate-100 dark:disabled:bg-slate-800"
                      />
                    </div>
                    <div>
                      <label className="mb-1 block text-xs font-medium">
                        Max Weight (g)
                      </label>
                      <input
                        type="number"
                        min={0}
                        value={form.max_weight}
                        onChange={(e) =>
                          setForm((f) => ({
                            ...f,
                            max_weight: e.target.value
                              ? Number(e.target.value)
                              : "",
                          }))
                        }
                        disabled={
                          form.type === "order_value" || form.type === "flat"
                        }
                        className="w-full rounded-lg border border-slate-300 bg-slate-50 px-3 py-2 text-sm dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100 disabled:bg-slate-100 dark:disabled:bg-slate-800"
                      />
                    </div>
                  </div>
                </div>

                {/* FOOTER BUTTONS */}
                <div className="flex items-center justify-between pt-2">
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    Order value rules ignore weight fields, and weight rules
                    ignore order value fields. You can combine multiple rules
                    to match real-world pricing.
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
                          <Plus size={14} /> Create Rule
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

export default AdminShippingRulesPage;
