// src/pages/ExportsPage.tsx
import React from "react";
import { FileText, FileSpreadsheet, Package, Loader2 } from "lucide-react";
import { api } from "@/lib/apiClient";
import { toast } from "react-hot-toast";

export default function ExportsPage() {
  const [loading, setLoading] = React.useState<string | null>(null);

  const handleExport = async (type: "orders" | "leads" | "shipping", format: "csv" | "pdf" | "zip") => {
    setLoading(`${type}-${format}`);
    try {
      let url = "";
      let filename = "";
      if (type === "orders") {
        if (format === "pdf") {
          url = "/sales/orders/export/pdf";
          filename = `orders_report_${Date.now()}.pdf`;
        } else if (format === "csv") {
          url = "/sales/orders/export/csv";
          filename = `orders_export_${Date.now()}.csv`;
        } else if (format === "zip") {
          url = "/sales/orders/export/bulk-zip";   // ✅ note the dash
          filename = `orders_bundle_${Date.now()}.zip`;
        }
      } else if (type === "leads") {
        url = "/crm/leads/export/csv";
        filename = `leads_export_${Date.now()}.csv`;
      } else if (type === "shipping") {
        url = "/sales/orders/export/shipping-labels";
        filename = `shipping_labels_${Date.now()}.pdf`;
      }

      if (!url) {
        toast.error(`Export not available for ${type}/${format}`);
        return;
      }

      await api.download(url, filename);
      toast.success(`${type.toUpperCase()} export completed`);
    } catch (err) {
      console.error(err);
      toast.error(`Failed to export ${type}`);
    } finally {
      setLoading(null);
    }
  };

  return (
    <div className="p-6">
      <h1 className="text-2xl font-semibold mb-4">Admin Exports</h1>
      <p className="text-slate-600 mb-6">
        Download bulk reports, invoices, CSV files, and shipping labels.
      </p>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
        {/* ORDERS EXPORT */}
        <div className="border rounded-xl p-5 bg-white shadow-sm">
          <div className="flex items-center gap-3 mb-3">
            <FileText className="text-violet-600" size={22} />
            <h2 className="text-lg font-bold">Orders Export</h2>
          </div>
          <p className="text-slate-600 text-sm mb-4">
            Export orders in PDF, CSV or ZIP (bulk orders bundle).
          </p>
          <div className="flex flex-wrap gap-2">
            <button
              onClick={() => handleExport("orders", "pdf")}
              disabled={loading !== null}
              className="rounded-full border border-slate-300 bg-white px-4 py-1.5 text-sm font-medium hover:bg-slate-50 disabled:opacity-50"
            >
              {loading === "orders-pdf" ? <Loader2 className="animate-spin inline mr-1" size={14} /> : <FileText size={14} className="inline mr-1" />}
              PDF Report
            </button>
            <button
              onClick={() => handleExport("orders", "csv")}
              disabled={loading !== null}
              className="rounded-full border border-slate-300 bg-white px-4 py-1.5 text-sm font-medium hover:bg-slate-50 disabled:opacity-50"
            >
              {loading === "orders-csv" ? <Loader2 className="animate-spin inline mr-1" size={14} /> : <FileSpreadsheet size={14} className="inline mr-1" />}
              CSV
            </button>
            <button
              onClick={() => handleExport("orders", "zip")}
              disabled={loading !== null}
              className="rounded-full border border-slate-300 bg-white px-4 py-1.5 text-sm font-medium hover:bg-slate-50 disabled:opacity-50"
            >
              {loading === "orders-zip" ? <Loader2 className="animate-spin inline mr-1" size={14} /> : <Package size={14} className="inline mr-1" />}
              ZIP Bundle
            </button>
          </div>
        </div>

        {/* LEADS EXPORT */}
        <div className="border rounded-xl p-5 bg-white shadow-sm">
          <div className="flex items-center gap-3 mb-3">
            <FileSpreadsheet className="text-emerald-600" size={22} />
            <h2 className="text-lg font-bold">Leads Export</h2>
          </div>
          <p className="text-slate-600 text-sm mb-4">
            Export all leads as CSV report.
          </p>
          <div className="flex flex-wrap gap-2">
            <button
              onClick={() => handleExport("leads", "csv")}
              disabled={loading !== null}
              className="rounded-full border border-slate-300 bg-white px-4 py-1.5 text-sm font-medium hover:bg-slate-50 disabled:opacity-50"
            >
              {loading === "leads-csv" ? <Loader2 className="animate-spin inline mr-1" size={14} /> : <FileSpreadsheet size={14} className="inline mr-1" />}
              Export CSV
            </button>
          </div>
        </div>

        {/* SHIPPING EXPORT */}
        <div className="border rounded-xl p-5 bg-white shadow-sm">
          <div className="flex items-center gap-3 mb-3">
            <Package className="text-blue-600" size={22} />
            <h2 className="text-lg font-bold">Shipping / Labels Export</h2>
          </div>
          <p className="text-slate-600 text-sm mb-4">
            Export shipping labels PDF (A4 multi-label).
          </p>
          <div className="flex flex-wrap gap-2">
            <button
              onClick={() => handleExport("shipping", "pdf")}
              disabled={loading !== null}
              className="rounded-full border border-slate-300 bg-white px-4 py-1.5 text-sm font-medium hover:bg-slate-50 disabled:opacity-50"
            >
              {loading === "shipping-pdf" ? <Loader2 className="animate-spin inline mr-1" size={14} /> : <FileText size={14} className="inline mr-1" />}
              PDF Labels
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}