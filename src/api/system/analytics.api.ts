// src/api/analytics/metrics.api.ts

import { api, API_ROUTES } from "@/lib/apiClient";

/* =========================================================
   VISITOR METRICS
   GET /api/analytics/visitors-metrics/summary
========================================================= */
export async function getVisitorSummary() {
  return api.get(
    `${API_ROUTES.analytics}/visitors-metrics/summary`
  );
}

/* =========================================================
   ADMIN REVIEWS (ADMIN PANEL)
   GET /api/admin/reviews/stats
========================================================= */
export async function getAdminReviewStats() {
  return api.get(
    `/admin/reviews/stats`
  );
}

/* =========================================================
   PUBLIC REVIEWS (STORE)
   GET /api/reviews/stats
========================================================= */
export async function getPublicReviewStats() {
  return api.get(
    `/reviews/stats`
  );
}

