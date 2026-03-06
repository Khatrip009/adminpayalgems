// src/pages/AdminInvoiceDetailPage.tsx

import React, { useEffect, useState, useMemo } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { toast } from "react-hot-toast";

import {
  ArrowLeft,
  FileText,
  Loader2,
  Package,
  CreditCard,
  Download,
  User,
  MapPin,
  Info as InfoIcon,
} from "lucide-react";

import { AdminPageHeader } from "@/components/admin/AdminPageHeader";
import { getInvoiceById, type Invoice } from "@/api/inventory/payments.api";
import { getOrderById, type Order, type OrderItem } from "@/api/sales/orders.api";

const API_BASE_URL =
  import.meta.env.VITE_API_BASE_URL || "http://localhost:4500/api";

const money = (a: number, c = "INR") =>
  `${c} ${Number(a || 0).toLocaleString()}`;

const dt = (v?: string | null) => {
  if (!v) return "—";
  const d = new Date(v);
  return Number.isNaN(d.getTime()) ? "—" : d.toLocaleString();
};

export default function AdminInvoiceDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();

  const [invoice, setInvoice] = useState<Invoice | null>(null);
  const [order, setOrder] = useState<Order | null>(null);
  const [orderItems, setOrderItems] = useState<OrderItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [downloading, setDownloading] = useState(false);

  const invoiceItems = useMemo(() => {
    if (!invoice) return [];
    const items = (invoice as any).items;
    return Array.isArray(items) ? items : [];
    // backend supports JSONB array
  }, [invoice]);

  async function load() {
    if (!id) return;
    setLoading(true);
    try {
      const invRes = await getInvoiceById(id);
      const inv = invRes.invoice;
      setInvoice(inv);

      if (inv.order_id) {
        const oRes = await getOrderById(inv.order_id);
        setOrder(oRes.order);
        setOrderItems(oRes.items);
      }
    } catch (err) {
      console.error("Invoice load failed", err);
      toast.error("Failed to load invoice.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
  }, [id]);

  if (loading) {
    return (
      <div className="flex h-80 items-center justify-center">
        <Loader2 className="animate-spin" />
      </div>
    );
  }

  if (!invoice) {
    return (
      <div className="p-6">
        <p className="text-center text-lg text-slate-600 dark:text-slate-300">
          Invoice not found.
        </p>
      </div>
    );
  }

  const currency =
    (invoice as any).currency || (order && order.currency) || "INR";

  const subtotal = Number(invoice.subtotal || 0);
  const taxTotal = Number(invoice.tax_total || 0);
  const discountTotal = Number(invoice.discount_total || 0);
  const shippingTotal = Number(invoice.shipping_total || 0);
  const grandTotal = Number(invoice.grand_total || 0);

  const status =
    (invoice as any).status || order?.payment_status || "issued";

  const invoiceDate =
    (invoice as any).invoice_date ||
    (invoice as any).issued_at ||
    invoice.created_at;

  const billingAddress =
    (invoice as any).billing_address || order?.billing_address;

  const shippingAddress =
    (invoice as any).shipping_address || order?.shipping_address;

  async function handleDownloadPdf() {
    if (!invoice) return;

    try {
      setDownloading(true);

      // Adjust the token key if your login stores it under a different name
      const token =
        localStorage.getItem("mg_admin_token") ||
        localStorage.getItem("access_token") ||
        localStorage.getItem("auth_token") ||
        "";

      const res = await fetch(
        `${API_BASE_URL}/payments/invoice/${encodeURIComponent(invoice.id)}/pdf`,
        {
          method: "GET",
          headers: {
            Authorization: token ? `Bearer ${token}` : "",
          },
        }
      );

      if (!res.ok) {
        console.error("PDF download failed", res.status, await res.text());
        toast.error("Failed to generate invoice PDF.");
        return;
      }

      const blob = await res.blob();
      const url = window.URL.createObjectURL(blob);

      const a = document.createElement("a");
      a.href = url;
      a.download = `invoice-${invoice.invoice_number || invoice.id}.pdf`;
      document.body.appendChild(a);
      a.click();
      a.remove();

      window.URL.revokeObjectURL(url);
    } catch (err) {
      console.error("PDF download error", err);
      toast.error("Error while downloading invoice PDF.");
    } finally {
      setDownloading(false);
    }
  }

  return (
    <div className="relative">
      <AdminPageHeader
        title={`Invoice #${invoice.invoice_number || invoice.id.slice(0, 8)}`}
        subtitle="Detailed tax invoice, billing breakdown and associated order."
        breadcrumbs={[
          { label: "Dashboard", path: "/" },
          { label: "Payments", path: "/payments" },
          { label: "Invoices", path: "/payments" },
          { label: invoice.invoice_number || invoice.id.slice(0, 8) },
        ]}
        right={
          <div className="flex items-center gap-3">
            <button
              onClick={handleDownloadPdf}
              disabled={downloading}
              className="inline-flex items-center gap-2 rounded-full border border-slate-300 bg-white px-4 py-2.5 text-sm shadow-sm hover:bg-slate-50 disabled:opacity-60 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100"
            >
              {downloading ? (
                <Loader2 size={16} className="animate-spin" />
              ) : (
                <Download size={16} />
              )}
              {downloading ? "Generating…" : "PDF"}
            </button>
            <button
              onClick={() => navigate(-1)}
              className="inline-flex items-center gap-2 rounded-full border border-slate-300 bg-white px-4 py-2.5 text-sm shadow-sm hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100"
            >
              <ArrowLeft size={16} /> Back
            </button>
          </div>
        }
      />

      <div className="px-6 pt-4 pb-10 space-y-10">
        {/* Top Section */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Invoice meta */}
          <div className="lg:col-span-2 rounded-2xl border border-slate-300 bg-white p-6 shadow-sm dark:bg-slate-900 dark:border-slate-700">
            <div className="flex items-center gap-3 mb-4">
              <FileText className="text-sky-600" />
              <h2 className="text-lg font-semibold">Invoice Details</h2>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
              <InfoRow
                label="Invoice Number"
                value={invoice.invoice_number || "—"}
              />
              <InfoRow label="Invoice Date" value={dt(invoiceDate)} />
              <InfoRow label="Status" value={status} pill />
              <InfoRow label="Created At" value={dt(invoice.created_at)} />

              {order && (
                <>
                  <InfoRow
                    label="Order Number"
                    value={`#${order.order_number}`}
                  />
                  <InfoRow label="Order Status" value={order.status} />
                </>
              )}
            </div>
          </div>

          {/* Amount summary */}
          <div className="rounded-2xl border border-slate-300 bg-white p-6 shadow-sm dark:bg-slate-900 dark:border-slate-700">
            <h2 className="mb-4 flex items-center gap-2 text-lg font-semibold">
              <CreditCard className="text-emerald-600" /> Invoice Total
            </h2>

            <div className="space-y-2 text-sm">
              <Row label="Subtotal" value={money(subtotal, currency)} />
              <Row
                label="Discount"
                value={money(discountTotal, currency)}
                red
              />
              <Row label="Tax" value={money(taxTotal, currency)} />
              <Row label="Shipping" value={money(shippingTotal, currency)} />

              <div className="border-t border-dashed pt-3 mt-2 dark:border-slate-700" />

              <div className="flex justify-between text-base">
                <span className="font-semibold">Grand Total</span>
                <span className="text-lg font-bold text-emerald-600">
                  {money(grandTotal, currency)}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Addresses */}
        {(billingAddress || shippingAddress) && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {billingAddress && (
              <AddressCard
                title="Billing Address"
                icon={<User size={18} className="text-sky-600" />}
                address={billingAddress}
              />
            )}
            {shippingAddress && (
              <AddressCard
                title="Shipping Address"
                icon={<MapPin size={18} className="text-emerald-600" />}
                address={shippingAddress}
              />
            )}
          </div>
        )}

        {/* Items Table */}
        <div className="rounded-2xl border border-slate-300 bg-white shadow-sm dark:bg-slate-900 dark:border-slate-700">
          <div className="flex items-center justify-between px-6 pt-5 pb-3">
            <div className="flex items-center gap-2">
              <Package className="text-sky-500" />
              <h2 className="text-lg font-semibold">Line Items</h2>
            </div>

            {order && (
              <button
                onClick={() => navigate(`/orders/${order.id}`)}
                className="inline-flex items-center gap-2 rounded-full border border-slate-300 px-3 py-1.5 text-xs hover:bg-slate-50 dark:border-slate-700 dark:hover:bg-slate-800"
              >
                View Order
              </button>
            )}
          </div>

          <div className="overflow-x-auto">
            <table className="min-w-full text-left text-sm">
              <thead className="bg-slate-100 text-xs uppercase tracking-wide dark:bg-slate-800 dark:text-slate-400">
                <tr>
                  <th className="px-6 py-3">Item</th>
                  <th className="px-6 py-3">SKU</th>
                  <th className="px-6 py-3">Qty</th>
                  <th className="px-6 py-3">Unit Price</th>
                  <th className="px-6 py-3">Total</th>
                </tr>
              </thead>

              <tbody>
                {(invoiceItems.length > 0 ? invoiceItems : orderItems).map(
                  (it, idx) => (
                    <tr
                      key={it.id || idx}
                      className="border-t border-slate-200 dark:border-slate-700"
                    >
                      <td className="px-6 py-3">
                        <div className="flex flex-col">
                          <span className="font-medium">
                            {it.product_title || it.title || "Item"}
                          </span>
                          {it.meta && (
                            <span className="text-xs text-slate-500">
                              {typeof it.meta === "string"
                                ? it.meta
                                : JSON.stringify(it.meta)}
                            </span>
                          )}
                        </div>
                      </td>

                      <td className="px-6 py-3 text-xs">
                        {it.sku || it.product_sku || "—"}
                      </td>

                      <td className="px-6 py-3">
                        {Number(it.quantity || it.qty || 1)}
                      </td>

                      <td className="px-6 py-3">
                        {money(
                          Number(
                            it.unit_price ||
                              it.price ||
                              it.line_total / (it.quantity || 1)
                          ),
                          currency
                        )}
                      </td>

                      <td className="px-6 py-3 font-semibold">
                        {money(Number(it.line_total || it.total || 0), currency)}
                      </td>
                    </tr>
                  )
                )}

                {invoiceItems.length === 0 && orderItems.length === 0 && (
                  <tr>
                    <td
                      colSpan={5}
                      className="px-6 py-6 text-center text-slate-500"
                    >
                      No line items found for this invoice.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Metadata */}
        {invoice.metadata && (
          <div className="rounded-2xl border border-slate-300 bg-white p-6 shadow-sm dark:bg-slate-900 dark:border-slate-700">
            <div className="flex items-center gap-2 mb-3">
              <InfoIcon size={18} className="text-slate-500" />
              <h2 className="text-sm font-semibold">Metadata</h2>
            </div>

            <pre className="max-h-80 overflow-auto rounded-xl bg-slate-900 p-4 text-xs text-slate-100">
              {JSON.stringify(invoice.metadata, null, 2)}
            </pre>
          </div>
        )}
      </div>
    </div>
  );
}

/* Helpers */

function Row({
  label,
  value,
  red = false,
}: {
  label: string;
  value: string;
  red?: boolean;
}) {
  return (
    <div className="flex justify-between">
      <span className="text-slate-500">{label}</span>
      <span className={`font-medium ${red ? "text-rose-600" : ""}`}>
        {value}
      </span>
    </div>
  );
}

function InfoRow({
  label,
  value,
  pill,
}: {
  label: string;
  value: React.ReactNode;
  pill?: boolean;
}) {
  return (
    <div className="space-y-1">
      <div className="text-xs uppercase tracking-wide text-slate-500">
        {label}
      </div>
      {pill ? (
        <div className="inline-flex rounded-full border border-slate-300 px-3 py-1 text-xs font-medium dark:border-slate-600">
          {value}
        </div>
      ) : (
        <div className="text-sm font-medium text-slate-800 dark:text-slate-100">
          {value}
        </div>
      )}
    </div>
  );
}

function AddressCard({
  title,
  icon,
  address,
}: {
  title: string;
  icon: React.ReactNode;
  address: any;
}) {
  return (
    <div className="rounded-2xl border border-slate-300 bg-white p-6 shadow-sm dark:bg-slate-900 dark:border-slate-700">
      <div className="flex items-center gap-2 mb-3">
        {icon}
        <h3 className="text-sm font-semibold">{title}</h3>
      </div>
      <div className="text-sm whitespace-pre-line">
        {formatAddress(address)}
      </div>
    </div>
  );
}

function formatAddress(addr: any): string {
  if (!addr) return "—";
  if (typeof addr === "string") return addr;
  const parts = [
    addr.name,
    addr.line1,
    addr.line2,
    addr.city,
    addr.state,
    addr.postal_code,
    addr.country,
    addr.phone,
  ]
    .filter(Boolean)
    .join("\n");
  return parts || "—";
}
