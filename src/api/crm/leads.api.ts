import { apiFetch, API_ROUTES } from "@/lib/apiClient";

const BASE = `${API_ROUTES.crm}/leads`;
const STATS = `${API_ROUTES.crm}/leads-stats`;

/* ---------------------------------------------
   Helper: safe query builder
--------------------------------------------- */
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

/* ---------------------------------------------
   LIST LEADS
--------------------------------------------- */
export async function fetchLeads(params?: {
  q?: string;
  status?: string;
  page?: number;
  limit?: number;
}) {
  return apiFetch(
    `${BASE}${buildQuery(params)}`
  );
}

/* ---------------------------------------------
   GET LEAD
--------------------------------------------- */
export async function fetchLead(id: string) {
  if (!id) throw new Error("lead_id_required");
  return apiFetch(
    `${BASE}/${encodeURIComponent(id)}`
  );
}

/* ---------------------------------------------
   CREATE
--------------------------------------------- */
export async function createLead(data: any) {
  return apiFetch(BASE, {
    method: "POST",
    body: data,
  });
}

/* ---------------------------------------------
   UPDATE
--------------------------------------------- */
export async function updateLead(id: string, data: any) {
  if (!id) throw new Error("lead_id_required");
  return apiFetch(
    `${BASE}/${encodeURIComponent(id)}`,
    { method: "PUT", body: data }
  );
}

/* ---------------------------------------------
   DELETE
--------------------------------------------- */
export async function deleteLead(id: string) {
  if (!id) throw new Error("lead_id_required");
  return apiFetch(
    `${BASE}/${encodeURIComponent(id)}`,
    { method: "DELETE" }
  );
}

/* ---------------------------------------------
   NOTES
--------------------------------------------- */
export async function fetchLeadNotes(leadId: string) {
  if (!leadId) throw new Error("lead_id_required");
  return apiFetch(
    `${BASE}/${encodeURIComponent(leadId)}/notes`
  );
}

export async function addLeadNote(
  leadId: string,
  note: string
) {
  if (!leadId) throw new Error("lead_id_required");
  if (!note) throw new Error("note_required");

  return apiFetch(
    `${BASE}/${encodeURIComponent(leadId)}/notes`,
    {
      method: "POST",
      body: { note },
    }
  );
}

/* ---------------------------------------------
   STATS
--------------------------------------------- */
export async function fetchLeadStats() {
  return apiFetch(
    `${STATS}/stats`
  );
}
