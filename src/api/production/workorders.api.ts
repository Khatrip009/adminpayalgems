// src/api/production/workorders.api.ts
import { apiFetch, API_ROUTES } from "@/lib/apiClient";

/* =========================================================
   BASE + HELPERS
========================================================= */

const BASE = `${API_ROUTES.production}/work-orders`;

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
   WORK ORDERS
========================================================= */

export const listWorkOrders = (
  params?: { limit?: number; offset?: number }
) =>
  apiFetch(
    `${BASE}${buildQuery(params)}`
  );

export const getWorkOrder = (id: string) => {
  if (!id) throw new Error("work_order_id_required");

  return apiFetch(
    `${BASE}/${encodeURIComponent(id)}`
  );
};

/* =========================================================
   LIFECYCLE ACTIONS
========================================================= */

export const issueWorkOrder = (payload: any) =>
  apiFetch(
    `${BASE}/issue`,
    { method: "POST", body: payload }
  );

export const transitionWorkOrder = (
  id: string,
  event: string,
  payload: any = {}
) => {
  if (!id) throw new Error("work_order_id_required");
  if (!event) throw new Error("workflow_event_required");

  return apiFetch(
    `${BASE}/${encodeURIComponent(id)}/transition`,
    {
      method: "POST",
      body: { event, payload },
    }
  );
};

export const startWorkOrder = (id: string) =>
  transitionWorkOrder(id, "start");

export const completeWorkOrder = (id: string) =>
  transitionWorkOrder(id, "complete");

export const receiveWorkOrder = (
  id: string,
  payload: { finished_items: any[] }
) =>
  apiFetch(`/production/work-orders/${id}/transition`, {
    method: "POST",
    body: JSON.stringify({
      event: "receive",
      payload,
    }),
  });



export const closeWorkOrder = (
  id: string,
  payload: { note?: string } = {}
) =>
  apiFetch(
    `${BASE}/${encodeURIComponent(id)}/close`,
    { method: "POST", body: payload }
  );

  export const getWorkOrderCost = (workOrderId: string) => {
  if (!workOrderId) throw new Error("work_order_id_required");

  return apiFetch(
    `${BASE}/${encodeURIComponent(workOrderId)}/cost`
  );
};

