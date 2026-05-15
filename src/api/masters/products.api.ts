// src/api/products.api.ts
import { apiFetch, API_ROUTES, type ApiResponse } from "@/lib/apiClient";

/* =========================================================
   TYPES
========================================================= */

export type TradeType = "import" | "export" | "both";

export interface Product {
  id: string;
  sku: string | null;
  title: string;
  slug: string;
  description: string | null;
  short_description: string | null;
  category_id: string | null;
  price: number;
  currency: string;
  moq: number;
  available_qty: number;
  is_published: boolean;
  metadata: any;
  created_by?: string | null;
  created_at: string;
  updated_at: string;
  trade_type: TradeType;
  primary_image?: string | null;
  meta_title?: string | null;
  meta_description?: string | null;
  canonical_url?: string | null;
  og_image?: string | null;
  // Gemstone & metal fields
  diamond_pcs: number;
  diamond_carat: number;
  rate: number;
  diamonds: any[];            // array of gemstone objects
  metal_type: string;
  gold_carat: number;         // numeric (e.g., 18, 22)
  total_weight: number;       // in grams
  gold_weight: number;        // in grams
}

export interface ProductAsset {
  id: string;
  product_id: string;
  asset_type: "image" | "video" | "3d" | "other";
  url: string;
  filename: string | null;
  file_type: string | null;
  width: number | null;
  height: number | null;
  filesize: number | null;
  is_primary: boolean;
  sort_order: number | null;
  metadata: any;
  created_at: string;
  updated_at: string;
}

export interface ProductsAdminListResponse extends ApiResponse {
  products: Product[];
  page: number;
  limit: number;
  total: number;
  total_pages: number;
}

export interface ProductResponse extends ApiResponse {
  product: Product;
}

export interface ProductAssetsResponse extends ApiResponse {
  assets: ProductAsset[];
}

/* =========================================================
   BASE + HELPERS
========================================================= */

const BASE = `${API_ROUTES.masters}/products`;
const ADMIN_BASE = `${BASE}/admin`;

function buildQuery(params?: Record<string, any>) {
  if (!params) return "";
  const q = new URLSearchParams();
  Object.entries(params).forEach(([k, v]) => {
    if (v !== undefined && v !== null && v !== "") {
      q.append(k, String(v));
    }
  });
  const s = q.toString();
  return s ? `?${s}` : "";
}

/* =========================================================
   PUBLIC PRODUCTS
========================================================= */

// GET /masters/products
export async function fetchPublicProducts() {
  return apiFetch<ApiResponse & { products: Product[] }>(BASE);
}

// GET /masters/products/:slug
export async function fetchProductBySlug(slug: string): Promise<ProductResponse> {
  if (!slug) throw new Error("product_slug_required");
  return apiFetch(`${BASE}/${encodeURIComponent(slug)}`);
}

/* =========================================================
   ADMIN PRODUCTS (all use /admin prefix)
========================================================= */

export interface FetchProductsAdminParams {
  q?: string;
  category_id?: string;
  trade_type?: TradeType;
  is_published?: boolean;
  page?: number;
  limit?: number;
}

// GET /masters/products/admin
export async function fetchProductsAdmin(
  params: FetchProductsAdminParams = {}
): Promise<ProductsAdminListResponse> {
  return apiFetch(`${ADMIN_BASE}${buildQuery(params)}`);
}

// GET /masters/products/admin/:id
export async function fetchProductAdmin(id: string): Promise<ProductResponse> {
  if (!id) throw new Error("product_id_required");
  return apiFetch(`${ADMIN_BASE}/${encodeURIComponent(id)}`);
}

/* =========================================================
   CREATE / UPDATE PAYLOADS – include every backend field
========================================================= */

export interface CreateProductPayload {
  title: string;
  slug: string;
  price: number;
  currency?: string;
  short_description?: string;
  description?: string;
  category_id?: string;
  trade_type?: TradeType;
  is_published?: boolean;
  sku?: string | null;
  available_qty?: number;
  moq?: number;
  metadata?: any;                   // JSON object
  diamond_pcs?: number;
  diamond_carat?: number;
  rate?: number;
  diamonds?: any[];
  metal_type?: string;
  gold_carat?: number;
  total_weight?: number;            // grams
  gold_weight?: number;             // grams
}

// POST /masters/products
export async function createProductAdmin(
  payload: CreateProductPayload
): Promise<ProductResponse> {
  return apiFetch(BASE, {
    method: "POST",
    body: payload,
  });
}

export interface UpdateProductPayload {
  title?: string;
  slug?: string;
  price?: number;
  currency?: string;
  short_description?: string;
  description?: string;
  category_id?: string;
  trade_type?: TradeType;
  is_published?: boolean;
  sku?: string | null;
  available_qty?: number;
  moq?: number;
  metadata?: any;
  diamond_pcs?: number;
  diamond_carat?: number;
  rate?: number;
  diamonds?: any[];
  metal_type?: string;
  gold_carat?: number;
  total_weight?: number;
  gold_weight?: number;
}

// PUT /masters/products/admin/:id
export async function updateProductAdmin(
  id: string,
  payload: UpdateProductPayload
): Promise<ProductResponse> {
  if (!id) throw new Error("product_id_required");
  return apiFetch(`${ADMIN_BASE}/${encodeURIComponent(id)}`, {
    method: "PUT",
    body: payload,
  });
}

// DELETE /masters/products/admin/:id
export async function deleteProductAdmin(id: string): Promise<ApiResponse> {
  if (!id) throw new Error("product_id_required");
  return apiFetch(`${ADMIN_BASE}/${encodeURIComponent(id)}`, {
    method: "DELETE",
  });
}

/* =========================================================
   PRODUCT ASSETS (no /admin)
========================================================= */

// GET /masters/products/:id/assets
export async function fetchProductAssets(
  productId: string
): Promise<ProductAssetsResponse> {
  if (!productId) throw new Error("product_id_required");
  return apiFetch(`${BASE}/${encodeURIComponent(productId)}/assets`);
}

// POST /masters/products/:id/assets
export async function uploadProductAssets(
  productId: string,
  formData: FormData
): Promise<ProductAssetsResponse> {
  if (!productId) throw new Error("product_id_required");
  return apiFetch(`${BASE}/${encodeURIComponent(productId)}/assets`, {
    method: "POST",
    body: formData,
  });
}

// PATCH /masters/products/assets/:assetId/set-primary
export async function setPrimaryProductAsset(
  assetId: string
): Promise<ApiResponse & { asset?: ProductAsset }> {
  if (!assetId) throw new Error("asset_id_required");
  return apiFetch(`${BASE}/assets/${encodeURIComponent(assetId)}/set-primary`, {
    method: "PATCH",
  });
}

// DELETE /masters/products/assets/:assetId
export async function deleteProductAsset(assetId: string): Promise<ApiResponse> {
  if (!assetId) throw new Error("asset_id_required");
  return apiFetch(`${BASE}/assets/${encodeURIComponent(assetId)}`, {
    method: "DELETE",
  });
}