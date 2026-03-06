import { useState } from "react";
import {
  Download,
  FileText,
  Package,
  FileSpreadsheet,
  ChevronDown,
  Loader2,
} from "lucide-react";

import {
  exportOrdersPDF,
  exportOrdersCSV,
  exportOrdersZIP,
  exportShippingLabelsPDF,
  exportLeadsCSV,
} from "../../api/logistics/export.api";

interface ExportMenuProps {
  orderIds?: string[]; // optional bulk export (not used yet)
  size?: "sm" | "md";  // UI sizing
  mode?: "orders" | "leads" | "shipping";
}

export default function ExportMenu({
  orderIds = [],
  size = "md",
  mode = "orders",
}: ExportMenuProps) {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState<"" | "pdf" | "csv" | "zip" | "labels">(
    ""
  );

  async function handleDownload(action: "pdf" | "csv" | "zip" | "labels") {
    try {
      setLoading(action);

      if (mode === "orders") {
        if (action === "pdf") await exportOrdersPDF();
        if (action === "csv") await exportOrdersCSV();
        if (action === "zip") await exportOrdersZIP();
      }

      if (mode === "leads") {
        if (action === "csv") await exportLeadsCSV();
        // (PDF for leads can be added later)
      }

      if (mode === "shipping") {
        if (action === "labels") await exportShippingLabelsPDF();
      }
    } catch (err: any) {
      console.error("Export failed:", err);
      alert(err.message || "Export failed");
    } finally {
      setLoading("");
      setOpen(false);
    }
  }

  const sizeClasses =
    size === "sm" ? "px-2 py-1.5 text-sm" : "px-3 py-2 text-sm";

  return (
    <div className="relative inline-block">
      <button
        onClick={() => setOpen((o) => !o)}
        className={`flex items-center gap-2 bg-white border border-slate-300 rounded-lg shadow-sm hover:bg-slate-50 ${sizeClasses}`}
      >
        <Download size={16} />
        Export
        <ChevronDown size={16} />
      </button>

      {open && (
        <div className="absolute z-20 mt-2 w-60 rounded-lg bg-white shadow-xl border border-slate-200 p-1">
          {mode === "orders" && (
            <>
              <button
                onClick={() => handleDownload("pdf")}
                className="flex items-center gap-2 w-full px-3 py-2 rounded-md hover:bg-slate-100"
              >
                {loading === "pdf" ? (
                  <Loader2 className="animate-spin" size={16} />
                ) : (
                  <FileText size={16} />
                )}
                Orders PDF
              </button>

              <button
                onClick={() => handleDownload("csv")}
                className="flex items-center gap-2 w-full px-3 py-2 rounded-md hover:bg-slate-100"
              >
                {loading === "csv" ? (
                  <Loader2 className="animate-spin" size={16} />
                ) : (
                  <FileSpreadsheet size={16} />
                )}
                Orders CSV
              </button>

              <button
                onClick={() => handleDownload("zip")}
                className="flex items-center gap-2 w-full px-3 py-2 rounded-md hover:bg-slate-100"
              >
                {loading === "zip" ? (
                  <Loader2 className="animate-spin" size={16} />
                ) : (
                  <Package size={16} />
                )}
                Orders ZIP (bulk export)
              </button>
            </>
          )}

          {mode === "leads" && (
            <button
              onClick={() => handleDownload("csv")}
              className="flex items-center gap-2 w-full px-3 py-2 rounded-md hover:bg-slate-100"
            >
              {loading === "csv" ? (
                <Loader2 className="animate-spin" size={16} />
              ) : (
                <FileSpreadsheet size={16} />
              )}
              Leads CSV
            </button>
          )}

          {mode === "shipping" && (
            <button
              onClick={() => handleDownload("labels")}
              className="flex items-center gap-2 w-full px-3 py-2 rounded-md hover:bg-slate-100"
            >
              {loading === "labels" ? (
                <Loader2 className="animate-spin" size={16} />
              ) : (
                <Package size={16} />
              )}
              Shipping Labels PDF
            </button>
          )}
        </div>
      )}
    </div>
  );
}
