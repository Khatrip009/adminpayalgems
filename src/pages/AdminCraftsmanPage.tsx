// src/pages/AdminCraftsmanPage.tsx
import React, { useEffect, useMemo, useRef, useState } from "react";
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

import {
  listCraftsmen,
  createCraftsman,
  updateCraftsman,
  deleteCraftsman,
  exportCraftsmenCSV,
  importCraftsmenCSV,
  type Craftsman,
} from "@/api/masters/craftsmen.api";

/* --------------------------
   Types & Constants
   -------------------------- */
type SortField = "code" | "name" | "created_at" | null;
type SortDir = "asc" | "desc";

const LIMIT = 20;

type SortEntry = { field: SortField; dir: SortDir };

/* --------------------------
   KV Editor (predefined + custom)
   -------------------------- */
type KV = { key: string; value: string };

function mapObjectToKV(obj: Record<string, any> | undefined, defaults: string[]) {
  const out: KV[] = [];
  const seen = new Set<string>();
  if (obj) {
    for (const k of Object.keys(obj)) {
      out.push({ key: k, value: obj[k] === undefined || obj[k] === null ? "" : String(obj[k]) });
      seen.add(k);
    }
  }
  // ensure defaults at top (if not present)
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
        <div className="text-sm font-medium text-slate-700 dark:text-slate-200">{title}</div>
        <div>
          <button
            type="button"
            onClick={() => addRow()}
            className="rounded-full border border-slate-300 px-2 py-1 text-xs hover:bg-slate-100 dark:border-slate-700"
          >
            + Add row
          </button>
        </div>
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
   AdminCraftsmanPage
   -------------------------- */
const AdminCraftsmanPage: React.FC = () => {
  const { user } = useAuth();
  const isAdminUI = user?.role_id === 1;

  /* ----- list state ----- */
  const [loading, setLoading] = useState(false);
  const [craftsmen, setCraftsmen] = useState<Craftsman[]>([]);
  const [total, setTotal] = useState(0);

  const [q, setQ] = useState("");
  const [isInhouseFilter, setIsInhouseFilter] = useState<null | boolean>(null);
  const [page, setPage] = useState(1);

  /* ----- multi-column sort stack ----- */
  const [sortStack, setSortStack] = useState<SortEntry[]>([]); // top = primary sort

  /* ----- selection ----- */
  const [selected, setSelected] = useState<Record<string, boolean>>({});

  /* ----- modal/form ----- */
  const [modalOpen, setModalOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({
    id: "",
    code: "",
    name: "",
    is_inhouse: false,
    contact: {} as Record<string, any>,
    kyc: {} as Record<string, any>,
  });

  const [contactKVs, setContactKVs] = useState<KV[]>(mapObjectToKV({}, ["phone", "email", "address"]));
  const [kycKVs, setKycKVs] = useState<KV[]>(mapObjectToKV({}, ["aadhar", "pan", "bank_account"]));

  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const totalPages = Math.max(1, Math.ceil(total / LIMIT));

  /* --------------------------
     Load craftsmen (primary sort sent to backend)
     -------------------------- */
  const primarySort = sortStack[0] ?? { field: "code" as SortField, dir: "asc" as SortDir };

  const loadCraftsmen = async () => {
    setLoading(true);
    try {
      const res = await listCraftsmen({
        q: q || undefined,
        is_inhouse: typeof isInhouseFilter === "boolean" ? isInhouseFilter : undefined,
        limit: LIMIT,
        offset: (page - 1) * LIMIT,
        order: (primarySort.field as any) || "code",
        direction: (primarySort.dir as any) || "asc",
      });

      const rows = res.craftsmen || [];
      // apply client-side stable sort according to entire sortStack (secondary+)
      const sorted = [...rows];
      if (sortStack.length > 0) {
        // apply stack from last (least priority) to first (highest priority)
        const stackCopy = [...sortStack].reverse();
        sorted.sort((a: any, b: any) => {
          for (const s of stackCopy) {
            const f = s.field;
            if (!f) continue;
            const va = a[f] ?? "";
            const vb = b[f] ?? "";
            if (va < vb) return s.dir === "asc" ? -1 : 1;
            if (va > vb) return s.dir === "asc" ? 1 : -1;
            // equal -> continue to next key
          }
          return 0;
        });
      }

      setCraftsmen(sorted);
      setTotal(res.total || 0);

      // prune selected keys to visible page
      setSelected((prev) => {
        const copy: Record<string, boolean> = {};
        for (const r of sorted) {
          if (prev[r.id]) copy[r.id] = true;
        }
        return copy;
      });
    } catch (err) {
      console.error("loadCraftsmen failed", err);
      toast.error("Failed to load craftsmen.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    // reset page when filters/search change
    setPage(1);
  }, [q, isInhouseFilter]);

  useEffect(() => {
    loadCraftsmen();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [page, primarySort.field, primarySort.dir, sortStack, q, isInhouseFilter]);

  /* --------------------------
     Sorting (multi-column)
     - click = set primary (replace unless shift)
     - shift-click = add / rotate on that field
     -------------------------- */
  const toggleSort = (field: SortField, shiftKey = false) => {
    setSortStack((prev) => {
      const foundIdx = prev.findIndex((p) => p.field === field);
      // if not shiftKey: set this as primary (put at front) with asc
      if (!shiftKey) {
        // if already primary, rotate direction -> asc -> desc -> remove
        if (foundIdx === 0) {
          const current = prev[0];
          if (current.dir === "asc") return [{ field, dir: "desc" }, ...prev.slice(1)];
          // remove primary (no sort)
          return prev.slice(1);
        } else {
          // put as primary asc
          const copy = prev.filter((p) => p.field !== field);
          return [{ field, dir: "asc" }, ...copy];
        }
      } else {
        // shiftKey behavior: toggle/rotate entry in stack but keep order of other entries
        const copy = prev.map((p) => ({ ...p }));
        if (foundIdx === -1) {
          // add as least priority (append) with asc
          copy.push({ field, dir: "asc" });
          return copy;
        }
        // found -> rotate dir asc -> desc -> remove
        const cur = copy[foundIdx];
        if (cur.dir === "asc") {
          copy[foundIdx] = { field, dir: "desc" };
          return copy;
        } else {
          // remove entry
          copy.splice(foundIdx, 1);
          return copy;
        }
      }
    });
  };

  const getSortDirForField = (field: SortField) => {
    const e = sortStack.find((s) => s.field === field);
    return e ? e.dir : null;
  };

  /* --------------------------
     Selection helpers
     -------------------------- */
  const toggleRow = (id: string) => {
    setSelected((s) => ({ ...s, [id]: !s[id] }));
  };

  const toggleSelectAllOnPage = () => {
    const allSelected = craftsmen.every((c) => selected[c.id]);
    if (allSelected) {
      const copy = { ...selected };
      for (const c of craftsmen) delete copy[c.id];
      setSelected(copy);
    } else {
      const copy = { ...selected };
      for (const c of craftsmen) copy[c.id] = true;
      setSelected(copy);
    }
  };

  const selectedIds = Object.keys(selected).filter((k) => selected[k]);

  /* --------------------------
     Create / Edit modal
     -------------------------- */
  const openCreateModal = () => {
    setForm({
      id: "",
      code: "",
      name: "",
      is_inhouse: false,
      contact: {},
      kyc: {},
    });
    setContactKVs(mapObjectToKV({}, ["phone", "email", "address"]));
    setKycKVs(mapObjectToKV({}, ["aadhar", "pan", "bank_account"]));
    setModalOpen(true);
  };

  const openEditModal = (c: Craftsman) => {
    setForm({
      id: c.id,
      code: c.code || "",
      name: c.name,
      is_inhouse: !!c.is_inhouse,
      contact: c.contact || {},
      kyc: c.kyc || {},
    });
    setContactKVs(mapObjectToKV(c.contact || {}, ["phone", "email", "address"]));
    setKycKVs(mapObjectToKV(c.kyc || {}, ["aadhar", "pan", "bank_account"]));
    setModalOpen(true);
  };

  /* --------------------------
     Save handler
     -------------------------- */
  const [savingLock, setSavingLock] = useState(false);
  const handleSave = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!form.name || form.name.trim() === "") {
      toast.error("Name is required.");
      return;
    }
    if (savingLock) return;
    setSavingLock(true);
    setSaving(true);
    try {
      const contactObj = mapKVToObject(contactKVs);
      const kycObj = mapKVToObject(kycKVs);

      const payload = {
        code: form.code || null,
        name: form.name,
        is_inhouse: !!form.is_inhouse,
        contact: contactObj,
        kyc: kycObj,
      };

      if (form.id) {
        await updateCraftsman(form.id, payload);
        toast.success("Craftsman updated.");
      } else {
        await createCraftsman(payload);
        toast.success("Craftsman created.");
      }

      setModalOpen(false);
      loadCraftsmen();
    } catch (err: any) {
      console.error("save failed", err);
      toast.error(err?.message || "Save failed.");
    } finally {
      setSaving(false);
      setSavingLock(false);
    }
  };

  /* --------------------------
     Delete single
     -------------------------- */
  const handleDelete = async (id: string) => {
    if (!confirm("Delete this craftsman? This cannot be undone.")) return;
    try {
      await deleteCraftsman(id);
      toast.success("Deleted.");
      loadCraftsmen();
    } catch (err) {
      console.error("delete failed", err);
      toast.error("Delete failed.");
    }
  };

  /* --------------------------
     Bulk delete
     -------------------------- */
  const handleBulkDelete = async () => {
    if (selectedIds.length === 0) return;
    if (!isAdminUI) {
      if (!confirm("You are not an admin in UI. Backend will enforce. Proceed?")) return;
    } else {
      if (!confirm(`Delete ${selectedIds.length} craftsmen? This cannot be undone.`)) return;
    }

    let success = 0;
    let failed = 0;
    for (const id of selectedIds) {
      try {
        await deleteCraftsman(id);
        success++;
      } catch (err) {
        failed++;
        console.error("bulk delete item failed", id, err);
      }
    }
    toast.success(`Bulk delete complete — ${success} deleted, ${failed} failed.`);
    setSelected({});
    loadCraftsmen();
  };

  /* --------------------------
     Export / Import
     -------------------------- */
  const handleExport = async () => {
    try {
      const blob = await exportCraftsmenCSV({
        q: q || undefined,
        is_inhouse: isInhouseFilter || undefined,
        order: (sortStack[0]?.field as any) || "code",
        direction: (sortStack[0]?.dir as any) || "asc",
      });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `craftsmen_${Date.now()}.csv`;
      a.click();
      URL.revokeObjectURL(url);
      toast.success("Export started.");
    } catch (err) {
      console.error("export failed", err);
      toast.error("Export failed.");
    }
  };

  const handleImport = async (file: File | null) => {
    if (!file) return;
    try {
      const res = await importCraftsmenCSV(file);
      toast.success(`Imported: ${res.result.inserted} inserted, ${res.result.updated} updated`);
      loadCraftsmen();
    } catch (err) {
      console.error("import failed", err);
      toast.error("Import failed.");
    }
  };

  /* --------------------------
     UI helpers
     -------------------------- */
  const isAllOnPageSelected = craftsmen.length > 0 && craftsmen.every((c) => !!selected[c.id]);

  /* --------------------------
     contact/kyc kv state helpers (local)
     -------------------------- */
  // contactKVs and kycKVs are maintained in local state and mapped to objects on save

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
            <h1 className="text-lg font-semibold text-slate-900 dark:text-white">Craftsmen</h1>
            <p className="text-xs text-slate-500 dark:text-slate-400">Manage craftsmen — create, edit, import/export and bulk actions.</p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => fileInputRef.current?.click()}
            className="rounded-lg border border-slate-300 px-3 py-1.5 text-sm hover:bg-slate-100 dark:border-slate-700 dark:hover:bg-slate-800"
            title="Import CSV"
          >
            <Upload size={14} className="inline mr-1" /> Import
          </button>
          <input ref={fileInputRef} type="file" accept=".csv" className="hidden" onChange={(e) => handleImport(e.target.files?.[0] || null)} />

          <button onClick={handleExport} className="rounded-lg border border-slate-300 px-3 py-1.5 text-sm hover:bg-slate-100 dark:border-slate-700 dark:hover:bg-slate-800" title="Export CSV">
            <Download size={14} className="inline mr-1" /> Export
          </button>

          <button onClick={openCreateModal} className="rounded-full bg-slate-900 px-4 py-1.5 text-sm font-semibold text-white hover:bg-slate-800 dark:bg-slate-100 dark:text-slate-900" title="Create craftsman">
            <Plus size={14} className="inline mr-1" /> Add
          </button>
        </div>
      </div>

      {/* Filters */}
      <div className="mb-4 flex items-center gap-3">
        <div className="relative w-64">
          <Search className="absolute left-2 top-2.5 text-slate-400" size={14} />
          <input
            placeholder="Search code or name"
            value={q}
            onChange={(e) => {
              setQ(e.target.value);
            }}
            className="w-full rounded-lg border border-slate-300 bg-white py-2 pl-8 pr-3 text-sm dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200"
          />
        </div>

        <select
          value={String(isInhouseFilter)}
          onChange={(e) => {
            const val = e.target.value;
            setIsInhouseFilter(val === "null" ? null : val === "true");
          }}
          className="rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200"
        >
          <option value="null">All types</option>
          <option value="true">In-house</option>
          <option value="false">External</option>
        </select>

        <div className="ml-auto flex items-center gap-2 text-sm text-slate-600 dark:text-slate-300">
          {selectedIds.length > 0 && (
            <button
              onClick={handleBulkDelete}
              className="rounded-lg border border-rose-300 px-3 py-1 text-xs text-rose-700 hover:bg-rose-50 dark:border-rose-700 dark:text-rose-300"
            >
              <Trash2 size={14} className="inline mr-1" /> Delete ({selectedIds.length})
            </button>
          )}
        </div>
      </div>

      {/* Table */}
      <div className="rounded-xl border border-slate-200 dark:border-slate-700 overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300">
            <tr>
              <th className="px-3 py-2 w-10 text-left">
                <button onClick={toggleSelectAllOnPage} className="rounded p-1 hover:bg-slate-200 dark:hover:bg-slate-700">
                  <Square size={16} />
                </button>
              </th>
              <th className="px-3 py-2 text-left cursor-pointer" onClick={(e) => toggleSort("code", e.shiftKey)}>
                <div className="flex items-center gap-1">
                  Code
                  <span className="ml-1">{getSortDirForField("code") === "asc" ? <ChevronUp size={14} /> : getSortDirForField("code") === "desc" ? <ChevronDown size={14} /> : <ChevronUp size={14} className="opacity-30" />}</span>
                </div>
              </th>
              <th className="px-3 py-2 text-left cursor-pointer" onClick={(e) => toggleSort("name", e.shiftKey)}>
                <div className="flex items-center gap-1">
                  Name
                  <span className="ml-1">{getSortDirForField("name") === "asc" ? <ChevronUp size={14} /> : getSortDirForField("name") === "desc" ? <ChevronDown size={14} /> : <ChevronUp size={14} className="opacity-30" />}</span>
                </div>
              </th>
              <th className="px-3 py-2 text-left">In-house</th>
              <th className="px-3 py-2 text-left">Contact</th>
              <th className="px-3 py-2 text-left">KYC</th>
              <th className="px-3 py-2 text-right cursor-pointer" onClick={(e) => toggleSort("created_at", e.shiftKey)}>
                <div className="flex items-center gap-1 justify-end">
                  Created
                  <span className="ml-1">{getSortDirForField("created_at") === "asc" ? <ChevronUp size={14} /> : getSortDirForField("created_at") === "desc" ? <ChevronDown size={14} /> : <ChevronUp size={14} className="opacity-30" />}</span>
                </div>
              </th>
              <th className="px-3 py-2 text-right">Actions</th>
            </tr>
          </thead>

          <tbody>
            {loading ? (
              <tr>
                <td colSpan={8} className="py-8 text-center text-slate-500">
                  <Loader2 className="animate-spin inline mr-2" /> Loading…
                </td>
              </tr>
            ) : craftsmen.length === 0 ? (
              <tr>
                <td colSpan={8} className="py-8 text-center text-slate-500">
                  No craftsmen found
                </td>
              </tr>
            ) : (
              craftsmen.map((c) => (
                <tr key={c.id} className="border-t border-slate-200 dark:border-slate-800">
                  <td className="px-3 py-2">
                    <input type="checkbox" checked={!!selected[c.id]} onChange={() => toggleRow(c.id)} className="h-4 w-4" />
                  </td>
                  <td className="px-3 py-2">{c.code || "—"}</td>
                  <td className="px-3 py-2">{c.name}</td>
                  <td className="px-3 py-2">{c.is_inhouse ? <span className="text-emerald-600 font-semibold">Yes</span> : <span className="text-slate-500">No</span>}</td>
                  <td className="px-3 py-2 text-xs">
                    {c.contact ? (typeof c.contact === "object" ? (
                      <>
                        {c.contact.phone && <div>📞 {c.contact.phone}</div>}
                        {c.contact.email && <div>✉️ {c.contact.email}</div>}
                        {c.contact.address && <div>📍 {c.contact.address}</div>}
                      </>
                    ) : String(c.contact)) : "—"}
                  </td>
                  <td className="px-3 py-2 text-xs">
                    {c.kyc ? (c.kyc.aadhar || c.kyc.pan || c.kyc.bank_account ? (
                      <>
                        {c.kyc.aadhar && <div>Aadhar: {c.kyc.aadhar}</div>}
                        {c.kyc.pan && <div>PAN: {c.kyc.pan}</div>}
                        {c.kyc.bank_account && <div>Bank: {c.kyc.bank_account}</div>}
                      </>
                    ) : "—") : "—"}
                  </td>
                  <td className="px-3 py-2 text-right">{c.created_at ? new Date(c.created_at).toLocaleDateString() : "—"}</td>
                  <td className="px-3 py-2 text-right">
                    <div className="flex items-center justify-end gap-2">
                      <button onClick={() => openEditModal(c)} className="rounded-lg border border-slate-300 px-2 py-1 text-xs hover:bg-slate-100 dark:border-slate-700 dark:hover:bg-slate-800" title="Edit">
                        <Edit2 size={14} />
                      </button>
                      <button
                        onClick={() => handleDelete(c.id)}
                        className="rounded-lg border border-rose-300 px-2 py-1 text-xs text-rose-600 hover:bg-rose-50 dark:border-rose-700 dark:text-rose-300"
                        title="Delete"
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
          <button disabled={page <= 1} onClick={() => setPage((p) => Math.max(1, p - 1))} className="rounded-lg border border-slate-300 px-3 py-1 hover:bg-slate-100 disabled:opacity-50 dark:border-slate-700">
            Previous
          </button>

          <div>
            Page {page} of {totalPages} · {total} records
          </div>

          <button disabled={page >= totalPages} onClick={() => setPage((p) => Math.min(totalPages, p + 1))} className="rounded-lg border border-slate-300 px-3 py-1 hover:bg-slate-100 disabled:opacity-50 dark:border-slate-700">
            Next
          </button>
        </div>
      )}

      {/* Floating Add FAB */}
      <button onClick={openCreateModal} title="Add craftsman" className="fixed right-6 bottom-6 z-50 inline-flex items-center gap-2 rounded-full bg-slate-900 px-4 py-3 text-sm font-semibold text-white shadow-lg hover:bg-slate-800 dark:bg-slate-100 dark:text-slate-900">
        <Plus size={16} /> Add
      </button>

      {/* Modal */}
      {modalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="w-full max-w-2xl rounded-2xl bg-white p-6 shadow-xl dark:bg-slate-900 dark:border dark:border-slate-700">
            <div className="mb-4 flex items-center justify-between">
              <h2 className="text-lg font-semibold text-slate-900 dark:text-white">{form.id ? "Edit Craftsman" : "Create Craftsman"}</h2>
              <button onClick={() => setModalOpen(false)} className="rounded-full p-1 hover:bg-slate-200 dark:hover:bg-slate-700"><X size={18} /></button>
            </div>

            <form onSubmit={handleSave} className="space-y-4 text-sm">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="mb-1 block text-xs font-medium">Name</label>
                  <input value={form.name} onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))} required className="w-full rounded-lg border border-slate-300 bg-slate-50 px-3 py-2 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100" />
                </div>

                <div>
                  <label className="mb-1 block text-xs font-medium">Code</label>
                  <input value={form.code ?? ""} onChange={(e) => setForm((f) => ({ ...f, code: e.target.value }))} className="w-full rounded-lg border border-slate-300 bg-slate-50 px-3 py-2 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100" />
                </div>
              </div>

              <div className="flex items-center gap-3">
                <input id="is_inhouse" type="checkbox" checked={!!form.is_inhouse} onChange={(e) => setForm((f) => ({ ...f, is_inhouse: e.target.checked }))} />
                <label htmlFor="is_inhouse" className="text-sm">In-house craftsman</label>
              </div>

              {/* Contact & KYC editors */}
              <KVEditor title="Contact" defaults={["phone", "email", "address"]} kvs={contactKVs} onChange={(next) => setContactKVs(next)} />
              <KVEditor title="KYC" defaults={["aadhar", "pan", "bank_account"]} kvs={kycKVs} onChange={(next) => setKycKVs(next)} />

              <div className="flex items-center justify-between pt-3">
                <p className="text-xs text-slate-500 dark:text-slate-400">Contact & KYC converted to JSON on save.</p>
                <div className="flex items-center gap-3">
                  <button type="button" onClick={() => setModalOpen(false)} className="rounded-full border border-slate-300 bg-white px-4 py-2 text-xs hover:bg-slate-100 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200">
                    Cancel
                  </button>
                  <button type="submit" disabled={saving} className="inline-flex items-center gap-2 rounded-full bg-slate-900 px-4 py-2 text-xs font-semibold text-white hover:bg-slate-800 disabled:opacity-60 dark:bg-slate-100 dark:text-slate-900">
                    {saving ? <Loader2 className="animate-spin" size={14} /> : <><Edit2 size={14} /> Save</>}
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

export default AdminCraftsmanPage;
