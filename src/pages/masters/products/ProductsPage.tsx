// src/pages/ProductsPage.tsx

import React, { useEffect, useMemo, useRef, useState } from "react";
import {
  Search,
  Filter,
  RefreshCw,
  Plus,
  Edit2,
  Trash2,
  Package,
  CheckCircle2,
  X,
  Loader2,
  Upload,
  Download,
  Image as ImageIcon,
  ImagePlus,
  Trash,
  Star,
  ExternalLink,
} from "lucide-react";
import { toast } from "react-hot-toast";

import { AdminPageHeader } from "@/components/admin/AdminPageHeader";

import type {
  Product,
  TradeType as ProductTradeType,
  ProductAsset,
} from "@/api/masters/products.api";
import {
  fetchProductsAdmin,
  createProductAdmin,
  updateProductAdmin,
  deleteProductAdmin,
  fetchProductAssets,
  uploadProductAssets,
  setPrimaryProductAsset,
  deleteProductAsset,
} from "@/api/masters/products.api";

import type { Category } from "@/api/masters/categories.api";
import { fetchCategories } from "@/api/masters/categories.api";

const TRADE_TYPE_OPTIONS: { value: ProductTradeType | ""; label: string }[] = [
  { value: "", label: "All trade types" },
  { value: "import", label: "Import" },
  { value: "export", label: "Export" },
  { value: "both", label: "Both" },
];

// Base path for public product page, e.g. "/products"
const PUBLIC_PRODUCT_BASE_PATH =
  import.meta.env.VITE_PUBLIC_PRODUCT_BASE_PATH || "/products";

interface ProductFormState {
  title: string;
  slug: string;
  sku: string;
  price: number;
  currency: string;
  short_description: string;
  description: string;
  category_id: string;
  trade_type: ProductTradeType;
  is_published: boolean;
  available_qty: number;
  moq: number;
}

const blankProductForm: ProductFormState = {
  title: "",
  slug: "",
  sku: "",
  price: 0,
  currency: "INR",
  short_description: "",
  description: "",
  category_id: "",
  trade_type: "both",
  is_published: false,
  available_qty: 0,
  moq: 1,
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

const ProductsPage: React.FC = () => {
  const [products, setProducts] = useState<Product[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [limit] = useState(20);

  const [q, setQ] = useState("");
  const [categoryFilter, setCategoryFilter] = useState<string>("");
  const [tradeType, setTradeType] = useState<ProductTradeType | "">("");
  const [publishedFilter, setPublishedFilter] = useState<"" | "true" | "false">(
    ""
  );
  const [loading, setLoading] = useState(false);

  // Categories for dropdown
  const [categories, setCategories] = useState<Category[]>([]);
  const [categoriesLoading, setCategoriesLoading] = useState(false);

  // Product modal
  const [modalOpen, setModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState<"create" | "edit">("create");
  const [currentProduct, setCurrentProduct] = useState<Product | null>(null);
  const [form, setForm] = useState<ProductFormState>(blankProductForm);
  const [saving, setSaving] = useState(false);

  // Assets modal
  const [assetModalOpen, setAssetModalOpen] = useState(false);
  const [assetProduct, setAssetProduct] = useState<Product | null>(null);
  const [assets, setAssets] = useState<ProductAsset[]>([]);
  const [assetsLoading, setAssetsLoading] = useState(false);
  const [assetsSaving, setAssetsSaving] = useState(false);
  const assetsFileInputRef = useRef<HTMLInputElement | null>(null);

  // CSV Import
  const [importing, setImporting] = useState(false);
  const [importSummary, setImportSummary] = useState<string | null>(null);
  const csvFileInputRef = useRef<HTMLInputElement | null>(null);

  const pageCount = useMemo(
    () => (total > 0 ? Math.ceil(total / limit) : 1),
    [total, limit]
  );

  async function loadProducts(opts?: { keepPage?: boolean }) {
    setLoading(true);
    try {
      const res = await fetchProductsAdmin({
        q,
        category_id: categoryFilter || undefined,
        trade_type: tradeType || undefined,
        is_published:
          publishedFilter === ""
            ? undefined
            : publishedFilter === "true"
            ? true
            : false,
        page: opts?.keepPage ? page : 1,
        limit,
      });

      setProducts(res.products || []);
      setTotal(res.total || 0);
      if (!opts?.keepPage) setPage(res.page || 1);
    } catch (err) {
      console.error("Failed to load products", err);
      toast.error("Failed to load products.");
    } finally {
      setLoading(false);
    }
  }

  async function loadCategoriesForFilter() {
    setCategoriesLoading(true);
    try {
      const res = await fetchCategories({
        page: 1,
        limit: 200,
        includeCounts: false,
      });
      setCategories(res.categories || []);
    } catch (err) {
      console.error("Failed to load categories", err);
      toast.error("Failed to load categories.");
    } finally {
      setCategoriesLoading(false);
    }
  }

  async function loadAssets(productId: string) {
    setAssetsLoading(true);
    try {
      const res = await fetchProductAssets(productId);
      setAssets(res.assets || []);
    } catch (err) {
      console.error("Failed to load assets", err);
      toast.error("Failed to load product assets.");
    } finally {
      setAssetsLoading(false);
    }
  }

  useEffect(() => {
    loadProducts();
    loadCategoriesForFilter();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    loadProducts();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tradeType, categoryFilter, publishedFilter]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    loadProducts();
  };

  const openCreateModal = () => {
    setModalMode("create");
    setCurrentProduct(null);
    setForm(blankProductForm);
    setModalOpen(true);
  };

  const openEditModal = (p: Product) => {
    setModalMode("edit");
    setCurrentProduct(p);
    setForm({
      title: p.title,
      slug: p.slug,
      sku: p.sku || "",
      price: Number(p.price),
      currency: p.currency || "INR",
      short_description: p.short_description || "",
      description: p.description || "",
      category_id: p.category_id || "",
      trade_type: (p.trade_type || "both") as ProductTradeType,
      is_published: !!p.is_published,
      available_qty: Number(p.available_qty ?? 0),
      moq: Number(p.moq ?? 1),
    });
    setModalOpen(true);
  };

  const handleDelete = async (p: Product) => {
    if (!window.confirm(`Delete product "${p.title}"?`)) return;
    try {
      await deleteProductAdmin(p.id);
      setProducts((prev) => prev.filter((x) => x.id !== p.id));
      setTotal((t) => Math.max(0, t - 1));
      toast.success("Product deleted.");
    } catch (err) {
      console.error("Failed to delete product", err);
      toast.error("Failed to delete product.");
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
  e.preventDefault();
  if (!form.title.trim()) {
    toast.error("Title is required.");
    return;
  }
  if (!isFinite(Number(form.price))) {
    toast.error("Price is required and must be numeric.");
    return;
  }

  setSaving(true);
  try {
    const payload = {
      title: form.title.trim(),
      slug: form.slug.trim() || slugifyClient(form.title),
      price: Number(form.price),
      currency: form.currency || "INR",
      short_description: form.short_description || undefined,
      description: form.description || undefined,
      sku: form.sku || undefined,
      category_id: form.category_id || undefined,
      trade_type: form.trade_type,
      is_published: form.is_published,
      available_qty: form.available_qty,
      moq: form.moq,
    };

    if (modalMode === "create") {
      const res = await createProductAdmin(payload);
      // Debug log to help identify response shape
      console.debug("createProductAdmin response:", res);
      const createdProduct = (res && (res.product ?? res)) as Product | undefined;

      if (createdProduct) {
        // Prefer to insert createdProduct into UI, but also reload the list to be safe
        setProducts((prev) => [createdProduct, ...prev]);
        setTotal((t) => t + 1);
      } else {
        console.warn("createProductAdmin returned no product field; reloading list.");
      }

      toast.success("Product created.");
      // Refresh list to make sure server-side persisted state is reflected
      await loadProducts({ page: 1 });
    } else if (modalMode === "edit" && currentProduct) {
      const res = await updateProductAdmin(currentProduct.id, payload);
      console.debug("updateProductAdmin response:", res);
      const updatedProduct = (res && (res.product ?? res)) as Product | undefined;

      if (updatedProduct) {
        setProducts((prev) =>
          prev.map((p) => (p.id === currentProduct.id ? updatedProduct : p))
        );
      } else {
        console.warn("updateProductAdmin returned no product field; reloading list.");
      }

      toast.success("Product updated.");
      // reload current page to pick up any server-side differences and avoid stale data
      await loadProducts({ page });
    }

    setModalOpen(false);
    setCurrentProduct(null);
    setForm(blankProductForm);
  } catch (err) {
    console.error("Failed to save product", err);
    toast.error("Failed to save product.");
  } finally {
    setSaving(false);
  }
};


  const handleTogglePublished = async (p: Product) => {
    try {
      const updated = await updateProductAdmin(p.id, {
        is_published: !p.is_published,
      });
      setProducts((prev) =>
        prev.map((x) => (x.id === p.id ? updated.product : x))
      );
      toast.success(
        updated.product.is_published
          ? "Product is now published."
          : "Product set to draft."
      );
    } catch (err) {
      console.error("Failed to toggle published", err);
      toast.error("Failed to update publish status.");
    }
  };

  const findCategoryName = (id?: string | null) => {
    if (!id) return "—";
    const c = categories.find((cat) => cat.id === id);
    return c ? c.name : "—";
  };

  // ASSET MANAGER
  const openAssetsModal = (p: Product) => {
    setAssetProduct(p);
    setAssetModalOpen(true);
    setAssets([]);
    loadAssets(p.id);
  };

  const handleAssetsUploadClick = () => {
    assetsFileInputRef.current?.click();
  };

  const handleAssetsFileChange = async (
    e: React.ChangeEvent<HTMLInputElement>
  ) => {
    const files = Array.from(e.target.files || []);
    if (!files.length || !assetProduct) return;
    e.target.value = "";

    setAssetsSaving(true);
    try {
      const formData = new FormData();
      files.forEach((file) => formData.append("files", file));
      formData.append("asset_type", "image");
      formData.append("is_primary", assets.length === 0 ? "true" : "false");
      formData.append("sort_order", "0");
      formData.append("metadata", JSON.stringify({}));

      const res = await uploadProductAssets(assetProduct.id, formData);
      setAssets((prev) => [...prev, ...(res.assets || [])]);
      toast.success("Assets uploaded.");
    } catch (err) {
      console.error("Failed to upload product assets", err);
      toast.error("Failed to upload assets.");
    } finally {
      setAssetsSaving(false);
    }
  };

  const handleSetPrimaryAsset = async (asset: ProductAsset) => {
    try {
      const res = await setPrimaryProductAsset(asset.id);
      const updated = res.asset;
      if (!updated) {
        toast.error("Failed to set primary image.");
        return;
      }
      setAssets((prev) =>
        prev.map((a) => ({
          ...a,
          is_primary: a.id === updated.id,
        }))
      );
      toast.success("Primary image updated.");
    } catch (err) {
      console.error("Failed to set primary asset", err);
      toast.error("Failed to set primary image.");
    }
  };

  const handleDeleteAsset = async (asset: ProductAsset) => {
    if (!window.confirm("Delete this asset?")) return;
    try {
      await deleteProductAsset(asset.id);
      setAssets((prev) => prev.filter((a) => a.id !== asset.id));
      toast.success("Asset deleted.");
    } catch (err) {
      console.error("Failed to delete asset", err);
      toast.error("Failed to delete asset.");
    }
  };

  // CSV EXPORT
  const handleExportCsv = () => {
    if (!products.length) {
      toast("No products to export.", { icon: "ℹ️" });
      return;
    }

    const header = [
      "title",
      "slug",
      "sku",
      "price",
      "currency",
      "short_description",
      "description",
      "category_id",
      "trade_type",
      "is_published",
      "available_qty",
      "moq",
    ];

    const rows = products.map((p) => [
      p.title ?? "",
      p.slug ?? "",
      p.sku ?? "",
      p.price ?? 0,
      p.currency ?? "INR",
      (p.short_description ?? "").replace(/"/g, '""'),
      (p.description ?? "").replace(/"/g, '""'),
      p.category_id ?? "",
      p.trade_type ?? "",
      p.is_published ? "true" : "false",
      p.available_qty ?? 0,
      p.moq ?? 0,
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

    downloadCsv("products_export.csv", csvLines.join("\n"));
    toast.success("Products exported as CSV.");
  };

  // CSV IMPORT
  const handleImportClick = () => {
    setImportSummary(null);
    csvFileInputRef.current?.click();
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

        const title = cols[0]?.replace(/^"|"$/g, "")?.trim();
        if (!title) {
          failed++;
          continue;
        }

        const slug = cols[1]?.replace(/^"|"$/g, "")?.trim() || "";
        const sku = cols[2]?.replace(/^"|"$/g, "").trim() || "";
        const price = Number(cols[3] || 0);
        const currency = cols[4]?.replace(/^"|"$/g, "").trim() || "INR";
        const short_description =
          cols[5]?.replace(/^"|"$/g, "")?.replace(/""/g, '"') || "";
        const description =
          cols[6]?.replace(/^"|"$/g, "")?.replace(/""/g, '"') || "";
        const category_id = cols[7]?.replace(/^"|"$/g, "").trim() || "";
        const trade_type =
          (cols[8]?.replace(/^"|"$/g, "").trim() as ProductTradeType) ||
          "both";
        const is_published =
          cols[9]?.replace(/^"|"$/g, "").trim().toLowerCase() === "true";
        const available_qty = Number(cols[10] || 0);
        const moq = Number(cols[11] || 0);

        try {
          await createProductAdmin({
            title,
            slug: slug || slugifyClient(title),
            sku: sku || undefined,
            price: Number.isNaN(price) ? 0 : price,
            currency,
            short_description: short_description || undefined,
            description: description || undefined,
            category_id: category_id || undefined,
            trade_type,
            is_published,
            available_qty: Number.isNaN(available_qty) ? 0 : available_qty,
            moq: Number.isNaN(moq) ? 0 : moq,
          });
          created++;
        } catch (err) {
          console.error("Failed to import product row", line, err);
          failed++;
        }
      }

      const summary = `Import completed. Created: ${created}, Failed: ${failed}.`;
      setImportSummary(summary);
      toast.success("Products CSV import completed.");
      await loadProducts();
    } catch (err) {
      console.error("Failed to import products CSV", err);
      const msg = "Failed to import CSV. Check console for details.";
      setImportSummary(msg);
      toast.error(msg);
    } finally {
      setImporting(false);
    }
  };

  const pageCountValue = pageCount;

  return (
    <div className="relative">
      <AdminPageHeader
        title="Products"
        subtitle="Manage Minal Gems product catalog, pricing and visibility."
        breadcrumbs={[{ label: "Dashboard", path: "/" }, { label: "Products" }]}
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
              <Plus size={16} /> New Product
            </button>

            <input
              ref={csvFileInputRef}
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
                placeholder="Search products by title or description…"
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
            {/* Category filter */}
            <select
              value={categoryFilter}
              onChange={(e) => setCategoryFilter(e.target.value)}
              className="rounded-full border border-slate-300 bg-white px-4 py-2.5 text-sm text-slate-800 shadow-sm focus:border-sky-500 focus:ring-sky-300 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200"
              disabled={categoriesLoading}
            >
              <option value="">All categories</option>
              {categories.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </select>

            {/* Trade Type */}
            <select
              value={tradeType}
              onChange={(e) =>
                setTradeType(e.target.value as ProductTradeType | "")
              }
              className="rounded-full border border-slate-300 bg-white px-4 py-2.5 text-sm text-slate-800 shadow-sm focus:border-sky-500 focus:ring-sky-300 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200"
            >
              {TRADE_TYPE_OPTIONS.map((opt) => (
                <option key={opt.value || "all"} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </select>

            {/* Published filter */}
            <select
              value={publishedFilter}
              onChange={(e) => setPublishedFilter(e.target.value as any)}
              className="rounded-full border border-slate-300 bg-white px-4 py-2.5 text-sm text-slate-800 shadow-sm focus:border-sky-500 focus:ring-sky-300 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200"
            >
              <option value="">All status</option>
              <option value="true">Published</option>
              <option value="false">Unpublished</option>
            </select>

            <button
              onClick={() => loadProducts({ keepPage: true })}
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
                  <th className="px-6 py-4">Product</th>
                  <th className="px-6 py-4">Price</th>
                  <th className="px-6 py-4">Category</th>
                  <th className="px-6 py-4">Trade</th>
                  <th className="px-6 py-4">Stock</th>
                  <th className="px-6 py-4">Status</th>
                  <th className="px-6 py-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr>
                    <td colSpan={7} className="py-8 text-center text-lg">
                      <Loader2 className="mx-auto animate-spin" />
                      Loading...
                    </td>
                  </tr>
                ) : products.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="py-8 text-center text-lg">
                      No products found
                    </td>
                  </tr>
                ) : (
                  products.map((p) => (
                    <tr
                      key={p.id}
                      className="border-t border-slate-200 hover:bg-slate-50 dark:border-slate-700 dark:hover:bg-slate-800"
                    >
                      <td className="px-6 py-4">
                        <div className="flex flex-col gap-1">
                          <div className="flex items-center gap-2">
                            <span className="inline-flex h-8 w-8 items-center justify-center rounded-full bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-300">
                              <Package size={16} />
                            </span>
                            <span className="font-medium">{p.title}</span>
                          </div>
                          {p.short_description && (
                            <div className="ml-10 text-sm text-slate-500 dark:text-slate-400 line-clamp-2">
                              {p.short_description}
                            </div>
                          )}
                          {p.sku && (
                            <div className="ml-10 text-xs text-slate-400 dark:text-slate-500">
                              SKU: {p.sku}
                            </div>
                          )}
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="text-base font-semibold">
                          {p.currency} {Number(p.price).toLocaleString()}
                        </div>
                        <div className="text-xs text-slate-500">
                          MOQ: {p.moq ?? 1}
                        </div>
                      </td>
                      <td className="px-6 py-4 text-sm">
                        {findCategoryName(p.category_id)}
                      </td>
                      <td className="px-6 py-4">
                        <span className="inline-flex rounded-full border border-slate-300 bg-slate-100 px-3 py-1 text-xs font-medium uppercase tracking-wide text-slate-700 dark:border-slate-600 dark:bg-slate-900 dark:text-slate-200">
                          {p.trade_type}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-sm">
                        <div className="font-medium">
                          {p.available_qty ?? 0}
                        </div>
                        <div className="text-xs text-slate-500">units</div>
                      </td>
                      <td className="px-6 py-4">
                        <button
                          onClick={() => handleTogglePublished(p)}
                          className={`inline-flex items-center gap-1 rounded-full px-3 py-1 text-xs font-medium ${
                            p.is_published
                              ? "border-emerald-300 bg-emerald-50 text-emerald-700 dark:border-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-200"
                              : "border-slate-300 bg-slate-100 text-slate-600 dark:border-slate-600 dark:bg-slate-900 dark:text-slate-300"
                          }`}
                        >
                          <CheckCircle2 size={14} />
                          {p.is_published ? "Published" : "Draft"}
                        </button>
                      </td>
                      <td className="px-6 py-4 text-right space-x-2">
                        {/* View on public site */}
                        <a
                          href={`${PUBLIC_PRODUCT_BASE_PATH}/${p.slug}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-1 rounded-full border border-slate-300 px-3 py-1.5 text-sm hover:bg-slate-100 dark:border-slate-700 dark:hover:bg-slate-800"
                        >
                          <ExternalLink size={14} /> View
                        </a>

                        <button
                          onClick={() => openAssetsModal(p)}
                          className="inline-flex items-center gap-1 rounded-full border border-slate-300 px-3 py-1.5 text-sm hover:bg-slate-100 dark:border-slate-700 dark:hover:bg-slate-800"
                        >
                          <ImageIcon size={14} /> Assets
                        </button>
                        <button
                          onClick={() => openEditModal(p)}
                          className="inline-flex items-center gap-1 rounded-full border border-slate-300 px-3 py-1.5 text-sm hover:bg-slate-100 dark:border-slate-700 dark:hover:bg-slate-800"
                        >
                          <Edit2 size={14} /> Edit
                        </button>
                        <button
                          onClick={() => handleDelete(p)}
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

          {/* Pagination */}
          <div className="flex items-center justify-between px-6 py-3 text-sm text-slate-600 dark:text-slate-400">
            <div>
              Page {page} of {pageCountValue} · {total} products
            </div>
            <div className="space-x-2">
              <button
                disabled={page <= 1 || loading}
                onClick={() => {
                  if (page <= 1) return;
                  setPage((p) => p - 1);
                  loadProducts({ keepPage: false });
                }}
                className="rounded-full border border-slate-300 bg-white px-3 py-1.5 text-xs font-medium hover:bg-slate-50 disabled:opacity-50 dark:border-slate-700 dark:bg-slate-900"
              >
                Previous
              </button>
              <button
                disabled={page >= pageCountValue || loading}
                onClick={() => {
                  if (page >= pageCountValue) return;
                  setPage((p) => p + 1);
                  loadProducts({ keepPage: false });
                }}
                className="rounded-full border border-slate-300 bg-white px-3 py-1.5 text-xs font-medium hover:bg-slate-50 disabled:opacity-50 dark:border-slate-700 dark:bg-slate-900"
              >
                Next
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* MODAL: CREATE / EDIT PRODUCT */}
      {modalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm">
          <div className="w-full max-w-3xl rounded-2xl border border-slate-300 bg-white p-6 shadow-xl dark:border-slate-700 dark:bg-slate-950">
            {/* HEADER */}
            <div className="mb-6 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <img src="/minal_gems_logo.svg" className="h-10 w-auto" />
                <div>
                  <h2 className="text-xl font-semibold text-slate-900 dark:text-white">
                    {modalMode === "create" ? "Create Product" : "Edit Product"}
                  </h2>
                  <p className="text-sm text-slate-500 dark:text-slate-400">
                    Configure product details, pricing, and visibility for
                    Minal Gems.
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
              {/* Row 1: title & slug */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="mb-1 block text-sm font-medium">
                    Title *
                  </label>
                  <input
                    required
                    value={form.title}
                    onChange={(e) =>
                      setForm((f) => ({ ...f, title: e.target.value }))
                    }
                    className="w-full rounded-lg border border-slate-300 bg-slate-50 px-3 py-2 text-base dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100"
                  />
                </div>
                <div>
                  <label className="mb-1 block text-sm font-medium">
                    Slug
                  </label>
                  <input
                    value={form.slug}
                    onChange={(e) =>
                      setForm((f) => ({
                        ...f,
                        slug: slugifyClient(e.target.value),
                      }))
                    }
                    placeholder="auto-generated if empty"
                    className="w-full rounded-lg border border-slate-300 bg-slate-50 px-3 py-2 text-base dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100"
                  />
                </div>
              </div>

              {/* Row 2: price & currency & SKU */}
              <div className="grid grid-cols-3 gap-4">
                <div>
                  <label className="mb-1 block text-sm font-medium">
                    Price *
                  </label>
                  <input
                    type="number"
                    required
                    min={0}
                    value={form.price}
                    onChange={(e) =>
                      setForm((f) => ({
                        ...f,
                        price: Number(e.target.value || 0),
                      }))
                    }
                    className="w-full rounded-lg border border-slate-300 bg-slate-50 px-3 py-2 text-base dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100"
                  />
                </div>
                <div>
                  <label className="mb-1 block text-sm font-medium">
                    Currency
                  </label>
                  <input
                    value={form.currency}
                    onChange={(e) =>
                      setForm((f) => ({
                        ...f,
                        currency: e.target.value.toUpperCase(),
                      }))
                    }
                    className="w-full rounded-lg border border-slate-300 bg-slate-50 px-3 py-2 text-base dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100"
                  />
                </div>
                <div>
                  <label className="mb-1 block text-sm font-medium">
                    SKU (optional)
                  </label>
                  <input
                    value={form.sku}
                    onChange={(e) =>
                      setForm((f) => ({ ...f, sku: e.target.value }))
                    }
                    className="w-full rounded-lg border border-slate-300 bg-slate-50 px-3 py-2 text-base dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100"
                  />
                </div>
              </div>

              {/* Row 3: category & trade type & published */}
              <div className="grid grid-cols-3 gap-4">
                <div>
                  <label className="mb-1 block text-sm font-medium">
                    Category
                  </label>
                  <select
                    value={form.category_id}
                    onChange={(e) =>
                      setForm((f) => ({ ...f, category_id: e.target.value }))
                    }
                    className="w-full rounded-lg border border-slate-300 bg-slate-50 px-3 py-2 text-sm dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100"
                  >
                    <option value="">Uncategorized</option>
                    {categories.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.name}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="mb-1 block text-sm font-medium">
                    Trade Type
                  </label>
                  <select
                    value={form.trade_type}
                    onChange={(e) =>
                      setForm((f) => ({
                        ...f,
                        trade_type: e.target.value as ProductTradeType,
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
                <div className="flex items-center gap-2 pt-6">
                  <input
                    id="is_published"
                    type="checkbox"
                    className="h-4 w-4 rounded border-slate-300 text-slate-900 focus:ring-slate-900 dark:border-slate-600"
                    checked={form.is_published}
                    onChange={(e) =>
                      setForm((f) => ({
                        ...f,
                        is_published: e.target.checked,
                      }))
                    }
                  />
                  <label
                    htmlFor="is_published"
                    className="text-sm text-slate-700 dark:text-slate-200"
                  >
                    Published
                  </label>
                </div>
              </div>

              {/* Row 4: stock */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="mb-1 block text-sm font-medium">
                    Available Quantity
                  </label>
                  <input
                    type="number"
                    min={0}
                    value={form.available_qty}
                    onChange={(e) =>
                      setForm((f) => ({
                        ...f,
                        available_qty: Number(e.target.value || 0),
                      }))
                    }
                    className="w-full rounded-lg border border-slate-300 bg-slate-50 px-3 py-2 text-base dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100"
                  />
                </div>
                <div>
                  <label className="mb-1 block text-sm font-medium">
                    MOQ
                  </label>
                  <input
                    type="number"
                    min={0}
                    value={form.moq}
                    onChange={(e) =>
                      setForm((f) => ({
                        ...f,
                        moq: Number(e.target.value || 0),
                      }))
                    }
                    className="w-full rounded-lg border border-slate-300 bg-slate-50 px-3 py-2 text-base dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100"
                  />
                </div>
              </div>

              {/* Descriptions */}
              <div>
                <label className="mb-1 block text-sm font-medium">
                  Short Description
                </label>
                <textarea
                  rows={2}
                  value={form.short_description}
                  onChange={(e) =>
                    setForm((f) => ({
                      ...f,
                      short_description: e.target.value,
                    }))
                  }
                  className="w-full rounded-lg border border-slate-300 bg-slate-50 px-3 py-2 text-base dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100"
                />
              </div>

              <div>
                <label className="mb-1 block text-sm font-medium">
                  Full Description
                </label>
                <textarea
                  rows={4}
                  value={form.description}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, description: e.target.value }))
                  }
                  className="w-full rounded-lg border border-slate-300 bg-slate-50 px-3 py-2 text-base dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100"
                />
              </div>

              {/* Actions */}
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
                    {saving ? (
                      <Loader2 className="animate-spin" size={16} />
                    ) : modalMode === "create" ? (
                      "Create Product"
                    ) : (
                      "Save Changes"
                    )}
                  </button>
                </div>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: ASSET MANAGER */}
      {assetModalOpen && assetProduct && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm">
          <div className="w-full max-w-3xl rounded-2xl border border-slate-300 bg-white p-6 shadow-xl dark:border-slate-700 dark:bg-slate-950">
            {/* HEADER */}
            <div className="mb-4 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <img src="/minal_gems_logo.svg" className="h-10 w-auto" />
                <div>
                  <h2 className="text-xl font-semibold text-slate-900 dark:text-white">
                    Manage Assets
                  </h2>
                  <p className="text-sm text-slate-500 dark:text-slate-400">
                    Upload images or manage gallery for:{" "}
                    <span className="font-semibold">
                      {assetProduct.title}
                    </span>
                  </p>
                </div>
              </div>
              <button
                onClick={() => setAssetModalOpen(false)}
                className="rounded-full border border-slate-300 p-2 hover:bg-slate-100 dark:border-slate-700 dark:hover:bg-slate-800"
              >
                <X size={18} />
              </button>
            </div>

            {/* UPLOAD BAR */}
            <div className="mb-4 flex items-center justify-between gap-3">
              <div className="flex items-center gap-2 text-sm text-slate-600 dark:text-slate-400">
                <ImageIcon size={16} />
                <span>
                  Primary image is used on listing cards and detail page
                  previews.
                </span>
              </div>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={handleAssetsUploadClick}
                  disabled={assetsSaving}
                  className="flex items-center gap-2 rounded-full border border-slate-300 bg-white px-4 py-2 text-sm font-medium text-slate-700 shadow-sm hover:bg-slate-50 disabled:opacity-60 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200"
                >
                  {assetsSaving ? (
                    <Loader2 className="animate-spin" size={16} />
                  ) : (
                    <ImagePlus size={16} />
                  )}
                  Upload Images
                </button>

                <input
                  ref={assetsFileInputRef}
                  type="file"
                  accept="image/*"
                  multiple
                  className="hidden"
                  onChange={handleAssetsFileChange}
                />
              </div>
            </div>

            {/* ASSETS GRID */}
            <div className="max-h-[420px] overflow-y-auto rounded-xl border border-slate-200 bg-slate-50 p-3 dark:border-slate-700 dark:bg-slate-900">
              {assetsLoading ? (
                <div className="flex flex-col items-center justify-center py-10 text-slate-500 dark:text-slate-400">
                  <Loader2 className="mb-2 animate-spin" size={20} />
                  Loading assets...
                </div>
              ) : assets.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-10 text-slate-500 dark:text-slate-400">
                  <ImageIcon size={24} className="mb-2" />
                  <p>No assets uploaded yet.</p>
                </div>
              ) : (
                <div className="grid grid-cols-2 gap-3 md:grid-cols-3">
                  {assets.map((asset) => {
                    const isImage = asset.asset_type === "image";
                    return (
                      <div
                        key={asset.id}
                        className="flex flex-col overflow-hidden rounded-xl border border-slate-300 bg-white shadow-sm dark:border-slate-700 dark:bg-slate-950"
                      >
                        <div className="relative h-40 w-full bg-slate-100 dark:bg-slate-900">
                          {isImage ? (
                            <img
                              src={asset.url}
                              alt={asset.filename || ""}
                              className="h-full w-full object-cover"
                            />
                          ) : (
                            <div className="flex h-full items-center justify-center text-slate-500 dark:text-slate-400">
                              <ImageIcon size={24} />
                            </div>
                          )}

                          {asset.is_primary && (
                            <div className="absolute left-2 top-2 inline-flex items-center gap-1 rounded-full bg-emerald-600/90 px-2 py-1 text-[10px] font-semibold uppercase tracking-wide text-white">
                              <Star size={12} /> Primary
                            </div>
                          )}
                        </div>

                        <div className="flex items-center justify-between gap-2 px-3 py-2 text-xs">
                          <div className="flex-1 truncate text-slate-600 dark:text-slate-300">
                            {asset.filename || "Image"}
                          </div>
                        </div>

                        <div className="flex items-center justify-between gap-2 px-3 pb-3 text-xs">
                          <button
                            onClick={() => handleSetPrimaryAsset(asset)}
                            className="inline-flex items-center gap-1 rounded-full border border-slate-300 px-2 py-1 text-[11px] font-medium hover:bg-slate-100 dark:border-slate-600 dark:hover:bg-slate-800"
                          >
                            <Star size={12} />
                            Set Primary
                          </button>
                          <button
                            onClick={() => handleDeleteAsset(asset)}
                            className="inline-flex items-center gap-1 rounded-full border border-rose-300 bg-rose-50 px-2 py-1 text-[11px] font-medium text-rose-700 hover:bg-rose-100 dark:border-rose-700 dark:bg-rose-900/40 dark:text-rose-200"
                          >
                            <Trash size={12} />
                            Delete
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            <div className="mt-4 flex justify-end">
              <button
                onClick={() => setAssetModalOpen(false)}
                className="rounded-full border border-slate-300 bg-white px-5 py-2 text-sm font-medium hover:bg-slate-100 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ProductsPage;
