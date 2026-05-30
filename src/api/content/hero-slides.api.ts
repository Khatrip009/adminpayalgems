// src/api/content/hero-slides.api.ts
import { api } from "@/lib/apiClient";

/**
 * Using the existing backend route:
 * GET    /api/masters/hero/admin    → list all slides (admin)
 * POST   /api/masters/hero/admin    → create slide (multipart)
 * PUT    /api/masters/hero/admin/:id → update slide (multipart)
 * DELETE /api/masters/hero/admin/:id → delete slide
 */
const ADMIN_BASE = "/masters/hero/admin";

/* ---------------------------------------------
   Types (same as before)
--------------------------------------------- */
export interface HeroSlide {
  id: string;
  title: string | null;
  subtitle: string | null;
  image_url: string | null;
  video_url: string | null;
  is_active: boolean;
  sort_order: number;
  created_at: string;
  updated_at: string;
}

export interface HeroSlideListResponse {
  ok: boolean;
  slides: HeroSlide[];
}

export interface HeroSlideSingleResponse {
  ok: boolean;
  slide: HeroSlide;
}

/* ---------------------------------------------
   Helpers
--------------------------------------------- */
// Convert a JS object to FormData (for create/update)
function objectToFormData(data: Record<string, any>, file?: File): FormData {
  const fd = new FormData();
  Object.entries(data).forEach(([key, value]) => {
    if (value !== undefined && value !== null) {
      fd.append(key, String(value));
    }
  });
  if (file) {
    fd.append("file", file);
  }
  return fd;
}

/* ---------------------------------------------
   API Methods
--------------------------------------------- */
export async function fetchHeroSlidesAdmin(): Promise<HeroSlideListResponse> {
  return api.get(ADMIN_BASE);
}

export async function createHeroSlideWithFile(
  data: {
    title: string;
    subtitle?: string;
    video_url?: string;
    sort_order?: number;
    is_active?: boolean;
  },
  imageFile?: File
): Promise<HeroSlideSingleResponse> {
  const fd = objectToFormData(data, imageFile);
  return api.post(ADMIN_BASE, fd, {
    headers: { "Content-Type": "multipart/form-data" },
  });
}

export async function updateHeroSlideWithFile(
  id: string,
  data: {
    title?: string;
    subtitle?: string;
    video_url?: string;
    sort_order?: number;
    is_active?: boolean;
  },
  imageFile?: File
): Promise<HeroSlideSingleResponse> {
  const fd = objectToFormData(data, imageFile);
  return api.put(`${ADMIN_BASE}/${id}`, fd, {
    headers: { "Content-Type": "multipart/form-data" },
  });
}

export async function deleteHeroSlide(id: string): Promise<{ ok: boolean }> {
  return api.delete(`${ADMIN_BASE}/${id}`);
}