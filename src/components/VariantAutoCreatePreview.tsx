import React, { useState } from "react";
import { apiFetch } from "../lib/apiClient";
import { Loader2 } from "lucide-react";
import { toast } from "react-hot-toast";

const VariantAutoCreatePreview = ({
  data,
  finishedItems,
  setFinishedItems,
  onClose,
}: any) => {
  const { index, sku } = data;

  const [unitPrice, setUnitPrice] = useState("");
  const [loading, setLoading] = useState(false);

  const createVariant = async () => {
    if (!unitPrice) return toast.error("Enter unit price");

    setLoading(true);
    try {
      const r = await apiFetch("/variants/create-from-wo", {
        method: "POST",
        body: JSON.stringify({ sku, unit_price: Number(unitPrice) }),
      });

      const updated = [...finishedItems];
      updated[index].unit_price = Number(unitPrice);
      setFinishedItems(updated);

      toast.success("Variant Created");
      onClose();
    } catch (e) {
      toast.error("Failed to create variant");
    }
    setLoading(false);
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-40 flex justify-center items-center z-50">
      <div className="bg-white rounded-lg p-6 w-[450px]">
        <h2 className="text-lg font-semibold mb-3">Create Variant</h2>

        <p className="text-sm text-gray-600 mb-4">
          SKU <strong>{sku}</strong> does not exist.  
          Enter unit price to auto-create variant.
        </p>

        <input
          className="border rounded w-full px-3 py-2 mb-4"
          placeholder="Unit Price (₹)"
          value={unitPrice}
          onChange={(e) => setUnitPrice(e.target.value)}
        />

        <div className="flex justify-end gap-2">
          <button
            onClick={onClose}
            className="px-4 py-2 bg-gray-300 rounded"
          >
            Cancel
          </button>

          <button
            onClick={createVariant}
            className="px-4 py-2 bg-blue-600 text-white rounded flex items-center"
          >
            {loading && <Loader2 size={16} className="animate-spin mr-2" />}
            Create
          </button>
        </div>
      </div>
    </div>
  );
};

export default VariantAutoCreatePreview;
