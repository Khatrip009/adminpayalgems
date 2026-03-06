import React, { useEffect, useState } from "react";
import { apiFetch } from "../lib/apiClient";
import { Loader2 } from "lucide-react";

const CostingSummaryCard = ({ woId }: any) => {
  const [loading, setLoading] = useState(true);
  const [summary, setSummary] = useState<any | null>(null);

  const load = async () => {
    try {
      const r = await apiFetch(`/work-orders/cost/${woId}`);
      setSummary(r.summary || null);
    } catch {}
    setLoading(false);
  };

  useEffect(() => {
    load();
  }, []);

  if (loading) {
    return (
      <div className="border rounded p-4 mb-4">
        <Loader2 className="animate-spin mx-auto" />
      </div>
    );
  }

  if (!summary) {
    return (
      <div className="border rounded p-4 mb-4 text-red-500">
        Cost summary unavailable
      </div>
    );
  }

  return (
    <div className="border rounded p-4 mb-4 bg-gray-50">
      <h2 className="font-medium mb-2">Cost Summary</h2>

      <table className="w-full text-sm">
        <thead className="bg-gray-100">
          <tr>
            <th className="p-1">Material</th>
            <th className="p-1">Qty</th>
            <th className="p-1">Rate</th>
            <th className="p-1">Cost</th>
          </tr>
        </thead>

        <tbody>
          {summary.materials.map((m: any, i: number) => (
            <tr key={i} className="border-t">
              <td className="p-1">{m.material_type}</td>
              <td className="p-1">{m.qty}</td>
              <td className="p-1">₹{m.rate}</td>
              <td className="p-1">₹{Math.round(m.cost)}</td>
            </tr>
          ))}
        </tbody>
      </table>

      <div className="border-t mt-2 pt-2 text-right">
        <strong>Total Estimated Cost: ₹{Math.round(summary.estimated_cost)}</strong>
      </div>
    </div>
  );
};

export default CostingSummaryCard;
