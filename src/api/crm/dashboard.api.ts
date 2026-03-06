// src/api/analytics/dashboard.api.ts

import { api } from "@/lib/apiClient";

/* =========================================================
   DASHBOARD – ANALYTICS SUMMARY
   GET /api/dashboard/summary
========================================================= */

export async function getDashboardSummary() {
  return api.get("/dashboard/summary");
}
