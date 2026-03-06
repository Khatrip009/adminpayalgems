// src/pages/admin/AdminSecurityLogsPage.tsx
import React, { useEffect, useState } from "react";
import { fetchLoginHistory } from "@/api/core/profile.api";
import { Clock, Globe, MonitorSmartphone } from "lucide-react";

export default function AdminSecurityLogsPage() {
  const [logs, setLogs] = useState([]);

  useEffect(() => {
    fetchLoginHistory().then((res) => setLogs(res.logs || []));
  }, []);

  return (
    <div className="p-6">
      <h1 className="text-3xl font-['Playfair_Display'] font-semibold mb-6">
        Login Activity
      </h1>

      <div className="bg-white border rounded-xl shadow p-4">
        {logs.length === 0 && (
          <p className="text-slate-500">No login activity found.</p>
        )}

        <ul className="divide-y divide-slate-200">
          {logs.map((log: any, i) => (
            <li key={i} className="py-3 flex items-center gap-4">
              <MonitorSmartphone className="text-sky-600" />

              <div>
                <p className="font-medium">{log.ip}</p>
                <p className="text-sm text-slate-500 flex items-center gap-2">
                  <Clock size={14} /> {log.timestamp}
                </p>
              </div>

              <span className="ml-auto text-sm text-slate-600 flex items-center gap-2">
                <Globe size={14} /> {log.location || "Unknown"}
              </span>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
