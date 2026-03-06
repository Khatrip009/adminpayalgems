import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { listWorkOrders } from "@/api/production/workorders.api";

const PAGE_SIZE = 20;

type WorkOrder = {
  id: string;
  wo_number: string;
  craftsman_name?: string;
  status: string;
  created_at?: string;
  expected_return?: string;
  materials_count?: number;
};

const AdminWorkOrdersPage: React.FC = () => {
  const [items, setItems] = useState<WorkOrder[]>([]);
  const [offset, setOffset] = useState(0);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    let mounted = true;

    (async () => {
      try {
        setLoading(true);

        const r = await listWorkOrders({
          limit: PAGE_SIZE,
          offset,
        });

        if (mounted) {
          if (r?.ok && Array.isArray(r.results)) {
            setItems(r.results);
          } else {
            setItems([]);
          }
        }
      } catch (err) {
        console.error("Failed to load work orders", err);
        if (mounted) setItems([]);
      } finally {
        if (mounted) setLoading(false);
      }
    })();

    return () => {
      mounted = false;
    };
  }, [offset]);

  return (
    <div className="p-6">
      {/* Header */}
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-xl font-semibold">Work Orders</h1>
        <Link
          to="/admin/work-orders/create"
          className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
        >
          Create Work Order
        </Link>
      </div>

      {/* Table */}
      <div className="border rounded overflow-x-auto bg-white">
        <table className="w-full border-collapse">
          <thead className="bg-gray-100 text-left">
            <tr>
              <th className="p-3">WO</th>
              <th className="p-3">Craftsman</th>
              <th className="p-3">Status</th>
              <th className="p-3">Created</th>
              <th className="p-3">Expected</th>
              <th className="p-3 text-center">Materials</th>
              <th className="p-3">Action</th>
            </tr>
          </thead>

          <tbody>
            {loading ? (
              <tr>
                <td colSpan={7} className="p-6 text-center text-gray-500">
                  Loading…
                </td>
              </tr>
            ) : items.length === 0 ? (
              <tr>
                <td colSpan={7} className="p-6 text-center text-gray-500">
                  No work orders found
                </td>
              </tr>
            ) : (
              items.map((wo) => (
                <tr key={wo.id} className="border-t hover:bg-gray-50">
                  <td className="p-3 font-medium">{wo.wo_number}</td>
                  <td className="p-3">{wo.craftsman_name || "-"}</td>
                  <td className="p-3 capitalize">{wo.status || "unknown"}</td>
                  <td className="p-3">
                    {wo.created_at
                      ? new Date(wo.created_at).toLocaleDateString()
                      : "-"}
                  </td>
                  <td className="p-3">
                    {wo.expected_return
                      ? new Date(wo.expected_return).toLocaleDateString()
                      : "-"}
                  </td>
                  <td className="p-3 text-center">
                    {wo.materials_count ?? 0}
                  </td>
                  <td className="p-3">
                    <Link
                      to={`/admin/work-orders/${wo.id}`}
                      className="text-blue-600 hover:underline"
                    >
                      View
                    </Link>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      <div className="flex justify-between mt-4">
        <button
          disabled={offset === 0 || loading}
          onClick={() => setOffset(Math.max(0, offset - PAGE_SIZE))}
          className="px-4 py-2 bg-gray-200 rounded disabled:opacity-50"
        >
          Previous
        </button>

        <button
          disabled={items.length < PAGE_SIZE || loading}
          onClick={() => setOffset(offset + PAGE_SIZE)}
          className="px-4 py-2 bg-gray-200 rounded disabled:opacity-50"
        >
          Next
        </button>
      </div>
    </div>
  );
};

export default AdminWorkOrdersPage;
