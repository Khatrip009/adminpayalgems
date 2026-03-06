// src/pages/AdminPaymentDetailPage.tsx

import React, { useEffect, useState } from "react";
import {
  CreditCard,
  ArrowLeft,
  Loader2,
  RotateCcw,
  FileText,
  ChevronDown,
  ChevronUp,
} from "lucide-react";

import { useParams, useNavigate } from "react-router-dom";
import { toast } from "react-hot-toast";

import {
  getPaymentById,
  getRefundsByPayment,
  createRefund,
  getInvoicesByOrder,
  type Payment,
  type Refund,
  type Invoice,
} from "@/api/inventory/payments.api";

import { getOrderById } from "@/api/sales/orders.api";

import { AdminPageHeader } from "@/components/admin/AdminPageHeader";

const money = (a: number, c = "INR") =>
  `${c} ${Number(a || 0).toLocaleString()}`;

const badgeClass = (status: string) => {
  const s = status.toLowerCase();
  if (["paid", "success"].includes(s))
    return "border-emerald-300 bg-emerald-50 text-emerald-700 dark:border-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-200";

  if (["failed", "refused"].includes(s))
    return "border-rose-300 bg-rose-50 text-rose-700 dark:border-rose-700 dark:bg-rose-900/30 dark:text-rose-200";

  if (["pending", "created"].includes(s))
    return "border-slate-300 bg-slate-100 text-slate-700 dark:border-slate-600 dark:bg-slate-900 dark:text-slate-200";

  return "border-slate-300 bg-slate-100 text-slate-700 dark:border-slate-600 dark:bg-slate-900 dark:text-slate-200";
};

export default function AdminPaymentDetailPage() {
  const params = useParams();
  const navigate = useNavigate();
  const paymentId = params.id;

  const [payment, setPayment] = useState<Payment | null>(null);
  const [order, setOrder] = useState<any>(null);
  const [refunds, setRefunds] = useState<Refund[]>([]);
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [expandedResponse, setExpandedResponse] = useState(false);
  const [loading, setLoading] = useState(true);

  const [refundAmount, setRefundAmount] = useState<string>("");

  async function load() {
    if (!paymentId) return;

    setLoading(true);
    try {
      const p = await getPaymentById(paymentId);
      setPayment(p.payment);

      if (p.payment.order_id) {
        const o = await getOrderById(p.payment.order_id);
        setOrder(o.order);
      }

      const r = await getRefundsByPayment(paymentId);
      setRefunds(r.refunds);

      if (p.payment.order_id) {
        const inv = await getInvoicesByOrder(p.payment.order_id);
        setInvoices(inv.invoices);
      }
    } catch (err) {
      console.error(err);
      toast.error("Failed to load payment details");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
    // eslint-disable-next-line
  }, [paymentId]);

  async function handleRefund() {
    if (!payment) return;
    const amt = Number(refundAmount);

    if (!amt || amt <= 0) {
      toast.error("Enter a valid refund amount.");
      return;
    }

    if (amt > payment.amount) {
      toast.error("Refund cannot exceed payment amount");
      return;
    }

    try {
      const res = await createRefund(payment.id, {
        amount: amt,
        reason: "admin_manual_refund",
      });
      toast.success("Refund created");
      await load();
    } catch (err) {
      console.error(err);
      toast.error("Refund failed");
    }
  }

  if (loading)
    return (
      <div className="flex h-80 items-center justify-center">
        <Loader2 className="animate-spin" />
      </div>
    );

  if (!payment)
    return (
      <div className="p-6">
        <p className="text-center text-lg">Payment not found.</p>
      </div>
    );

  return (
    <div>
      <AdminPageHeader
        title={`Payment #${payment.id.slice(0, 8)}`}
        subtitle="Payment details, timeline, refunds and invoice information."
        breadcrumbs={[
          { label: "Dashboard", path: "/" },
          { label: "Payments", path: "/payments" },
          { label: payment.id.slice(0, 8) },
        ]}
        right={
          <button
            onClick={() => navigate(-1)}
            className="inline-flex items-center gap-2 rounded-full border border-slate-300 px-4 py-2.5 text-sm hover:bg-slate-100 dark:border-slate-700 dark:hover:bg-slate-800"
          >
            <ArrowLeft size={16} /> Back
          </button>
        }
      />

      <div className="px-6 py-10 space-y-10">

        {/* -----------------------
            Section: Payment Info
        ------------------------ */}
        <div className="rounded-2xl border border-slate-300 bg-white p-6 shadow-sm dark:border-slate-700 dark:bg-slate-900">
          <div className="flex items-center gap-3">
            <CreditCard className="text-sky-600" />
            <h2 className="text-xl font-semibold">Payment Information</h2>
          </div>

          <div className="mt-6 grid grid-cols-1 md:grid-cols-2 gap-6">
            <Info label="Provider" value={payment.provider} />
            <Info label="Provider Payment ID" value={payment.provider_payment_id || "—"} />
            <Info label="Amount" value={money(payment.amount, payment.currency)} />
            <Info label="Status" value={
              <span className={`inline-flex items-center gap-1 rounded-full border px-2.5 py-1 text-sm font-medium ${badgeClass(payment.status)}`}>
                {payment.status}
              </span>
            } />
            <Info label="Created At" value={new Date(payment.created_at).toLocaleString()} />
            <Info label="Paid At" value={payment.paid_at ? new Date(payment.paid_at).toLocaleString() : "—"} />
          </div>

          {/* JSON RESPONSE */}
          <div className="mt-6">
            <button
              onClick={() => setExpandedResponse(!expandedResponse)}
              className="flex items-center gap-2 text-sky-600 hover:underline"
            >
              {expandedResponse ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
              Gateway Raw Response
            </button>

            {expandedResponse && (
              <pre className="mt-3 max-h-80 overflow-auto rounded-xl bg-slate-900 p-4 text-slate-100 text-sm">
                {JSON.stringify(payment.raw_response || {}, null, 2)}
              </pre>
            )}
          </div>
        </div>

        {/* -----------------------
            Section: Linked Order
        ------------------------ */}
        {order && (
          <div className="rounded-2xl border border-slate-300 bg-white p-6 shadow-sm dark:border-slate-700 dark:bg-slate-900">
            <div className="flex items-center gap-3">
              <FileText className="text-amber-600" />
              <h2 className="text-xl font-semibold">Linked Order</h2>
            </div>

            <div className="mt-6 space-y-3">
              <div className="font-semibold text-lg">
                Order #{order.order_number}
              </div>

              <div className="text-sm text-slate-600 dark:text-slate-300">
                Grand Total: {money(order.grand_total, order.currency)}
              </div>

              <button
                onClick={() => navigate(`/orders/${order.id}`)}
                className="mt-2 inline-flex items-center gap-2 rounded-full border border-slate-300 px-4 py-2 text-sm hover:bg-slate-50 dark:border-slate-700 dark:hover:bg-slate-800"
              >
                View Order
              </button>
            </div>
          </div>
        )}

        {/* -----------------------
            Section: Refunds
        ------------------------ */}
        <div className="rounded-2xl border border-slate-300 bg-white p-6 shadow-sm dark:border-slate-700 dark:bg-slate-900">
          <div className="flex items-center gap-3 mb-4">
            <RotateCcw className="text-rose-600" />
            <h2 className="text-xl font-semibold">Refunds</h2>
          </div>

          {refunds.length === 0 && (
            <p className="text-slate-500 text-sm">No refunds yet.</p>
          )}

          {refunds.length > 0 && (
            <div className="space-y-4">
              {refunds.map((r) => (
                <div
                  key={r.id}
                  className="rounded-xl border border-slate-200 p-4 dark:border-slate-700"
                >
                  <div className="flex justify-between">
                    <div>
                      <div className="font-semibold text-slate-700 dark:text-slate-100">
                        Refund #{r.id.slice(0, 8)}
                      </div>
                      <div className="text-sm text-slate-500 mt-1">
                        Amount: {money(r.amount, r.currency)}
                      </div>
                    </div>
                    <div
                      className={`rounded-full border px-3 py-1 text-sm font-medium ${badgeClass(
                        r.status
                      )}`}
                    >
                      {r.status}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Refund Action */}
          <div className="mt-6">
            <div className="font-medium mb-2">Issue Refund</div>

            <div className="flex items-center gap-3">
              <input
                type="number"
                value={refundAmount}
                onChange={(e) => setRefundAmount(e.target.value)}
                placeholder="Refund amount"
                className="rounded-full border border-slate-300 px-4 py-2 text-sm dark:border-slate-700 dark:bg-slate-800"
              />

              <button
                onClick={handleRefund}
                className="inline-flex items-center gap-2 rounded-full bg-rose-600 px-4 py-2 text-sm font-medium text-white shadow hover:bg-rose-700"
              >
                Issue Refund
              </button>
            </div>
          </div>
        </div>

        {/* -----------------------
            Section: Invoices
        ------------------------ */}
        {invoices && invoices.length > 0 && (
          <div className="rounded-2xl border border-slate-300 bg-white p-6 shadow-sm dark:border-slate-700 dark:bg-slate-900">
            <div className="flex items-center gap-3 mb-4">
              <FileText className="text-blue-600" />
              <h2 className="text-xl font-semibold">Invoices</h2>
            </div>

            <div className="space-y-4">
              {invoices.map((inv) => (
                <div
                  key={inv.id}
                  className="rounded-xl border border-slate-200 p-4 dark:border-slate-700"
                >
                  <div className="flex justify-between items-center">
                    <div>
                      <div className="font-semibold text-slate-700 dark:text-slate-100">
                        Invoice #{inv.invoice_number}
                      </div>
                      <div className="text-sm text-slate-500 mt-1">
                        Total: {money(inv.grand_total, inv.currency)}
                      </div>
                    </div>

                    <button
                      onClick={() => navigate(`/invoices/${inv.id}`)}
                      className="inline-flex items-center gap-2 rounded-full border border-slate-300 px-3 py-1.5 text-sm hover:bg-slate-100 dark:border-slate-700 dark:hover:bg-slate-800"
                    >
                      <FileText size={14} /> View Invoice
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

/* ----------------------------------------------------------
   Small reusable info row
---------------------------------------------------------- */
function Info({ label, value }: { label: string; value: any }) {
  return (
    <div>
      <div className="text-sm text-slate-500">{label}</div>
      <div className="text-base font-medium mt-1">{value}</div>
    </div>
  );
}
