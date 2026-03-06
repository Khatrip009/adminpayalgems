import React, { useEffect, useState } from "react";
import { ArrowLeft, FileSpreadsheet, Loader2 } from "lucide-react";
import { useNavigate, useParams } from "react-router-dom";
import { toast } from "react-hot-toast";

import { getSupplierLedger } from "@/api/procurement/supplierLedger.api";
import { getSupplier } from "@/api/masters/suppliers.api";

const AdminSupplierLedgerPage: React.FC = () => {
  const navigate = useNavigate();
  const { supplierId } = useParams();

  const [supplier, setSupplier] = useState<any>(null);
  const [ledger, setLedger] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");

  const [closing, setClosing] = useState(0);

  /* ----------------------------------------------------
     Load Supplier + Ledger
  ---------------------------------------------------- */
  const loadLedger = async () => {
    if (!supplierId) return;
    setLoading(true);

    try {
      const r1 = await getSupplier(supplierId);
      setSupplier(r1.supplier);

      const r2 = await getSupplierLedger(supplierId, { from, to });
      setLedger(r2.ledger || []);
      setClosing(r2.closing_balance || 0);
    } catch (e) {
      console.error(e);
      toast.error("Failed to load ledger");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadLedger();
  }, [from, to]);

  /* ----------------------------------------------------
     Export CSV
  ---------------------------------------------------- */
  const exportCSV = () => {
    const rows = [
      ["Date", "Type", "Ref No", "Debit", "Credit", "Balance"],
      ...ledger.map((l) => [
        l.date,
        l.type,
        l.ref_no || "",
        l.debit || "",
        l.credit || "",
        l.balance,
      ]),
      ["", "", "", "", "Closing", closing],
    ];

    const csvContent =
      "data:text/csv;charset=utf-8," +
      rows.map((e) => e.join(",")).join("\n");

    const a = document.createElement("a");
    a.href = csvContent;
    a.download = `supplier_ledger_${supplierId}.csv`;
    a.click();
  };

  /* ----------------------------------------------------
     Render
  ---------------------------------------------------- */
  return (
    <div className="p-6">
      {/* Back Button */}
      <button
        onClick={() => navigate(-1)}
        className="flex items-center mb-4 text-sm text-slate-600 hover:text-slate-800"
      >
        <ArrowLeft size={16} className="mr-1" /> Back
      </button>

      {/* Title */}
      <h1 className="text-xl font-semibold mb-1">
        Supplier Ledger — {supplier?.name || ""}
      </h1>
      <p className="text-xs text-slate-500 mb-4">
        Full debit / credit history with running balance.
      </p>

      {/* Filters */}
      <div className="flex items-center gap-4 mb-4">
        <div>
          <label className="text-xs">From</label>
          <input
            type="date"
            className="border rounded-lg px-3 py-1 ml-2"
            value={from}
            onChange={(e) => setFrom(e.target.value)}
          />
        </div>

        <div>
          <label className="text-xs">To</label>
          <input
            type="date"
            className="border rounded-lg px-3 py-1 ml-2"
            value={to}
            onChange={(e) => setTo(e.target.value)}
          />
        </div>

        <button
          onClick={exportCSV}
          className="ml-auto border px-3 py-2 rounded-lg flex items-center gap-2 text-sm hover:bg-slate-100"
        >
          <FileSpreadsheet size={16} /> Export CSV
        </button>
      </div>

      {/* Table */}
      <div className="rounded-xl border overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-slate-100 text-slate-600">
            <tr>
              <th className="px-3 py-2">Date</th>
              <th className="px-3 py-2">Type</th>
              <th className="px-3 py-2">Reference</th>
              <th className="px-3 py-2 text-right">Debit</th>
              <th className="px-3 py-2 text-right">Credit</th>
              <th className="px-3 py-2 text-right">Balance</th>
            </tr>
          </thead>

          <tbody>
            {loading ? (
              <tr>
                <td colSpan={6} className="py-10 text-center text-slate-500">
                  <Loader2 className="animate-spin inline mr-2" /> Loading…
                </td>
              </tr>
            ) : ledger.length === 0 ? (
              <tr>
                <td colSpan={6} className="py-8 text-center text-slate-500">
                  No records found
                </td>
              </tr>
            ) : (
              ledger.map((row, i) => (
                <tr key={i} className="border-t">
                  <td className="px-3 py-2">
                    {row.date
                      ? new Date(row.date).toLocaleDateString()
                      : "—"}
                  </td>
                  <td className="px-3 py-2 capitalize">{row.type}</td>
                  <td className="px-3 py-2">{row.ref_no || "—"}</td>

                  <td className="px-3 py-2 text-right text-red-600">
                    {row.debit ? `₹${row.debit}` : "—"}
                  </td>

                  <td className="px-3 py-2 text-right text-green-700">
                    {row.credit ? `₹${row.credit}` : "—"}
                  </td>

                  <td className="px-3 py-2 text-right font-semibold">
                    ₹{row.balance}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Closing Balance */}
      <div className="mt-4 text-right text-lg font-bold">
        Closing Balance: ₹{closing}
      </div>
    </div>
  );
};

export default AdminSupplierLedgerPage;
