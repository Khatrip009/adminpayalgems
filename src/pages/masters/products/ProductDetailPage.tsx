import React, { useEffect, useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import {
  ArrowLeft,
  ExternalLink,
  Loader2,
  Save,
  Trash2,
  UploadCloud,
  Image as ImageIcon,
  Video,
  Box,
  FileText,
  Globe,
  Link2,
  Tag,
  Boxes,
  RefreshCw,
  Star,
  Trash,
 
} from "lucide-react";

import { AdminPageHeader } from "@/components/admin/AdminPageHeader";
import { toast } from "@/lib/toast";

import type { Category } from "@/api/masters/categories.api";
import { fetchCategories } from "@/api/masters/categories.api";

import type { Product, ProductAsset } from "@/api/masters/products.api";
import {
  fetchProductBySlug,       // <-- make sure this exists in products.api.ts
  updateProductAdmin,
  deleteProductAdmin,
  fetchProductAssets,
  uploadProductAssets,
  setPrimaryProductAsset,
  deleteProductAsset,
} from "@/api/masters/products.api";

import ProductPreviewModal from "@/components/admin/ProductPreview";

const PUBLIC_SITE_BASE =
  import.meta.env.VITE_PUBLIC_SITE_BASE_URL?.replace(/\/+$/, "") ||
  window.location.origin;

type TradeType = "import" | "export" | "both";

const tradeTypeOptions: { value: TradeType; label: string }[] = [
  { value: "both", label: "Both" },
  { value: "import", label: "Import" },
  { value: "export", label: "Export" },
];



const ProductDetailPage: React.FC = () => {
  const { slug } = useParams<{ slug: string }>();
  const navigate = useNavigate();

  const [previewOpen, setPreviewOpen] = useState(false);

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);

  const [product, setProduct] = useState<Product | null>(null);
  const [form, setForm] = useState<Partial<Product>>({});

  const [categories, setCategories] = useState<Category[]>([]);
  const [categoriesLoading, setCategoriesLoading] = useState(false);

  // Assets
  const [assets, setAssets] = useState<ProductAsset[]>([]);
  const [assetsLoading, setAssetsLoading] = useState(false);
  const [assetUploading, setAssetUploading] = useState(false);
  const [assetType, setAssetType] = useState<
    "image" | "video" | "3d" | "other" | "auto"
  >("auto");
  const [assetIsPrimary, setAssetIsPrimary] = useState(false);
  const [assetSortOrder, setAssetSortOrder] = useState<number>(0);
  const [assetFiles, setAssetFiles] = useState<FileList | null>(null);

  const publicUrl = useMemo(() => {
    if (!product?.slug) return null;
    return `${PUBLIC_SITE_BASE}/products/${product.slug}`;
  }, [product]);

  // ---------------------- LOAD PRODUCT + CATEGORIES + ASSETS ----------------------

  useEffect(() => {
    if (!slug) {
      setLoading(false);
      return;
    }

    let cancelled = false;

    async function loadAll() {
      setLoading(true);
      try {
        // 1) Product by slug (public endpoint, but returns full row p.*)
        const prodRes = await fetchProductBySlug(slug);
        if (cancelled) return;

        if (!prodRes?.product) {
          toast.error("Product not found.");
          setProduct(null);
          setForm({});
          setLoading(false);
          return;
        }

        const p = prodRes.product;
        setProduct(p);
        setForm(p);

        // 2) Categories in parallel
        (async () => {
          setCategoriesLoading(true);
          try {
            const r = await fetchCategories({
              limit: 500,
              include_counts: false,
            });
            setCategories(r.categories || []);
          } catch (err) {
            console.error("Failed to load categories", err);
            toast.error("Failed to load categories.");
          } finally {
            setCategoriesLoading(false);
          }
        })();

        // 3) Assets
        setAssetsLoading(true);
        try {
          const ares = await fetchProductAssets(p.id);
          setAssets(ares.assets || []);
        } catch (err) {
          console.error("Failed to load assets", err);
          toast.error("Failed to load product assets.");
        } finally {
          setAssetsLoading(false);
        }
      } catch (err) {
        console.error("Error loading product by slug", err);
        toast.error("Failed to load product.");
        setProduct(null);
        setForm({});
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    loadAll();

    return () => {
      cancelled = true;
    };
  }, [slug]);

  // ---------------------- HANDLERS ----------------------

  const handleFieldChange = <K extends keyof Product>(
  key: K,
  value: Product[K] | string | number | boolean | null
) => {
  setForm((prev) => {
    const next = { ...prev } as any;

    // coerce known numeric fields to numbers, keep others as-is
    if (key === "price") {
      next[key] = value === "" || value === null ? null : Number(value);
    } else if (key === "moq" || key === "available_qty") {
      next[key] = value === "" || value === null ? 0 : Number(value);
    } else {
      next[key] = value;
    }

    return next;
  });
};


  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!product) return;

    const title = (form.title || "").toString().trim();
    const slug = (form.slug || "").toString().trim();
    const rawPrice = form.price;
    const priceNum = rawPrice === null || rawPrice === "" ? NaN : Number(rawPrice);

    if (!title) {
      toast.error("Title is required.");
      return;
    }
    if (!slug) {
      toast.error("Slug is required.");
      return;
    }
    if (!isFinite(priceNum)) {
      toast.error("Price is required and must be a number.");
      return;
    }

    setSaving(true);
    try {
      const res = await updateProductAdmin(product.id, {
        sku: form.sku ?? null,
        title,
        slug,
        price: priceNum,
        currency: form.currency || "INR",
        short_description: form.short_description ?? null,
        description: form.description ?? null,
        category_id: form.category_id || null,
        trade_type: (form.trade_type as TradeType) || "both",
        is_published: Boolean(form.is_published),
        available_qty: Number(form.available_qty ?? 0),
        moq: Number(form.moq ?? 0),
        metadata: form.metadata ?? product.metadata,
      });

      if (res?.product) {
        setProduct(res.product);
        setForm(res.product);
        toast.success("Product updated successfully.");
      } else {
        // handle unexpected success response shape
        console.warn("updateProductAdmin returned unexpected payload:", res);
        toast.success("Product updated (no product returned).");
      }
    } catch (err: any) {
      console.error("Failed to update product", err);
      const message = err?.message || err?.response?.data?.error || "Failed to update product.";
      toast.error(message);
    } finally {
      setSaving(false);
    }
  };


  const handleDelete = async () => {
    if (!product) return;
    if (
      !window.confirm(
        `Delete product "${product.title}"? This cannot be undone.`
      )
    ) {
      return;
    }

    setDeleting(true);
    try {
      await deleteProductAdmin(product.id);
      toast.success("Product deleted.");
      navigate("/products");
    } catch (err: any) {
      console.error("Failed to delete product", err);
      toast.error(err?.message || "Failed to delete product.");
    } finally {
      setDeleting(false);
    }
  };

  const handleAssetsRefresh = async () => {
    if (!product?.id) return;
    setAssetsLoading(true);
    try {
      const res = await fetchProductAssets(product.id);
      setAssets(res.assets || []);
    } catch (err) {
      console.error("Failed to refresh assets", err);
      toast.error("Failed to refresh assets.");
    } finally {
      setAssetsLoading(false);
    }
  };

  const handleAssetFilesChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setAssetFiles(e.target.files);
  };

  const handleAssetUpload = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!product?.id) return;
    if (!assetFiles || assetFiles.length === 0) {
      toast.error("Please select files to upload.");
      return;
    }

    const formData = new FormData();
    for (let i = 0; i < assetFiles.length; i++) {
      formData.append("files", assetFiles[i]);
    }
    if (assetType !== "auto") {
      formData.append("asset_type", assetType);
    }
    formData.append("is_primary", assetIsPrimary ? "true" : "false");
    formData.append("sort_order", String(assetSortOrder || 0));

    setAssetUploading(true);
    try {
      const res = await uploadProductAssets(product.id, formData);
      toast.success("Assets uploaded successfully.");
      setAssetFiles(null);
      const merged = [...assets, ...(res.assets || [])];
      merged.sort((a, b) => {
        if (a.is_primary && !b.is_primary) return -1;
        if (!a.is_primary && b.is_primary) return 1;
        return (a.sort_order || 0) - (b.sort_order || 0);
      });
      setAssets(merged);
    } catch (err: any) {
      console.error("Failed to upload assets", err);
      toast.error(err?.message || "Failed to upload assets.");
    } finally {
      setAssetUploading(false);
    }
  };

  const handleSetPrimaryAsset = async (assetId: string) => {
    try {
      const res = await setPrimaryProductAsset(assetId);
      toast.success("Primary image updated.");
      const pid = res.asset?.product_id || product?.id;
      if (pid) {
        const refreshed = await fetchProductAssets(pid);
        setAssets(refreshed.assets || []);
      }
    } catch (err: any) {
      console.error("Failed to set primary asset", err);
      toast.error(err?.message || "Failed to set primary asset.");
    }
  };

  const handleDeleteAsset = async (assetId: string) => {
    if (!window.confirm("Delete this asset?")) return;
    try {
      await deleteProductAsset(assetId);
      setAssets((prev) => prev.filter((a) => a.id !== assetId));
      toast.success("Asset deleted.");
    } catch (err: any) {
      console.error("Failed to delete asset", err);
      toast.error(err?.message || "Failed to delete asset.");
    }
  };

  const renderAssetIcon = (asset: ProductAsset) => {
    switch (asset.asset_type) {
      case "image":
        return <ImageIcon className="h-4 w-4" />;
      case "video":
        return <Video className="h-4 w-4" />;
      case "3d":
        return <Box className="h-4 w-4" />;
      default:
        return <FileText className="h-4 w-4" />;
    }
  };

  // ---------------------- RENDER ----------------------

  if (loading) {
    return (
      <div className="px-6 pt-6">
        <div className="flex items-center gap-3 text-slate-700 dark:text-slate-100">
          <Loader2 className="animate-spin" />
          <span>Loading product…</span>
        </div>
      </div>
    );
  }

  if (!product) {
    return (
      <div className="px-6 pt-6">
        <button
          onClick={() => navigate(-1)}
          className="inline-flex items-center gap-2 rounded-full border border-slate-300 px-4 py-2 text-sm text-slate-700 hover:bg-slate-100 dark:border-slate-700 dark:text-slate-200 dark:hover:bg-slate-800"
        >
          <ArrowLeft className="h-4 w-4" />
          Back
        </button>
        <div className="mt-6 text-lg text-slate-700 dark:text-slate-100">
          Product not found.
        </div>
      </div>
    );
  }

  return (
    <div className="relative">
      <AdminPageHeader
        title={product.title || "Product Detail"}
        subtitle="Edit product details, pricing, visibility, and media."
        breadcrumbs={[
          { label: "Dashboard", path: "/" },
          { label: "Products", path: "/products" },
          { label: product.title || "Detail" },
        ]}
        actions={
          <div className="flex items-center gap-2">
            {publicUrl && (
              <button
                type="button"
                onClick={() => setPreviewOpen(true)}
                className="inline-flex items-center gap-1 rounded-full border border-slate-300 bg-white px-4 py-2 text-xs font-medium text-slate-700 shadow-sm hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200"
              >
                <Globe className="h-4 w-4" />
                Preview Product
                <ExternalLink className="h-3 w-3" />
              </button>
            )}

            <button
              type="button"
              onClick={handleDelete}
              disabled={deleting}
              className="inline-flex items-center gap-1 rounded-full border border-rose-200 bg-rose-50 px-4 py-2 text-xs font-semibold text-rose-700 shadow-sm hover:bg-rose-100 disabled:opacity-60 dark:border-rose-700 dark:bg-rose-900/40 dark:text-rose-100"
            >
              {deleting ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Trash2 className="h-4 w-4" />
              )}
              Delete
            </button>

            <button
              type="submit"
              form="product-edit-form"
              disabled={saving}
              className="inline-flex items-center gap-2 rounded-full bg-slate-900 px-5 py-2 text-xs font-semibold text-white shadow-sm hover:bg-slate-800 disabled:opacity-60 dark:bg-slate-100 dark:text-slate-900"
            >
              {saving ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Save className="h-4 w-4" />
              )}
              Save Changes
            </button>
          </div>
        }
      />

      <div className="px-6 pt-4 pb-10 space-y-6">
        {/* Back link */}
        <button
          onClick={() => navigate(-1)}
          className="inline-flex items-center gap-2 rounded-full border border-slate-300 bg-white px-4 py-2 text-xs text-slate-700 shadow-sm hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200"
        >
          <ArrowLeft className="h-4 w-4" />
          Back
        </button>

        <div className="grid gap-6 lg:grid-cols-[minmax(0,2fr),minmax(0,1.2fr)]">
          {/* LEFT: PRODUCT FORM */}
          <form
            id="product-edit-form"
            onSubmit={handleSave}
            className="space-y-6 rounded-2xl border border-slate-300 bg-white p-6 shadow-sm dark:border-slate-700 dark:bg-slate-900"
          >
            <h2 className="text-lg font-semibold text-slate-900 dark:text-slate-50 flex items-center gap-2">
              <Tag className="h-5 w-5" />
              Core Details
            </h2>

            <div className="grid gap-4 md:grid-cols-2">
              <div className="md:col-span-2">
                <label className="block text-xs font-medium uppercase tracking-wide text-slate-500 dark:text-slate-400 mb-1">
                  Title *
                </label>
                <input
                  value={form.title || ""}
                  onChange={(e) => handleFieldChange("title", e.target.value)}
                  className="w-full rounded-lg border border-slate-300 bg-slate-50 px-3 py-2.5 text-sm text-slate-900 focus:border-sky-500 focus:ring-sky-300 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-100"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-medium uppercase tracking-wide text-slate-500 dark:text-slate-400 mb-1">
                  Slug *
                </label>
                <div className="flex items-center gap-2 rounded-lg border border-slate-300 bg-slate-50 px-3 py-2.5 text-sm text-slate-900 focus-within:border-sky-500 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-100">
                  <span className="text-xs text-slate-500">{"/products/"}</span>
                  <input
                    value={form.slug || ""}
                    onChange={(e) => handleFieldChange("slug", e.target.value)}
                    className="flex-1 bg-transparent outline-none"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium uppercase tracking-wide text-slate-500 dark:text-slate-400 mb-1">
                  SKU
                </label>
                <input
                  value={form.sku || ""}
                  onChange={(e) => handleFieldChange("sku", e.target.value)}
                  className="w-full rounded-lg border border-slate-300 bg-slate-50 px-3 py-2.5 text-sm text-slate-900 focus:border-sky-500 focus:ring-sky-300 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-100"
                />
              </div>

              <div>
                <label className="block text-xs font-medium uppercase tracking-wide text-slate-500 dark:text-slate-400 mb-1">
                  Price *
                </label>
                <div className="flex gap-2">
                  <select
                    value={form.currency || "INR"}
                    onChange={(e) =>
                      handleFieldChange("currency", e.target.value)
                    }
                    className="w-24 rounded-lg border border-slate-300 bg-slate-50 px-2 py-2.5 text-sm dark:border-slate-700 dark:bg-slate-950 dark:text-slate-100"
                  >
                    <option value="INR">INR</option>
                    <option value="USD">USD</option>
                    <option value="EUR">EUR</option>
                  </select>
                  <input
                    type="number"
                    min={0}
                    step="0.01"
                    value={form.price ?? ""}
                    onChange={(e) =>
                      handleFieldChange("price", e.target.value)
                    }
                    className="w-full rounded-lg border border-slate-300 bg-slate-50 px-3 py-2.5 text-sm text-slate-900 focus:border-sky-500 focus:ring-sky-300 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-100"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium uppercase tracking-wide text-slate-500 dark:text-slate-400 mb-1">
                  MOQ
                </label>
                <input
                  type="number"
                  min={0}
                  value={form.moq ?? 0}
                  onChange={(e) =>
                    handleFieldChange("moq", Number(e.target.value) || 0)
                  }
                  className="w-full rounded-lg border border-slate-300 bg-slate-50 px-3 py-2.5 text-sm text-slate-900 focus:border-sky-500 focus:ring-sky-300 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-100"
                />
              </div>

              <div>
                <label className="block text-xs font-medium uppercase tracking-wide text-slate-500 dark:text-slate-400 mb-1">
                  Available Qty
                </label>
                <input
                  type="number"
                  min={0}
                  value={form.available_qty ?? 0}
                  onChange={(e) =>
                    handleFieldChange(
                      "available_qty",
                      Number(e.target.value) || 0
                    )
                  }
                  className="w-full rounded-lg border border-slate-300 bg-slate-50 px-3 py-2.5 text-sm text-slate-900 focus:border-sky-500 focus:ring-sky-300 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-100"
                />
              </div>

              {/* Category + trade type */}
              <div>
                <label className="block text-xs font-medium uppercase tracking-wide text-slate-500 dark:text-slate-400 mb-1">
                  Category
                </label>
                <select
                  value={form.category_id || ""}
                  onChange={(e) =>
                    handleFieldChange(
                      "category_id",
                      e.target.value || null
                    )
                  }
                  disabled={categoriesLoading}
                  className="w-full rounded-lg border border-slate-300 bg-slate-50 px-3 py-2.5 text-sm text-slate-900 focus:border-sky-500 focus:ring-sky-300 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-100 disabled:opacity-60"
                >
                  <option value="">
                    {categoriesLoading ? "Loading…" : "Uncategorized"}
                  </option>
                  {categories.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name} ({c.trade_type})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-medium uppercase tracking-wide text-slate-500 dark:text-slate-400 mb-1">
                  Trade Type
                </label>
                <select
                  value={(form.trade_type as TradeType) || "both"}
                  onChange={(e) =>
                    handleFieldChange("trade_type", e.target.value)
                  }
                  className="w-full rounded-lg border border-slate-300 bg-slate-50 px-3 py-2.5 text-sm text-slate-900 focus:border-sky-500 focus:ring-sky-300 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-100"
                >
                  {tradeTypeOptions.map((opt) => (
                    <option key={opt.value} value={opt.value}>
                      {opt.label}
                    </option>
                  ))}
                </select>
              </div>

              {/* Published toggle */}
              <div className="md:col-span-2 flex items-center gap-3 mt-2">
                <label className="inline-flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={Boolean(form.is_published)}
                    onChange={(e) =>
                      handleFieldChange("is_published", e.target.checked)
                    }
                    className="h-4 w-4 rounded border-slate-400 text-slate-900 focus:ring-sky-500 dark:border-slate-600 dark:bg-slate-900 dark:text-slate-100"
                  />
                  <span className="text-sm text-slate-700 dark:text-slate-200">
                    Published on public site
                  </span>
                </label>
              </div>
            </div>

            {/* SHORT + FULL DESCRIPTION */}
            <div className="grid gap-4 md:grid-cols-2 mt-4">
              <div>
                <label className="block text-xs font-medium uppercase tracking-wide text-slate-500 dark:text-slate-400 mb-1">
                  Short Description
                </label>
                <textarea
                  rows={3}
                  value={form.short_description || ""}
                  onChange={(e) =>
                    handleFieldChange("short_description", e.target.value)
                  }
                  className="w-full rounded-lg border border-slate-300 bg-slate-50 px-3 py-2 text-sm text-slate-900 focus:border-sky-500 focus:ring-sky-300 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-100"
                />
              </div>

              <div>
                <label className="block text-xs font-medium uppercase tracking-wide text-slate-500 dark:text-slate-400 mb-1">
                  Full Description
                </label>
                <textarea
                  rows={6}
                  value={form.description || ""}
                  onChange={(e) =>
                    handleFieldChange("description", e.target.value)
                  }
                  className="w-full rounded-lg border border-slate-300 bg-slate-50 px-3 py-2 text-sm text-slate-900 focus:border-sky-500 focus:ring-sky-300 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-100"
                />
              </div>
            </div>

            <p className="mt-2 text-xs text-slate-500 dark:text-slate-400 flex items-center gap-1">
              <Link2 className="h-3 w-3" />
              Slug and title are used for the public product page URL and SEO.
            </p>
          </form>

          {/* RIGHT: ASSET MANAGER */}
          <div className="space-y-6">
            {/* Upload form */}
            <div className="rounded-2xl border border-slate-300 bg-white p-5 shadow-sm dark:border-slate-700 dark:bg-slate-900">
              <h2 className="text-sm font-semibold text-slate-900 dark:text-slate-50 mb-3 flex items-center gap-2">
                <UploadCloud className="h-5 w-5" />
                Upload Media
              </h2>

              <form onSubmit={handleAssetUpload} className="space-y-4">
                <div>
                  <label className="block text-xs font-medium uppercase tracking-wide text-slate-500 dark:text-slate-400 mb-1">
                    Files
                  </label>
                  <input
                    type="file"
                    multiple
                    onChange={handleAssetFilesChange}
                    className="block w-full text-sm text-slate-900 file:mr-3 file:rounded-full file:border-0 file:bg-slate-900 file:px-4 file:py-2 file:text-xs file:font-semibold file:text-white hover:file:bg-slate-800 dark:text-slate-100 dark:file:bg-slate-100 dark:file:text-slate-900"
                  />
                  <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
                    Images, videos, or 3D files up to 200MB each.
                  </p>
                </div>

                <div className="flex flex-wrap gap-3">
                  <div>
                    <label className="block text-xs font-medium uppercase tracking-wide text-slate-500 dark:text-slate-400 mb-1">
                      Asset Type
                    </label>
                    <select
                      value={assetType}
                      onChange={(e) => setAssetType(e.target.value as any)}
                      className="w-40 rounded-lg border border-slate-300 bg-slate-50 px-3 py-2 text-xs text-slate-900 focus:border-sky-500 focus:ring-sky-300 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-100"
                    >
                      <option value="auto">Auto Detect</option>
                      <option value="image">Image</option>
                      <option value="video">Video</option>
                      <option value="3d">3D</option>
                      <option value="other">Other</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-medium uppercase tracking-wide text-slate-500 dark:text-slate-400 mb-1">
                      Sort Order
                    </label>
                    <input
                      type="number"
                      value={assetSortOrder}
                      onChange={(e) =>
                        setAssetSortOrder(Number(e.target.value) || 0)
                      }
                      className="w-24 rounded-lg border border-slate-300 bg-slate-50 px-3 py-2 text-xs text-slate-900 focus:border-sky-500 focus:ring-sky-300 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-100"
                    />
                  </div>
                </div>

                <label className="inline-flex items-center gap-2 mt-1">
                  <input
                    type="checkbox"
                    checked={assetIsPrimary}
                    onChange={(e) => setAssetIsPrimary(e.target.checked)}
                    className="h-3.5 w-3.5 rounded border-slate-400 text-slate-900 focus:ring-sky-500 dark:border-slate-600 dark:bg-slate-900 dark:text-slate-100"
                  />
                  <span className="text-xs text-slate-700 dark:text-slate-200">
                    Mark first uploaded file as primary image
                  </span>
                </label>

                <div className="flex justify-end">
                  <button
                    type="submit"
                    disabled={assetUploading}
                    className="inline-flex items-center gap-2 rounded-full bg-slate-900 px-4 py-2 text-xs font-semibold text-white shadow-sm hover:bg-slate-800 disabled:opacity-60 dark:bg-slate-100 dark:text-slate-900"
                  >
                    {assetUploading ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <UploadCloud className="h-4 w-4" />
                    )}
                    Upload
                  </button>
                </div>
              </form>
            </div>

            {/* Assets list */}
           {/* ----------------------- PRODUCT MEDIA LIST ----------------------- */}
           {/* ----------------------- PRODUCT MEDIA LIST ----------------------- */}
<div className="mt-6 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm dark:border-slate-700 dark:bg-slate-900">
  <div className="flex items-center justify-between gap-2">
    <h3 className="text-base font-semibold text-slate-900 dark:text-slate-50">
      Product Media
    </h3>

    <button
      type="button"
      onClick={handleAssetsRefresh}
      className="inline-flex items-center gap-1 rounded-full border border-slate-300 bg-white px-3 py-1.5 text-xs font-medium text-slate-700 hover:bg-slate-50 dark:border-slate-600 dark:bg-slate-900 dark:text-slate-200"
      disabled={assetsLoading}
    >
      {assetsLoading ? (
        <Loader2 size={14} className="animate-spin" />
      ) : (
        <RefreshCw size={14} />
      )}
      Refresh
    </button>
  </div>

  <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
    Primary image is used as the thumbnail on the public product page.
  </p>

  <div className="mt-4 max-h-[380px] space-y-3 overflow-y-auto">
    {assetsLoading ? (
      <div className="flex flex-col items-center justify-center py-10 text-slate-500 dark:text-slate-400">
        <Loader2 className="mb-2 animate-spin" size={20} />
        Loading media…
      </div>
    ) : assets.length === 0 ? (
      <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-slate-300 bg-slate-50 py-10 text-sm text-slate-500 dark:border-slate-700 dark:bg-slate-900/40 dark:text-slate-300">
        <ImageIcon size={24} className="mb-2" />
        No media uploaded yet.
      </div>
    ) : ( 
      assets.map((asset) => {
        const fileType = (asset.file_type || "").toLowerCase();
        const url = asset.url || "";

        const isImage =
          asset.asset_type === "image" || fileType.startsWith("image/");

        const is3D =
          asset.asset_type === "3d" ||
          fileType.startsWith("model/") ||
          /\.(glb|gltf|usdz)$/i.test(url);

        return (
          <div
            key={asset.id}
            className="flex items-center gap-3 rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 text-sm dark:border-slate-700 dark:bg-slate-950"
          >
            
            {/* Preview box */}
            <div className="h-16 w-16 flex-shrink-0 overflow-hidden rounded-lg bg-slate-200 dark:bg-slate-800">
              {isImage ? (
                <img
                  src={asset.url}
                  alt={asset.filename || "image"}
                  className="h-full w-full object-cover"
                />
              ) : is3D ? (
                <div className="flex h-full w-full flex-col items-center justify-center text-[10px] font-semibold uppercase tracking-wide text-slate-700 dark:text-slate-200">
                  <Box size={18} className="mb-1" />
                  3D Model
                </div>
              ) : (
                <div className="flex h-full w-full flex-col items-center justify-center text-[10px] font-semibold uppercase tracking-wide text-slate-700 dark:text-slate-200">
                  <ImageIcon size={18} className="mb-1" />
                  File
                </div>
              )}
            </div>
            {asset.preferred_resolution === "replacement" && (
            <button
              type="button"
              className="w-full rounded bg-blue-600 px-3 py-1 text-white"
              onClick={() => createReplacementShipment(asset)}
            >
              Create Replacement Shipment
            </button>
          )}
  
            {/* File details */}
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-2">
                <span className="truncate font-medium text-slate-900 dark:text-slate-50">
                  {asset.filename || "Untitled"}
                </span>

                {asset.is_primary && (
                  <span className="inline-flex items-center gap-1 rounded-full bg-emerald-600/90 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-white">
                    <Star size={10} />
                    Primary
                  </span>
                )}
              </div>

              <div className="mt-0.5 flex flex-wrap items-center gap-2 text-[11px] text-slate-500 dark:text-slate-400">
                <span className="rounded-full border border-slate-300 bg-white/60 px-2 py-0.5 dark:border-slate-600 dark:bg-slate-900/60">
                  {asset.asset_type}
                </span>
                {asset.file_type && (
                  <span className="rounded-full border border-slate-300 bg-white/60 px-2 py-0.5 dark:border-slate-600 dark:bg-slate-900/60">
                    {asset.file_type}
                  </span>
                )}

                <a
                  href={asset.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1 text-[11px] font-medium text-sky-600 hover:underline dark:text-sky-400"
                >
                  <ExternalLink size={12} />
                  Preview
                </a>
              </div>
            </div>

            {/* Actions */}
            <div className="flex flex-shrink-0 flex-col items-end gap-2">
              <button
                type="button"
                onClick={() => handleSetPrimaryAsset(asset.id)}
                className="inline-flex items-center gap-1 rounded-full border border-slate-300 bg-white px-3 py-1 text-[11px] font-medium hover:bg-slate-50 dark:border-slate-600 dark:bg-slate-900 dark:text-slate-100 dark:hover:bg-slate-800"
              >
                <Star size={12} />
                Set Primary
              </button>

              <button
                type="button"
                onClick={() => handleDeleteAsset(asset.id)}
                className="inline-flex items-center gap-1 rounded-full border border-rose-300 bg-rose-50 px-3 py-1 text-[11px] font-medium text-rose-700 hover:bg-rose-100 dark:border-rose-700 dark:bg-rose-900/40 dark:text-rose-100"
              >
                <Trash size={12} />
                Delete
              </button>
            </div>
          </div>
        );
      })
    )}
  </div>
</div>


            <div className="mt-3 text-[11px] text-slate-500 dark:text-slate-400">
                Tip: Upload one **hero** image as primary, and additional angles or 3D models
                for richer product detail pages.
            </div>
            </div>

        </div>

        <div className="text-[11px] text-slate-400 dark:text-slate-500">
          <span>ID: </span>
          <code className="rounded bg-slate-100 px-1 py-0.5 dark:bg-slate-800">
            {product.id}
          </code>
          <span className="ml-4">
            Created: {new Date(product.created_at).toLocaleString()}
          </span>
          <span className="ml-4">
            Updated: {new Date(product.updated_at).toLocaleString()}
          </span>
          <ProductPreviewModal
              product={{ ...product, assets }}
              open={previewOpen}
              onClose={() => setPreviewOpen(false)}
            />

        </div>
      </div>
    </div>
  );
};

export default ProductDetailPage;
