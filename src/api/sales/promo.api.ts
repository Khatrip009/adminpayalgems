import { apiFetch, API_ROUTES } from "@/lib/apiClient";

/* =========================================================
   BASE + HELPERS (ALIGNED WITH BACKEND)
========================================================= */

const BASE = `${API_ROUTES.sales}/promos`;

function buildQuery(params?: Record<string, any>) {
  if (!params) return "";
  const q = new URLSearchParams();

  Object.entries(params).forEach(([key, val]) => {
    if (val !== undefined && val !== null && val !== "") {
      q.append(key, String(val));
    }
  });

  const s = q.toString();
  return s ? `?${s}` : "";
}

/* =========================================================
   PUBLIC
========================================================= */

export async function applyPromoCode(input: {
  promo_code: string;
  subtotal: number;
}) {
  if (!input?.promo_code) {
    throw new Error("promo_code_required");
  }

  return apiFetch(`${BASE}/apply`, {
    method: "POST",
    body: input,
  });
}

/* =========================================================
   ADMIN – PROMO CODES
========================================================= */

export async function listPromoCodes(params?: {
  page?: number;
  limit?: number;
  q?: string;
}) {
  return apiFetch(
    `${BASE}/codes${buildQuery(params)}`
  );
}

/** GET single promo */
export async function getPromoCodeById(id: string) {
  if (!id) throw new Error("promo_id_required");

  return apiFetch(
    `${BASE}/codes/${encodeURIComponent(id)}`
  );
}

/** CREATE promo */
export async function createPromoCode(payload: {
  code: string;
  description?: string;
  type: "percent" | "fixed" | "free_shipping";
  value?: number;
  max_uses?: number | null;
  max_uses_per_user?: number | null;
  valid_from?: string | null;
  valid_to?: string | null;
  min_order_value?: number | null;
  is_active?: boolean;
  metadata?: Record<string, any>;
}) {
  if (!payload?.code) {
    throw new Error("promo_code_required");
  }

  return apiFetch(`${BASE}/codes`, {
    method: "POST",
    body: payload,
  });
}

/** UPDATE promo */
export async function updatePromoCode(
  id: string,
  payload: Partial<{
    code: string;
    description: string;
    type: "percent" | "fixed" | "free_shipping";
    value: number;
    max_uses: number | null;
    max_uses_per_user: number | null;
    valid_from: string | null;
    valid_to: string | null;
    min_order_value: number | null;
    is_active: boolean;
    metadata: Record<string, any>;
  }>
) {
  if (!id) throw new Error("promo_id_required");

  return apiFetch(
    `${BASE}/codes/${encodeURIComponent(id)}`,
    {
      method: "PUT",
      body: payload,
    }
  );
}

/** TOGGLE active */
export async function togglePromoCode(
  id: string,
  is_active?: boolean
) {
  if (!id) throw new Error("promo_id_required");

  return apiFetch(
    `${BASE}/codes/${encodeURIComponent(id)}/toggle`,
    {
      method: "PATCH",
      body: { is_active },
    }
  );
}
