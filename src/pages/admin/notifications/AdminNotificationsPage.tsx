// src/pages/admin/notifications/AdminNotificationsPage.tsx
import React, { useState, useEffect, useCallback } from "react";
import { toast } from "react-hot-toast";
import {
  Plus,
  Trash2,
  Eye,
  Search,
  Filter,
  RefreshCw,
  Loader2,
  X,
  Send,
  Users,
  User,
  AlertCircle,
} from "lucide-react";
import { AdminPageHeader } from "@/components/admin/AdminPageHeader";
import { apiFetch } from "@/lib/apiClient";

// Types (aligned with backend)
interface Notification {
  id: string;
  title: string;
  body?: string;
  data?: any;
  target_query?: any;
  scheduled_at?: string | null;
  sent: boolean;
  created_at: string;
}

interface NotificationListItem extends Notification {}

interface NotificationsListResponse {
  ok: boolean;
  items: NotificationListItem[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    pages: number;
  };
}

// API functions (admin)
const BASE_URL = "/crm/notifications";

async function listNotifications(params?: {
  page?: number;
  limit?: number;
  q?: string;
  sent?: boolean;
}): Promise<NotificationsListResponse> {
  const query = new URLSearchParams();
  if (params?.page) query.append("page", String(params.page));
  if (params?.limit) query.append("limit", String(params.limit));
  if (params?.q) query.append("q", params.q);
  if (params?.sent !== undefined) query.append("sent", String(params.sent));
  const url = `${BASE_URL}${query.toString() ? `?${query}` : ""}`;
  return apiFetch(url);
}

async function createNotification(payload: {
  title: string;
  body?: string;
  target_query?: any;
  scheduled_at?: string | null;
}): Promise<{ ok: boolean; notification: Notification }> {
  return apiFetch(BASE_URL, {
    method: "POST",
    body: payload,
  });
}

async function deleteNotification(id: string): Promise<{ ok: boolean }> {
  return apiFetch(`${BASE_URL}/${id}`, { method: "DELETE" });
}

async function fetchNotificationDetails(id: string): Promise<Notification> {
  const res = await apiFetch<{ ok: boolean; notification: Notification }>(
    `${BASE_URL}/${id}`
  );
  if (!res.ok) throw new Error("Failed to fetch notification details");
  return res.notification;
}

async function fetchDeadLetterQueue(limit = 100): Promise<any[]> {
  const res = await apiFetch(`/crm/notifications/dlq?limit=${limit}`);
  if (!res.ok) throw new Error("Failed to fetch DLQ");
  return res.dlq || [];
}

// Helper for target display
function formatTarget(target: any): string {
  if (!target) return "All users";
  if (target.type === "all") return "All users";
  if (target.user_ids && target.user_ids.length) {
    return `${target.user_ids.length} specific user(s)`;
  }
  return "All users";
}

// ----------------------------------------------------------------------
// Main Component
// ----------------------------------------------------------------------
export default function AdminNotificationsPage() {
  const [notifications, setNotifications] = useState<NotificationListItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [limit] = useState(20);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);
  const [search, setSearch] = useState("");
  const [sentFilter, setSentFilter] = useState<boolean | undefined>(undefined);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [selectedNotification, setSelectedNotification] = useState<Notification | null>(null);
  const [showDLQ, setShowDLQ] = useState(false);
  const [dlqItems, setDlqItems] = useState<any[]>([]);
  const [submitting, setSubmitting] = useState(false);

  // Create form state
  const [formTitle, setFormTitle] = useState("");
  const [formBody, setFormBody] = useState("");
  const [formTargetType, setFormTargetType] = useState<"all" | "users">("all");
  const [formUserIds, setFormUserIds] = useState("");
  const [formScheduledAt, setFormScheduledAt] = useState("");

  // Load notifications
  const loadNotifications = useCallback(async () => {
    setLoading(true);
    try {
      const res = await listNotifications({
        page,
        limit,
        q: search || undefined,
        sent: sentFilter,
      });
      setNotifications(res.items);
      setTotal(res.pagination.total);
      setTotalPages(res.pagination.pages);
    } catch (err: any) {
      toast.error(err.message || "Failed to load notifications");
    } finally {
      setLoading(false);
    }
  }, [page, limit, search, sentFilter]);

  useEffect(() => {
    loadNotifications();
  }, [loadNotifications]);

  // Delete handler
  const handleDelete = async (id: string) => {
    if (!window.confirm("Delete this notification? This action cannot be undone.")) return;
    try {
      await deleteNotification(id);
      toast.success("Notification deleted");
      loadNotifications();
    } catch (err: any) {
      toast.error(err.message || "Delete failed");
    }
  };

  // View details
  const handleViewDetails = async (id: string) => {
    try {
      const notif = await fetchNotificationDetails(id);
      setSelectedNotification(notif);
      setShowDetailModal(true);
    } catch (err: any) {
      toast.error(err.message || "Failed to load details");
    }
  };

  // Create submit
  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formTitle.trim()) {
      toast.error("Title is required");
      return;
    }
    let targetQuery = null;
    if (formTargetType === "users") {
      const userIds = formUserIds
        .split(/[ ,\n]+/)
        .map((s) => s.trim())
        .filter(Boolean);
      if (userIds.length === 0) {
        toast.error("Please enter at least one user ID");
        return;
      }
      targetQuery = { user_ids: userIds };
    } else {
      targetQuery = { type: "all" };
    }

    setSubmitting(true);
    try {
      await createNotification({
        title: formTitle.trim(),
        body: formBody.trim() || undefined,
        target_query: targetQuery,
        scheduled_at: formScheduledAt || null,
      });
      toast.success("Notification created successfully");
      // Reset form
      setFormTitle("");
      setFormBody("");
      setFormTargetType("all");
      setFormUserIds("");
      setFormScheduledAt("");
      setShowCreateModal(false);
      loadNotifications();
    } catch (err: any) {
      toast.error(err.message || "Creation failed");
    } finally {
      setSubmitting(false);
    }
  };

  // Load Dead Letter Queue
  const loadDLQ = async () => {
    try {
      const items = await fetchDeadLetterQueue();
      setDlqItems(items);
      setShowDLQ(true);
    } catch (err: any) {
      toast.error(err.message || "Failed to load DLQ");
    }
  };

  // Pagination controls
  const goPrev = () => setPage((p) => Math.max(1, p - 1));
  const goNext = () => setPage((p) => Math.min(totalPages, p + 1));

  return (
    <div className="relative">
      <AdminPageHeader
        title="Notifications"
        subtitle="Manage system notifications – create, view, and track broadcasts."
        breadcrumbs={[{ label: "Dashboard", path: "/admin" }, { label: "Notifications" }]}
        actions={
          <div className="flex gap-3">
            <button
              onClick={loadDLQ}
              className="flex items-center gap-2 rounded-full border border-red-300 bg-white px-4 py-2 text-sm font-medium text-red-600 hover:bg-red-50"
            >
              <AlertCircle size={16} /> Dead Letter Queue
            </button>
            <button
              onClick={() => setShowCreateModal(true)}
              className="flex items-center gap-2 rounded-full bg-indigo-600 px-5 py-2 text-sm font-semibold text-white shadow hover:bg-indigo-700"
            >
              <Plus size={16} /> New Notification
            </button>
          </div>
        }
      />

      <div className="px-6 pt-4 pb-8 space-y-6">
        {/* Filters */}
        <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
          <div className="flex flex-1 gap-3">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" size={18} />
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search by title or body..."
                className="w-full rounded-full border border-slate-300 bg-white py-2.5 pl-10 pr-4 text-sm shadow-sm"
              />
            </div>
            <select
              value={sentFilter === undefined ? "" : sentFilter ? "sent" : "pending"}
              onChange={(e) => {
                const val = e.target.value;
                if (val === "sent") setSentFilter(true);
                else if (val === "pending") setSentFilter(false);
                else setSentFilter(undefined);
              }}
              className="rounded-full border border-slate-300 bg-white px-4 py-2.5 text-sm"
            >
              <option value="">All status</option>
              <option value="sent">Sent</option>
              <option value="pending">Pending</option>
            </select>
            <button
              onClick={() => loadNotifications()}
              disabled={loading}
              className="flex items-center gap-2 rounded-full border border-slate-300 bg-white px-4 py-2.5 text-sm font-medium hover:bg-slate-50"
            >
              {loading ? <Loader2 className="animate-spin" size={16} /> : <RefreshCw size={16} />}
              Refresh
            </button>
          </div>
        </div>

        {/* Table */}
        <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
          <div className="overflow-x-auto">
            <table className="min-w-full text-left text-sm">
              <thead className="bg-slate-50 text-xs uppercase text-slate-500">
                <tr>
                  <th className="px-4 py-3">Title</th>
                  <th className="px-4 py-3">Body</th>
                  <th className="px-4 py-3">Target</th>
                  <th className="px-4 py-3">Status</th>
                  <th className="px-4 py-3">Created</th>
                  <th className="px-4 py-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr>
                    <td colSpan={6} className="py-8 text-center">
                      <Loader2 className="mx-auto animate-spin" />
                    </td>
                  </tr>
                ) : notifications.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="py-8 text-center text-slate-500">
                      No notifications found
                    </td>
                  </tr>
                ) : (
                  notifications.map((n) => (
                    <tr key={n.id} className="border-t border-slate-100 hover:bg-slate-50">
                      <td className="px-4 py-3 font-medium">{n.title}</td>
                      <td className="px-4 py-3 text-slate-600 max-w-xs truncate">{n.body || "—"}</td>
                      <td className="px-4 py-3 text-xs">{formatTarget(n.target_query)}</td>
                      <td className="px-4 py-3">
                        <span
                          className={`rounded-full px-2 py-0.5 text-xs font-medium ${
                            n.sent
                              ? "bg-green-100 text-green-700"
                              : "bg-amber-100 text-amber-700"
                          }`}
                        >
                          {n.sent ? "Sent" : "Pending"}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-xs">
                        {new Date(n.created_at).toLocaleDateString()}
                      </td>
                      <td className="px-4 py-3 text-right space-x-2">
                        <button
                          onClick={() => handleViewDetails(n.id)}
                          className="inline-flex items-center gap-1 rounded-full border border-slate-300 px-3 py-1.5 text-xs hover:bg-slate-100"
                        >
                          <Eye size={14} /> View
                        </button>
                        <button
                          onClick={() => handleDelete(n.id)}
                          className="inline-flex items-center gap-1 rounded-full border border-rose-200 bg-rose-50 px-3 py-1.5 text-xs text-rose-600 hover:bg-rose-100"
                        >
                          <Trash2 size={14} /> Delete
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex items-center justify-between border-t border-slate-100 px-4 py-3 text-sm">
              <div>
                Page {page} of {totalPages} · {total} notifications
              </div>
              <div className="space-x-2">
                <button
                  onClick={goPrev}
                  disabled={page === 1}
                  className="rounded-full border border-slate-300 bg-white px-3 py-1.5 text-xs disabled:opacity-50"
                >
                  Previous
                </button>
                <button
                  onClick={goNext}
                  disabled={page === totalPages}
                  className="rounded-full border border-slate-300 bg-white px-3 py-1.5 text-xs disabled:opacity-50"
                >
                  Next
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Create Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="w-full max-w-lg rounded-2xl bg-white p-6 shadow-xl">
            <div className="mb-4 flex items-center justify-between">
              <h2 className="text-xl font-semibold">Create Notification</h2>
              <button onClick={() => setShowCreateModal(false)} className="rounded-full p-1 hover:bg-slate-100">
                <X size={20} />
              </button>
            </div>
            <form onSubmit={handleCreate} className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-1">Title *</label>
                <input
                  type="text"
                  value={formTitle}
                  onChange={(e) => setFormTitle(e.target.value)}
                  className="w-full rounded-lg border border-slate-300 px-3 py-2"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Body</label>
                <textarea
                  rows={3}
                  value={formBody}
                  onChange={(e) => setFormBody(e.target.value)}
                  className="w-full rounded-lg border border-slate-300 px-3 py-2"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Target audience</label>
                <div className="flex gap-4 mb-2">
                  <label className="flex items-center gap-2">
                    <input
                      type="radio"
                      value="all"
                      checked={formTargetType === "all"}
                      onChange={() => setFormTargetType("all")}
                    />
                    All users
                  </label>
                  <label className="flex items-center gap-2">
                    <input
                      type="radio"
                      value="users"
                      checked={formTargetType === "users"}
                      onChange={() => setFormTargetType("users")}
                    />
                    Specific users
                  </label>
                </div>
                {formTargetType === "users" && (
                  <div>
                    <textarea
                      placeholder="User IDs (one per line or comma separated)"
                      rows={3}
                      value={formUserIds}
                      onChange={(e) => setFormUserIds(e.target.value)}
                      className="w-full rounded-lg border border-slate-300 px-3 py-2"
                    />
                    <p className="text-xs text-slate-500 mt-1">
                      Enter UUIDs separated by commas, spaces, or new lines.
                    </p>
                  </div>
                )}
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Schedule (optional)</label>
                <input
                  type="datetime-local"
                  value={formScheduledAt}
                  onChange={(e) => setFormScheduledAt(e.target.value)}
                  className="w-full rounded-lg border border-slate-300 px-3 py-2"
                />
              </div>
              <div className="flex justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                  className="rounded-full border border-slate-300 px-5 py-2 text-sm"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="flex items-center gap-2 rounded-full bg-indigo-600 px-5 py-2 text-sm font-semibold text-white hover:bg-indigo-700 disabled:opacity-60"
                >
                  {submitting ? <Loader2 className="animate-spin" size={16} /> : <Send size={16} />}
                  Send
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Detail Modal */}
      {showDetailModal && selectedNotification && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="w-full max-w-lg rounded-2xl bg-white p-6 shadow-xl">
            <div className="mb-4 flex items-center justify-between">
              <h2 className="text-xl font-semibold">Notification Details</h2>
              <button onClick={() => setShowDetailModal(false)} className="rounded-full p-1 hover:bg-slate-100">
                <X size={20} />
              </button>
            </div>
            <div className="space-y-3 text-sm">
              <div>
                <span className="font-medium">ID:</span> {selectedNotification.id}
              </div>
              <div>
                <span className="font-medium">Title:</span> {selectedNotification.title}
              </div>
              <div>
                <span className="font-medium">Body:</span> {selectedNotification.body || "—"}
              </div>
              <div>
                <span className="font-medium">Target:</span> {formatTarget(selectedNotification.target_query)}
              </div>
              <div>
                <span className="font-medium">Status:</span>{" "}
                {selectedNotification.sent ? "Sent" : "Pending"}
              </div>
              <div>
                <span className="font-medium">Created:</span>{" "}
                {new Date(selectedNotification.created_at).toLocaleString()}
              </div>
              {selectedNotification.scheduled_at && (
                <div>
                  <span className="font-medium">Scheduled:</span>{" "}
                  {new Date(selectedNotification.scheduled_at).toLocaleString()}
                </div>
              )}
              {selectedNotification.data && (
                <div>
                  <span className="font-medium">Data:</span>
                  <pre className="mt-1 rounded bg-slate-100 p-2 text-xs overflow-auto">
                    {JSON.stringify(selectedNotification.data, null, 2)}
                  </pre>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Dead Letter Queue Modal */}
      {showDLQ && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="w-full max-w-4xl rounded-2xl bg-white p-6 shadow-xl max-h-[80vh] overflow-y-auto">
            <div className="mb-4 flex items-center justify-between">
              <h2 className="text-xl font-semibold">Dead Letter Queue</h2>
              <button onClick={() => setShowDLQ(false)} className="rounded-full p-1 hover:bg-slate-100">
                <X size={20} />
              </button>
            </div>
            {dlqItems.length === 0 ? (
              <p className="text-slate-500">No failed notifications.</p>
            ) : (
              <table className="min-w-full text-left text-sm">
                <thead className="bg-slate-50 text-xs uppercase">
                  <tr>
                    <th className="px-3 py-2">ID</th>
                    <th className="px-3 py-2">Title</th>
                    <th className="px-3 py-2">Error</th>
                    <th className="px-3 py-2">Failed At</th>
                  </tr>
                </thead>
                <tbody>
                  {dlqItems.map((item) => (
                    <tr key={item.id} className="border-t">
                      <td className="px-3 py-2 font-mono text-xs">{item.id}</td>
                      <td className="px-3 py-2">{item.title}</td>
                      <td className="px-3 py-2 text-red-600 max-w-md truncate">{item.error}</td>
                      <td className="px-3 py-2 text-xs">
                        {new Date(item.failed_at).toLocaleString()}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </div>
      )}
    </div>
  );
}