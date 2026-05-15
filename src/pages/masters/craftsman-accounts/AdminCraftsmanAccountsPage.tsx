// src/pages/masters/craftsman-accounts/AdminCraftsmanAccountsPage.tsx
import React, { useState, useEffect, useCallback } from "react";
import { useSearchParams } from "react-router-dom";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { toast } from "react-hot-toast";
import { listCraftsmen } from "@/api/masters/craftsmen.api";
import {
  getCraftsmanStatement,
  getCraftsmanStatementPdf,
  listGoldIssues,
  createGoldIssue,
  updateGoldIssue,
  deleteGoldIssue,
  listGoldConsumptions,
  createGoldConsumption,
  updateGoldConsumption,
  deleteGoldConsumption,
  listCashPayments,
  createCashPayment,
  updateCashPayment,
  deleteCashPayment,
  getMonthlyReport,
  getMonthlyReportPdf,
  type StatementData,
  type GoldIssue,
  type GoldConsumption,
  type CashPayment,
} from "@/api/masters/craftsman-accounts.api";
import { Download, RefreshCw, Plus, Pencil, Trash2, X, Lock } from "lucide-react";

// Helper to get current year-month (YYYY-MM)
const getCurrentMonth = () => {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;
};

// --- SAFE NUMBER FORMATTING ---
const safeNumber = (value: any): number => {
  if (value === null || value === undefined) return 0;
  const num = typeof value === 'number' ? value : parseFloat(String(value).replace(/[^0-9.-]/g, ''));
  return isNaN(num) ? 0 : num;
};

const formatGold = (value: any): string => safeNumber(value).toFixed(3);
const formatCurrency = (value: any): string => safeNumber(value).toFixed(2);

export default function AdminCraftsmanAccountsPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const [selectedCraftsmanId, setSelectedCraftsmanId] = useState<string>("");
  const [selectedCraftsmanName, setSelectedCraftsmanName] = useState<string>("");
  const [allCraftsmen, setAllCraftsmen] = useState<{ id: string; name: string; code: string }[]>([]);
  const [isCraftsmenLoading, setIsCraftsmenLoading] = useState(true);

  const [startDate, setStartDate] = useState<string>(searchParams.get("startDate") || "");
  const [endDate, setEndDate] = useState<string>(searchParams.get("endDate") || "");
  const [statement, setStatement] = useState<StatementData | null>(null);
  const [loading, setLoading] = useState(false);

  const [activeTab, setActiveTab] = useState<"statement" | "transactions" | "monthly">("statement");

  const [goldIssues, setGoldIssues] = useState<GoldIssue[]>([]);
  const [goldConsumptions, setGoldConsumptions] = useState<GoldConsumption[]>([]);
  const [cashPayments, setCashPayments] = useState<CashPayment[]>([]);
  const [modalOpen, setModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<any>(null);
  const [modalType, setModalType] = useState<"goldIssue" | "goldConsumption" | "cashPayment">("goldIssue");
  const [formData, setFormData] = useState<any>({});
  // Override toggle for final 24kt in gold consumption modal
  const [overrideFinal24kt, setOverrideFinal24kt] = useState(false);

  const [month, setMonth] = useState(getCurrentMonth());

  // Load all craftsmen on mount
  useEffect(() => {
    const loadCraftsmen = async () => {
      setIsCraftsmenLoading(true);
      try {
        const res = await listCraftsmen({ limit: 1000 });
        if (res.ok) {
          const craftsmenList = res.craftsmen.map((c: any) => ({
            id: c.id,
            name: c.name,
            code: c.code || "",
          }));
          setAllCraftsmen(craftsmenList);
        }
      } catch (err) {
        console.error("Failed to load craftsmen", err);
        toast.error("Failed to load craftsmen list");
      } finally {
        setIsCraftsmenLoading(false);
      }
    };
    loadCraftsmen();
  }, []);

  const loadStatement = useCallback(async () => {
    if (!selectedCraftsmanId) return;
    setLoading(true);
    try {
      const res = await getCraftsmanStatement(selectedCraftsmanId, startDate || undefined, endDate || undefined);
      if (res.ok) {
        setStatement(res.statement);
        setSearchParams({ startDate, endDate }, { replace: true });
      } else {
        toast.error("Failed to load statement");
      }
    } catch (err) {
      toast.error("Error loading statement");
    } finally {
      setLoading(false);
    }
  }, [selectedCraftsmanId, startDate, endDate, setSearchParams]);

  const loadTransactions = async () => {
    if (!selectedCraftsmanId) return;
    try {
      const [issues, consumptions, payments] = await Promise.all([
        listGoldIssues(selectedCraftsmanId, 100, 0),
        listGoldConsumptions(selectedCraftsmanId, 100, 0),
        listCashPayments(selectedCraftsmanId, 100, 0),
      ]);
      if (issues.ok) setGoldIssues(issues.gold_issues);
      if (consumptions.ok) setGoldConsumptions(consumptions.gold_consumptions);
      if (payments.ok) setCashPayments(payments.cash_payments);
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    if (selectedCraftsmanId) {
      loadStatement();
      loadTransactions();
    } else {
      setStatement(null);
    }
  }, [selectedCraftsmanId, startDate, endDate, loadStatement]);

  const handleSelectCraftsman = (id: string) => {
    const craftsman = allCraftsmen.find(c => c.id === id);
    if (craftsman) {
      setSelectedCraftsmanId(id);
      setSelectedCraftsmanName(`${craftsman.name} (${craftsman.code || "no code"})`);
    }
  };

  const exportPDF = async () => {
    if (!selectedCraftsmanId) return;
    try {
      const blob = await getCraftsmanStatementPdf(selectedCraftsmanId, startDate || undefined, endDate || undefined);
      const url = URL.createObjectURL(blob);
      window.open(url);
    } catch (err) {
      toast.error("PDF generation failed");
    }
  };

  const handleMonthlyReport = async (format: "json" | "pdf") => {
    if (!month) return;
    if (format === "pdf") {
      const blob = await getMonthlyReportPdf(month);
      const url = URL.createObjectURL(blob);
      window.open(url);
    } else {
      const res = await getMonthlyReport(month);
      console.log("Monthly report", res);
      toast.success("Monthly report loaded (check console)");
    }
  };

  // --- Modal handlers ---
  const openCreateModal = (type: typeof modalType) => {
    setModalType(type);
    setEditingItem(null);
    setFormData({});
    setOverrideFinal24kt(false);
    setModalOpen(true);
  };

  const openEditModal = (type: typeof modalType, item: any) => {
    setModalType(type);
    setEditingItem(item);
    setFormData({ ...item });
    setOverrideFinal24kt(type === "goldConsumption" ? false : false);
    setModalOpen(true);
  };

  const handleSave = async () => {
    try {
      if (modalType === "goldIssue") {
        if (editingItem) {
          await updateGoldIssue(editingItem.id, formData);
        } else {
          await createGoldIssue(selectedCraftsmanId, formData);
        }
      } else if (modalType === "goldConsumption") {
        const payload = { ...formData };
        // If override toggle is off, compute final_gold_24kt
        if (!overrideFinal24kt) {
          const gw = safeNumber(payload.gold_weight);
          const ct = safeNumber(payload.carat || 18);
          const cp = safeNumber(payload.conversion_percentage ?? 100);
          payload.final_gold_24kt = gw * (ct / 24) * (cp / 100);
        }
        if (editingItem) {
          await updateGoldConsumption(editingItem.id, payload);
        } else {
          await createGoldConsumption(selectedCraftsmanId, payload);
        }
      } else {
        if (editingItem) {
          await updateCashPayment(editingItem.id, formData);
        } else {
          await createCashPayment(selectedCraftsmanId, formData);
        }
      }
      toast.success("Saved successfully");
      setModalOpen(false);
      loadTransactions();
      loadStatement();
    } catch (err) {
      toast.error("Save failed");
    }
  };

  const handleDelete = async (type: typeof modalType, id: string) => {
    if (!confirm("Are you sure?")) return;
    try {
      if (type === "goldIssue") await deleteGoldIssue(id);
      else if (type === "goldConsumption") await deleteGoldConsumption(id);
      else await deleteCashPayment(id);
      toast.success("Deleted");
      loadTransactions();
      loadStatement();
    } catch (err) {
      toast.error("Delete failed");
    }
  };

  return (
    <div className="container mx-auto py-6 space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold">Craftsman Accounts</h1>
        <div className="flex gap-2">
          <Button onClick={exportPDF} disabled={!selectedCraftsmanId} variant="outline">
            <Download className="w-4 h-4 mr-2" /> Export PDF
          </Button>
          <Button onClick={loadStatement} disabled={!selectedCraftsmanId}>
            <RefreshCw className="w-4 h-4 mr-2" /> Refresh
          </Button>
        </div>
      </div>

      {/* Craftsman Selector */}
      <Card>
        <CardHeader>
          <CardTitle>Select Craftsman</CardTitle>
        </CardHeader>
        <CardContent>
          {isCraftsmenLoading ? (
            <div className="text-gray-500">Loading craftsmen...</div>
          ) : (
            <select
              className="w-full border border-gray-300 rounded-md p-2 focus:outline-none focus:ring-2 focus:ring-pink-500"
              value={selectedCraftsmanId}
              onChange={(e) => handleSelectCraftsman(e.target.value)}
            >
              <option value="">-- Select a craftsman --</option>
              {allCraftsmen.map(c => (
                <option key={c.id} value={c.id}>
                  {c.name} {c.code ? `(${c.code})` : ''}
                </option>
              ))}
            </select>
          )}
        </CardContent>
      </Card>

      {/* Date Range */}
      <Card>
        <CardHeader>
          <CardTitle>Date Range</CardTitle>
        </CardHeader>
        <CardContent className="flex gap-4 items-end">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">From</label>
            <Input type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">To</label>
            <Input type="date" value={endDate} onChange={(e) => setEndDate(e.target.value)} />
          </div>
        </CardContent>
      </Card>

      {/* Tabs */}
      <div className="border-b border-gray-200">
        <nav className="-mb-px flex space-x-8">
          <button
            onClick={() => setActiveTab("statement")}
            className={`py-2 px-1 border-b-2 font-medium text-sm ${
              activeTab === "statement"
                ? "border-pink-500 text-pink-600"
                : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
            }`}
          >
            Statement
          </button>
          <button
            onClick={() => setActiveTab("transactions")}
            className={`py-2 px-1 border-b-2 font-medium text-sm ${
              activeTab === "transactions"
                ? "border-pink-500 text-pink-600"
                : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
            }`}
          >
            Manage Transactions
          </button>
          <button
            onClick={() => setActiveTab("monthly")}
            className={`py-2 px-1 border-b-2 font-medium text-sm ${
              activeTab === "monthly"
                ? "border-pink-500 text-pink-600"
                : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
            }`}
          >
            Monthly Report
          </button>
        </nav>
      </div>

      {/* ================= STATEMENT TAB ================= */}
      {activeTab === "statement" && (
        <div className="space-y-6">
          {loading && <div>Loading statement...</div>}
          {!loading && statement && statement.totals ? (
            <>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Left side: Gold Consumptions (with new fields) */}
                <Card>
                  <CardHeader>
                    <CardTitle>Gold Consumptions</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="overflow-x-auto">
                      <table className="min-w-full divide-y divide-gray-200">
                        <thead className="bg-gray-50">
                          <tr>
                            <th className="px-2 py-2 text-left text-xs font-medium text-gray-500 uppercase">Date</th>
                            <th className="px-2 py-2 text-left text-xs font-medium text-gray-500 uppercase">Item No</th>
                            <th className="px-2 py-2 text-left text-xs font-medium text-gray-500 uppercase">Carat</th>
                            <th className="px-2 py-2 text-left text-xs font-medium text-gray-500 uppercase">Conv%</th>
                            <th className="px-2 py-2 text-left text-xs font-medium text-gray-500 uppercase">Gold Wt</th>
                            <th className="px-2 py-2 text-left text-xs font-medium text-gray-500 uppercase">Final 24kt</th>
                            <th className="px-2 py-2 text-left text-xs font-medium text-gray-500 uppercase">Labour</th>
                          </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-gray-200">
                          {statement.leftEntries.map((entry: any, idx) => (
                            <tr key={idx}>
                              <td className="px-2 py-2 text-xs">{entry.date || ""}</td>
                              <td className="px-2 py-2 text-xs">{entry.item_no || ""}</td>
                              <td className="px-2 py-2 text-xs">{entry.carat || 18}</td>
                              <td className="px-2 py-2 text-xs">{entry.conversion_percentage ?? 100}</td>
                              <td className="px-2 py-2 text-xs">{formatGold(entry.gold_weight)}</td>
                              <td className="px-2 py-2 text-xs">{formatGold(entry.final_gold_24kt)}</td>
                              <td className="px-2 py-2 text-xs">{formatCurrency(entry.labour_amount)}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                    <div className="mt-2 text-sm font-medium">
                      Total Gold Wt: {formatGold(statement.totals.totalGoldWeight)} &nbsp;
                      Total Final 24kt: {formatGold(statement.totals.totalEquivalent24kt)} &nbsp;
                      Total Labour: {formatCurrency(statement.totals.totalLabour)}
                    </div>
                  </CardContent>
                </Card>

                {/* Right side: Gold Issues + Cash Payments */}
                <Card>
                  <CardHeader>
                    <CardTitle>Gold Issued (24Kt) & Cash Payments</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="overflow-x-auto">
                      <table className="min-w-full divide-y divide-gray-200">
                        <thead className="bg-gray-50">
                          <tr>
                            <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Date</th>
                            <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Remark</th>
                            <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Cash</th>
                            <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">24Kt</th>
                          </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-gray-200">
                          {statement.rightEntries.map((entry, idx) => (
                            <tr key={idx}>
                              <td className="px-4 py-2 text-sm">{entry.date || ""}</td>
                              <td className="px-4 py-2 text-sm">{entry.remark || ""}</td>
                              <td className="px-4 py-2 text-sm">{entry.cash_amount ? formatCurrency(entry.cash_amount) : "-"}</td>
                              <td className="px-4 py-2 text-sm">{entry.quantity_24kt ? formatGold(entry.quantity_24kt) : "-"}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                    <div className="mt-2 text-sm font-medium">
                      Total Cash: {formatCurrency(statement.totals.totalCash)} &nbsp;
                      Total 24Kt Issued: {formatGold(statement.totals.total24ktIssued)}
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* Summary */}
              <Card>
                <CardHeader>
                  <CardTitle>Summary</CardTitle>
                </CardHeader>
                <CardContent>
                  <ul className="space-y-1 font-mono">
                    {statement.summaryLines.map((line, idx) => (
                      <li key={idx}>{line}</li>
                    ))}
                  </ul>
                </CardContent>
              </Card>
            </>
          ) : (
            !loading && (
              <div className="text-gray-500 text-center py-8">
                {selectedCraftsmanId ? "No statement data available for the selected period." : "Please select a craftsman to view the statement."}
              </div>
            )
          )}
        </div>
      )}

      {/* ================= TRANSACTIONS TAB ================= */}
      {activeTab === "transactions" && (
        <div className="space-y-6">
          {!selectedCraftsmanId && <div className="text-gray-500">Please select a craftsman first.</div>}
          {selectedCraftsmanId && (
            <>
              <div className="flex gap-2">
                <Button onClick={() => openCreateModal("goldIssue")}>
                  <Plus className="w-4 h-4 mr-2" /> Add Gold Issue (24Kt)
                </Button>
                <Button onClick={() => openCreateModal("goldConsumption")}>
                  <Plus className="w-4 h-4 mr-2" /> Add Gold Consumption
                </Button>
                <Button onClick={() => openCreateModal("cashPayment")}>
                  <Plus className="w-4 h-4 mr-2" /> Add Cash Payment
                </Button>
              </div>

              {/* Gold Issues Table */}
              <Card>
                <CardHeader>
                  <CardTitle>Gold Issues (24Kt)</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-200">
                      <thead className="bg-gray-50">
                        <tr>
                          <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Date</th>
                          <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Quantity (24Kt)</th>
                          <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Remark</th>
                          <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Actions</th>
                        </tr>
                      </thead>
                      <tbody className="bg-white divide-y divide-gray-200">
                        {goldIssues.map((issue) => (
                          <tr key={issue.id}>
                            <td className="px-4 py-2 text-sm">{issue.issue_date}</td>
                            <td className="px-4 py-2 text-sm">{formatGold(issue.quantity_24kt)}</td>
                            <td className="px-4 py-2 text-sm">{issue.remark}</td>
                            <td className="px-4 py-2 text-sm">
                              <Button variant="ghost" size="sm" onClick={() => openEditModal("goldIssue", issue)}>
                                <Pencil className="w-4 h-4" />
                              </Button>
                              <Button variant="ghost" size="sm" onClick={() => handleDelete("goldIssue", issue.id)}>
                                <Trash2 className="w-4 h-4" />
                              </Button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </CardContent>
              </Card>

              {/* Gold Consumptions Table (with new fields) */}
              <Card>
                <CardHeader>
                  <CardTitle>Gold Consumptions</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-200">
                      <thead className="bg-gray-50">
                        <tr>
                          <th className="px-2 py-2 text-xs font-medium text-gray-500 uppercase">Date</th>
                          <th className="px-2 py-2 text-xs font-medium text-gray-500 uppercase">Item No</th>
                          <th className="px-2 py-2 text-xs font-medium text-gray-500 uppercase">Carat</th>
                          <th className="px-2 py-2 text-xs font-medium text-gray-500 uppercase">Conv%</th>
                          <th className="px-2 py-2 text-xs font-medium text-gray-500 uppercase">Gold Wt</th>
                          <th className="px-2 py-2 text-xs font-medium text-gray-500 uppercase">Final 24kt</th>
                          <th className="px-2 py-2 text-xs font-medium text-gray-500 uppercase">Labour</th>
                          <th className="px-2 py-2 text-xs font-medium text-gray-500 uppercase">Actions</th>
                        </tr>
                      </thead>
                      <tbody className="bg-white divide-y divide-gray-200">
                        {goldConsumptions.map((item) => (
                          <tr key={item.id}>
                            <td className="px-2 py-2 text-xs">{item.consumption_date}</td>
                            <td className="px-2 py-2 text-xs">{item.item_no || ""}</td>
                            <td className="px-2 py-2 text-xs">{item.carat || 18}</td>
                            <td className="px-2 py-2 text-xs">{item.conversion_percentage ?? 100}</td>
                            <td className="px-2 py-2 text-xs">{formatGold(item.gold_weight)}</td>
                            <td className="px-2 py-2 text-xs">{formatGold(item.final_gold_24kt)}</td>
                            <td className="px-2 py-2 text-xs">{formatCurrency(item.labour_amount)}</td>
                            <td className="px-2 py-2 text-xs">
                              <Button variant="ghost" size="sm" onClick={() => openEditModal("goldConsumption", item)}>
                                <Pencil className="w-4 h-4" />
                              </Button>
                              <Button variant="ghost" size="sm" onClick={() => handleDelete("goldConsumption", item.id)}>
                                <Trash2 className="w-4 h-4" />
                              </Button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </CardContent>
              </Card>

              {/* Cash Payments Table */}
              <Card>
                <CardHeader>
                  <CardTitle>Cash Payments</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-200">
                      <thead className="bg-gray-50">
                        <tr>
                          <th className="px-4 py-2 text-xs font-medium text-gray-500 uppercase">Date</th>
                          <th className="px-4 py-2 text-xs font-medium text-gray-500 uppercase">Amount</th>
                          <th className="px-4 py-2 text-xs font-medium text-gray-500 uppercase">Remark</th>
                          <th className="px-4 py-2 text-xs font-medium text-gray-500 uppercase">Actions</th>
                        </tr>
                      </thead>
                      <tbody className="bg-white divide-y divide-gray-200">
                        {cashPayments.map((item) => (
                          <tr key={item.id}>
                            <td className="px-4 py-2 text-sm">{item.payment_date}</td>
                            <td className="px-4 py-2 text-sm">{formatCurrency(item.amount)}</td>
                            <td className="px-4 py-2 text-sm">{item.remark}</td>
                            <td className="px-4 py-2 text-sm">
                              <Button variant="ghost" size="sm" onClick={() => openEditModal("cashPayment", item)}>
                                <Pencil className="w-4 h-4" />
                              </Button>
                              <Button variant="ghost" size="sm" onClick={() => handleDelete("cashPayment", item.id)}>
                                <Trash2 className="w-4 h-4" />
                              </Button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </CardContent>
              </Card>
            </>
          )}
        </div>
      )}

      {/* ================= MONTHLY REPORT TAB ================= */}
      {activeTab === "monthly" && (
        <Card>
          <CardHeader>
            <CardTitle>Monthly Report (All Craftsmen)</CardTitle>
            <p className="text-sm text-gray-500">Select month and generate JSON or PDF</p>
          </CardHeader>
          <CardContent className="flex gap-4 items-end">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Month (YYYY-MM)</label>
              <Input type="month" value={month} onChange={(e) => setMonth(e.target.value)} />
            </div>
            <Button onClick={() => handleMonthlyReport("json")}>View JSON</Button>
            <Button onClick={() => handleMonthlyReport("pdf")}>Download PDF</Button>
          </CardContent>
        </Card>
      )}

      {/* ================= MODAL OVERLAY ================= */}
      {modalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center p-4 border-b">
              <h3 className="text-lg font-semibold">
                {editingItem ? "Edit" : "Create"} {modalType === "goldIssue" && "Gold Issue"}
                {modalType === "goldConsumption" && "Gold Consumption"}
                {modalType === "cashPayment" && "Cash Payment"}
              </h3>
              <button onClick={() => setModalOpen(false)} className="text-gray-400 hover:text-gray-600">
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="p-4 space-y-4">
              {/* Gold Issue Form */}
              {modalType === "goldIssue" && (
                <>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Date</label>
                    <Input
                      type="date"
                      value={formData.issue_date || ""}
                      onChange={(e) => setFormData({ ...formData, issue_date: e.target.value })}
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Quantity (24Kt)</label>
                    <Input
                      type="number"
                      step="0.001"
                      value={formData.quantity_24kt || ""}
                      onChange={(e) => setFormData({ ...formData, quantity_24kt: parseFloat(e.target.value) })}
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Remark</label>
                    <Input
                      value={formData.remark || ""}
                      onChange={(e) => setFormData({ ...formData, remark: e.target.value })}
                    />
                  </div>
                </>
              )}

              {/* Gold Consumption Form */}
              {modalType === "goldConsumption" && (
                <>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Date</label>
                    <Input
                      type="date"
                      value={formData.consumption_date || ""}
                      onChange={(e) => setFormData({ ...formData, consumption_date: e.target.value })}
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Gold Weight</label>
                    <Input
                      type="number"
                      step="0.001"
                      value={formData.gold_weight || ""}
                      onChange={(e) => setFormData({ ...formData, gold_weight: parseFloat(e.target.value) })}
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Carat</label>
                    <Input
                      type="number"
                      step="0.1"
                      value={formData.carat || 18}
                      onChange={(e) => setFormData({ ...formData, carat: parseFloat(e.target.value) })}
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Conversion %</label>
                    <Input
                      type="number"
                      step="0.01"
                      value={formData.conversion_percentage ?? 100}
                      onChange={(e) => setFormData({ ...formData, conversion_percentage: parseFloat(e.target.value) })}
                    />
                  </div>
                  <div className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      checked={overrideFinal24kt}
                      onChange={(e) => setOverrideFinal24kt(e.target.checked)}
                    />
                    <label className="text-sm text-gray-700">Custom Final 24kt Value</label>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Final Gold (24kt) {overrideFinal24kt ? "(manual)" : "(auto)"}
                    </label>
                    <Input
                      type="number"
                      step="0.001"
                      value={
                        overrideFinal24kt
                          ? formData.final_gold_24kt || ""
                          : (() => {
                              const gw = safeNumber(formData.gold_weight);
                              const ct = safeNumber(formData.carat || 18);
                              const cp = safeNumber(formData.conversion_percentage ?? 100);
                              return (gw * (ct / 24) * (cp / 100)).toFixed(3);
                            })()
                      }
                      onChange={(e) => {
                        if (overrideFinal24kt) {
                          setFormData({ ...formData, final_gold_24kt: parseFloat(e.target.value) });
                        }
                      }}
                      disabled={!overrideFinal24kt}
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Labour Amount</label>
                    <Input
                      type="number"
                      step="0.01"
                      value={formData.labour_amount || ""}
                      onChange={(e) => setFormData({ ...formData, labour_amount: parseFloat(e.target.value) })}
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Item No</label>
                    <Input
                      type="text"
                      value={formData.item_no || ""}
                      onChange={(e) => setFormData({ ...formData, item_no: e.target.value })}
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Remark</label>
                    <Input
                      value={formData.remark || ""}
                      onChange={(e) => setFormData({ ...formData, remark: e.target.value })}
                    />
                  </div>
                </>
              )}

              {/* Cash Payment Form */}
              {modalType === "cashPayment" && (
                <>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Date</label>
                    <Input
                      type="date"
                      value={formData.payment_date || ""}
                      onChange={(e) => setFormData({ ...formData, payment_date: e.target.value })}
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Amount</label>
                    <Input
                      type="number"
                      step="0.01"
                      value={formData.amount || ""}
                      onChange={(e) => setFormData({ ...formData, amount: parseFloat(e.target.value) })}
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Remark</label>
                    <Input
                      value={formData.remark || ""}
                      onChange={(e) => setFormData({ ...formData, remark: e.target.value })}
                    />
                  </div>
                </>
              )}
            </div>
            <div className="flex justify-end gap-2 p-4 border-t">
              <Button variant="outline" onClick={() => setModalOpen(false)}>Cancel</Button>
              <Button onClick={handleSave}>Save</Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
} 