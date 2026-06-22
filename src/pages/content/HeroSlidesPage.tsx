// src/pages/content/HeroSlidesPage.tsx
import React, { useEffect, useMemo, useRef, useState } from "react";
import { createPortal } from "react-dom";
import {
  Search,
  Filter,
  RefreshCw,
  Plus,
  Edit2,
  Trash2,
  Loader2,
  X,
  Image as ImageIcon,
  Eye,
  UploadCloud,
  Trash,
} from "lucide-react";
import { toast } from "react-hot-toast";

import { AdminPageHeader } from "@/components/admin/AdminPageHeader";
import type { HeroSlide } from "@/api/content/hero-slides.api";
import {
  fetchHeroSlidesAdmin,
  createHeroSlideWithFile,
  updateHeroSlideWithFile,
  deleteHeroSlide,
} from "@/api/content/hero-slides.api";

// Helper: get full image URL (if relative, prepend API base)
const getImageUrl = (url: string | null | undefined) => {
  if (!url) return "";
  if (url.startsWith("http")) return url;
  // If your Vite proxy forwards /uploads, you can keep it relative
  return url; // e.g. "/uploads/hero/abc.jpg" will be proxied
};

/* =========================================================
   TYPES
========================================================= */
interface SlideFormState {
  title: string;
  subtitle: string;
  image_url: string;
  video_url: string;
  is_active: boolean;
  sort_order: number;
  imageFile?: File; // new image to upload
}

const blankForm: SlideFormState = {
  title: "",
  subtitle: "",
  image_url: "",
  video_url: "",
  is_active: true,
  sort_order: 0,
};

const dateFmt = (iso: string) =>
  iso ? new Date(iso).toLocaleDateString("en-IN") : "—";

const HeroSlidesPage: React.FC = () => {
  const [slides, setSlides] = useState<HeroSlide[]>([]);
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState("");
  const [sort] = useState<"sort_order" | "title" | "created_at">("sort_order");
  const [order] = useState<"asc" | "desc">("asc");

  // Modal state
  const [modalOpen, setModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState<"create" | "edit">("create");
  const [currentSlide, setCurrentSlide] = useState<HeroSlide | null>(null);
  const [form, setForm] = useState<SlideFormState>(blankForm);
  const [saving, setSaving] = useState(false);
  const [uploadingImage, setUploadingImage] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const modalContentRef = useRef<HTMLDivElement>(null);

  // ---------- Fetch slides ----------
  const loadSlides = async () => {
    setLoading(true);
    try {
      const res = await fetchHeroSlidesAdmin();
      setSlides(res.slides || []);
    } catch (err) {
      console.error("Failed to load hero slides", err);
      toast.error("Failed to load slides.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadSlides();
  }, []); // no pagination params needed – backend returns all

  // ---------- Local filtering ----------
  const filteredSlides = useMemo(() => {
    if (!search.trim()) return slides;
    const q = search.toLowerCase();
    return slides.filter(
      (s) =>
        (s.title || "").toLowerCase().includes(q) ||
        (s.subtitle || "").toLowerCase().includes(q)
    );
  }, [slides, search]);

  // ---------- Modal handlers ----------
  const openCreateModal = () => {
    setModalMode("create");
    setCurrentSlide(null);
    setForm(blankForm);
    setModalOpen(true);
  };

  const openEditModal = (slide: HeroSlide) => {
    setModalMode("edit");
    setCurrentSlide(slide);
    setForm({
      title: slide.title || "",
      subtitle: slide.subtitle || "",
      image_url: slide.image_url || "",
      video_url: slide.video_url || "",
      is_active: slide.is_active,
      sort_order: slide.sort_order,
    });
    setModalOpen(true);
  };

  const closeModal = () => {
    setModalOpen(false);
    setCurrentSlide(null);
    setForm(blankForm);
    setUploadingImage(false);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const handleDelete = async (slide: HeroSlide) => {
    if (!window.confirm(`Delete slide "${slide.title || "Untitled"}"?`)) return;
    try {
      await deleteHeroSlide(slide.id);
      toast.success("Slide deleted.");
      loadSlides();
    } catch (err) {
      console.error(err);
      toast.error("Failed to delete slide.");
    }
  };

  const handleImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith("image/")) {
      toast.error("Only image files are allowed.");
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      toast.error("Image must be less than 5MB.");
      return;
    }

    // Preview immediately
    const reader = new FileReader();
    reader.onload = (event) => {
      setForm((prev) => ({
        ...prev,
        image_url: event.target?.result as string,
        imageFile: file,
      }));
    };
    reader.readAsDataURL(file);
  };

  const handleRemoveImage = () => {
    setForm((prev) => ({
      ...prev,
      image_url: "",
      imageFile: undefined,
    }));
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.title.trim()) {
      toast.error("Title is required.");
      return;
    }

    setSaving(true);
    try {
      const payload = {
        title: form.title.trim(),
        subtitle: form.subtitle.trim() || undefined,
        video_url: form.video_url.trim() || undefined,
        sort_order: form.sort_order,
        is_active: form.is_active,
      };

      if (modalMode === "create") {
        await createHeroSlideWithFile(payload, form.imageFile);
        toast.success("Slide created.");
      } else if (modalMode === "edit" && currentSlide) {
        await updateHeroSlideWithFile(currentSlide.id, payload, form.imageFile);
        toast.success("Slide updated.");
      }

      closeModal();
      loadSlides();
    } catch (err: any) {
      console.error(err);
      toast.error(err?.message || "Failed to save slide.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="relative">
      <AdminPageHeader
        title="Hero Slides"
        subtitle="Manage the main promotional banner slides on the homepage."
        breadcrumbs={[{ label: "Dashboard", path: "/" }, { label: "Hero Slides" }]}
        actions={
          <button
            onClick={openCreateModal}
            className="flex items-center gap-2 rounded-full bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 px-5 py-2.5 text-sm font-semibold text-white shadow-md hover:brightness-110"
          >
            <Plus size={16} /> New Slide
          </button>
        }
      />

      <div className="px-6 pt-4 pb-8 space-y-6">
        {/* Search & Refresh */}
        <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" size={18} />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search slides by title or subtitle…"
              className="w-full rounded-full border border-slate-300 bg-white py-3 pl-10 pr-3 text-base shadow-sm focus:border-sky-500 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-50"
            />
          </div>
          <button
            onClick={loadSlides}
            disabled={loading}
            className="flex items-center gap-2 rounded-full border border-slate-300 bg-white px-4 py-2.5 text-sm font-medium shadow-sm hover:bg-slate-50 disabled:opacity-60 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200"
          >
            {loading ? <Loader2 className="animate-spin" size={16} /> : <RefreshCw size={16} />}
            Refresh
          </button>
        </div>

        {/* Table */}
        <div className="overflow-hidden rounded-2xl border border-slate-300 bg-white shadow-sm dark:border-slate-700 dark:bg-slate-900">
          <div className="overflow-x-auto">
            <table className="min-w-full text-left text-sm text-slate-800 dark:text-slate-200">
              <thead className="bg-slate-100 text-xs uppercase tracking-wide text-slate-600 dark:bg-slate-800 dark:text-slate-400">
                <tr>
                  <th className="px-4 py-3">Image</th>
                  <th className="px-4 py-3">Title</th>
                  <th className="px-4 py-3">Subtitle</th>
                  <th className="px-4 py-3">Status</th>
                  <th className="px-4 py-3">Order</th>
                  <th className="px-4 py-3">Created</th>
                  <th className="px-4 py-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr>
                    <td colSpan={7} className="py-8 text-center">
                      <Loader2 className="mx-auto animate-spin" />
                    </td>
                  </tr>
                ) : filteredSlides.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="py-8 text-center">No slides found</td>
                  </tr>
                ) : (
                  filteredSlides.map((slide) => (
                    <tr key={slide.id} className="border-t border-slate-200 hover:bg-slate-50 dark:border-slate-700 dark:hover:bg-slate-800">
                      <td className="px-4 py-3">
                        {slide.image_url ? (
                          <img
                            src={getImageUrl(slide.image_url)}
                            alt={slide.title || ""}
                            className="h-10 w-16 rounded object-cover"
                            onError={(e) => ((e.target as HTMLImageElement).style.display = "none")}
                          />
                        ) : (
                          <div className="flex h-10 w-16 items-center justify-center rounded bg-slate-100 text-slate-400">
                            <ImageIcon size={18} />
                          </div>
                        )}
                      </td>
                      <td className="px-4 py-3 font-medium">{slide.title || "—"}</td>
                      <td className="px-4 py-3 text-xs text-slate-500">{slide.subtitle || "—"}</td>
                      <td className="px-4 py-3">
                        <span
                          className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-medium ${
                            slide.is_active
                              ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300"
                              : "bg-slate-100 text-slate-500 dark:bg-slate-700 dark:text-slate-400"
                          }`}
                        >
                          <Eye size={12} />
                          {slide.is_active ? "Active" : "Hidden"}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-xs">{slide.sort_order}</td>
                      <td className="px-4 py-3 text-xs whitespace-nowrap">{dateFmt(slide.created_at)}</td>
                      <td className="px-4 py-3 text-right space-x-2 whitespace-nowrap">
                        <button
                          onClick={() => openEditModal(slide)}
                          className="inline-flex items-center gap-1 rounded-full border border-slate-300 px-3 py-1.5 text-xs hover:bg-slate-100"
                        >
                          <Edit2 size={14} /> Edit
                        </button>
                        <button
                          onClick={() => handleDelete(slide)}
                          className="inline-flex items-center gap-1 rounded-full border border-rose-300 bg-rose-50 px-3 py-1.5 text-xs text-rose-700 hover:bg-rose-100"
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
      </div>

      {/* Modal – Create / Edit */}
      {modalOpen &&
        createPortal(
          <div className="fixed inset-0 z-[1000] flex items-start justify-center bg-black/40 backdrop-blur-sm p-4">
            <div
              ref={modalContentRef}
              className="w-full max-w-xl rounded-2xl border border-slate-300 bg-white p-6 shadow-xl dark:border-slate-700 dark:bg-slate-950 my-8 mx-auto max-h-[90vh] overflow-y-auto"
            >
              <div className="mb-6 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <img src="/logo_minalgems.png" className="h-10 w-auto" alt="logo" />
                  <div>
                    <h2 className="text-xl font-semibold">{modalMode === "create" ? "Create Hero Slide" : "Edit Hero Slide"}</h2>
                    <p className="text-sm text-slate-500">Configure banner display on the homepage.</p>
                  </div>
                </div>
                <button onClick={closeModal} className="rounded-full border border-slate-300 p-2 hover:bg-slate-100">
                  <X size={18} />
                </button>
              </div>

              <form onSubmit={handleSubmit} className="space-y-4 text-sm">
                {/* Title */}
                <div>
                  <label className="block text-sm font-medium mb-1">Title *</label>
                  <input
                    required
                    value={form.title}
                    onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))}
                    className="w-full rounded-lg border border-slate-300 bg-slate-50 px-3 py-2 dark:border-slate-700 dark:bg-slate-900"
                    placeholder="e.g. Summer Collection"
                  />
                </div>

                {/* Subtitle */}
                <div>
                  <label className="block text-sm font-medium mb-1">Subtitle</label>
                  <input
                    value={form.subtitle}
                    onChange={(e) => setForm((f) => ({ ...f, subtitle: e.target.value }))}
                    className="w-full rounded-lg border border-slate-300 bg-slate-50 px-3 py-2 dark:border-slate-700 dark:bg-slate-900"
                    placeholder="e.g. Up to 50% off"
                  />
                </div>

                {/* Image upload with preview */}
                <div>
                  <label className="block text-sm font-medium mb-1">Image</label>
                  <div className="flex flex-col gap-3">
                    <div className="flex items-start gap-4">
                      {form.image_url ? (
                        <div className="relative h-24 w-32 rounded-lg border border-slate-200 overflow-hidden bg-slate-100">
                          <img
                            src={form.image_url}
                            alt="Preview"
                            className="h-full w-full object-cover"
                            onError={(e) => ((e.target as HTMLImageElement).style.display = "none")}
                          />
                          <button
                            type="button"
                            onClick={handleRemoveImage}
                            className="absolute top-1 right-1 rounded-full bg-black/60 p-1 text-white hover:bg-black/80"
                          >
                            <Trash size={12} />
                          </button>
                        </div>
                      ) : (
                        <div className="flex h-24 w-32 items-center justify-center rounded-lg border border-dashed border-slate-300 bg-slate-50 text-slate-400">
                          <ImageIcon size={24} />
                        </div>
                      )}

                      <div className="flex-1">
                        <input
                          type="file"
                          accept="image/*"
                          ref={fileInputRef}
                          onChange={handleImageSelect}
                          className="hidden"
                          id="hero-image-upload"
                        />
                        <label
                          htmlFor="hero-image-upload"
                          className="inline-flex cursor-pointer items-center gap-2 rounded-full border border-slate-300 bg-white px-4 py-2 text-sm font-medium hover:bg-slate-50"
                        >
                          <UploadCloud size={16} />
                          {form.imageFile || form.image_url ? "Change Image" : "Upload Image"}
                        </label>
                        <p className="text-xs text-slate-500 mt-1">JPG, PNG, WEBP up to 5MB</p>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Video URL */}
                <div>
                  <label className="block text-sm font-medium mb-1">Video URL (optional)</label>
                  <input
                    type="url"
                    value={form.video_url}
                    onChange={(e) => setForm((f) => ({ ...f, video_url: e.target.value }))}
                    className="w-full rounded-lg border border-slate-300 bg-slate-50 px-3 py-2 dark:border-slate-700 dark:bg-slate-900"
                    placeholder="https://example.com/video.mp4"
                  />
                </div>

                {/* Sort Order & Active */}
                <div className="flex items-center gap-4">
                  <div className="flex-1">
                    <label className="block text-sm font-medium mb-1">Sort Order</label>
                    <input
                      type="number"
                      value={form.sort_order}
                      onChange={(e) => setForm((f) => ({ ...f, sort_order: Number(e.target.value || 0) }))}
                      className="w-full rounded-lg border border-slate-300 bg-slate-50 px-3 py-2 dark:border-slate-700 dark:bg-slate-900"
                    />
                  </div>
                  <div className="flex items-center gap-2 pt-6">
                    <label className="relative inline-flex cursor-pointer items-center">
                      <input
                        type="checkbox"
                        checked={form.is_active}
                        onChange={(e) => setForm((f) => ({ ...f, is_active: e.target.checked }))}
                        className="peer sr-only"
                      />
                      <div className="peer h-6 w-11 rounded-full bg-gray-200 after:absolute after:left-[2px] after:top-[2px] after:h-5 after:w-5 after:rounded-full after:border after:border-gray-300 after:bg-white after:transition-all after:content-[''] peer-checked:bg-emerald-600 peer-checked:after:translate-x-full peer-checked:after:border-white"></div>
                    </label>
                    <span className="text-sm font-medium">Active</span>
                  </div>
                </div>

                <div className="flex justify-end gap-3 pt-4">
                  <button
                    type="button"
                    onClick={closeModal}
                    className="rounded-full border border-slate-300 bg-white px-5 py-2 text-sm font-medium hover:bg-slate-100"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={saving || uploadingImage}
                    className="rounded-full bg-slate-900 px-5 py-2 text-sm font-semibold text-white hover:bg-slate-800 disabled:opacity-60"
                  >
                    {saving ? <Loader2 className="animate-spin" size={16} /> : "Save Slide"}
                  </button>
                </div>
              </form>
            </div>
          </div>,
          document.body
        )}
    </div>
  );
};

export default HeroSlidesPage;