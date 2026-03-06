import React, { useEffect, useState } from "react";
import { apiFetch } from "../lib/apiClient";
import { Loader2, Search } from "lucide-react";

const FinishedGoodsSelector = ({ onSelect, onClose }: any) => {
  const [query, setQuery] = useState("");
  const [items, setItems] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  const search = async () => {
    setLoading(true);
    try {
      const r = await apiFetch(`/variants/search?q=${encodeURIComponent(query)}`);
      setItems(r.items || []);
    } catch {
      setItems([]);
    }
    setLoading(false);
  };

  useEffect(() => {
    search();
  }, []);

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 w-[600px] max-h-[80vh] overflow-y-auto">
        <h2 className="text-lg font-semibold mb-3">Select SKU</h2>

        <div className="flex mb-3">
          <input
            className="border rounded px-3 py-2 w-full"
            placeholder="Search SKU or name"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
          />
          <button
            onClick={search}
            className="ml-2 px-3 py-2 bg-gray-200 rounded"
          >
            <Search size={16} />
          </button>
        </div>

        {loading ? (
          <div className="py-10 text-center">
            <Loader2 className="animate-spin mx-auto" />
          </div>
        ) : (
          <table className="w-full border">
            <thead className="bg-gray-100">
              <tr>
                <th className="p-2">SKU</th>
                <th className="p-2">Price</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {items.map((it) => (
                <tr key={it.id} className="border-t">
                  <td className="p-2">{it.sku}</td>
                  <td className="p-2">₹{it.price}</td>
                  <td className="p-2 text-right">
                    <button
                      onClick={() => onSelect(it)}
                      className="px-3 py-1 bg-blue-600 text-white rounded"
                    >
                      Select
                    </button>
                  </td>
                </tr>
              ))}

              {items.length === 0 && (
                <tr>
                  <td colSpan={3} className="p-4 text-center text-gray-500">
                    No results
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        )}

        <div className="text-right mt-4">
          <button
            onClick={onClose}
            className="px-4 py-2 bg-gray-300 rounded"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};

export default FinishedGoodsSelector;
