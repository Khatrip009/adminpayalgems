// src/pages/production/finance/invoices/AdminOrderInvoiceDetailPage.tsx
import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { toast } from "react-hot-toast";
import { ArrowLeft, Loader2, FileText } from "lucide-react";
import { AdminPageHeader } from "@/components/admin/AdminPageHeader";
import { getInvoiceById, type Invoice } from "@/api/inventory/payments.api";

const money = (a: number, c = "INR") => `${c} ${Number(a || 0).toLocaleString()}`;

export default function AdminOrderInvoiceDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [invoice, setInvoice] = useState<Invoice | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!id) return;
    const fetchInvoice = async () => {
      try {
        const res = await getInvoiceById(id);
        setInvoice(res.invoice);
      } catch (err) {
        console.error(err);
        toast.error("Failed to load invoice");
      } finally {
        setLoading(false);
      }
    };
    fetchInvoice();
  }, [id]);

  if (loading) return <div className="flex h-80 items-center justify-center"><Loader2 className="animate-spin" /></div>;
  if (!invoice) return <div className="p-6 text-center">Invoice not found.</div>;

  return (
    <div>
      <AdminPageHeader
        title={`Invoice #${invoice.invoice_number}`}
        subtitle="Invoice details"
        breadcrumbs={[
          { label: "Dashboard", path: "/" },
          { label: "Payments", path: "/admin/payments" },
          { label: invoice.invoice_number },
        ]}
        right={
          <button onClick={() => navigate(-1)} className="inline-flex items-center gap-2 rounded-full border border-slate-300 px-4 py-2.5 text-sm hover:bg-slate-100">
            <ArrowLeft size={16} /> Back
          </button>
        }
      />
      <div className="px-6 py-10">
        <div className="rounded-2xl border border-slate-300 bg-white p-6 shadow-sm">
          <div className="flex items-center gap-3 mb-4">
            <FileText className="text-blue-600" />
            <h2 className="text-xl font-semibold">Invoice Information</h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div><strong>Invoice Number:</strong> {invoice.invoice_number}</div>
            <div><strong>Order ID:</strong> {invoice.order_id}</div>
            <div><strong>Total:</strong> {money(invoice.grand_total, invoice.currency)}</div>
            <div><strong>Status:</strong> {invoice.status}</div>
            <div><strong>Created At:</strong> {new Date(invoice.created_at).toLocaleString()}</div>
          </div>
          {/* You can extend this with items, etc. */}
        </div>
      </div>
    </div>
  );
}