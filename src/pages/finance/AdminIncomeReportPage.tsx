// src/pages/finance/AdminIncomeReportPage.tsx
import React, { useState, useEffect, useCallback } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/input";
import { toast } from "react-hot-toast";
import {
  BarChart3,
  Download,
  TrendingUp,
  CreditCard,
  RefreshCw,
  FileText,
} from "lucide-react";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";
import { format, parseISO } from "date-fns";
import { getIncomeReport, getIncomeReportPdf } from "@/api/inventory/payments.api";
import type { IncomeReportData } from "@/api/inventory/payments.api";

const AdminIncomeReportPage: React.FC = () => {
  const [startDate, setStartDate] = useState<string>(
    format(new Date(new Date().setDate(1)), "yyyy-MM-dd")
  );
  const [endDate, setEndDate] = useState<string>(format(new Date(), "yyyy-MM-dd"));
  const [groupBy, setGroupBy] = useState<"day" | "week" | "month">("day");
  const [data, setData] = useState<IncomeReportData[]>([]);
  const [loading, setLoading] = useState(false);

  const loadReport = useCallback(async () => {
    setLoading(true);
    try {
      const res = await getIncomeReport({ startDate, endDate, groupBy });
      if (res.ok) {
        const normalizedData = res.data.map(item => ({
          ...item,
          total_amount: Number(item.total_amount),
          transaction_count: Number(item.transaction_count),
        }));
        setData(normalizedData);
      } else {
        toast.error("Failed to load income report");
      }
    } catch (err) {
      console.error(err);
      toast.error("Error fetching income report");
    } finally {
      setLoading(false);
    }
  }, [startDate, endDate, groupBy]);

  useEffect(() => {
    loadReport();
  }, [loadReport]);

  const chartData = React.useMemo(() => {
    const periodMap = new Map<string, number>();
    data.forEach((item) => {
      const period = format(parseISO(item.period), "yyyy-MM-dd");
      periodMap.set(period, (periodMap.get(period) || 0) + item.total_amount);
    });
    return Array.from(periodMap.entries())
      .map(([period, total]) => ({ period, total }))
      .sort((a, b) => a.period.localeCompare(b.period));
  }, [data]);

  const tableData = data;
  const totalIncome = data.reduce((sum, d) => sum + d.total_amount, 0);
  const totalTransactions = data.reduce((sum, d) => sum + d.transaction_count, 0);

  const handleExportCSV = () => {
    if (!tableData.length) {
      toast.error("No data to export");
      return;
    }
    const headers = ["Period", "Payment Method", "Total Amount (₹)", "Transaction Count"];
    const rows = tableData.map((d) => [
      d.period,
      d.payment_method,
      d.total_amount.toFixed(2),
      d.transaction_count,
    ]);
    const csvContent = [headers, ...rows]
      .map((row) => row.map((cell) => `"${cell}"`).join(","))
      .join("\n");
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.download = `income_report_${startDate}_to_${endDate}.csv`;
    link.click();
    URL.revokeObjectURL(link.href);
    toast.success("Exported to CSV");
  };

  const handleExportExcel = () => {
    import("xlsx").then((XLSX) => {
      const wsData = [
        ["Period", "Payment Method", "Total Amount (₹)", "Transaction Count"],
        ...tableData.map((d) => [
          d.period,
          d.payment_method,
          d.total_amount,
          d.transaction_count,
        ]),
      ];
      const ws = XLSX.utils.aoa_to_sheet(wsData);
      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, "Income Report");
      XLSX.writeFile(wb, `income_report_${startDate}_to_${endDate}.xlsx`);
      toast.success("Exported to Excel");
    });
  };

  const handleExportPDF = async () => {
    try {
      toast.loading("Generating PDF...", { id: "pdf-gen" });
      const blob = await getIncomeReportPdf({ startDate, endDate, groupBy });
      const url = URL.createObjectURL(blob);
      window.open(url);
      toast.success("PDF generated", { id: "pdf-gen" });
    } catch (err) {
      console.error(err);
      toast.error("Failed to generate PDF", { id: "pdf-gen" });
    }
  };

  return (
    <div className="container mx-auto py-4 sm:py-6 space-y-4 sm:space-y-6">
      {/* Header – wrap buttons on mobile */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
        <h1 className="text-xl sm:text-2xl font-bold">Income Report</h1>
        <div className="flex flex-wrap gap-2">
          <Button onClick={loadReport} variant="outline" disabled={loading} size="sm">
            <RefreshCw className={`w-4 h-4 mr-2 ${loading ? "animate-spin" : ""}`} />
            Refresh
          </Button>
          <Button onClick={handleExportCSV} variant="outline" size="sm">
            <Download className="w-4 h-4 mr-2" /> CSV
          </Button>
          <Button onClick={handleExportExcel} variant="outline" size="sm">
            <Download className="w-4 h-4 mr-2" /> Excel
          </Button>
          <Button onClick={handleExportPDF} variant="outline" size="sm">
            <FileText className="w-4 h-4 mr-2" /> PDF
          </Button>
        </div>
      </div>

      {/* Filters – stack on mobile */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-base sm:text-lg">Filters</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-end">
            <div className="w-full sm:w-auto">
              <label className="block text-sm font-medium text-gray-700 mb-1">Start Date</label>
              <Input type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} className="w-full sm:w-auto" />
            </div>
            <div className="w-full sm:w-auto">
              <label className="block text-sm font-medium text-gray-700 mb-1">End Date</label>
              <Input type="date" value={endDate} onChange={(e) => setEndDate(e.target.value)} className="w-full sm:w-auto" />
            </div>
            <div className="w-full sm:w-auto">
              <label className="block text-sm font-medium text-gray-700 mb-1">Group By</label>
              <select
                value={groupBy}
                onChange={(e) => setGroupBy(e.target.value as any)}
                className="w-full sm:w-auto border border-gray-300 rounded-md p-2 focus:ring-pink-500 focus:border-pink-500"
              >
                <option value="day">Day</option>
                <option value="week">Week</option>
                <option value="month">Month</option>
              </select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Summary Cards – stack on mobile */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs sm:text-sm text-gray-500">Total Income</p>
                <p className="text-xl sm:text-2xl font-bold">₹ {totalIncome.toFixed(2)}</p>
              </div>
              <TrendingUp className="h-6 w-6 sm:h-8 sm:w-8 text-emerald-500" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs sm:text-sm text-gray-500">Total Transactions</p>
                <p className="text-xl sm:text-2xl font-bold">{totalTransactions}</p>
              </div>
              <CreditCard className="h-6 w-6 sm:h-8 sm:w-8 text-blue-500" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs sm:text-sm text-gray-500">Average Daily Income</p>
                <p className="text-xl sm:text-2xl font-bold">
                  ₹ {(totalIncome / Math.max(1, chartData.length)).toFixed(2)}
                </p>
              </div>
              <BarChart3 className="h-6 w-6 sm:h-8 sm:w-8 text-purple-500" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Chart – responsive height */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base sm:text-lg">Income Trend</CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="h-48 sm:h-64 flex items-center justify-center">Loading chart...</div>
          ) : chartData.length === 0 ? (
            <div className="h-48 sm:h-64 flex items-center justify-center text-gray-500">
              No data available for selected period
            </div>
          ) : (
            <div className="h-64 sm:h-[350px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={chartData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="period" tick={{ fontSize: 12 }} />
                  <YAxis tick={{ fontSize: 12 }} />
                  <Tooltip formatter={(value) => `₹ ${value}`} />
                  <Legend wrapperStyle={{ fontSize: 12 }} />
                  <Line
                    type="monotone"
                    dataKey="total"
                    stroke="#0F172A"
                    strokeWidth={2}
                    dot={{ r: 3 }}
                    name="Total Income (₹)"
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Data Table – horizontally scrollable on small screens */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base sm:text-lg">Income Breakdown</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <div className="min-w-[600px] sm:min-w-full">
              <table className="w-full text-left text-sm divide-y divide-gray-200">
                <thead className="bg-gray-50 text-xs font-medium text-gray-500 uppercase">
                  <tr>
                    <th className="px-3 py-3">Period</th>
                    <th className="px-3 py-3">Payment Method</th>
                    <th className="px-3 py-3 text-right">Total Amount (₹)</th>
                    <th className="px-3 py-3 text-right">Transactions</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {loading ? (
                    <tr>
                      <td colSpan={4} className="px-3 py-8 text-center">Loading...</td>
                    </tr>
                  ) : tableData.length === 0 ? (
                    <tr>
                      <td colSpan={4} className="px-3 py-8 text-center text-gray-500">No data found</td>
                    </tr>
                  ) : (
                    tableData.map((row, idx) => (
                      <tr key={idx} className="hover:bg-gray-50">
                        <td className="px-3 py-2 whitespace-nowrap">{format(parseISO(row.period), "PPP")}</td>
                        <td className="px-3 py-2">{row.payment_method}</td>
                        <td className="px-3 py-2 text-right">₹ {row.total_amount.toFixed(2)}</td>
                        <td className="px-3 py-2 text-right">{row.transaction_count}</td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default AdminIncomeReportPage;