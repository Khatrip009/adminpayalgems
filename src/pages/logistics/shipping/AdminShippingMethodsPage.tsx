// src/pages/admin/ShippingManagement.tsx
import React, { useEffect, useState } from "react";
import { toast } from "react-hot-toast";
import {
  Plus,
  Pencil,
  Trash2,
  RefreshCw,
  Search,
  X,
  CheckCircle,
  XCircle,
  Package,
  Table2,
  Trash,
} from "lucide-react";
import {
  listShippingMethods,
  createShippingMethod,
  updateShippingMethod,
  deleteShippingMethod,
  listShippingRules,
  createShippingRule,
  updateShippingRule,
  deleteShippingRule,
  type ShippingMethod,
  type ShippingRule,
} from "@/api/shipping/shipping.api";

// ---------- TYPES ----------
interface RateTier {
  rate: number;
  maxTotal: number;   // maximum order total for this tier
}

/* =========================================================
   SHIPPING MANAGEMENT PAGE
========================================================= */

const ShippingManagement: React.FC = () => {
  const [activeTab, setActiveTab] = useState<"methods" | "rules">("methods");

  // --- Methods state ---
  const [methods, setMethods] = useState<ShippingMethod[]>([]);
  const [methodsPage, setMethodsPage] = useState(1);
  const [methodsTotal, setMethodsTotal] = useState(0);
  const [methodsLimit] = useState(20);
  const [methodsSearch, setMethodsSearch] = useState("");
  const [methodsOnlyActive, setMethodsOnlyActive] = useState(false);
  const [methodsLoading, setMethodsLoading] = useState(false);

  // --- Rules state ---
  const [rules, setRules] = useState<ShippingRule[]>([]);
  const [rulesLoading, setRulesLoading] = useState(false);

  // --- Modals ---
  const [methodModalOpen, setMethodModalOpen] = useState(false);
  const [editingMethod, setEditingMethod] = useState<ShippingMethod | null>(null);
  const [methodForm, setMethodForm] = useState({
    code: "",
    name: "",
    description: "",
    base_rate: 0,
    is_active: true,
  });

  // Tiers for method rate_config
  const [methodTiers, setMethodTiers] = useState<RateTier[]>([]);

  const [ruleModalOpen, setRuleModalOpen] = useState(false);
  const [editingRule, setEditingRule] = useState<ShippingRule | null>(null);
  const [ruleForm, setRuleForm] = useState({
    name: "",
    type: "flat",
    amount: 0,
    min_order_value: "",
    max_order_value: "",
    min_weight: "",
    max_weight: "",
    active: true,
  });

  // ---------- Load Methods ----------
  const loadMethods = async (page = 1) => {
    setMethodsLoading(true);
    try {
      const res = await listShippingMethods({
        page,
        limit: methodsLimit,
        q: methodsSearch || undefined,
        only_active: methodsOnlyActive || undefined,
      });
      if (res.ok) {
        setMethods(res.methods);
        setMethodsTotal(res.total);
        setMethodsPage(page);
      } else {
        toast.error("Failed to load shipping methods");
      }
    } catch (err) {
      toast.error("Failed to load shipping methods");
      console.error(err);
    } finally {
      setMethodsLoading(false);
    }
  };

  // ---------- Load Rules ----------
  const loadRules = async () => {
    setRulesLoading(true);
    try {
      const res = await listShippingRules();
      if (res.ok) {
        setRules(res.rules);
      } else {
        toast.error("Failed to load shipping rules");
      }
    } catch (err) {
      toast.error("Failed to load shipping rules");
      console.error(err);
    } finally {
      setRulesLoading(false);
    }
  };

  useEffect(() => {
    if (activeTab === "methods") loadMethods(1);
    else loadRules();
  }, [activeTab]);

  // ---------- Helpers for rate_config ----------
  const parseRateConfigTiers = (rateConfig: any): RateTier[] => {
    if (!rateConfig) return [];
    // Accept both object with tiers array or a string
    let parsed = rateConfig;
    if (typeof rateConfig === "string") {
      try { parsed = JSON.parse(rateConfig); } catch { return []; }
    }
    if (parsed && Array.isArray(parsed.tiers)) {
      return parsed.tiers.map((t: any) => ({
        rate: Number(t.rate || 0),
        maxTotal: Number(t.maxTotal || 0),
      }));
    }
    return [];
  };

  const buildRateConfigObject = (tiers: RateTier[]) => {
    if (!tiers || tiers.length === 0) return null;
    return { tiers: tiers.filter(t => t.rate > 0 || t.maxTotal > 0) };
  };

  // ---------- Method Modal Handlers ----------
  const openCreateMethod = () => {
    setEditingMethod(null);
    setMethodForm({
      code: "",
      name: "",
      description: "",
      base_rate: 0,
      is_active: true,
    });
    setMethodTiers([]);
    setMethodModalOpen(true);
  };

  const openEditMethod = (method: ShippingMethod) => {
    setEditingMethod(method);
    setMethodForm({
      code: method.code,
      name: method.name,
      description: method.description || "",
      base_rate: Number(method.base_rate || 0),
      is_active: method.is_active,
    });
    setMethodTiers(parseRateConfigTiers(method.rate_config));
    setMethodModalOpen(true);
  };

  const handleMethodSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const rateConfig = buildRateConfigObject(methodTiers);

    const payload = {
      code: methodForm.code,
      name: methodForm.name,
      description: methodForm.description || null,
      base_rate: methodForm.base_rate,
      is_active: methodForm.is_active,
      rate_config: rateConfig,
    };

    try {
      if (editingMethod) {
        await updateShippingMethod(editingMethod.id, payload);
        toast.success("Shipping method updated");
      } else {
        await createShippingMethod(payload);
        toast.success("Shipping method created");
      }
      setMethodModalOpen(false);
      loadMethods(methodsPage);
    } catch (err) {
      toast.error("Operation failed");
      console.error(err);
    }
  };

  const handleDeleteMethod = async (id: string) => {
    if (!confirm("Delete this shipping method?")) return;
    try {
      await deleteShippingMethod(id);
      toast.success("Shipping method deleted");
      loadMethods(methodsPage);
    } catch (err) {
      toast.error("Failed to delete");
      console.error(err);
    }
  };

  // Tier management
  const addTier = () => {
    setMethodTiers([...methodTiers, { rate: 0, maxTotal: 0 }]);
  };

  const removeTier = (index: number) => {
    const updated = [...methodTiers];
    updated.splice(index, 1);
    setMethodTiers(updated);
  };

  const updateTier = (index: number, field: keyof RateTier, value: number) => {
    const updated = [...methodTiers];
    updated[index][field] = value;
    setMethodTiers(updated);
  };

  // ---------- Rule Modal Handlers ----------
  const openCreateRule = () => {
    setEditingRule(null);
    setRuleForm({
      name: "",
      type: "flat",
      amount: 0,
      min_order_value: "",
      max_order_value: "",
      min_weight: "",
      max_weight: "",
      active: true,
    });
    setRuleModalOpen(true);
  };

  const openEditRule = (rule: ShippingRule) => {
    setEditingRule(rule);
    setRuleForm({
      name: rule.name,
      type: rule.type,
      amount: Number(rule.amount || 0),
      min_order_value: rule.min_order_value?.toString() || "",
      max_order_value: rule.max_order_value?.toString() || "",
      min_weight: rule.min_weight?.toString() || "",
      max_weight: rule.max_weight?.toString() || "",
      active: rule.active,
    });
    setRuleModalOpen(true);
  };

  const handleRuleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const payload = {
        name: ruleForm.name,
        type: ruleForm.type as "flat" | "weight" | "order_value",
        amount: Number(ruleForm.amount || 0),
        min_order_value: ruleForm.min_order_value ? Number(ruleForm.min_order_value) : null,
        max_order_value: ruleForm.max_order_value ? Number(ruleForm.max_order_value) : null,
        min_weight: ruleForm.min_weight ? Number(ruleForm.min_weight) : null,
        max_weight: ruleForm.max_weight ? Number(ruleForm.max_weight) : null,
        active: ruleForm.active,
      };

      if (editingRule) {
        await updateShippingRule(editingRule.id, payload);
        toast.success("Shipping rule updated");
      } else {
        await createShippingRule(payload);
        toast.success("Shipping rule created");
      }
      setRuleModalOpen(false);
      loadRules();
    } catch (err) {
      toast.error("Operation failed");
      console.error(err);
    }
  };

  const handleDeleteRule = async (id: string) => {
    if (!confirm("Delete this shipping rule?")) return;
    try {
      await deleteShippingRule(id);
      toast.success("Shipping rule deleted");
      loadRules();
    } catch (err) {
      toast.error("Failed to delete");
      console.error(err);
    }
  };

  // ---------- Pagination for Methods ----------
  const totalMethodPages = Math.ceil(methodsTotal / methodsLimit);

  return (
    <div className="container mx-auto py-6 px-4 space-y-6">
      <h1 className="text-2xl font-bold text-gray-800">Shipping Management</h1>

      {/* Tabs */}
      <div className="border-b border-gray-200">
        <nav className="-mb-px flex space-x-8">
          <button
            onClick={() => setActiveTab("methods")}
            className={`py-2 px-1 border-b-2 font-medium text-sm ${
              activeTab === "methods"
                ? "border-indigo-500 text-indigo-600"
                : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
            }`}
          >
            <Package className="inline-block w-4 h-4 mr-1" />
            Shipping Methods
          </button>
          <button
            onClick={() => setActiveTab("rules")}
            className={`py-2 px-1 border-b-2 font-medium text-sm ${
              activeTab === "rules"
                ? "border-indigo-500 text-indigo-600"
                : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
            }`}
          >
            <CheckCircle className="inline-block w-4 h-4 mr-1" />
            Shipping Rules
          </button>
        </nav>
      </div>

      {/* ============================================= */}
      {/* SHIPPING METHODS TAB */}
      {/* ============================================= */}
      {activeTab === "methods" && (
        <div className="space-y-4">
          <div className="flex flex-col sm:flex-row gap-3 items-start sm:items-center justify-between">
            <div className="flex gap-2 items-center">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={16} />
                <input
                  type="text"
                  placeholder="Search code or name..."
                  value={methodsSearch}
                  onChange={(e) => setMethodsSearch(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && loadMethods(1)}
                  className="pl-9 pr-3 py-2 border rounded-lg focus:ring-2 focus:ring-indigo-500 text-sm"
                />
              </div>
              <label className="flex items-center gap-1 text-sm">
                <input
                  type="checkbox"
                  checked={methodsOnlyActive}
                  onChange={(e) => setMethodsOnlyActive(e.target.checked)}
                  className="rounded"
                />
                Active only
              </label>
              <button
                onClick={() => loadMethods(1)}
                className="p-2 border rounded-lg hover:bg-gray-50"
                title="Refresh"
              >
                <RefreshCw size={16} />
              </button>
            </div>
            <button
              onClick={openCreateMethod}
              className="bg-indigo-600 text-white px-4 py-2 rounded-lg hover:bg-indigo-700 flex items-center gap-2 text-sm"
            >
              <Plus size={16} /> Add Method
            </button>
          </div>

          <div className="bg-white rounded-xl shadow overflow-hidden">
            <table className="w-full text-sm">
              <thead className="bg-gray-100 text-left">
                <tr>
                  <th className="px-4 py-3 font-medium">Code</th>
                  <th className="px-4 py-3 font-medium">Name</th>
                  <th className="px-4 py-3 font-medium">Base Rate</th>
                  <th className="px-4 py-3 font-medium text-center">Active</th>
                  <th className="px-4 py-3 font-medium text-right">Actions</th>
                </tr>
              </thead>
              <tbody>
                {methodsLoading ? (
                  <tr>
                    <td colSpan={5} className="text-center py-8 text-gray-500">
                      Loading...
                    </td>
                  </tr>
                ) : methods.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="text-center py-8 text-gray-500">
                      No shipping methods found.
                    </td>
                  </tr>
                ) : (
                  methods.map((m) => (
                    <tr key={m.id} className="border-t hover:bg-gray-50">
                      <td className="px-4 py-3 font-mono text-xs">{m.code}</td>
                      <td className="px-4 py-3">{m.name}</td>
                      <td className="px-4 py-3">{Number(m.base_rate ?? 0).toFixed(2)}</td>
                      <td className="px-4 py-3 text-center">
                        {m.is_active ? (
                          <CheckCircle className="inline text-green-600" size={16} />
                        ) : (
                          <XCircle className="inline text-red-500" size={16} />
                        )}
                      </td>
                      <td className="px-4 py-3 text-right space-x-2">
                        <button
                          onClick={() => openEditMethod(m)}
                          className="text-blue-600 hover:text-blue-800"
                        >
                          <Pencil size={16} />
                        </button>
                        <button
                          onClick={() => handleDeleteMethod(m.id)}
                          className="text-red-600 hover:text-red-800"
                        >
                          <Trash2 size={16} />
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>

            {totalMethodPages > 1 && (
              <div className="flex justify-between items-center px-4 py-3 border-t">
                <div className="text-sm text-gray-500">
                  Page {methodsPage} of {totalMethodPages}
                </div>
                <div className="flex gap-2">
                  <button
                    disabled={methodsPage === 1}
                    onClick={() => loadMethods(methodsPage - 1)}
                    className="px-3 py-1 border rounded disabled:opacity-50"
                  >
                    Prev
                  </button>
                  <button
                    disabled={methodsPage === totalMethodPages}
                    onClick={() => loadMethods(methodsPage + 1)}
                    className="px-3 py-1 border rounded disabled:opacity-50"
                  >
                    Next
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ============================================= */}
      {/* SHIPPING RULES TAB */}
      {/* ============================================= */}
      {activeTab === "rules" && (
        <div className="space-y-4">
          <div className="flex justify-between items-center">
            <h2 className="text-lg font-semibold">All Rules</h2>
            <button
              onClick={openCreateRule}
              className="bg-indigo-600 text-white px-4 py-2 rounded-lg hover:bg-indigo-700 flex items-center gap-2 text-sm"
            >
              <Plus size={16} /> Add Rule
            </button>
          </div>

          <div className="bg-white rounded-xl shadow overflow-hidden">
            <table className="w-full text-sm">
              <thead className="bg-gray-100 text-left">
                <tr>
                  <th className="px-4 py-3 font-medium">Name</th>
                  <th className="px-4 py-3 font-medium">Type</th>
                  <th className="px-4 py-3 font-medium">Amount</th>
                  <th className="px-4 py-3 font-medium">Order Value Range</th>
                  <th className="px-4 py-3 font-medium">Weight Range</th>
                  <th className="px-4 py-3 font-medium text-center">Active</th>
                  <th className="px-4 py-3 font-medium text-right">Actions</th>
                </tr>
              </thead>
              <tbody>
                {rulesLoading ? (
                  <tr>
                    <td colSpan={7} className="text-center py-8 text-gray-500">
                      Loading...
                    </td>
                  </tr>
                ) : rules.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="text-center py-8 text-gray-500">
                      No shipping rules found.
                    </td>
                  </tr>
                ) : (
                  rules.map((r) => (
                    <tr key={r.id} className="border-t hover:bg-gray-50">
                      <td className="px-4 py-3">{r.name}</td>
                      <td className="px-4 py-3 capitalize">{r.type.replace("_", " ")}</td>
                      <td className="px-4 py-3">{Number(r.amount ?? 0).toFixed(2)}</td>
                      <td className="px-4 py-3">
                        {r.min_order_value != null ? `₹${r.min_order_value}` : "—"} –{" "}
                        {r.max_order_value != null ? `₹${r.max_order_value}` : "—"}
                      </td>
                      <td className="px-4 py-3">
                        {r.min_weight != null ? `${r.min_weight}g` : "—"} –{" "}
                        {r.max_weight != null ? `${r.max_weight}g` : "—"}
                      </td>
                      <td className="px-4 py-3 text-center">
                        {r.active ? (
                          <CheckCircle className="inline text-green-600" size={16} />
                        ) : (
                          <XCircle className="inline text-red-500" size={16} />
                        )}
                      </td>
                      <td className="px-4 py-3 text-right space-x-2">
                        <button
                          onClick={() => openEditRule(r)}
                          className="text-blue-600 hover:text-blue-800"
                        >
                          <Pencil size={16} />
                        </button>
                        <button
                          onClick={() => handleDeleteRule(r.id)}
                          className="text-red-600 hover:text-red-800"
                        >
                          <Trash2 size={16} />
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

      {/* ============================================= */}
      {/* METHOD MODAL (with tier table) */}
      {/* ============================================= */}
      {methodModalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-lg max-w-lg w-full max-h-[90vh] overflow-y-auto p-6">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-lg font-semibold">
                {editingMethod ? "Edit Shipping Method" : "New Shipping Method"}
              </h2>
              <button onClick={() => setMethodModalOpen(false)}>
                <X size={18} />
              </button>
            </div>
            <form onSubmit={handleMethodSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-1">Code</label>
                <input
                  required
                  value={methodForm.code}
                  onChange={(e) => setMethodForm({ ...methodForm, code: e.target.value.toUpperCase() })}
                  className="w-full border rounded p-2 text-sm"
                  placeholder="e.g., STANDARD, EXPRESS"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Name</label>
                <input
                  required
                  value={methodForm.name}
                  onChange={(e) => setMethodForm({ ...methodForm, name: e.target.value })}
                  className="w-full border rounded p-2 text-sm"
                  placeholder="e.g., Standard Delivery"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Description</label>
                <textarea
                  value={methodForm.description}
                  onChange={(e) => setMethodForm({ ...methodForm, description: e.target.value })}
                  className="w-full border rounded p-2 text-sm"
                  rows={2}
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Base Rate</label>
                <input
                  type="number"
                  step="0.01"
                  value={methodForm.base_rate}
                  onChange={(e) => setMethodForm({ ...methodForm, base_rate: parseFloat(e.target.value) || 0 })}
                  className="w-full border rounded p-2 text-sm"
                />
              </div>

              {/* --- Rate Configuration (Tiers) --- */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <label className="text-sm font-medium">Rate Config (Optional)</label>
                  <button
                    type="button"
                    onClick={addTier}
                    className="text-xs text-indigo-600 hover:text-indigo-800 flex items-center gap-1"
                  >
                    <Plus size={14} /> Add Tier
                  </button>
                </div>
                {methodTiers.length > 0 ? (
                  <div className="border rounded-lg overflow-hidden">
                    <table className="w-full text-sm">
                      <thead className="bg-gray-50">
                        <tr>
                          <th className="px-3 py-2 text-left font-medium">Max Total (₹)</th>
                          <th className="px-3 py-2 text-left font-medium">Rate (₹)</th>
                          <th className="px-3 py-2 text-center font-medium">Action</th>
                        </tr>
                      </thead>
                      <tbody>
                        {methodTiers.map((tier, idx) => (
                          <tr key={idx} className="border-t">
                            <td className="px-3 py-2">
                              <input
                                type="number"
                                step="0.01"
                                min="0"
                                value={tier.maxTotal}
                                onChange={(e) => updateTier(idx, "maxTotal", Number(e.target.value))}
                                className="w-full border rounded p-1 text-sm"
                                placeholder="5000"
                              />
                            </td>
                            <td className="px-3 py-2">
                              <input
                                type="number"
                                step="0.01"
                                min="0"
                                value={tier.rate}
                                onChange={(e) => updateTier(idx, "rate", Number(e.target.value))}
                                className="w-full border rounded p-1 text-sm"
                                placeholder="100"
                              />
                            </td>
                            <td className="px-3 py-2 text-center">
                              <button
                                type="button"
                                onClick={() => removeTier(idx)}
                                className="text-red-500 hover:text-red-700"
                              >
                                <Trash size={14} />
                              </button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                ) : (
                  <p className="text-xs text-gray-500 italic">No tiers added. The base rate will be used for all orders.</p>
                )}
              </div>

              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={methodForm.is_active}
                  onChange={(e) => setMethodForm({ ...methodForm, is_active: e.target.checked })}
                />
                <label className="text-sm">Active</label>
              </div>
              <div className="flex justify-end gap-2 pt-3">
                <button type="button" onClick={() => setMethodModalOpen(false)} className="px-4 py-2 border rounded">
                  Cancel
                </button>
                <button type="submit" className="px-4 py-2 bg-indigo-600 text-white rounded">
                  {editingMethod ? "Update" : "Create"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ============================================= */}
      {/* RULE MODAL */}
      {/* ============================================= */}
      {ruleModalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-lg max-w-md w-full p-6">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-lg font-semibold">
                {editingRule ? "Edit Shipping Rule" : "New Shipping Rule"}
              </h2>
              <button onClick={() => setRuleModalOpen(false)}>
                <X size={18} />
              </button>
            </div>
            <form onSubmit={handleRuleSubmit} className="space-y-3">
              <div>
                <label className="block text-sm font-medium mb-1">Name</label>
                <input
                  required
                  value={ruleForm.name}
                  onChange={(e) => setRuleForm({ ...ruleForm, name: e.target.value })}
                  className="w-full border rounded p-2 text-sm"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Type</label>
                <select
                  value={ruleForm.type}
                  onChange={(e) => setRuleForm({ ...ruleForm, type: e.target.value })}
                  className="w-full border rounded p-2 text-sm"
                >
                  <option value="flat">Flat</option>
                  <option value="weight">Weight</option>
                  <option value="order_value">Order Value</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Amount</label>
                <input
                  type="number"
                  step="0.01"
                  required
                  value={ruleForm.amount}
                  onChange={(e) => setRuleForm({ ...ruleForm, amount: parseFloat(e.target.value) || 0 })}
                  className="w-full border rounded p-2 text-sm"
                />
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-sm font-medium mb-1">Min Order Value</label>
                  <input
                    type="number"
                    step="0.01"
                    value={ruleForm.min_order_value}
                    onChange={(e) => setRuleForm({ ...ruleForm, min_order_value: e.target.value })}
                    className="w-full border rounded p-2 text-sm"
                    placeholder="Optional"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Max Order Value</label>
                  <input
                    type="number"
                    step="0.01"
                    value={ruleForm.max_order_value}
                    onChange={(e) => setRuleForm({ ...ruleForm, max_order_value: e.target.value })}
                    className="w-full border rounded p-2 text-sm"
                    placeholder="Optional"
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-sm font-medium mb-1">Min Weight (g)</label>
                  <input
                    type="number"
                    step="0.01"
                    value={ruleForm.min_weight}
                    onChange={(e) => setRuleForm({ ...ruleForm, min_weight: e.target.value })}
                    className="w-full border rounded p-2 text-sm"
                    placeholder="Optional"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Max Weight (g)</label>
                  <input
                    type="number"
                    step="0.01"
                    value={ruleForm.max_weight}
                    onChange={(e) => setRuleForm({ ...ruleForm, max_weight: e.target.value })}
                    className="w-full border rounded p-2 text-sm"
                    placeholder="Optional"
                  />
                </div>
              </div>
              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={ruleForm.active}
                  onChange={(e) => setRuleForm({ ...ruleForm, active: e.target.checked })}
                />
                <label className="text-sm">Active</label>
              </div>
              <div className="flex justify-end gap-2 pt-3">
                <button type="button" onClick={() => setRuleModalOpen(false)} className="px-4 py-2 border rounded">
                  Cancel
                </button>
                <button type="submit" className="px-4 py-2 bg-indigo-600 text-white rounded">
                  {editingRule ? "Update" : "Create"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default ShippingManagement;