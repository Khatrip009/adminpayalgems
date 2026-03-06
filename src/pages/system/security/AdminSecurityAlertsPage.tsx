// src/pages/admin/AdminSecurityAlertsPage.tsx
import React, { useEffect, useState } from "react";
import { fetchSecurityAlerts } from "@/api/core/profile.api";
import { AlertTriangle, ShieldAlert, CheckCircle } from "lucide-react";

export default function AdminSecurityAlertsPage() {
  const [alerts, setAlerts] = useState([]);

  useEffect(() => {
    fetchSecurityAlerts().then((res) => setAlerts(res.alerts || []));
  }, []);

  return (
    <div className="p-6">
      <h1 className="text-3xl font-['Playfair_Display'] font-semibold mb-6">
        Security Alerts
      </h1>

      <div className="space-y-4">
        {alerts.map((a: any, i) => (
          <div
            key={i}
            className="border rounded-xl p-4 bg-white shadow flex items-center gap-4"
          >
            {a.level === "high" ? (
              <ShieldAlert className="text-red-600" size={32} />
            ) : (
              <AlertTriangle className="text-amber-500" size={32} />
            )}

            <div>
              <p className="font-semibold">{a.message}</p>
              <p className="text-sm text-slate-500">{a.timestamp}</p>
            </div>

            {a.resolved && (
              <span className="ml-auto text-green-600 flex items-center gap-1">
                <CheckCircle size={16} /> Resolved
              </span>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
