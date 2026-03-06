// src/api/procurement/grn.api.ts
import { apiFetch, apiFetchRaw, API_ROUTES } from "@/lib/apiClient";

/**
 * IMPORTANT:
 * Backend is mounted at:
 *   /api/procurement/grns
 */
const BASE = `${API_ROUTES.procurement}/grns`;

const BACKEND_ORIGIN =
  import.meta.env.VITE_API_ORIGIN || "http://localhost:4500";


/* ---------------------------------------------
   Helpers
--------------------------------------------- */

function buildQuery(params?: Record<string, any>) {
  if (!params) return "";
  const q = new URLSearchParams();
  Object.entries(params).forEach(([k, v]) => {
    if (v !== undefined && v !== null) q.append(k, String(v));
  });
  const s = q.toString();
  return s ? `?${s}` : "";
}
/* =========================
   LIST / DETAIL
========================= */

export async function listGrns(params?: Record<string, any>) {
  return apiFetch(`${BASE}${buildQuery(params)}`);
}

export async function getGrn(id: string) {
  if (!id) throw new Error("grn_id_required");
  return apiFetch(`${BASE}/${encodeURIComponent(id)}`);
}

/* =========================
   CREATE
========================= */

export async function createManualGrn(payload: any) {
  return apiFetch(BASE, {
    method: "POST",
    body: payload,
  });
}

/* =========================
   POST / FINALIZE GRN
========================= */

export async function postGrn(grnId: string) {
  if (!grnId) throw new Error("grn_id_required");

  return apiFetch(`${BASE}/${encodeURIComponent(grnId)}/post`, {
    method: "POST",
  });
}


/* =========================
   PDF (FINAL – FIXED)
========================= */

export function getGrnPdfUrl(grnId: string) {
  if (!grnId) throw new Error("grn_id_required");

  return (
    `${BACKEND_ORIGIN}` +
    `/api${API_ROUTES.procurement}/grns/` +
    `${encodeURIComponent(grnId)}/pdf`
  );
}

/* =========================
   PDF (SECURE)
========================= */

export async function openGrnPdf(grnId: string) {
  if (!grnId) throw new Error("grn_id_required");

  const res = await apiFetchRaw(
    `${API_ROUTES.procurement}/grns/${encodeURIComponent(grnId)}/pdf`,
    { method: "GET" }
  );

  const blob = await res.blob();
  const url = URL.createObjectURL(blob);

  window.open(url, "_blank", "noopener,noreferrer");

  // cleanup
  setTimeout(() => URL.revokeObjectURL(url), 2000);
}

export async function downloadGrnPdf(grnId: string) {
  const res = await apiFetchRaw(getGrnPdfUrl(grnId), { method: "GET" });
  const blob = await res.blob();

  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `GRN_${grnId}.pdf`;
  document.body.appendChild(a);
  a.click();
  a.remove();

  URL.revokeObjectURL(url);
}