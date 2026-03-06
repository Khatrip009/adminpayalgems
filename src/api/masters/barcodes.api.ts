import { apiFetchRaw, API_ROUTES } from "@/lib/apiClient";

/* =========================================
   BARCODE PDF GENERATION
========================================= */

export async function generateBarcodePdf(
  labels: { text: string; title?: string }[]
) {
  const res = await apiFetchRaw(
    `${API_ROUTES.system}/barcode/pdf`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ labels }),
    }
  );

  return res.blob();
}

/* =========================================
   PACKET LABELS PDF
========================================= */

export async function generatePacketLabelsPdf(packets: any[]) {
  const res = await apiFetchRaw(
    `${API_ROUTES.system}/barcode/packet-labels/pdf`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ packets }),
    }
  );

  return res.blob();
}
