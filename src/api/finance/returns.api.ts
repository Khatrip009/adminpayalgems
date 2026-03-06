import { apiFetch, API_ROUTES } from "@/lib/apiClient";

/* =========================================================
   BASE PATHS (AUTO-LOADER COMPLIANT)
========================================================= */

const ADMIN_BASE = `${API_ROUTES.sales}/returns`;
const ACCOUNT_BASE = `${API_ROUTES.finance}/account-returns`;

/* ------------------ ADMIN ------------------ */

export async function listReturns() {
  return apiFetch(ADMIN_BASE);
}

export async function getReturnById(id: string) {
  if (!id) throw new Error("return_id_required");

  return apiFetch(
    `${ADMIN_BASE}/${encodeURIComponent(id)}`
  );
}

export async function updateReturnStatus(
  id: string,
  payload: { status: string; notes?: string }
) {
  if (!id) throw new Error("return_id_required");

  return apiFetch(
    `${ADMIN_BASE}/${encodeURIComponent(id)}/status`,
    {
      method: "PATCH",
      body: payload,
    }
  );
}

/* ------------------ CUSTOMER ------------------ */

export async function createReturnRequest(payload: any) {
  return apiFetch(
    ACCOUNT_BASE,
    {
      method: "POST",
      body: payload,
    }
  );
}

/* ------------------ REPLACEMENT ------------------ */

export async function createReplacementShipment(
  returnId: string
) {
  if (!returnId) throw new Error("return_id_required");

  return apiFetch(
    `${ADMIN_BASE}/${encodeURIComponent(returnId)}/create-replacement`,
    { method: "POST" }
  );
}
