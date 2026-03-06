// src/pages/ExportsPage.tsx
import React from "react";
import ExportMenu from "@/components/admin/ExportMenu";
import { FileText, FileSpreadsheet, Package } from "lucide-react";

export default function ExportsPage() {
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
          <ExportMenu size="md" mode="orders" />
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
          <ExportMenu size="md" mode="leads" />
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
          <ExportMenu size="md" mode="shipping" />
        </div>
      </div>
    </div>
  );
}
