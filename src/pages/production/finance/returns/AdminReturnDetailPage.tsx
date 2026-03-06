// src/pages/AdminReturnDetailPage.tsx
import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { ArrowLeft, Calendar, RefreshCcw, Image as ImgIcon, FileText } from "lucide-react";

import { Button } from "@/components/ui/Button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";

import {
  getReturnById,
  updateReturnStatus,
  createReplacementShipment,
} from "@/api/finance/returns.api";

import type { ReturnDetailResponse } from "@/api/finance/returns.api";

const STATUS_OPTIONS = [
  "requested",
  "approved",
  "rejected",
  "processing",
  "refund_initiated",
  "completed",
];

export default function AdminReturnDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();

  const [loading, setLoading] = useState(true);
  const [ret, setRet] = useState<ReturnDetailResponse["return"] | null>(null);
  const [events, setEvents] = useState<ReturnDetailResponse["events"]>([]);
  const [status, setStatus] = useState("");
  const [notes, setNotes] = useState("");
  const [saving, setSaving] = useState(false);

  const [zoomSrc, setZoomSrc] = useState<string | null>(null);

  async function load() {
    if (!id) return;
    try {
      setLoading(true);
      const res = await getReturnById(id);

      if (res.ok) {
        setRet(res.return);
        setEvents(res.events);
        setStatus(res.return.status);
      }
    } catch (err) {
      console.error("[ReturnDetail] Load failed:", err);
    }
    setLoading(false);
  }

  async function saveStatus() {
    if (!id) return;
    setSaving(true);
    try {
      await updateReturnStatus(id, { status, notes });
      await load();
      setNotes("");
    } catch (err) {
      console.error("Update failed:", err);
    }
    setSaving(false);
  }

  async function handleReplacement() {
    if (!id) return;
    try {
      await createReplacementShipment(id);
      alert("Replacement shipment created successfully");
    } catch (err) {
      console.error(err);
      alert("Failed to create shipment");
    }
  }

  useEffect(() => {
    load();
  }, [id]);

  if (loading || !ret)
    return (
      <div className="p-6">
        <p>Loading return details...</p>
      </div>
    );

  return (
    <div className="p-6 space-y-6">

      {/* Back Button */}
      <Button
        variant="ghost"
        className="flex items-center gap-2"
        onClick={() => navigate("/returns")}
      >
        <ArrowLeft size={18} /> Back to Returns
      </Button>

      <h1 className="text-3xl font-semibold">Return Request #{ret.id.slice(0, 8)}</h1>
      <p className="text-gray-600">Order #{ret.order_number}</p>

      {/* QUICK ACCESS BUTTONS */}
      <div className="flex gap-3 mt-2">

        {/* View Invoice */}
        {ret.invoice_id ? (
          <Button
            onClick={() => navigate(`/invoices/${ret.invoice_id}`)}
            className="flex items-center gap-2"
          >
            <FileText size={16} /> View Invoice
          </Button>
        ) : (
          <Button disabled className="opacity-60">Invoice Not Linked</Button>
        )}

        {/* View Payment */}
        {ret.order_payment_id ? (
          <Button
            onClick={() => navigate(`/payments/${ret.order_payment_id}`)}
            className="flex items-center gap-2 bg-red-600 text-white"
          >
            Process Payment / Refund
          </Button>
        ) : (
          <Button disabled className="opacity-60">Payment Not Linked</Button>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        <div className="lg:col-span-2 space-y-6">

          {/* Return Details */}
          <Card>
            <CardHeader><CardTitle>Return Details</CardTitle></CardHeader>
            <CardContent className="space-y-3">
              <p><strong>Type:</strong> {ret.type}</p>
              <p><strong>Reason Code:</strong> {ret.reason_code}</p>
              {ret.reason_notes && <p><strong>Notes:</strong> {ret.reason_notes}</p>}
              <p><strong>Status:</strong> {ret.status}</p>
              <p><strong>Requested Resolution:</strong> {ret.preferred_resolution || "N/A"}</p>

              <p className="flex items-center gap-2 text-sm text-gray-500">
                <Calendar size={16} />
                Created at: {new Date(ret.created_at).toLocaleString()}
              </p>
            </CardContent>
          </Card>

          {/* Photos */}
          {ret.photos?.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <ImgIcon size={20} /> Uploaded Photos
                </CardTitle>
              </CardHeader>
              <CardContent className="grid grid-cols-2 md:grid-cols-3 gap-4">
                {ret.photos.map((url, i) => (
                  <img
                    key={i}
                    src={url}
                    onClick={() => setZoomSrc(url)}
                    className="w-full h-32 object-cover rounded border cursor-pointer hover:opacity-80"
                  />
                ))}
              </CardContent>
            </Card>
          )}

          {/* Zoom Modal */}
          {zoomSrc && (
            <div
              className="fixed inset-0 bg-black/80 flex items-center justify-center z-50"
              onClick={() => setZoomSrc(null)}
            >
              <img src={zoomSrc} className="max-h-[90vh] max-w-[90vw] rounded" />
            </div>
          )}

          {/* Timeline */}
          <Card>
            <CardHeader><CardTitle>Timeline</CardTitle></CardHeader>
            <CardContent className="space-y-4">
              {events.map((ev) => (
                <div key={ev.id} className="border-l-4 pl-3 py-2 border-gray-400">
                  <p className="font-medium">{ev.event_type}</p>
                  {ev.notes && <p className="text-sm text-gray-600">{ev.notes}</p>}
                  <p className="text-xs text-gray-500">{new Date(ev.created_at).toLocaleString()}</p>
                </div>
              ))}
            </CardContent>
          </Card>

        </div>

        {/* Right Panel */}
        <div className="space-y-6">
          <Card>
            <CardHeader><CardTitle>Update Status</CardTitle></CardHeader>
            <CardContent className="space-y-4">

              <select
                className="w-full border rounded px-3 py-2"
                value={status}
                onChange={(e) => setStatus(e.target.value)}
              >
                {STATUS_OPTIONS.map((s) => (
                  <option key={s} value={s}>{s}</option>
                ))}
              </select>

              <Textarea
                rows={3}
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Add internal notes..."
              />

              {/* Refund */}
              {ret.preferred_resolution === "refund" && (
                <Button
                  className="w-full bg-red-600 text-white"
                  onClick={() => {
                    if (!ret.order_payment_id) return alert("Payment not linked.");
                    navigate(`/payments/${ret.order_payment_id}`);
                  }}
                >
                  Process Refund
                </Button>
              )}

              {/* Replacement */}
              {ret.preferred_resolution === "replacement" && (
                <Button className="w-full bg-blue-600 text-white" onClick={handleReplacement}>
                  Create Replacement Shipment
                </Button>
              )}

              <Button className="w-full" disabled={saving} onClick={saveStatus}>
                {saving ? "Updating..." : "Update Status"}
              </Button>
            </CardContent>
          </Card>

          <Button className="w-full" variant="outline" onClick={load}>
            <RefreshCcw size={16} /> Refresh Data
          </Button>
        </div>
      </div>
    </div>
  );
}
