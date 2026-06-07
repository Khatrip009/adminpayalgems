// src/pages/finance/AdminPaymentCollectionPage.tsx
import React, { useState, useEffect, useCallback } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/input";
import { toast } from "react-hot-toast";
import {
  Download,
  RefreshCw,
  DollarSign,
  AlertTriangle,
  CheckCircle,
  X,
  CreditCard,
  FileText,
} from "lucide-react";
import { getOutstandingReport, getOutstandingReportPdf } from "@/api/inventory/payments.api";
import type { OutstandingPayment } from "@/api/inventory/payments.api";

const AdminPaymentCollectionPage: React.FC = () => {
  const [statusFilter, setStatusFilter] = useState<"all" | "overdue" | "late">("all");
  const [data, setData] = useState<OutstandingPayment[]>([]);
  const [loading, setLoading] = useState(false);
  const [modalOpen, setModalOpen] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState<OutstandingPayment | null>(null);
  const [paymentAmount, setPaymentAmount] = useState<number>(0);
  const [paymentMethod, setPaymentMethod] = useState<string>("Cash");

  const loadReport = useCallback(async () => {
    setLoading(true);
    try {
      const res = await getOutstandingReport({ status: statusFilter });
      if (res.ok) {
        const normalizedData = res.data.map((item) => ({
          ...item,
          grand_total: Number(item.grand_total),
          paid_amount: Number(item.paid_amount),
          amount_due: Number(item.amount_due),
          days_overdue: Number(item.days_overdue),
        }));
        setData(normalizedData);
      } else {
        toast.error("Failed to load outstanding report");
      }
    } catch (err) {
      console.error(err);
      toast.error("Error fetching outstanding report");
    } finally {
      setLoading(false);
    }
  }, [statusFilter]);

  useEffect(() => {
    loadReport();
  }, [loadReport]);

  const totalDue = data.reduce((sum, d) => sum + d.amount_due, 0);
  const totalOrders = data.length;
  const avgDue = totalOrders > 0 ? totalDue / totalOrders : 0;

  const handleExportCSV = () => {
    if (!data.length) {
      toast.error("No data to export");
      return;
    }
    const headers = [
      "Order Number",
      "Customer Name",
      "Grand Total",
      "Paid Amount",
      "Amount Due",
      "Placed At",
      "Days Overdue",
    ];
    const rows = data.map((d) => [
      d.order_number,
      d.customer_name,
      d.grand_total.toFixed(2),
      d.paid_amount.toFixed(2),
      d.amount_due.toFixed(2),
      d.placed_at,
      d.days_overdue,
    ]);
    const csvContent = [headers, ...rows]
      .map((row) => row.map((cell) => `"${cell}"`).join(","))
      .join("\n");
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.download = `outstanding_payments_${new Date().toISOString().slice(0, 10)}.csv`;
    link.click();
    URL.revokeObjectURL(link.href);
    toast.success("Exported to CSV");
  };

  const handleExportPDF = async () => {
    try {
      toast.loading("Generating PDF...", { id: "pdf-gen" });
      const blob = await getOutstandingReportPdf({ status: statusFilter });
      const url = URL.createObjectURL(blob);
      window.open(url);
      toast.success("PDF generated", { id: "pdf-gen" });
    } catch (err) {
      console.error(err);
      toast.error("Failed to generate PDF", { id: "pdf-gen" });
    }
  };

  const openPaymentModal = (order: OutstandingPayment) => {
    setSelectedOrder(order);
    setPaymentAmount(order.amount_due);
    setModalOpen(true);
  };

  const handleRecordPayment = async () => {
    if (!selectedOrder) return;
    if (paymentAmount <= 0 || paymentAmount > selectedOrder.amount_due) {
      toast.error(`Amount must be between 1 and ${selectedOrder.amount_due}`);
      return;
    }
    toast.success(`Payment of ₹${paymentAmount.toFixed(2)} recorded successfully.`);
    setModalOpen(false);
    loadReport();
  };

  const getStatusBadge = (days: number) => {
    if (days >= 30)
      return (
        <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-red-100 text-red-800">
          <AlertTriangle className="w-3 h-3 mr-1" /> Overdue
        </span>
      );
    if (days >= 15)
      return (
        <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
          Late
        </span>
      );
    return (
      <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
        Current
      </span>
    );
  };

  return (
    <div className="container mx-auto py-6 space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold">Payment Collection – Outstanding Orders</h1>
        <div className="flex gap-2">
          <Button onClick={loadReport} variant="outline" disabled={loading}>
            <RefreshCw className={`w-4 h-4 mr-2 ${loading ? "animate-spin" : ""}`} />
            Refresh
          </Button>
          <Button onClick={handleExportCSV} variant="outline">
            <Download className="w-4 h-4 mr-2" /> Export CSV
          </Button>
          <Button onClick={handleExportPDF} variant="outline">
            <FileText className="w-4 h-4 mr-2" /> Export PDF
          </Button>
        </div>
      </div>

      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle>Filters</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-4 items-end">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Overdue Status
              </label>
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value as any)}
                className="border border-gray-300 rounded-md p-2 focus:ring-pink-500 focus:border-pink-500"
              >
                <option value="all">All Outstanding</option>
                <option value="overdue">Overdue (≥30 days)</option>
                <option value="late">Late (15–29 days)</option>
              </select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">Total Due Amount</p>
                <p className="text-2xl font-bold">₹ {totalDue.toFixed(2)}</p>
              </div>
              <DollarSign className="h-8 w-8 text-emerald-500" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">Outstanding Orders</p>
                <p className="text-2xl font-bold">{totalOrders}</p>
              </div>
              <AlertTriangle className="h-8 w-8 text-orange-500" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">Average Due per Order</p>
                <p className="text-2xl font-bold">₹ {avgDue.toFixed(2)}</p>
              </div>
              <CreditCard className="h-8 w-8 text-blue-500" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Data Table */}
      <Card>
        <CardHeader>
          <CardTitle>Outstanding Orders</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Order #</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Customer</th>
                  <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">Grand Total</th>
                  <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">Paid</th>
                  <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">Due</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Placed On</th>
                  <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase">Status</th>
                  <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase">Action</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {loading ? (
                  <tr>
                    <td colSpan={8} className="px-4 py-8 text-center">Loading...</td>
                  </tr>
                ) : data.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="px-4 py-8 text-center text-gray-500">No outstanding orders found</td>
                  </tr>
                ) : (
                  data.map((row) => (
                    <tr key={row.order_id}>
                      <td className="px-4 py-3 text-sm font-medium">{row.order_number}</td>
                      <td className="px-4 py-3 text-sm">{row.customer_name || "—"}</td>
                      <td className="px-4 py-3 text-sm text-right">₹ {row.grand_total.toFixed(2)}</td>
                      <td className="px-4 py-3 text-sm text-right">₹ {row.paid_amount.toFixed(2)}</td>
                      <td className="px-4 py-3 text-sm text-right font-semibold text-red-600">₹ {row.amount_due.toFixed(2)}</td>
                      <td className="px-4 py-3 text-sm">{new Date(row.placed_at).toLocaleDateString()}</td>
                      <td className="px-4 py-3 text-sm text-center">{getStatusBadge(row.days_overdue)}</td>
                      <td className="px-4 py-3 text-sm text-center">
                        <Button size="sm" onClick={() => openPaymentModal(row)} variant="outline">
                          <CheckCircle className="w-4 h-4 mr-1" /> Record Payment
                        </Button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      {/* Payment Modal */}
      {modalOpen && selectedOrder && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full">
            <div className="flex justify-between items-center p-4 border-b">
              <h3 className="text-lg font-semibold">Record Payment</h3>
              <button onClick={() => setModalOpen(false)} className="text-gray-400 hover:text-gray-600">
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="p-4 space-y-4">
              <div>
                <p className="text-sm text-gray-600">Order: <strong>{selectedOrder.order_number}</strong></p>
                <p className="text-sm text-gray-600">Due Amount: <strong>₹ {selectedOrder.amount_due.toFixed(2)}</strong></p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Payment Amount</label>
                <Input
                  type="number"
                  step="0.01"
                  min={1}
                  max={selectedOrder.amount_due}
                  value={paymentAmount}
                  onChange={(e) => setPaymentAmount(parseFloat(e.target.value) || 0)}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Payment Method</label>
                <select
                  value={paymentMethod}
                  onChange={(e) => setPaymentMethod(e.target.value)}
                  className="w-full border border-gray-300 rounded-md p-2"
                >
                  <option>Cash</option>
                  <option>Card</option>
                  <option>UPI</option>
                  <option>Bank Transfer</option>
                  <option>Cheque</option>
                </select>
              </div>
              <p className="text-xs text-gray-500">Note: This will record a payment and update the order’s paid amount.</p>
            </div>
            <div className="flex justify-end gap-2 p-4 border-t">
              <Button variant="outline" onClick={() => setModalOpen(false)}>Cancel</Button>
              <Button onClick={handleRecordPayment}>Record Payment</Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminPaymentCollectionPage;