import { api, API_ROUTES } from "@/lib/apiClient";

/**
 * Backend base:
 * GET    /api/masters/categories
 * GET    /api/masters/categories/:id
 * POST   /api/masters/categories
 * PUT    /api/masters/categories/:id
 * DELETE /api/masters/categories/:id
 */
const BASE = `${API_ROUTES.masters}/categories`;

/* ---------------------------------------------
   Types
--------------------------------------------- */
export type TradeType = "import" | "export" | "both";

export interface Category {
  id: string;
  slug: string;
  name: string;
  description?: string | null;
  parent_id?: string | null;
  trade_type: TradeType;
  product_count?: number;
}

export interface CategoryListResponse {
  ok: boolean;
  categories: Category[];
  page: number;
  limit: number;
  total: number;
  total_pages: number;
}

export interface CategoryQuery {
  q?: string;
  trade_type?: TradeType;
  include_counts?: boolean;
  page?: number;
  limit?: number;
}

/* ---------------------------------------------
   Helper: build query string
--------------------------------------------- */
function buildQuery(params?: Record<string, any>) {
  if (!params) return "";
  const q = new URLSearchParams();

  Object.entries(params).forEach(([key, val]) => {
    if (val !== undefined && val !== null) {
      q.append(key, String(val));
    }
  });

  const s = q.toString();
  return s ? `?${s}` : "";
}

/* ---------------------------------------------
   GET /categories
--------------------------------------------- */
export async function fetchCategories(params?: CategoryQuery) {
  return api.get<CategoryListResponse>(
    `${BASE}${buildQuery(params)}`
  );
}

/* ---------------------------------------------
   GET /categories/:id
--------------------------------------------- */
export async function fetchCategoryById(id: string) {
  if (!id) throw new Error("category_id_required");
  return api.get<{ ok: boolean; category: Category }>(
    `${BASE}/${id}`
  );
}

/* ---------------------------------------------
   POST /categories
--------------------------------------------- */
export async function createCategory(payload: {
  name: string;
  slug?: string;
  description?: string | null;
  parent_id?: string | null;
  sort_order?: number;
  trade_type?: TradeType;
}) {
  return api.post<{ ok: boolean; category: Category }>(
    BASE,
    payload
  );
}

/* ---------------------------------------------
   PUT /categories/:id
--------------------------------------------- */
export async function updateCategory(
  id: string,
  payload: {
    name: string;
    slug?: string;
    description?: string | null;
    parent_id?: string | null;
    sort_order?: number;
    trade_type?: TradeType;
  }
) {
  if (!id) throw new Error("category_id_required");
  return api.put<{ ok: boolean; category: Category }>(
    `${BASE}/${id}`,
    payload
  );
}

/* ---------------------------------------------
   DELETE /categories/:id
--------------------------------------------- */
export async function deleteCategory(id: string) {
  if (!id) throw new Error("category_id_required");
  return api.delete<{ ok: boolean }>(
    `${BASE}/${id}`
  );
}
