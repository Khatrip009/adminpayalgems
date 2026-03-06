import { apiFetch, API_ROUTES } from "@/lib/apiClient";


/* =========================================================
   BASE PATH (AUTO-LOADER COMPLIANT)
========================================================= */

const BASE = `${API_ROUTES.system}/tax-rules/rules`;

/* =========================================================
   TAX RULES
========================================================= */

export async function listTaxRules() {
  return apiFetch(
    BASE
  );
}

export async function createTaxRule(data: any) {
  return apiFetch(
    BASE,
    { method: "POST", body: data }
  );
}

export async function updateTaxRule(
  id: string,
  data: any
) {
  if (!id) throw new Error("tax_rule_id_required");

  return apiFetch(
    `${BASE}/${encodeURIComponent(id)}`,
    { method: "PUT", body: data }
  );
}

export async function deleteTaxRule(id: string) {
  if (!id) throw new Error("tax_rule_id_required");

  return apiFetch(
    `${BASE}/${encodeURIComponent(id)}`,
    { method: "DELETE" }
  );
}

/* =========================================================
   TAX CALCULATION
========================================================= */

export async function calculateTax(data: any) {
  return apiFetch(
    `${BASE}/calculate`,
    { method: "POST", body: data }
  );
}
