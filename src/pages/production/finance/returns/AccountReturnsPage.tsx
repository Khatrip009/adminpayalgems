// src/pages/AccountReturnsPage.tsx

import React, { useEffect, useState } from "react";
import { listCustomerReturns } from "@/api/finance/accountReturns.api";
import { Link } from "react-router-dom";

export default function AccountReturnsPage() {
  const [loading, setLoading] = useState(true);
  const [items, setItems] = useState([]);

  async function load() {
    try {
      const res = await listCustomerReturns();
      if (res.ok) setItems(res.returns);
    } catch (e) {
      console.error("Load returns failed", e);
    }
    setLoading(false);
  }

  useEffect(() => {
    load();
  }, []);

  if (loading) return <div className="p-6">Loading...</div>;

  return (
    <div className="p-6 space-y-6">
      <h1 className="text-2xl font-bold">My Returns</h1>

      {items.length === 0 && (
        <p className="text-gray-500">You have no return requests yet.</p>
      )}

      <div className="space-y-4">
        {items.map((r) => (
          <div
            key={r.id}
            className="border p-4 rounded-lg shadow-sm bg-white flex justify-between items-center"
          >
            <div>
              <p className="font-semibold">
                Return #{r.id.slice(0, 8)} — Order #{r.order_number}
              </p>
              <p className="text-sm text-gray-600">Type: {r.type}</p>
              <p className="text-sm">Status: {r.status}</p>

              {r.refund_amount && (
                <p className="text-sm text-green-600">
                  Refund: ₹{r.refund_amount}
                </p>
              )}
            </div>

            <Link
              to={`/account/returns/${r.id}`}
              className="px-4 py-2 text-sm bg-black text-white rounded"
            >
              View Details
            </Link>
          </div>
        ))}
      </div>
    </div>
  );
}
