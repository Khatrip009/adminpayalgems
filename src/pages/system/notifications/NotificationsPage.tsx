// src/pages/NotificationsPage.tsx
import React, { useEffect, useState } from "react";
import { fetchNotificationsPage, markNotificationRead } from "@/api/core/notifications.api";
import type { NotificationListItem } from "@/types/notification";
import toast from "react-hot-toast";

export default function NotificationsPage() {
  const [page, setPage] = useState(1);
  const [items, setItems] = useState<NotificationListItem[]>([]);
  const [pages, setPages] = useState(1);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    loadPage(page);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [page]);

  async function loadPage(p:number) {
    setLoading(true);
    try {
      const r = await fetchNotificationsPage(p, 20);
      setItems(r.items);
      setPages(r.pages || 1);
    } catch (e) {
      console.error(e);
      toast.error("Failed to load notifications");
    } finally {
      setLoading(false);
    }
  }

  async function handleMarkRead(id:string) {
    try {
      await markNotificationRead(id);
      setItems(prev => prev.filter(i => i.id !== id));
      toast.success("Marked read");
    } catch {
      toast.error("Failed to mark read");
    }
  }

  return (
    // Added pt-20 so sticky topbar doesn't overlap content
    <div className="p-4 pt-20">
      <h1 className="text-xl font-semibold mb-4">All Notifications</h1>
      <div className="space-y-3">
        {loading && <div className="p-4 text-sm text-slate-500">Loading…</div>}
        {!loading && items.length === 0 && <div className="p-4 text-sm text-slate-500">No notifications found.</div>}
        {!loading && items.map(n => (
          <div key={n.id} className="rounded-lg border p-3 flex items-start justify-between">
            <div>
              <div className="font-semibold">{n.title}</div>
              {n.body && <div className="text-sm text-slate-600 mt-1">{n.body}</div>}
              <div className="text-xs text-slate-400 mt-1">{new Date(n.created_at || Date.now()).toLocaleString()}</div>
            </div>
            <div className="flex flex-col gap-2">
              <button onClick={() => handleMarkRead(n.id)} className="text-sm text-sky-600 hover:underline">Mark read</button>
            </div>
          </div>
        ))}
      </div>

      <div className="mt-4 flex items-center justify-between">
        <div className="text-sm text-slate-500">Page {page} of {pages}</div>
        <div className="flex gap-2">
          <button disabled={page <= 1} onClick={() => setPage(p => Math.max(1, p-1))} className="px-3 py-2 rounded bg-white border">Prev</button>
          <button disabled={page >= pages} onClick={() => setPage(p => Math.min(pages, p+1))} className="px-3 py-2 rounded bg-white border">Next</button>
        </div>
      </div>
    </div>
  );
}
