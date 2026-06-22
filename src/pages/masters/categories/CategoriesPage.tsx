// src/pages/masters/categories/CategoriesPage.tsx
import React, { useEffect, useMemo, useRef, useState } from "react";
import { createPortal } from "react-dom";
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
  Image as ImageIcon,
  ImagePlus,
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

// ---------- Constants ----------
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
  image_url: string;
}

const blankCategoryForm: CategoryFormState = {
  name: "",
  slug: "",
  description: "",
  parent_id: null,
  sort_order: 0,
  trade_type: "both",
  image_url: "",
};

// ---------- Helpers ----------
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

  const [modalOpen, setModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState<"create" | "edit">("create");
  const [currentCategory, setCurrentCategory] = useState<Category | null>(null);
  const [form, setForm] = useState<CategoryFormState>(blankCategoryForm);
  const [saving, setSaving] = useState(false);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const modalContentRef = useRef<HTMLDivElement>(null);

  const [importing, setImporting] = useState(false);
  const [importSummary, setImportSummary] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const imageUploadRef = useRef<HTMLInputElement | null>(null);

  const pageCount = useMemo(
    () => (total > 0 ? Math.ceil(total / limit) : 1),
    [total, limit]
  );

  // ---------- Data fetching ----------
  async function loadCategories() {
    setLoading(true);
    try {
      const res = await fetchCategories({
        q,
        trade_type: tradeType || undefined,
        page,
        limit,
        include_counts: true,
      });
      setCategories(res.categories || []);
      setTotal(res.total || 0);
      setPage(res.page || 1);
    } catch (err) {
      console.error("Failed to load categories", err);
      toast.error("Failed to load categories.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadCategories();
  }, []); // initial load

  useEffect(() => {
    setPage(1);
    loadCategories();
  }, [tradeType]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setPage(1);
    loadCategories();
  };

  useEffect(() => {
    if (modalOpen && modalContentRef.current) {
      modalContentRef.current.scrollTop = 0;
    }
  }, [modalOpen]);

  // ---------- Modal handlers ----------
  const openCreateModal = () => {
    setModalMode("create");
    setCurrentCategory(null);
    setForm(blankCategoryForm);
    setImagePreview(null);
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
      image_url: cat.image_url || "",
    });
    setImagePreview(cat.image_url || null);
    setModalOpen(true);
  };

  const handleDelete = async (cat: Category) => {
    if (!window.confirm(`Delete category "${cat.name}"?`)) return;
    try {
      await deleteCategory(cat.id);
      toast.success("Category deleted.");
      loadCategories();
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
        image_url: form.image_url || null,
      };

      if (modalMode === "create") {
        await createCategory(payload);
        toast.success("Category created.");
      } else if (modalMode === "edit" && currentCategory) {
        await updateCategory(currentCategory.id, payload);
        toast.success("Category updated.");
      }

      setModalOpen(false);
      setCurrentCategory(null);
      setForm(blankCategoryForm);
      setImagePreview(null);
      loadCategories();
    } catch (err) {
      console.error("Failed to save category", err);
      toast.error("Failed to save category.");
    } finally {
      setSaving(false);
    }
  };

  // ---------- CSV Export ----------
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
      "image_url",
    ];
    const rows = categories.map((c) => [
      c.name ?? "",
      c.slug ?? "",
      c.trade_type ?? "",
      (c.description ?? "").replace(/"/g, '""'),
      c.sort_order ?? 0,
      c.product_count ?? 0,
      c.image_url ?? "",
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

  // ---------- CSV Import ----------
  const handleImportClick = () => {
    setImportSummary(null);
    fileInputRef.current?.click();
  };

  const handleImportFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
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
        setImportSummary("No rows found in CSV.");
        toast("No rows found.", { icon: "ℹ️" });
        return;
      }

      const headers = lines[0].split(",").map((h) => h.replace(/^"|"$/g, "").trim());
      const dataLines = lines.slice(1);

      let created = 0;
      let failed = 0;

      for (const line of dataLines) {
        const values: string[] = [];
        let inQuote = false;
        let current = "";
        for (let i = 0; i < line.length; i++) {
          const ch = line[i];
          if (ch === '"') {
            inQuote = !inQuote;
          } else if (ch === "," && !inQuote) {
            values.push(current);
            current = "";
          } else {
            current += ch;
          }
        }
        values.push(current);

        const record: any = {};
        headers.forEach((h, idx) => {
          record[h] = values[idx]?.replace(/^"|"$/g, "")?.trim() || "";
        });

        if (!record.name) {
          failed++;
          continue;
        }

        try {
          await createCategory({
            name: record.name,
            slug: record.slug || slugifyClient(record.name),
            trade_type: (record.trade_type as CategoryTradeType) || "both",
            description: record.description || undefined,
            sort_order: parseInt(record.sort_order) || 0,
            image_url: record.image_url || null,
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
      loadCategories();
    } catch (err) {
      console.error("Failed to import categories CSV", err);
      setImportSummary("Failed to import CSV. Check console for details.");
      toast.error("Failed to import CSV.");
    } finally {
      setImporting(false);
    }
  };

  // ---------- Image Upload (base64) ----------
  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith("image/")) {
      toast.error("Please upload an image file (JPEG, PNG, GIF, etc.)");
      return;
    }

    if (file.size > 2 * 1024 * 1024) {
      toast.error("Image must be smaller than 2MB");
      return;
    }

    const reader = new FileReader();
    reader.onload = (event) => {
      const base64 = event.target?.result as string;
      setForm((prev) => ({ ...prev, image_url: base64 }));
      setImagePreview(base64);
      toast.success("Image loaded (will be saved as base64)");
    };
    reader.onerror = () => {
      toast.error("Failed to read image file");
    };
    reader.readAsDataURL(file);
    e.target.value = "";
  };

  // ---------- Render ----------
  return (
    <div className="relative">
      <AdminPageHeader
        title="Categories"
        subtitle="Organize products by category and trade type."
        breadcrumbs={[{ label: "Dashboard", path: "/" }, { label: "Categories" }]}
        actions={
          <div className="flex flex-wrap items-center gap-2">
            <button
              onClick={handleExportCsv}
              className="flex items-center gap-2 rounded-full border border-slate-300 bg-white px-3 py-2 text-sm font-medium text-slate-700 shadow-sm hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200"
            >
              <Download size={16} /> Export CSV
            </button>

            <button
              onClick={handleImportClick}
              disabled={importing}
              className="flex items-center gap-2 rounded-full border border-slate-300 bg-white px-3 py-2 text-sm font-medium text-slate-700 shadow-sm hover:bg-slate-50 disabled:opacity-60 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200"
            >
              {importing ? <Loader2 className="animate-spin" size={16} /> : <Upload size={16} />}
              Import CSV
            </button>

            <button
              onClick={openCreateModal}
              className="flex items-center gap-2 rounded-full bg-gradient-to-r from-emerald-500 via-teal-500 to-sky-500 px-4 py-2 text-sm font-semibold text-white shadow-md hover:brightness-110"
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

      <div className="px-4 sm:px-6 pt-4 pb-8 space-y-8">
        {importSummary && (
          <div className="rounded-xl border border-emerald-300 bg-emerald-50 px-4 py-3 text-sm text-emerald-800 dark:border-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-100">
            {importSummary}
          </div>
        )}

        <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
          <form onSubmit={handleSearchSubmit} className="flex flex-1 items-center gap-3">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" size={18} />
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

          <div className="flex flex-wrap items-center gap-3">
            <select
              value={tradeType}
              onChange={(e) => setTradeType(e.target.value as CategoryTradeType | "")}
              className="rounded-full border border-slate-300 bg-white px-4 py-2.5 text-sm text-slate-800 shadow-sm focus:border-sky-500 focus:ring-sky-300 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200"
            >
              {TRADE_TYPE_OPTIONS.map((opt) => (
                <option key={opt.value} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </select>

            <button
              onClick={loadCategories}
              disabled={loading}
              className="flex items-center gap-2 rounded-full border border-slate-300 bg-white px-4 py-2.5 text-sm font-medium text-slate-800 shadow-sm hover:bg-slate-50 disabled:opacity-60 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200"
            >
              {loading ? <Loader2 className="animate-spin" size={16} /> : <RefreshCw size={16} />}
              Refresh
            </button>
          </div>
        </div>

        {/* Table with horizontal scroll on mobile */}
        <div className="overflow-hidden rounded-2xl border border-slate-300 bg-white shadow-sm dark:border-slate-700 dark:bg-slate-900">
          <div className="overflow-x-auto">
            <div className="min-w-[600px]">
              <table className="w-full text-left text-sm text-slate-800 dark:text-slate-200">
                <thead className="bg-slate-100 text-xs uppercase tracking-wide text-slate-600 dark:bg-slate-800 dark:text-slate-400">
                  <tr>
                    <th className="px-3 py-3 sm:px-4">Image</th>
                    <th className="px-3 py-3 sm:px-4">Name</th>
                    <th className="px-3 py-3 sm:px-4">Slug</th>
                    <th className="px-3 py-3 sm:px-4">Trade Type</th>
                    <th className="px-3 py-3 sm:px-4">Products</th>
                    <th className="px-3 py-3 sm:px-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {loading ? (
                    <tr>
                      <td colSpan={6} className="py-8 text-center">
                        <Loader2 className="mx-auto animate-spin" />
                        <span className="ml-2">Loading...</span>
                      </td>
                    </tr>
                  ) : categories.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="py-8 text-center">
                        No categories found
                      </td>
                    </tr>
                  ) : (
                    categories.map((cat) => (
                      <tr
                        key={cat.id}
                        className="border-t border-slate-200 hover:bg-slate-50 dark:border-slate-700 dark:hover:bg-slate-800"
                      >
                        <td className="px-3 py-3 sm:px-4">
                          {cat.image_url ? (
                            <img
                              src={cat.image_url}
                              alt={cat.name}
                              className="h-10 w-10 rounded object-cover"
                              onError={(e) => {
                                (e.target as HTMLImageElement).style.display = "none";
                              }}
                            />
                          ) : (
                            <div className="flex h-10 w-10 items-center justify-center rounded bg-slate-100 text-slate-400 dark:bg-slate-800">
                              <ImageIcon size={18} />
                            </div>
                          )}
                        </td>
                        <td className="px-3 py-3 sm:px-4 font-medium">
                          <span className="inline-flex items-center gap-2">
                            <FolderTree size={14} className="text-slate-500" />
                            {cat.name}
                          </span>
                        </td>
                        <td className="px-3 py-3 sm:px-4 text-xs text-slate-500 dark:text-slate-400">{cat.slug}</td>
                        <td className="px-3 py-3 sm:px-4">
                          <span className="inline-flex rounded-full border border-slate-300 bg-slate-100 px-2 py-0.5 text-xs font-medium uppercase dark:border-slate-600 dark:bg-slate-900 dark:text-slate-200">
                            {cat.trade_type}
                          </span>
                        </td>
                        <td className="px-3 py-3 sm:px-4 text-xs">{cat.product_count ?? "—"}</td>
                        <td className="px-3 py-3 sm:px-4 text-right space-x-2 whitespace-nowrap">
                          <button
                            onClick={() => openEditModal(cat)}
                            className="inline-flex items-center gap-1 rounded-full border border-slate-300 px-2 py-1 text-xs hover:bg-slate-100 dark:border-slate-700 dark:hover:bg-slate-800"
                          >
                            <Edit2 size={14} /> Edit
                          </button>
                          <button
                            onClick={() => handleDelete(cat)}
                            className="inline-flex items-center gap-1 rounded-full border border-rose-300 bg-rose-50 px-2 py-1 text-xs text-rose-700 hover:bg-rose-100 dark:border-rose-700 dark:bg-rose-900/40 dark:text-rose-200"
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
          </div>

          {/* Pagination */}
          <div className="flex flex-col sm:flex-row items-center justify-between gap-3 px-4 py-3 text-sm text-slate-600 dark:text-slate-400">
            <div>
              Page {page} of {pageCount} · {total} categories
            </div>
            <div className="space-x-2">
              <button
                disabled={page <= 1 || loading}
                onClick={() => {
                  const newPage = Math.max(1, page - 1);
                  setPage(newPage);
                  loadCategories();
                }}
                className="rounded-full border border-slate-300 bg-white px-3 py-1.5 text-xs font-medium hover:bg-slate-50 disabled:opacity-50 dark:border-slate-700 dark:bg-slate-900"
              >
                Previous
              </button>
              <button
                disabled={page >= pageCount || loading}
                onClick={() => {
                  const newPage = Math.min(pageCount, page + 1);
                  setPage(newPage);
                  loadCategories();
                }}
                className="rounded-full border border-slate-300 bg-white px-3 py-1.5 text-xs font-medium hover:bg-slate-50 disabled:opacity-50 dark:border-slate-700 dark:bg-slate-900"
              >
                Next
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Create / Edit Modal */}
      {modalOpen &&
        createPortal(
          <div className="fixed inset-0 z-[1000] flex items-start justify-center bg-black/40 backdrop-blur-sm p-3 sm:p-4">
            <div
              ref={modalContentRef}
              className="w-full max-w-xl rounded-2xl border border-slate-300 bg-white p-4 sm:p-6 shadow-xl dark:border-slate-700 dark:bg-slate-950 my-8 mx-auto max-h-[90vh] overflow-y-auto"
            >
              <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
                <div className="flex items-center gap-3">
                  <img src="/logo_minalgems.png" className="h-8 sm:h-10 w-auto" alt="logo" />
                  <div>
                    <h2 className="text-lg sm:text-xl font-semibold text-slate-900 dark:text-white">
                      {modalMode === "create" ? "Create Category" : "Edit Category"}
                    </h2>
                    <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400">
                      Manage product categories.
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

              <form onSubmit={handleSubmit} className="space-y-4 text-sm">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium mb-1">Name *</label>
                    <input
                      required
                      value={form.name}
                      onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
                      className="w-full rounded-lg border border-slate-300 bg-slate-50 px-3 py-2 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1">Slug</label>
                    <input
                      value={form.slug}
                      onChange={(e) =>
                        setForm((f) => ({ ...f, slug: slugifyClient(e.target.value) }))
                      }
                      placeholder="auto-generated"
                      className="w-full rounded-lg border border-slate-300 bg-slate-50 px-3 py-2 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium mb-1">Trade Type</label>
                    <select
                      value={form.trade_type}
                      onChange={(e) =>
                        setForm((f) => ({ ...f, trade_type: e.target.value as CategoryTradeType }))
                      }
                      className="w-full rounded-lg border border-slate-300 bg-slate-50 px-3 py-2 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100"
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
                        setForm((f) => ({ ...f, sort_order: Number(e.target.value || 0) }))
                      }
                      className="w-full rounded-lg border border-slate-300 bg-slate-50 px-3 py-2 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium mb-1">Category Image</label>
                  <div className="flex flex-wrap items-center gap-3 mb-2">
                    <button
                      type="button"
                      onClick={() => imageUploadRef.current?.click()}
                      className="inline-flex items-center gap-2 rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-sm font-medium text-slate-700 hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200"
                    >
                      <ImagePlus size={18} />
                      Upload Image
                    </button>
                    {form.image_url && (
                      <button
                        type="button"
                        onClick={() => {
                          setForm((prev) => ({ ...prev, image_url: "" }));
                          setImagePreview(null);
                        }}
                        className="text-red-500 hover:text-red-700 text-sm"
                      >
                        Remove
                      </button>
                    )}
                    <input
                      ref={imageUploadRef}
                      type="file"
                      accept="image/*"
                      className="hidden"
                      onChange={handleImageUpload}
                    />
                  </div>
                  {imagePreview && (
                    <div className="mt-2">
                      <p className="text-xs text-slate-500 mb-1">Preview:</p>
                      <img
                        src={imagePreview}
                        alt="Preview"
                        className="h-20 w-20 rounded border object-cover"
                        onError={(e) => {
                          (e.target as HTMLImageElement).style.display = "none";
                          toast.error("Invalid image");
                        }}
                      />
                    </div>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium mb-1">Description</label>
                  <textarea
                    rows={3}
                    value={form.description}
                    onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
                    className="w-full rounded-lg border border-slate-300 bg-slate-50 px-3 py-2 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100"
                  />
                </div>

                <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-4">
                  <p className="text-xs text-slate-500 dark:text-slate-400">* Required</p>
                  <div className="flex items-center gap-3">
                    <button
                      type="button"
                      onClick={() => setModalOpen(false)}
                      className="rounded-full border border-slate-300 bg-white px-4 py-2 text-sm font-medium hover:bg-slate-100 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      disabled={saving}
                      className="rounded-full bg-slate-900 px-4 py-2 text-sm font-semibold text-white hover:bg-slate-800 disabled:opacity-60 dark:bg-slate-100 dark:text-slate-900"
                    >
                      {saving ? <Loader2 className="animate-spin" size={16} /> : "Save Category"}
                    </button>
                  </div>
                </div>
              </form>
            </div>
          </div>,
          document.body
        )}
    </div>
  );
};

export default CategoriesPage;