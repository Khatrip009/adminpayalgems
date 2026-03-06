import React, { useEffect, useState, useCallback } from "react";
import { listPackets } from "@/api/inventory/packets.api";
import PacketCard from "@/components/inventory/PacketCard";
import toast from "react-hot-toast";
import { useNavigate } from "react-router-dom";
import { useWarehouse } from "@/context/WarehouseContext";

const PAGE_SIZE = 24;

type PacketRow = {
  id: string;
  packet_code: string;
  available_carats: number;
  attributes?: Record<string, any>;
  status?: string;
};

export default function AdminDiamondPacketsPage() {
  const navigate = useNavigate();
  const { warehouseId, warehouses, loading: warehouseLoading } = useWarehouse();

  const [search, setSearch] = useState("");
  const [packets, setPackets] = useState<PacketRow[]>([]);
  const [loading, setLoading] = useState(false);
  const [page, setPage] = useState(0);

  /* =====================================================
     LOAD PACKETS (WAREHOUSE SCOPED)
  ===================================================== */
  const loadPackets = useCallback(async () => {
    if (!warehouseId) return;

    setLoading(true);
    try {
      const r = await listPackets({
        warehouse_id: warehouseId,
        q: search || undefined,
        limit: 500,
      });

      setPackets(r?.results || []);
      setPage(0);
    } catch (err) {
      console.error(err);
      toast.error("Failed to load packets");
      setPackets([]);
    } finally {
      setLoading(false);
    }
  }, [warehouseId, search]);

  useEffect(() => {
    if (warehouseId) loadPackets();
  }, [warehouseId, loadPackets]);

  /* =====================================================
     OPEN PACKET
  ===================================================== */
 function openPacket(packetId: string) {
  if (!warehouseId) return;

  navigate(
    `/admin/inventory/packets/${packetId}?warehouse_id=${warehouseId}`
  );
}

  const paginated = packets.slice(
    page * PAGE_SIZE,
    (page + 1) * PAGE_SIZE
  );

  if (warehouseLoading) {
    return <div>Loading warehouses…</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold">Diamond Packets</h1>

        <div className="flex gap-2">
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search packet code"
            className="px-3 py-2 border rounded-lg"
            onKeyDown={(e) => e.key === "Enter" && loadPackets()}
          />

          <button
            onClick={loadPackets}
            className="px-4 py-2 bg-pink-600 text-white rounded-lg"
          >
            Search
          </button>

          <button
  onClick={() => navigate("/admin/inventory/packets/create")}
  className="px-4 py-2 border rounded-lg"
>
  Create
</button>
        </div>
      </div>

      {loading ? (
        <div>Loading…</div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {paginated.length ? (
            paginated.map((p) => (
              <div
                key={p.id}
                onClick={() => openPacket(p.id)}
                className="cursor-pointer"
              >
                <PacketCard
                  packet={{
                    ...p,
                    stock_quantity: p.available_carats,
                  }}
                />
              </div>
            ))
          ) : (
            <div className="col-span-full text-sm text-slate-500">
              No packets found
            </div>
          )}
        </div>
      )}
    </div>
  );
}
