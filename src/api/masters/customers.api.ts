import { api, API_ROUTES } from "@/lib/apiClient";

const BASE = `${API_ROUTES.masters}/customers`;

/* ---------------------------------------------
   Helper: safe query builder
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
   LIST CUSTOMERS
--------------------------------------------- */
export async function listCustomers(params?: Record<string, any>) {
  return api.get(`${BASE}${buildQuery(params)}`);
}

/* ---------------------------------------------
   GET CUSTOMER (FULL)
--------------------------------------------- */
export async function getCustomerFull(
  id: string,
  page = 1
) {
  if (!id) throw new Error("customer_id_required");

  return api.get(
    `${BASE}/${id}/full${buildQuery({ page })}`
  );
}

/* ---------------------------------------------
   UPDATE CUSTOMER
--------------------------------------------- */
export async function updateCustomer(
  id: string,
  payload: any
) {
  if (!id) throw new Error("customer_id_required");

  return api.put(
    `${BASE}/${id}`,
    payload
  );
}
