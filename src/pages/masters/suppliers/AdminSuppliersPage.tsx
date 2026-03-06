import React, { useEffect, useRef, useState } from "react";
import {
  Users,
  Search,
  Plus,
  Edit2,
  Trash2,
  Loader2,
  Download,
  Upload,
  X,
  ChevronUp,
  ChevronDown,
  Square,
} from "lucide-react";
import { toast } from "react-hot-toast";

import { useAuth } from "@/context/AuthContext";
import { useNavigate } from "react-router-dom";

import {
  listSuppliers,
  getSupplier,
  createSupplier,
  updateSupplier,
  deleteSupplier,
  exportSuppliersCSV,
  importSuppliersCSV,
} from "@/api/masters/suppliers.api";

import type { Supplier } from "@/api/masters/suppliers.api";

/* --------------------------
   Types & constants
-------------------------- */
type SortField = "code" | "name" | "created_at" | null;
type SortDir = "asc" | "desc";
type SortEntry = { field: SortField; dir: SortDir };

const LIMIT = 20;

/* --------------------------
   KV helpers
-------------------------- */
type KV = { key: string; value: string };

function mapObjectToKV(obj: Record<string, any> | undefined, defaults: string[]) {
  const out: KV[] = [];
  const seen = new Set<string>();

  if (obj) {
    for (const k of Object.keys(obj)) {
      out.push({
        key: k,
        value: obj[k] === undefined || obj[k] === null ? "" : String(obj[k]),
      });
      seen.add(k);
    }
  }

  for (const d of defaults) {
    if (!seen.has(d)) {
      out.unshift({ key: d, value: "" });
      seen.add(d);
    }
  }

  return out;
}

function mapKVToObject(kvs: KV[]) {
  const out: Record<string, string> = {};
  for (const kv of kvs) {
    if (!kv.key) continue;
    out[kv.key] = kv.value;
  }
  return out;
}

/* --------------------------
   KVEditor component
-------------------------- */
interface KVEditorProps {
  title: string;
  defaults: string[];
  kvs: KV[];
  onChange: (kvs: KV[]) => void;
}

const KVEditor: React.FC<KVEditorProps> = ({ title, defaults, kvs, onChange }) => {
  const handleKeyChange = (idx: number, key: string) => {
    const copy = kvs.map((x) => ({ ...x }));
    copy[idx].key = key;
    onChange(copy);
  };
  const handleValueChange = (idx: number, value: string) => {
    const copy = kvs.map((x) => ({ ...x }));
    copy[idx].value = value;
    onChange(copy);
  };
  const addRow = (afterIdx?: number) => {
    const copy = kvs.map((x) => ({ ...x }));
    const ins = { key: "", value: "" };
    if (typeof afterIdx === "number") copy.splice(afterIdx + 1, 0, ins);
    else copy.push(ins);
    onChange(copy);
  };
  const removeRow = (idx: number) => {
    const copy = kvs.map((x) => ({ ...x }));
    copy.splice(idx, 1);
    onChange(copy);
  };

  return (
    <div className="rounded-lg border border-slate-200 bg-white p-3 dark:border-slate-700 dark:bg-slate-900">
      <div className="mb-2 flex items-center justify-between">
        <div className="text-sm font-medium text-slate-700 dark:text-slate-200">
          {title}
        </div>
        <button
          type="button"
          onClick={() => addRow()}
          className="rounded-full border border-slate-300 px-2 py-1 text-xs hover:bg-slate-100 dark:border-slate-700"
        >
          + Add row
        </button>
      </div>

      <div className="space-y-2">
        {kvs.map((kv, idx) => (
          <div key={idx} className="flex items-start gap-2">
            <input
              placeholder={defaults.includes(kv.key) ? kv.key : "key"}
              value={kv.key}
              onChange={(e) => handleKeyChange(idx, e.target.value)}
              className="w-1/3 rounded-lg border border-slate-300 bg-slate-50 px-2 py-1 text-sm font-mono dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100"
            />

            <input
              value={kv.value}
              onChange={(e) => handleValueChange(idx, e.target.value)}
              className="flex-1 rounded-lg border border-slate-300 bg-slate-50 px-2 py-1 text-sm font-mono dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100"
            />

            <div className="flex gap-1">
              <button
                type="button"
                onClick={() => addRow(idx)}
                className="rounded-lg border border-slate-300 px-2 py-1 text-xs hover:bg-slate-100 dark:border-slate-700"
              >
                +
              </button>
              <button
                type="button"
                onClick={() => removeRow(idx)}
                className="rounded-lg border border-rose-300 px-2 py-1 text-xs text-rose-600 hover:bg-rose-50 dark:border-rose-700 dark:text-rose-300"
              >
                -
              </button>
            </div>
          </div>
        ))}
      </div>

      <p className="mt-2 text-[12px] text-slate-500 dark:text-slate-400">
        Add common fields quickly, or add custom rows. Empty keys are ignored on save.
      </p>
    </div>
  );
};

/* --------------------------
   Main Page
-------------------------- */
const AdminSuppliersPage: React.FC = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const isSuperAdminUI = user?.role_id === 1;

  const [loading, setLoading] = useState(false);
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [total, setTotal] = useState(0);

  const [q, setQ] = useState("");
  const [page, setPage] = useState(1);

  const [sortStack, setSortStack] = useState<SortEntry[]>([]);
  const [selected, setSelected] = useState<Record<string, boolean>>({});

  const [modalOpen, setModalOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [savingLock, setSavingLock] = useState(false);

  const [form, setForm] = useState<
    Partial<Supplier & { contact?: Record<string, any>; kyc?: Record<string, any> }>
  >({
    id: "",
    name: "",
    code: "",
    contact: {},
    kyc: {},
  });

  const [contactKVs, setContactKVs] = useState<KV[]>(
    mapObjectToKV({}, ["phone", "email", "address"])
  );
  const [kycKVs, setKycKVs] = useState<KV[]>(
    mapObjectToKV({}, ["aadhar", "pan", "bank_account"])
  );

  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const totalPages = Math.max(1, Math.ceil(total / LIMIT));

  /* --------------------------
     Load suppliers
-------------------------- */
  const loadSuppliers = async () => {
    setLoading(true);
    try {
      const res = await listSuppliers({
        q: q || undefined,
        limit: LIMIT,
        offset: (page - 1) * LIMIT,
      });

      const rows = res.suppliers || [];

      // apply client-side multi-column sort
      const sorted = [...rows];
      if (sortStack.length > 0) {
        const stack = [...sortStack].reverse();
        sorted.sort((a, b) => {
          for (const s of stack) {
            const field = s.field;
            if (!field) continue;

            let va: any = a[field];
            let vb: any = b[field];

            if (field === "created_at") {
              va = a.created_at ? new Date(a.created_at).getTime() : 0;
              vb = b.created_at ? new Date(b.created_at).getTime() : 0;
            }

            if (va < vb) return s.dir === "asc" ? -1 : 1;
            if (va > vb) return s.dir === "asc" ? 1 : -1;
          }
          return 0;
        });
      }

      setSuppliers(sorted);
      setTotal(res.total || 0);

      // retain selection only for currently visible
      setSelected((prev) => {
        const result: Record<string, boolean> = {};
        for (const r of sorted) if (prev[r.id]) result[r.id] = true;
        return result;
      });
    } catch (err) {
      console.error(err);
      toast.error("Failed to load suppliers.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    setPage(1);
  }, [q]);

  useEffect(() => {
    loadSuppliers();
  }, [page, sortStack, q]);

  /* --------------------------
     Sorting
-------------------------- */
  const toggleSort = (field: SortField, shiftKey = false) => {
    setSortStack((prev) => {
      const idx = prev.findIndex((p) => p.field === field);

      if (!shiftKey) {
        if (idx === 0) {
          // rotate asc → desc → remove
          if (prev[0].dir === "asc") return [{ field, dir: "desc" }, ...prev.slice(1)];
          return prev.slice(1);
        } else {
          const copy = prev.filter((p) => p.field !== field);
          return [{ field, dir: "asc" }, ...copy];
        }
      }

      // shift behavior
      if (idx === -1) return [...prev, { field, dir: "asc" }];

      const cur = prev[idx];
      if (cur.dir === "asc") {
        const copy = [...prev];
        copy[idx] = { field, dir: "desc" };
        return copy;
      }
      return prev.filter((p) => p.field !== field);
    });
  };

  const getSortDirForField = (field: SortField) =>
    sortStack.find((s) => s.field === field)?.dir ?? null;

  /* --------------------------
     Selection
-------------------------- */
  const selectedIds = Object.keys(selected).filter((id) => selected[id]);

  const toggleRow = (id: string) =>
    setSelected((s) => ({ ...s, [id]: !s[id] }));

  const toggleSelectAllOnPage = () => {
    const allSelected = suppliers.every((s) => selected[s.id]);
    if (allSelected) {
      const copy = { ...selected };
      suppliers.forEach((s) => delete copy[s.id]);
      setSelected(copy);
    } else {
      const copy = { ...selected };
      suppliers.forEach((s) => (copy[s.id] = true));
      setSelected(copy);
    }
  };

  /* --------------------------
     Modal open actions
-------------------------- */
  const openCreateModal = () => {
    setForm({ id: "", name: "", code: "", contact: {}, kyc: {} });
    setContactKVs(mapObjectToKV({}, ["phone", "email", "address"]));
    setKycKVs(mapObjectToKV({}, ["aadhar", "pan", "bank_account"]));
    setModalOpen(true);
  };

  const openEditModal = async (id: string) => {
    try {
      setLoading(true);
      const r = await getSupplier(id);
      const sup = r.supplier;

      setForm({
        id: sup.id,
        name: sup.name,
        code: sup.code,
        contact: sup.contact || {},
        kyc: sup.kyc || {},
      });

      setContactKVs(mapObjectToKV(sup.contact || {}, ["phone", "email", "address"]));
      setKycKVs(mapObjectToKV(sup.kyc || {}, ["aadhar", "pan", "bank_account"]));

      setModalOpen(true);
    } catch (err) {
      console.error(err);
      toast.error("Failed to load supplier.");
    } finally {
      setLoading(false);
    }
  };

  /* --------------------------
     Save (create/update)
-------------------------- */
  const handleSave = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!form.name || !form.name.trim()) return toast.error("Name is required.");

    if (savingLock) return;
    setSavingLock(true);
    setSaving(true);

    try {
      const payload = {
        name: form.name,
        code: form.code || null,
        contact: mapKVToObject(contactKVs),
        kyc: mapKVToObject(kycKVs),
      };

      if (form.id) {
        await updateSupplier(form.id, payload);
        toast.success("Supplier updated.");
      } else {
        await createSupplier(payload);
        toast.success("Supplier created.");
      }

      setModalOpen(false);
      loadSuppliers();
    } catch (err: any) {
      console.error(err);
      toast.error(err?.message || "Save failed.");
    } finally {
      setSaving(false);
      setSavingLock(false);
    }
  };

  /* --------------------------
     Delete
-------------------------- */
  const handleDelete = async (id: string) => {
    if (!isSuperAdminUI) return toast.error("Delete requires super-admin privileges.");
    if (!confirm("Delete this supplier? This cannot be undone.")) return;

    try {
      await deleteSupplier(id);
      toast.success("Deleted.");
      loadSuppliers();
    } catch (err) {
      console.error(err);
      toast.error("Delete failed.");
    }
  };

  const handleBulkDelete = async () => {
    if (!isSuperAdminUI) return toast.error("Bulk delete requires super-admin.");
    if (selectedIds.length === 0) return;

    if (!confirm(`Delete ${selectedIds.length} suppliers?`)) return;

    let success = 0;
    let failed = 0;

    for (const id of selectedIds) {
      try {
        await deleteSupplier(id);
        success++;
      } catch {
        failed++;
      }
    }

    toast.success(`Bulk delete: ${success} deleted, ${failed} failed.`);
    setSelected({});
    loadSuppliers();
  };

  /* --------------------------
     Export / Import
-------------------------- */
  const handleExport = async () => {
    try {
      const blob = await exportSuppliersCSV({
        q: q || undefined,
        limit: 10000,
        offset: 0,
      });

      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `suppliers_${Date.now()}.csv`;
      a.click();
      URL.revokeObjectURL(url);
    } catch (err) {
      console.error(err);
      toast.error("Export failed.");
    }
  };

  const handleImport = async (file: File | null) => {
    if (!file) return;
    try {
      const result = await importSuppliersCSV(file);
      toast.success(`Imported: ${result.result.inserted} inserted, ${result.result.updated} updated`);
      loadSuppliers();
    } catch (err) {
      console.error(err);
      toast.error("Import failed.");
    }
  };

  /* --------------------------
     Render
-------------------------- */
  return (
    <div className="p-6">
      {/* Header */}
      <div className="mb-6 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Users size={22} />
          <div>
            <h1 className="text-lg font-semibold text-slate-900 dark:text-white">
              Suppliers
            </h1>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Manage suppliers — create, edit, import/export and bulk actions.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => fileInputRef.current?.click()}
            className="rounded-lg border border-slate-300 px-3 py-1.5 text-sm hover:bg-slate-100 dark:border-slate-700"
          >
            <Upload size={14} className="inline mr-1" /> Import
          </button>

          <input
            ref={fileInputRef}
            type="file"
            accept=".csv"
            className="hidden"
            onChange={(e) => handleImport(e.target.files?.[0] || null)}
          />

          <button
            onClick={handleExport}
            className="rounded-lg border border-slate-300 px-3 py-1.5 text-sm hover:bg-slate-100 dark:border-slate-700"
          >
            <Download size={14} className="inline mr-1" /> Export
          </button>

          <button
            onClick={openCreateModal}
            className="rounded-full bg-slate-900 px-4 py-1.5 text-sm font-semibold text-white hover:bg-slate-800 dark:bg-slate-100 dark:text-slate-900"
          >
            <Plus size={14} className="inline mr-1" /> Add
          </button>
        </div>
      </div>

      {/* Filters */}
      <div className="mb-4 flex items-center gap-3">
        <div className="relative w-64">
          <Search className="absolute left-2 top-2.5 text-slate-400" size={14} />
          <input
            placeholder="Search name or code"
            value={q}
            onChange={(e) => setQ(e.target.value)}
            className="w-full rounded-lg border border-slate-300 bg-white py-2 pl-8 pr-3 text-sm dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200"
          />
        </div>

        {selectedIds.length > 0 && (
          <button
            onClick={handleBulkDelete}
            className="ml-auto rounded-lg border border-rose-300 px-3 py-1 text-xs text-rose-700 hover:bg-rose-50 dark:border-rose-700 dark:text-rose-300"
          >
            <Trash2 size={14} className="inline mr-1" /> Delete ({selectedIds.length})
          </button>
        )}
      </div>

      {/* Table */}
      <div className="rounded-xl border border-slate-200 dark:border-slate-700 overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300">
            <tr>
              <th className="px-3 py-2 w-10">
                <button
                  onClick={toggleSelectAllOnPage}
                  className="rounded p-1 hover:bg-slate-200 dark:hover:bg-slate-700"
                >
                  <Square size={16} />
                </button>
              </th>
              <th
                className="px-3 py-2 cursor-pointer"
                onClick={(e) => toggleSort("code", e.shiftKey)}
              >
                <div className="flex items-center gap-1">
                  Code
                  {getSortDirForField("code") === "asc" ? (
                    <ChevronUp size={14} />
                  ) : getSortDirForField("code") === "desc" ? (
                    <ChevronDown size={14} />
                  ) : (
                    <ChevronUp size={14} className="opacity-30" />
                  )}
                </div>
              </th>

              <th
                className="px-3 py-2 cursor-pointer"
                onClick={(e) => toggleSort("name", e.shiftKey)}
              >
                <div className="flex items-center gap-1">
                  Name
                  {getSortDirForField("name") === "asc" ? (
                    <ChevronUp size={14} />
                  ) : getSortDirForField("name") === "desc" ? (
                    <ChevronDown size={14} />
                  ) : (
                    <ChevronUp size={14} className="opacity-30" />
                  )}
                </div>
              </th>

              <th className="px-3 py-2">Contact</th>
              <th className="px-3 py-2">KYC</th>

              <th
                className="px-3 py-2 text-right cursor-pointer"
                onClick={(e) => toggleSort("created_at", e.shiftKey)}
              >
                <div className="flex items-center justify-end gap-1">
                  Created
                  {getSortDirForField("created_at") === "asc" ? (
                    <ChevronUp size={14} />
                  ) : getSortDirForField("created_at") === "desc" ? (
                    <ChevronDown size={14} />
                  ) : (
                    <ChevronUp size={14} className="opacity-30" />
                  )}
                </div>
              </th>

              <th className="px-3 py-2 text-right">Actions</th>
            </tr>
          </thead>

          <tbody>
            {loading ? (
              <tr>
                <td colSpan={7} className="py-10 text-center text-slate-500">
                  <Loader2 className="animate-spin inline mr-2" /> Loading…
                </td>
              </tr>
            ) : suppliers.length === 0 ? (
              <tr>
                <td colSpan={7} className="py-10 text-center text-slate-500">
                  No suppliers found
                </td>
              </tr>
            ) : (
              suppliers.map((s) => (
                <tr key={s.id} className="border-t dark:border-slate-800">
                  <td className="px-3 py-2">
                    <input
                      type="checkbox"
                      checked={!!selected[s.id]}
                      onChange={() => toggleRow(s.id)}
                      className="h-4 w-4"
                    />
                  </td>

                  <td className="px-3 py-2">{s.code || "—"}</td>
                  <td className="px-3 py-2">{s.name}</td>

                  {/* Contact */}
                  <td className="px-3 py-2 text-xs">
                    {s.contact ? (
                      typeof s.contact === "object" ? (
                        <>
                          {s.contact.phone && <div>📞 {s.contact.phone}</div>}
                          {s.contact.email && <div>✉️ {s.contact.email}</div>}
                          {s.contact.address && <div>📍 {s.contact.address}</div>}
                        </>
                      ) : (
                        String(s.contact)
                      )
                    ) : (
                      "—"
                    )}
                  </td>

                  {/* KYC */}
                  <td className="px-3 py-2 text-xs">
                    {s.kyc &&
                    (s.kyc.aadhar || s.kyc.pan || s.kyc.bank_account) ? (
                      <>
                        {s.kyc.aadhar && <div>Aadhar: {s.kyc.aadhar}</div>}
                        {s.kyc.pan && <div>PAN: {s.kyc.pan}</div>}
                        {s.kyc.bank_account && (
                          <div>Bank: {s.kyc.bank_account}</div>
                        )}
                      </>
                    ) : (
                      "—"
                    )}
                  </td>

                  <td className="px-3 py-2 text-right">
                    {s.created_at
                      ? new Date(s.created_at).toLocaleDateString()
                      : "—"}
                  </td>

                  {/* Actions */}
                  <td className="px-3 py-2 text-right">
                    <div className="flex items-center justify-end gap-2">
                      {/* Invoices */}
                      <button
                        onClick={() =>
                          navigate(`/admin/suppliers/${s.id}/invoices`)
                        }
                        className="rounded-lg border border-blue-300 px-2 py-1 text-xs text-blue-600 hover:bg-blue-50 dark:border-blue-700 dark:text-blue-300"
                      >
                        🧾 Invoices
                      </button>

                      {/* Ledger */}
                      <button
                        onClick={() =>
                          navigate(`/admin/suppliers/${s.id}/ledger`)
                        }
                        className="rounded-lg border border-orange-300 px-2 py-1 text-xs text-orange-600 hover:bg-orange-50 dark:border-orange-700 dark:text-orange-300"
                      >
                        📒 Ledger
                      </button>

                      {/* Edit */}
                      <button
                        onClick={() => openEditModal(s.id)}
                        className="rounded-lg border border-slate-300 px-2 py-1 text-xs hover:bg-slate-100 dark:border-slate-700 dark:hover:bg-slate-800"
                      >
                        <Edit2 size={14} />
                      </button>

                      {/* Delete */}
                      <button
                        onClick={() => handleDelete(s.id)}
                        disabled={!isSuperAdminUI}
                        className="rounded-lg border border-rose-300 px-2 py-1 text-xs text-rose-600 hover:bg-rose-50 disabled:opacity-50 dark:border-rose-700 dark:text-rose-300"
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="mt-4 flex items-center justify-between text-sm text-slate-600 dark:text-slate-300">
          <button
            disabled={page <= 1}
            onClick={() => setPage((p) => Math.max(1, p - 1))}
            className="rounded-lg border border-slate-300 px-3 py-1 hover:bg-slate-100 disabled:opacity-50 dark:border-slate-700"
          >
            Previous
          </button>

          <div>
            Page {page} of {totalPages} · {total} records
          </div>

          <button
            disabled={page >= totalPages}
            onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
            className="rounded-lg border border-slate-300 px-3 py-1 hover:bg-slate-100 disabled:opacity-50 dark:border-slate-700"
          >
            Next
          </button>
        </div>
      )}

      {/* Floating Add FAB */}
      <button
        onClick={openCreateModal}
        className="fixed right-6 bottom-6 z-50 inline-flex items-center gap-2 rounded-full bg-slate-900 px-4 py-3 text-sm font-semibold text-white shadow-lg hover:bg-slate-800 dark:bg-slate-100 dark:text-slate-900"
      >
        <Plus size={16} /> Add
      </button>

      {/* Modal */}
      {modalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="w-full max-w-2xl rounded-2xl bg-white p-6 shadow-xl dark:bg-slate-900 dark:border dark:border-slate-700">
            <div className="mb-4 flex items-center justify-between">
              <h2 className="text-lg font-semibold text-slate-900 dark:text-white">
                {form.id ? "Edit Supplier" : "Create Supplier"}
              </h2>
              <button
                onClick={() => setModalOpen(false)}
                className="rounded-full p-1 hover:bg-slate-200 dark:hover:bg-slate-700"
              >
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleSave} className="space-y-4 text-sm">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="mb-1 block text-xs font-medium">Name</label>
                  <input
                    value={form.name || ""}
                    onChange={(e) =>
                      setForm((f) => ({ ...f, name: e.target.value }))
                    }
                    required
                    className="w-full rounded-lg border border-slate-300 bg-slate-50 px-3 py-2 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100"
                  />
                </div>

                <div>
                  <label className="mb-1 block text-xs font-medium">Code</label>
                  <input
                    value={form.code || ""}
                    onChange={(e) =>
                      setForm((f) => ({ ...f, code: e.target.value }))
                    }
                    className="w-full rounded-lg border border-slate-300 bg-slate-50 px-3 py-2 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100"
                  />
                </div>
              </div>

              {/* Contact */}
              <KVEditor
                title="Contact"
                defaults={["phone", "email", "address"]}
                kvs={contactKVs}
                onChange={setContactKVs}
              />

              {/* KYC */}
              <KVEditor
                title="KYC"
                defaults={["aadhar", "pan", "bank_account"]}
                kvs={kycKVs}
                onChange={setKycKVs}
              />

              <div className="flex items-center justify-between pt-3">
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  Contact & KYC stored as JSON.
                </p>

                <div className="flex items-center gap-3">
                  <button
                    type="button"
                    onClick={() => setModalOpen(false)}
                    className="rounded-full border border-slate-300 bg-white px-4 py-2 text-xs hover:bg-slate-100 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200"
                  >
                    Cancel
                  </button>

                  <button
                    type="submit"
                    disabled={saving}
                    className="inline-flex items-center gap-2 rounded-full bg-slate-900 px-4 py-2 text-xs font-semibold text-white hover:bg-slate-800 disabled:opacity-60 dark:bg-slate-100 dark:text-slate-900"
                  >
                    {saving ? (
                      <Loader2 className="animate-spin" size={14} />
                    ) : (
                      <>
                        <Edit2 size={14} /> Save
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

export default AdminSuppliersPage;
