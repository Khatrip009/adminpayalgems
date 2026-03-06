import React, { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { toast } from "react-hot-toast";
import { apiFetch } from "@/lib/apiClient";
import { ArrowLeft, Loader2 } from "lucide-react";
import CostingSummaryCard from "@/components/CostingSummaryCard";

const AdminWorkOrderClosePage: React.FC = () => {
  const { id } = useParams();
  const navigate = useNavigate();

  const [loading, setLoading] = useState(true);
  const [wo, setWO] = useState<any | null>(null);
  const [note, setNote] = useState("");
  const [submitting, setSubmitting] = useState(false);

  /* ---------------------------------------
     LOAD WORK ORDER
  --------------------------------------- */
const loadWO = async () => {
  try {
    const r = await apiFetch(`/production/work-orders/${id}`);

    // r IS ALREADY the payload
    const woData = r.work_order || r.wo;

    if (!woData) {
      toast.error("Work Order not found");
      navigate("/admin/work-orders");
      return;
    }

    if (woData.status !== "received") {
      toast.error("Only RECEIVED work orders can be closed");
      navigate(`/admin/work-orders/${id}`);
      return;
    }

    setWO(woData);
  } catch (e) {
    console.error(e);
    toast.error("Failed to load Work Order");
  } finally {
    setLoading(false);
  }
};


  useEffect(() => {
    loadWO();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  /* ---------------------------------------
     SUBMIT CLOSE
  --------------------------------------- */
  const handleClose = async () => {
    try {
      setSubmitting(true);

      const idemKey = `wo-close-${id}`;

      const r = await apiFetch(
        `/production/work-orders/${id}/close`,
        {
          method: "POST",
          headers: {
            "idempotency-key": idemKey,
          },
          body: {
            note,
          },
        }
      );

      if (r.ok) {
        toast.success("Work Order closed successfully");
        navigate(`/admin/work-orders/${id}`);
      }
    } catch (e: any) {
      toast.error(e?.message || "Closing failed");
    } finally {
      setSubmitting(false);
    }
  };

  /* ---------------------------------------
     RENDER
  --------------------------------------- */
  if (loading) {
    return (
      <div className="p-10 text-center">
        <Loader2 className="animate-spin mx-auto" />
      </div>
    );
  }

  if (!wo) {
    return (
      <div className="p-10 text-center text-red-500">
        Work Order not found
      </div>
    );
  }

  return (
    <div className="p-6 max-w-5xl mx-auto">
      <button
        onClick={() => navigate(-1)}
        className="flex items-center text-sm mb-4"
      >
        <ArrowLeft size={14} className="mr-1" /> Back
      </button>

      <h1 className="text-xl font-semibold mb-4">
        Close Work Order — {wo.wo_number}
      </h1>

      {/* COST SUMMARY (AUTHORITATIVE) */}
      <CostingSummaryCard woId={id!} />

      {/* NOTE */}
      <div className="mt-6">
        <label className="text-sm font-medium">Closing Note</label>
        <textarea
          className="border rounded w-full px-3 py-2 mt-1"
          rows={3}
          value={note}
          onChange={(e) => setNote(e.target.value)}
          placeholder="Optional remarks for audit / variance explanation"
        />
      </div>

      {/* ACTION */}
      <div className="flex justify-end mt-6">
        <button
          disabled={submitting}
          onClick={handleClose}
          className={`px-6 py-2 rounded text-white ${
            submitting ? "bg-gray-400" : "bg-green-600"
          }`}
        >
          {submitting ? "Closing..." : "Close Work Order"}
        </button>
      </div>
    </div>
  );
};

export default AdminWorkOrderClosePage;
