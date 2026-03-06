import React, { useEffect, useState } from "react";
import { getExportLogs } from "@/api/logistics/exportLogs.api";
import { File, Clock, User } from "lucide-react";

export default function ExportHistoryPage() {
  const [logs, setLogs] = useState([]);

  useEffect(() => {
    getExportLogs().then(res => setLogs(res.logs));
  }, []);

  return (
    <div className="p-6">
      <h1 className="text-2xl font-semibold mb-4">Export History</h1>

      <div className="border rounded-xl overflow-hidden shadow-sm">
        <table className="w-full text-sm">
          <thead className="bg-slate-100">
            <tr>
              <th className="p-3 text-left">Type</th>
              <th className="p-3">Size</th>
              <th className="p-3">User</th>
              <th className="p-3">Date</th>
            </tr>
          </thead>

          <tbody>
            {logs.map((log) => (
              <tr key={log.id} className="border-t hover:bg-slate-50">
                <td className="p-3 flex items-center gap-2">
                  <File size={16} /> {log.export_type}
                </td>

                <td className="p-3 text-center">{(log.file_size / 1024).toFixed(1)} KB</td>

                <td className="p-3 text-center flex items-center justify-center gap-1">
                  <User size={14} /> {log.user_name || log.user_id}
                </td>

                <td className="p-3 text-center flex items-center justify-center gap-1">
                  <Clock size={14} /> {new Date(log.created_at).toLocaleString()}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
