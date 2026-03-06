// src/pages/AdminTaxRulesPage.tsx

import React, { useEffect, useState } from "react";
import {
  Globe2,
  MapPin,
  Percent,
  RefreshCw,
  Loader2,
  Plus,
  Trash2,
  Edit2,
} from "lucide-react";
import { toast } from "react-hot-toast";

import { AdminPageHeader } from "@/components/admin/AdminPageHeader";
import {
  listTaxRules,
  createTaxRule,
  updateTaxRule,
  deleteTaxRule,
  type TaxRule,
} from "@/api/masters/tax.api";

interface TaxFormState {
  id?: string;
  country: string;
  state: string;
  rate: number;
}

const blankTaxForm: TaxFormState = {
  country: "",
  state: "",
  rate: 0.18,
};

const AdminTaxRulesPage: React.FC = () => {
  const [rules, setRules] = useState<TaxRule[]>([]);
  const [loading, setLoading] = useState(false);

  const [modalOpen, setModalOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState<TaxFormState>(blankTaxForm);

  async function loadRules() {
    setLoading(true);
    try {
      const res = await listTaxRules();
      setRules(res.rules || []);
    } catch (err) {
      console.error("Failed to load tax rules", err);
      toast.error("Failed to load tax rules.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadRules();
  }, []);

  const formatRate = (rate: number) =>
    `${(Number(rate || 0) * 100).toFixed(2)}%`;

  const openCreateModal = () => {
    setForm(blankTaxForm);
    setModalOpen(true);
  };

  const openEditModal = (rule: TaxRule) => {
    setForm({
      id: rule.id,
      country: rule.country,
      state: rule.state || "",
      rate: Number(rule.rate),
    });
    setModalOpen(true);
  };

  const handleDelete = async (rule: TaxRule) => {
    if (
      !window.confirm(
        `Delete tax rule for ${rule.country}${
          rule.state ? " / " + rule.state : ""
        }?`
      )
    )
      return;
    try {
      await deleteTaxRule(rule.id);
      setRules((prev) => prev.filter((r) => r.id !== rule.id));
      toast.success("Tax rule deleted.");
    } catch (err) {
      console.error("Failed to delete tax rule", err);
      toast.error("Failed to delete tax rule.");
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.country.trim()) {
      toast.error("Country is required.");
      return;
    }

    setSaving(true);
    try {
      const payload = {
        country: form.country.trim().toUpperCase(),
        state: form.state.trim() || null,
        rate: Number(form.rate),
      };

      if (form.id) {
        const res = await updateTaxRule(form.id, payload);
        setRules((prev) =>
          prev.map((r) => (r.id === form.id ? res.rule : r))
        );
        toast.success("Tax rule updated.");
      } else {
        const res = await createTaxRule(payload);
        setRules((prev) => [...prev, res.rule]);
        toast.success("Tax rule created.");
      }

      setModalOpen(false);
      setForm(blankTaxForm);
    } catch (err) {
      console.error("Failed to save tax rule", err);
      toast.error("Failed to save tax rule.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="relative">
      <AdminPageHeader
        title="Tax Rules"
        subtitle="Configure tax rates by country and state for Minal Gems."
        breadcrumbs={[
          { label: "Dashboard", path: "/" },
          { label: "Tax Rules" },
        ]}
        actions={
          <button
            onClick={openCreateModal}
            className="flex items-center gap-2 rounded-full bg-gradient-to-r from-sky-500 via-indigo-500 to-violet-500 px-5 py-2.5 text-sm font-semibold text-white shadow-md hover:brightness-110"
          >
            <Plus size={16} /> New Tax Rule
          </button>
        }
      />

      <div className="px-6 pt-4 pb-8 space-y-6">
        <div className="flex items-center justify-between">
          <p className="text-sm text-slate-600 dark:text-slate-400">
            Tax rules are evaluated by state first (if present), then
            country-level fallbacks.
          </p>
          <button
            onClick={loadRules}
            disabled={loading}
            className="flex items-center gap-2 rounded-full border border-slate-300 bg-white px-4 py-2 text-xs font-medium text-slate-800 shadow-sm hover:bg-slate-50 disabled:opacity-60 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200"
          >
            {loading ? (
              <Loader2 className="animate-spin" size={14} />
            ) : (
              <RefreshCw size={14} />
            )}
            Refresh
          </button>
        </div>

        <div className="overflow-hidden rounded-2xl border border-slate-300 bg-white shadow-sm dark:border-slate-700 dark:bg-slate-900">
          <div className="overflow-x-auto">
            <table className="min-w-full text-left text-sm text-slate-800 dark:text-slate-200">
              <thead className="bg-slate-100 text-xs uppercase tracking-wide text-slate-600 dark:bg-slate-800 dark:text-slate-400">
                <tr>
                  <th className="px-6 py-3">Region</th>
                  <th className="px-6 py-3">Rate</th>
                  <th className="px-6 py-3">Created</th>
                  <th className="px-6 py-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr>
                    <td colSpan={4} className="py-8 text-center text-lg">
                      <Loader2 className="mx-auto animate-spin" />
                      Loading...
                    </td>
                  </tr>
                ) : rules.length === 0 ? (
                  <tr>
                    <td colSpan={4} className="py-8 text-center text-lg">
                      No tax rules configured
                    </td>
                  </tr>
                ) : (
                  rules.map((r) => (
                    <tr
                      key={r.id}
                      className="border-t border-slate-200 hover:bg-slate-50 dark:border-slate-700 dark:hover:bg-slate-800"
                    >
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <span className="inline-flex h-8 w-8 items-center justify-center rounded-full bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-300">
                            {r.state ? (
                              <MapPin size={16} />
                            ) : (
                              <Globe2 size={16} />
                            )}
                          </span>
                          <div className="flex flex-col">
                            <span className="font-semibold">
                              {r.country}
                            </span>
                            <span className="text-xs text-slate-500">
                              {r.state
                                ? `State: ${r.state}`
                                : "Country-wide"}
                            </span>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-1 text-sm font-semibold">
                          <Percent size={14} />
                          {formatRate(Number(r.rate))}
                        </div>
                      </td>
                      <td className="px-6 py-4 text-xs text-slate-500">
                        {new Date(r.created_at).toLocaleDateString()}
                      </td>
                      <td className="px-6 py-4 text-right space-x-2">
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
        </div>
      </div>

      {/* MODAL */}
      {modalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm">
          <div className="w-full max-w-md rounded-2xl border border-slate-300 bg-white p-6 shadow-xl dark:border-slate-700 dark:bg-slate-950">
            <div className="mb-4 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Globe2 className="h-7 w-7 text-sky-500" />
                <div>
                  <h2 className="text-lg font-semibold text-slate-900 dark:text-white">
                    {form.id ? "Edit Tax Rule" : "Create Tax Rule"}
                  </h2>
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    Define GST/VAT rates per region.
                  </p>
                </div>
              </div>
              <button
                onClick={() => setModalOpen(false)}
                className="rounded-full border border-slate-300 px-3 py-1 text-xs hover:bg-slate-100 dark:border-slate-700 dark:hover:bg-slate-800"
              >
                Close
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4 text-sm">
              <div>
                <label className="mb-1 block text-xs font-medium">
                  Country Code / Name *
                </label>
                <input
                  value={form.country}
                  onChange={(e) =>
                    setForm((f) => ({
                      ...f,
                      country: e.target.value,
                    }))
                  }
                  placeholder="INDIA or IN"
                  className="w-full rounded-lg border border-slate-300 bg-slate-50 px-3 py-2 text-sm dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100"
                  required
                />
              </div>

              <div>
                <label className="mb-1 block text-xs font-medium">
                  State / Region (optional)
                </label>
                <input
                  value={form.state}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, state: e.target.value }))
                  }
                  placeholder="GUJARAT"
                  className="w-full rounded-lg border border-slate-300 bg-slate-50 px-3 py-2 text-sm dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100"
                />
              </div>

              <div>
                <label className="mb-1 block text-xs font-medium">
                  Rate (0.18 = 18%)
                </label>
                <div className="relative">
                  <Percent
                    size={14}
                    className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-slate-400"
                  />
                  <input
                    type="number"
                    step={0.001}
                    min={0}
                    value={form.rate}
                    onChange={(e) =>
                      setForm((f) => ({
                        ...f,
                        rate: Number(e.target.value || 0),
                      }))
                    }
                    className="w-full rounded-lg border border-slate-300 bg-slate-50 px-3 py-2 pr-8 text-sm dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100"
                  />
                </div>
              </div>

              <div className="flex items-center justify-between pt-2">
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  If both state and country rules exist, the state rule
                  will be used.
                </p>
                <div className="flex items-center gap-3">
                  <button
                    type="button"
                    onClick={() => setModalOpen(false)}
                    className="rounded-full border border-slate-300 bg-white px-4 py-1.5 text-xs font-medium hover:bg-slate-100 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={saving}
                    className="inline-flex items-center gap-2 rounded-full bg-slate-900 px-5 py-1.5 text-xs font-semibold text-white hover:bg-slate-800 disabled:opacity-60 dark:bg-slate-100 dark:text-slate-900"
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
      )}
    </div>
  );
};

export default AdminTaxRulesPage;
