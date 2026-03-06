// src/pages/ReturnRequestPage.tsx
import React, { useState } from "react";
import { useParams, useNavigate } from "react-router-dom";

// ✅ Correct API import
import { createReturnRequest } from "@/api/finance/returns.api";

export default function ReturnRequestPage() {
  const { orderId, itemId } = useParams();
  const navigate = useNavigate();

  const [reason, setReason] = useState("");
  const [notes, setNotes] = useState("");
  const [resolution, setResolution] = useState("refund");
  const [photos, setPhotos] = useState<string[]>([]);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  async function submit() {
    setError("");

    if (!reason) {
      setError("Please select a reason.");
      return;
    }

    setSaving(true);

    const payload = {
      order_id: orderId!,
      order_item_id: itemId || undefined,
      type: "return",
      reason_code: reason,
      reason_notes: notes || undefined,
      preferred_resolution: resolution,
      photos: photos.length ? photos : undefined,
    };

    try {
      const res = await createReturnRequest(payload);

      if (!res.ok) {
        setError(res.error || "Failed to submit return request.");
        setSaving(false);
        return;
      }

      navigate(`/return/confirmation/${res.return_id}`);
    } catch (e) {
      console.error(e);
      setError("Something went wrong while submitting your request.");
    }

    setSaving(false);
  }

  return (
    <div className="p-6 max-w-xl mx-auto space-y-5">
      <h1 className="text-2xl font-semibold">Request a Return</h1>

      {error && (
        <div className="p-3 bg-red-100 text-red-700 rounded">{error}</div>
      )}

      {/* Reason */}
      <div>
        <label className="block font-medium mb-1">Reason</label>
        <select
          className="border p-2 w-full rounded"
          value={reason}
          onChange={(e) => setReason(e.target.value)}
        >
          <option value="">Select reason</option>
          <option value="damaged">Damaged Product</option>
          <option value="wrong_item">Wrong Item Received</option>
          <option value="not_as_described">Not as described</option>
          <option value="other">Other</option>
        </select>
      </div>

      {/* Notes */}
      <div>
        <label className="block font-medium mb-1">Notes (optional)</label>
        <textarea
          className="border p-2 w-full rounded"
          rows={4}
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
        />
      </div>

      {/* Resolution */}
      <div>
        <label className="block font-medium mb-1">Preferred Resolution</label>
        <select
          className="border p-2 w-full rounded"
          value={resolution}
          onChange={(e) => setResolution(e.target.value)}
        >
          <option value="refund">Refund</option>
          <option value="replacement">Replacement</option>
        </select>
      </div>

      <button
        onClick={submit}
        disabled={saving}
        className="bg-black text-white p-3 w-full rounded disabled:opacity-70"
      >
        {saving ? "Submitting..." : "Submit Return Request"}
      </button>
    </div>
  );
}
