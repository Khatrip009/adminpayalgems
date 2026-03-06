import { apiFetch } from "@/lib/apiClient";

export interface CustomerReturn {
  id: string;
  order_id: string;
  order_number: string;
  type: string;
  status: string;
  preferred_resolution: string | null;
  refund_amount: number | null;
  photos?: string[] | null;
  created_at: string;
}

export interface CustomerListReturnsResponse {
  ok: boolean;
  returns: CustomerReturn[];
}

export async function listCustomerReturns() {
  return apiFetch<CustomerListReturnsResponse>("/account/returns");
}

export async function getCustomerReturn(id: string) {
  return apiFetch(`/account/returns/${id}`);
}
