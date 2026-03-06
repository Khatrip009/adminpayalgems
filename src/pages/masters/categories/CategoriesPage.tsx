// src/pages/CategoriesPage.tsx

import React, { useEffect, useMemo, useRef, useState } from "react";
import {
  Search,
  Filter,
  RefreshCw,
  Plus,
  Edit2,
  Trash2,
  FolderTree,
  Loader2,
  X,
  Upload,
  Download,
} from "lucide-react";
import { toast } from "react-hot-toast";

import { AdminPageHeader } from "@/components/admin/AdminPageHeader";
import type {
  Category,
  TradeType as CategoryTradeType,
} from "@/api/masters/categories.api";
import {
  fetchCategories,
  createCategory,
  updateCategory,
  deleteCategory,
} from "@/api/masters/categories.api";

const TRADE_TYPE_OPTIONS: { value: CategoryTradeType | ""; label: string }[] = [
  { value: "", label: "All trade types" },
  { value: "import", label: "Import" },
  { value: "export", label: "Export" },
  { value: "both", label: "Both" },
];

interface CategoryFormState {
  name: string;
  slug: string;
  description: string;
  parent_id: string | null;
  sort_order: number;
  trade_type: CategoryTradeType;
}

const blankCategoryForm: CategoryFormState = {
  name: "",
  slug: "",
  description: "",
  parent_id: null,
  sort_order: 0,
  trade_type: "both",
};

function slugifyClient(value: string): string {
  return value
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\-_ ]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "");
}

function downloadCsv(filename: string, csv: string) {
  const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.setAttribute("download", filename);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

const CategoriesPage: React.FC = () => {
  const [categories, setCategories] = useState<Category[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [limit] = useState(50);
  const [q, setQ] = useState("");
  const [tradeType, setTradeType] = useState<CategoryTradeType | "">("");
  const [loading, setLoading] = useState(false);

  // Create/Edit modal
  const [modalOpen, setModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState<"create" | "edit">("create");
  const [currentCategory, setCurrentCategory] = useState<Category | null>(null);
  const [form, setForm] = useState<CategoryFormState>(blankCategoryForm);
  const [saving, setSaving] = useState(false);

  // CSV import
  const [importing, setImporting] = useState(false);
  const [importSummary, setImportSummary] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const pageCount = useMemo(
    () => (total > 0 ? Math.ceil(total / limit) : 1),
    [total, limit]
  );

  async function loadCategories(opts?: { keepPage?: boolean }) {
    setLoading(true);
    try {
      const res = await fetchCategories({
        q,
        trade_type: tradeType || undefined,
        page: opts?.keepPage ? page : 1,
        limit,
        includeCounts: true,
      });
      setCategories(res.categories || []);
      setTotal(res.total || 0);
      if (!opts?.keepPage) setPage(res.page || 1);
    } catch (err) {
      console.error("Failed to load categories", err);
      toast.error("Failed to load categories.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadCategories();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    loadCategories();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tradeType]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    loadCategories();
  };

  const openCreateModal = () => {
    setModalMode("create");
    setCurrentCategory(null);
    setForm(blankCategoryForm);
    setModalOpen(true);
  };

  const openEditModal = (cat: Category) => {
    setModalMode("edit");
    setCurrentCategory(cat);
    setForm({
      name: cat.name,
      slug: cat.slug,
      description: cat.description || "",
      parent_id: cat.parent_id || null,
      sort_order: typeof cat.sort_order === "number" ? cat.sort_order : 0,
      trade_type: (cat.trade_type || "both") as CategoryTradeType,
    });
    setModalOpen(true);
  };

  const handleDelete = async (cat: Category) => {
    if (!window.confirm(`Delete category "${cat.name}"?`)) return;
    try {
      await deleteCategory(cat.id);
      setCategories((prev) => prev.filter((c) => c.id !== cat.id));
      setTotal((t) => Math.max(0, t - 1));
      toast.success("Category deleted.");
    } catch (err) {
      console.error("Failed to delete category", err);
      toast.error("Failed to delete category.");
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name.trim()) return;

    setSaving(true);
    try {
      const payload = {
        name: form.name.trim(),
        slug: form.slug.trim() || slugifyClient(form.name),
        description: form.description || undefined,
        parent_id: form.parent_id || undefined,
        sort_order: form.sort_order,
        trade_type: form.trade_type,
      };

      if (modalMode === "create") {
        const res = await createCategory(payload);
        setCategories((prev) => [res.category, ...prev]);
        setTotal((t) => t + 1);
        toast.success("Category created.");
      } else if (modalMode === "edit" && currentCategory) {
        const res = await updateCategory(currentCategory.id, payload);
        setCategories((prev) =>
          prev.map((c) => (c.id === currentCategory.id ? res.category : c))
        );
        toast.success("Category updated.");
      }

      setModalOpen(false);
      setCurrentCategory(null);
      setForm(blankCategoryForm);
    } catch (err) {
      console.error("Failed to save category", err);
      toast.error("Failed to save category.");
    } finally {
      setSaving(false);
    }
  };

  // CSV EXPORT
  const handleExportCsv = () => {
    if (!categories.length) {
      toast("No categories to export.", { icon: "ℹ️" });
      return;
    }

    const header = [
      "name",
      "slug",
      "trade_type",
      "description",
      "sort_order",
      "product_count",
    ];
    const rows = categories.map((c) => [
      c.name ?? "",
      c.slug ?? "",
      c.trade_type ?? "",
      (c.description ?? "").replace(/"/g, '""'),
      c.sort_order ?? 0,
      c.product_count ?? 0,
    ]);

    const csvLines = [
      header.join(","),
      ...rows.map((r) =>
        r
          .map((v) => {
            const s = String(v ?? "");
            return s.includes(",") || s.includes('"') ? `"${s}"` : s;
          })
          .join(",")
      ),
    ];

    downloadCsv("categories_export.csv", csvLines.join("\n"));
    toast.success("Categories exported as CSV.");
  };

  // CSV IMPORT
  const handleImportClick = () => {
    setImportSummary(null);
    fileInputRef.current?.click();
  };

  const handleImportFileChange = async (
    e: React.ChangeEvent<HTMLInputElement>
  ) => {
    const file = e.target.files?.[0];
    if (!file) return;
    e.target.value = "";

    setImporting(true);
    setImportSummary(null);

    try {
      const text = await file.text();
      const lines = text
        .split(/\r?\n/)
        .map((l) => l.trim())
        .filter((l) => l.length > 0);

      if (lines.length === 0) {
        const msg = "No rows found in CSV.";
        setImportSummary(msg);
        toast(msg, { icon: "ℹ️" });
        return;
      }

      const [, ...dataLines] = lines;

      let created = 0;
      let failed = 0;

      for (const line of dataLines) {
        const cols = line.split(",");

        const name = cols[0]?.replace(/^"|"$/g, "")?.trim();
        if (!name) {
          failed++;
          continue;
        }

        const slug = cols[1]?.replace(/^"|"$/g, "")?.trim() || "";
        const trade_type =
          (cols[2]?.replace(/^"|"$/g, "").trim() as CategoryTradeType) ||
          "both";
        const description = cols[3]?.replace(/^"|"$/g, "") || "";
        const sort_order = Number(cols[4] || 0);

        try {
          await createCategory({
            name,
            slug: slug || slugifyClient(name),
            trade_type,
            description,
            sort_order: Number.isNaN(sort_order) ? 0 : sort_order,
          });
          created++;
        } catch (err) {
          console.error("Failed to import category row", line, err);
          failed++;
        }
      }

      const summary = `Import completed. Created: ${created}, Failed: ${failed}.`;
      setImportSummary(summary);
      toast.success("Categories CSV import completed.");
      await loadCategories();
    } catch (err) {
      console.error("Failed to import categories CSV", err);
      const msg = "Failed to import CSV. Check console for details.";
      setImportSummary(msg);
      toast.error(msg);
    } finally {
      setImporting(false);
    }
  };

  return (
    <div className="relative">
      <AdminPageHeader
        title="Categories"
        subtitle="Organize products by category and trade type."
        breadcrumbs={[{ label: "Dashboard", path: "/" }, { label: "Categories" }]}
        actions={
          <div className="flex items-center gap-2">
            <button
              onClick={handleExportCsv}
              className="flex items-center gap-2 rounded-full border border-slate-300 bg-white px-4 py-2.5 text-sm font-medium text-slate-700 shadow-sm hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200"
            >
              <Download size={16} /> Export CSV
            </button>

            <button
              onClick={handleImportClick}
              disabled={importing}
              className="flex items-center gap-2 rounded-full border border-slate-300 bg-white px-4 py-2.5 text-sm font-medium text-slate-700 shadow-sm hover:bg-slate-50 disabled:opacity-60 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200"
            >
              {importing ? (
                <Loader2 className="animate-spin" size={16} />
              ) : (
                <Upload size={16} />
              )}
              Import CSV
            </button>

            <button
              onClick={openCreateModal}
              className="flex items-center gap-2 rounded-full bg-gradient-to-r from-emerald-500 via-teal-500 to-sky-500 px-5 py-2.5 text-sm font-semibold text-white shadow-md hover:brightness-110"
            >
              <Plus size={16} /> New Category
            </button>

            <input
              ref={fileInputRef}
              type="file"
              accept=".csv,text/csv"
              className="hidden"
              onChange={handleImportFileChange}
            />
          </div>
        }
      />

      <div className="px-6 pt-4 pb-8 space-y-8">
        {/* IMPORT SUMMARY */}
        {importSummary && (
          <div className="rounded-xl border border-emerald-300 bg-emerald-50 px-4 py-3 text-sm text-emerald-800 dark:border-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-100">
            {importSummary}
          </div>
        )}

        {/* FILTER BAR */}
        <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
          <form onSubmit={handleSearchSubmit} className="flex flex-1 items-center gap-3">
            <div className="relative flex-1">
              <Search
                className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500"
                size={18}
              />
              <input
                type="text"
                value={q}
                onChange={(e) => setQ(e.target.value)}
                placeholder="Search categories…"
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

          <button
            onClick={() => loadCategories({ keepPage: true })}
            disabled={loading}
            className="flex items-center gap-2 rounded-full border border-slate-300 bg-white px-4 py-2.5 text-sm font-medium text-slate-800 shadow-sm hover:bg-slate-50 disabled:opacity-60 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200"
          >
            {loading ? <Loader2 className="animate-spin" size={16} /> : <RefreshCw size={16} />}
            Refresh
          </button>
        </div>

        {/* TABLE */}
        <div className="overflow-hidden rounded-2xl border border-slate-300 bg-white shadow-sm dark:border-slate-700 dark:bg-slate-900">
          <div className="overflow-x-auto">
            <table className="min-w-full text-left text-base text-slate-800 dark:text-slate-200">
              <thead className="bg-slate-100 text-sm uppercase tracking-wide text-slate-600 dark:bg-slate-800 dark:text-slate-400">
                <tr>
                  <th className="px-6 py-4">Name</th>
                  <th className="px-6 py-4">Slug</th>
                  <th className="px-6 py-4">Trade Type</th>
                  <th className="px-6 py-4">Description</th>
                  <th className="px-6 py-4">Products</th>
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
                ) : categories.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="py-8 text-center text-lg">
                      No categories found
                    </td>
                  </tr>
                ) : (
                  categories.map((cat) => (
                    <tr
                      key={cat.id}
                      className="border-t border-slate-200 hover:bg-slate-50 dark:border-slate-700 dark:hover:bg-slate-800"
                    >
                      <td className="px-6 py-4 font-medium flex items-center gap-2">
                        <span className="inline-flex h-8 w-8 items-center justify-center rounded-full bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-300">
                          <FolderTree size={16} />
                        </span>
                        {cat.name}
                      </td>
                      <td className="px-6 py-4 text-sm text-slate-500 dark:text-slate-400">
                        {cat.slug}
                      </td>
                      <td className="px-6 py-4">
                        <span className="inline-flex rounded-full border border-slate-300 bg-slate-100 px-3 py-1 text-xs font-medium uppercase tracking-wide text-slate-700 dark:border-slate-600 dark:bg-slate-900 dark:text-slate-200">
                          {cat.trade_type}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-sm text-slate-600 dark:text-slate-300">
                        {cat.description || "—"}
                      </td>
                      <td className="px-6 py-4 text-sm">
                        {typeof cat.product_count === "number"
                          ? cat.product_count
                          : "—"}
                      </td>
                      <td className="px-6 py-4 text-right space-x-2">
                        <button
                          onClick={() => openEditModal(cat)}
                          className="inline-flex items-center gap-1 rounded-full border border-slate-300 px-3 py-1.5 text-sm hover:bg-slate-100 dark:border-slate-700 dark:hover:bg-slate-800"
                        >
                          <Edit2 size={14} /> Edit
                        </button>
                        <button
                          onClick={() => handleDelete(cat)}
                          className="inline-flex items-center gap-1 rounded-full border border-rose-300 bg-rose-50 px-3 py-1.5 text-sm text-rose-700 hover:bg-rose-100 dark:border-rose-700 dark:bg-rose-900/40 dark:text-rose-200"
                        >
                          <Trash2 size={14} /> Delete
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          {/* Simple pagination footer */}
          <div className="flex items-center justify-between px-6 py-3 text-sm text-slate-600 dark:text-slate-400">
            <div>
              Page {page} of {pageCount} · {total} categories
            </div>
            <div className="space-x-2">
              <button
                disabled={page <= 1 || loading}
                onClick={() => {
                  if (page <= 1) return;
                  setPage((p) => p - 1);
                  loadCategories({ keepPage: false });
                }}
                className="rounded-full border border-slate-300 bg-white px-3 py-1.5 text-xs font-medium hover:bg-slate-50 disabled:opacity-50 dark:border-slate-700 dark:bg-slate-900"
              >
                Previous
              </button>
              <button
                disabled={page >= pageCount || loading}
                onClick={() => {
                  if (page >= pageCount) return;
                  setPage((p) => p + 1);
                  loadCategories({ keepPage: false });
                }}
                className="rounded-full border border-slate-300 bg-white px-3 py-1.5 text-xs font-medium hover:bg-slate-50 disabled:opacity-50 dark:border-slate-700 dark:bg-slate-900"
              >
                Next
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* MODAL: CREATE / EDIT CATEGORY */}
      {modalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm">
          <div className="w-full max-w-xl rounded-2xl border border-slate-300 bg-white p-6 shadow-xl dark:border-slate-700 dark:bg-slate-950">
            {/* HEADER */}
            <div className="mb-6 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <img src="/minal_gems_logo.svg" className="h-10 w-auto" />
                <div>
                  <h2 className="text-xl font-semibold text-slate-900 dark:text-white">
                    {modalMode === "create" ? "Create Category" : "Edit Category"}
                  </h2>
                  <p className="text-sm text-slate-500 dark:text-slate-400">
                    Manage product categories for the Minal Gems catalog.
                  </p>
                </div>
              </div>
              <button
                onClick={() => setModalOpen(false)}
                className="rounded-full border border-slate-300 p-2 hover:bg-slate-100 dark:border-slate-700 dark:hover:bg-slate-800"
              >
                <X size={18} />
              </button>
            </div>

            {/* FORM */}
            <form onSubmit={handleSubmit} className="space-y-4 text-base">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-1">Name *</label>
                  <input
                    required
                    value={form.name}
                    onChange={(e) =>
                      setForm((f) => ({ ...f, name: e.target.value }))
                    }
                    className="w-full rounded-lg border border-slate-300 bg-slate-50 px-3 py-2 text-base dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Slug</label>
                  <input
                    value={form.slug}
                    onChange={(e) =>
                      setForm((f) => ({ ...f, slug: slugifyClient(e.target.value) }))
                    }
                    placeholder="auto-generated if empty"
                    className="w-full rounded-lg border border-slate-300 bg-slate-50 px-3 py-2 text-base dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-1">Trade Type</label>
                  <select
                    value={form.trade_type}
                    onChange={(e) =>
                      setForm((f) => ({
                        ...f,
                        trade_type: e.target.value as CategoryTradeType,
                      }))
                    }
                    className="w-full rounded-lg border border-slate-300 bg-slate-50 px-3 py-2 text-sm dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100"
                  >
                    {TRADE_TYPE_OPTIONS.filter((t) => t.value).map((opt) => (
                      <option key={opt.value} value={opt.value}>
                        {opt.label}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Sort Order</label>
                  <input
                    type="number"
                    value={form.sort_order}
                    onChange={(e) =>
                      setForm((f) => ({
                        ...f,
                        sort_order: Number(e.target.value || 0),
                      }))
                    }
                    className="w-full rounded-lg border border-slate-300 bg-slate-50 px-3 py-2 text-base dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">Description</label>
                <textarea
                  rows={3}
                  value={form.description}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, description: e.target.value }))
                  }
                  className="w-full rounded-lg border border-slate-300 bg-slate-50 px-3 py-2 text-base dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100"
                />
              </div>

              <div className="flex items-center justify-between pt-4">
                <p className="text-sm text-slate-500 dark:text-slate-400">
                  Required fields are marked with *
                </p>
                <div className="flex items-center gap-3">
                  <button
                    type="button"
                    onClick={() => setModalOpen(false)}
                    className="rounded-full border border-slate-300 bg-white px-5 py-2 text-sm font-medium hover:bg-slate-100 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={saving}
                    className="rounded-full bg-slate-900 px-5 py-2 text-sm font-semibold text-white hover:bg-slate-800 disabled:opacity-60 dark:bg-slate-100 dark:text-slate-900"
                  >
                    {saving ? <Loader2 className="animate-spin" size={16} /> : "Save Category"}
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

export default CategoriesPage;
