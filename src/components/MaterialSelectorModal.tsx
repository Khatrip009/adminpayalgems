import React, { useEffect, useState } from "react";
import { X, Search, Check } from "lucide-react";
import { searchMaterials } from "../api/inventory/inventory.materials.api";
import { toast } from "react-hot-toast";

interface Props {
  open: boolean;
  onClose: () => void;
  onSelect: (item: any) => void;
  materialType: "diamond_packet" | "gold_lot";
}

const MaterialSelectorModal: React.FC<Props> = ({
  open,
  onClose,
  onSelect,
  materialType,
}) => {
  const [loading, setLoading] = useState(false);
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<any[]>([]);

  const load = async () => {
    setLoading(true);
    try {
      const r = await searchMaterials(materialType, query);
      setResults(r || []);
    } catch (err: any) {
      console.error(err);
      toast.error("Failed to load inventory");
    }
    setLoading(false);
  };

  useEffect(() => {
    if (open) load();
  }, [open]);

  const handleSearch = () => load();

  if (!open) return null;

  return (
    <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-xl w-full max-w-2xl overflow-hidden">
        {/* HEADER */}
        <div className="flex items-center justify-between p-4 border-b">
          <h2 className="text-lg font-semibold">Select {materialType === "diamond_packet" ? "Diamond Packet" : "Gold Lot"}</h2>
          <button className="p-2 hover:bg-slate-100 rounded-full" onClick={onClose}>
            <X size={18} />
          </button>
        </div>

        {/* SEARCH BAR */}
        <div className="flex items-center gap-2 p-3 border-b">
          <input
            className="border rounded-lg px-3 py-2 flex-1"
            placeholder="Search packet code / lot no…"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
          />
          <button
            onClick={handleSearch}
            className="bg-slate-800 text-white px-4 py-2 rounded-lg flex items-center gap-2"
          >
            <Search size={16} /> Search
          </button>
        </div>

        {/* BODY */}
        <div className="max-h-80 overflow-y-auto">
          {loading ? (
            <div className="p-6 text-center text-slate-500">Loading…</div>
          ) : results.length === 0 ? (
            <div className="p-6 text-center text-slate-500">No materials found</div>
          ) : (
            <table className="w-full text-sm">
              <thead className="bg-slate-100">
                <tr>
                  <th className="px-3 py-2 text-left">Code</th>
                  <th className="px-3 py-2 text-right">Available</th>
                  <th className="px-3 py-2 text-right">Warehouse</th>
                  <th className="px-3 py-2"></th>
                </tr>
              </thead>
              <tbody>
                {results.map((m: any, i) => (
                  <tr key={i} className="border-t">
                    <td className="px-3 py-2 font-medium">
                      {m.label}
                    </td>
                    <td className="px-3 py-2 text-right">{m.available_qty}</td>
                    <td className="px-3 py-2 text-right">{m.warehouse_id || "-"}</td>
                    <td className="px-3 py-2 text-right">
                      <button
                        onClick={() => onSelect(m)}
                        className="px-3 py-1 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg flex items-center gap-1 text-xs"
                      >
                        <Check size={14} /> Select
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </div>
  );
};

export default MaterialSelectorModal;
