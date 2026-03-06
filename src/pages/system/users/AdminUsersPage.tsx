// src/pages/AdminUsersPage.tsx

import React, { useEffect, useMemo, useState } from "react";
import {
  Search,
  Filter,
  RefreshCw,
  Loader2,
  User,
  Shield,
  ShieldAlert,
  Mail,
  Plus,
  Edit2,
  Trash2,
} from "lucide-react";
import { toast } from "react-hot-toast";

import { AdminPageHeader } from "@/components/admin/AdminPageHeader";
import {
  listUsers,
  createUser,
  updateUser,
  deleteUser,
  type AdminUser,
} from "@/api/system/users.api";

const PAGE_LIMIT = 20;

const ROLE_LABELS: Record<number, string> = {
  1: "Admin",
  2: "Editor",
  3: "Customer",
};

const ROLE_OPTIONS = [
  { value: "", label: "All roles" },
  { value: "1", label: "Admin" },
  { value: "2", label: "Editor" },
  { value: "3", label: "Customer" },
];

type StatusFilterValue = "" | "active" | "inactive";

interface UserFormState {
  email: string;
  full_name: string;
  role_id: string;
  is_active: boolean;
  password: string;
}

const blankUserForm: UserFormState = {
  email: "",
  full_name: "",
  role_id: "2", // default Editor
  is_active: true,
  password: "",
};

const AdminUsersPage: React.FC = () => {
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(false);

  const [q, setQ] = useState("");
  const [roleFilter, setRoleFilter] = useState<string>("");
  const [statusFilter, setStatusFilter] = useState<StatusFilterValue>("");

  // Modal state
  const [modalOpen, setModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState<"create" | "edit">("create");
  const [currentUser, setCurrentUser] = useState<AdminUser | null>(null);
  const [form, setForm] = useState<UserFormState>(blankUserForm);
  const [saving, setSaving] = useState(false);

  async function loadUsers(opts?: { page?: number }) {
    setLoading(true);
    try {
      const targetPage = opts?.page ?? page;
      const res = await listUsers({
        q,
        role_id: roleFilter ? Number(roleFilter) : undefined,
        is_active:
          statusFilter === ""
            ? undefined
            : statusFilter === "active"
            ? true
            : false,
        page: targetPage,
        limit: PAGE_LIMIT,
      });

      setUsers(res.users || []);
      setTotal(res.total || 0);
      setPage(res.page || targetPage);
    } catch (err) {
      console.error("Failed to load users", err);
      toast.error("Failed to load users.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadUsers({ page: 1 });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const pageCount = useMemo(
    () => (total > 0 ? Math.ceil(total / PAGE_LIMIT) : 1),
    [total]
  );

  const filteredUsers = useMemo(() => {
    return users.filter((u) => {
      const search = q.trim().toLowerCase();
      if (search) {
        const haystack = [u.email, u.full_name]
          .filter(Boolean)
          .join(" ")
          .toLowerCase();
        if (!haystack.includes(search)) return false;
      }

      if (roleFilter && u.role_id !== Number(roleFilter)) return false;

      if (statusFilter === "active" && !u.is_active) return false;
      if (statusFilter === "inactive" && u.is_active) return false;

      return true;
    });
  }, [users, q, roleFilter, statusFilter]);

  const formatDateTime = (value?: string | null) => {
    if (!value) return "—";
    const d = new Date(value);
    if (Number.isNaN(d.getTime())) return "—";
    return d.toLocaleString();
  };

  const getStatusBadgeClass = (is_active: boolean) => {
    return is_active
      ? "border-emerald-300 bg-emerald-50 text-emerald-700 dark:border-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-200"
      : "border-slate-300 bg-slate-100 text-slate-600 dark:border-slate-600 dark:bg-slate-900 dark:text-slate-300";
  };

  const getRoleBadgeClass = (role_id: number) => {
    if (role_id === 1) {
      return "border-amber-300 bg-amber-50 text-amber-700 dark:border-amber-600 dark:bg-amber-900/40 dark:text-amber-100";
    }
    if (role_id === 2) {
      return "border-sky-300 bg-sky-50 text-sky-700 dark:border-sky-600 dark:bg-sky-900/40 dark:text-sky-100";
    }
    return "border-slate-300 bg-slate-100 text-slate-700 dark:border-slate-600 dark:bg-slate-900 dark:text-slate-200";
  };

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    loadUsers({ page: 1 });
  };

  const openCreateModal = () => {
    setModalMode("create");
    setCurrentUser(null);
    setForm(blankUserForm);
    setModalOpen(true);
  };

  const openEditModal = (u: AdminUser) => {
    setModalMode("edit");
    setCurrentUser(u);
    setForm({
      email: u.email,
      full_name: u.full_name || "",
      role_id: String(u.role_id),
      is_active: u.is_active,
      password: "",
    });
    setModalOpen(true);
  };

  const handleDelete = async (u: AdminUser) => {
    if (
      !window.confirm(
        `Delete user "${u.email}"?\nThis cannot be undone and may affect linked customers.`
      )
    )
      return;
    try {
      await deleteUser(u.id);
      setUsers((prev) => prev.filter((x) => x.id !== u.id));
      setTotal((t) => Math.max(0, t - 1));
      toast.success("User deleted.");
    } catch (err: any) {
      console.error("Failed to delete user", err);
      const msg =
        err?.error === "cannot_delete_own_account"
          ? "You cannot delete your own account."
          : "Failed to delete user.";
      toast.error(msg);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!form.email.trim() || !form.role_id) {
      toast.error("Email and role are required.");
      return;
    }

    if (modalMode === "create" && !form.password.trim()) {
      toast.error("Password is required for new users.");
      return;
    }

    setSaving(true);
    try {
      if (modalMode === "create") {
        const payload = {
          email: form.email.trim(),
          full_name: form.full_name.trim() || undefined,
          role_id: Number(form.role_id),
          password: form.password.trim(),
        };
        const res = await createUser(payload);
        setUsers((prev) => [res.user, ...prev]);
        setTotal((t) => t + 1);
        toast.success("User created.");
      } else if (modalMode === "edit" && currentUser) {
        const payload: any = {
          email: form.email.trim(),
          full_name: form.full_name.trim() || undefined,
          role_id: Number(form.role_id),
          is_active: form.is_active,
        };
        if (form.password.trim()) {
          payload.password = form.password.trim();
        }
        const res = await updateUser(currentUser.id, payload);
        setUsers((prev) =>
          prev.map((u) => (u.id === currentUser.id ? res.user : u))
        );
        toast.success("User updated.");
      }

      setModalOpen(false);
      setCurrentUser(null);
      setForm(blankUserForm);
    } catch (err: any) {
      console.error("Failed to save user", err);
      const message =
        err?.error === "email_exists"
          ? "Email already in use."
          : "Failed to save user.";
      toast.error(message);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="relative">
      <AdminPageHeader
        title="Users"
        subtitle="Manage admin and customer accounts for Minal Gems."
        breadcrumbs={[
          { label: "Dashboard", path: "/" },
          { label: "Users" },
        ]}
        actions={
          <button
            onClick={openCreateModal}
            className="flex items-center gap-2 rounded-full bg-gradient-to-r from-slate-900 via-slate-800 to-slate-700 px-5 py-2.5 text-sm font-semibold text-white shadow-md hover:brightness-110 dark:from-slate-100 dark:via-slate-200 dark:to-slate-300 dark:text-slate-900"
          >
            <Plus size={16} /> New User
          </button>
        }
      />

      <div className="px-6 pt-4 pb-8 space-y-8">
        {/* FILTER BAR */}
        <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
          <form
            onSubmit={handleSearchSubmit}
            className="flex flex-1 items-center gap-3"
          >
            <div className="relative flex-1">
              <Search
                className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500"
                size={18}
              />
              <input
                type="text"
                value={q}
                onChange={(e) => setQ(e.target.value)}
                placeholder="Search users by name or email…"
                className="w-full rounded-full border border-slate-300 bg-white py-3 pl-10 pr-3 text-base text-slate-900 shadow-sm focus:border-sky-500 focus:ring-sky-300 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-50"
              />
            </div>

            <button
              type="submit"
              className="flex items-center gap-2 rounded-full border border-slate-300 bg-white px-4 py-2.5 text-sm font-medium text-slate-700 shadow-sm hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200"
            >
              <Filter size={16} /> Apply
            </button>
          </form>

          <div className="flex flex-wrap items-center gap-2">
            {/* Role filter */}
            <select
              value={roleFilter}
              onChange={(e) => setRoleFilter(e.target.value)}
              className="rounded-full border border-slate-300 bg-white px-4 py-2.5 text-sm text-slate-800 shadow-sm focus:border-sky-500 focus:ring-sky-300 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200"
            >
              {ROLE_OPTIONS.map((opt) => (
                <option key={opt.value || "all"} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </select>

            {/* Status filter */}
            <select
              value={statusFilter}
              onChange={(e) =>
                setStatusFilter(e.target.value as StatusFilterValue)
              }
              className="rounded-full border border-slate-300 bg-white px-4 py-2.5 text-sm text-slate-800 shadow-sm focus:border-sky-500 focus:ring-sky-300 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200"
            >
              <option value="">All status</option>
              <option value="active">Active</option>
              <option value="inactive">Inactive</option>
            </select>

            <button
              onClick={() => loadUsers({ page })}
              disabled={loading}
              className="flex items-center gap-2 rounded-full border border-slate-300 bg-white px-4 py-2.5 text-sm font-medium text-slate-800 shadow-sm hover:bg-slate-50 disabled:opacity-60 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200"
            >
              {loading ? (
                <Loader2 className="animate-spin" size={16} />
              ) : (
                <RefreshCw size={16} />
              )}
              Refresh
            </button>
          </div>
        </div>

        {/* TABLE */}
        <div className="overflow-hidden rounded-2xl border border-slate-300 bg-white shadow-sm dark:border-slate-700 dark:bg-slate-900">
          <div className="overflow-x-auto">
            <table className="min-w-full text-left text-base text-slate-800 dark:text-slate-200">
              <thead className="bg-slate-100 text-sm uppercase tracking-wide text-slate-600 dark:bg-slate-800 dark:text-slate-400">
                <tr>
                  <th className="px-6 py-4">User</th>
                  <th className="px-6 py-4">Role</th>
                  <th className="px-6 py-4">Status</th>
                  <th className="px-6 py-4">Created</th>
                  <th className="px-6 py-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr>
                    <td colSpan={5} className="py-8 text-center text-lg">
                      <Loader2 className="mx-auto animate-spin" />
                      Loading...
                    </td>
                  </tr>
                ) : filteredUsers.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="py-8 text-center text-lg">
                      No users found
                    </td>
                  </tr>
                ) : (
                  filteredUsers.map((u) => (
                    <tr
                      key={u.id}
                      className="border-t border-slate-200 hover:bg-slate-50 dark:border-slate-700 dark:hover:bg-slate-800"
                    >
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <span className="inline-flex h-9 w-9 items-center justify-center rounded-full bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-300">
                            <User size={18} />
                          </span>
                          <div className="flex flex-col">
                            <span className="font-semibold">
                              {u.full_name || "—"}
                            </span>
                            <span className="flex items-center gap-1 text-xs text-slate-500">
                              <Mail size={12} />
                              {u.email}
                            </span>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-sm">
                        <span
                          className={
                            "inline-flex items-center gap-1 rounded-full border px-3 py-1 text-xs font-medium " +
                            getRoleBadgeClass(u.role_id)
                          }
                        >
                          {u.role_id === 1 ? (
                            <Shield size={12} />
                          ) : u.role_id === 2 ? (
                            <ShieldAlert size={12} />
                          ) : (
                            <User size={12} />
                          )}
                          {ROLE_LABELS[u.role_id] || `Role ${u.role_id}`}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-sm">
                        <span
                          className={
                            "inline-flex items-center gap-1 rounded-full border px-3 py-1 text-xs font-medium " +
                            getStatusBadgeClass(u.is_active)
                          }
                        >
                          <span
                            className={`h-2 w-2 rounded-full ${
                              u.is_active
                                ? "bg-emerald-500"
                                : "bg-slate-400 dark:bg-slate-500"
                            }`}
                          />
                          {u.is_active ? "Active" : "Inactive"}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-sm">
                        {formatDateTime(u.created_at)}
                      </td>
                      <td className="px-6 py-4 text-right space-x-2">
                        <button
                          onClick={() => openEditModal(u)}
                          className="inline-flex items-center gap-1 rounded-full border border-slate-300 px-3 py-1.5 text-sm hover:bg-slate-100 dark:border-slate-700 dark:hover:bg-slate-800"
                        >
                          <Edit2 size={14} /> Edit
                        </button>
                        <button
                          onClick={() => handleDelete(u)}
                          className="inline-flex items-center gap-1 rounded-full border border-rose-300 bg-rose-50 px-3 py-1.5 text-sm text-rose-700 hover:bg-rose-100 dark:border-rose-700 dark:bg-rose-900/40 dark:text-rose-200"
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
          <div className="flex items-center justify-between px-6 py-3 text-sm text-slate-600 dark:text-slate-400">
            <div>
              Page {page} of {pageCount} · {total} users
              {filteredUsers.length !== users.length && (
                <span className="ml-2 text-xs text-slate-500">
                  (Filtered on this page: {filteredUsers.length})
                </span>
              )}
            </div>
            <div className="space-x-2">
              <button
                disabled={page <= 1 || loading}
                onClick={() => {
                  if (page <= 1) return;
                  const next = page - 1;
                  setPage(next);
                  loadUsers({ page: next });
                }}
                className="rounded-full border border-slate-300 bg-white px-3 py-1.5 text-xs font-medium hover:bg-slate-50 disabled:opacity-50 dark:border-slate-700 dark:bg-slate-900"
              >
                Previous
              </button>
              <button
                disabled={page >= pageCount || loading}
                onClick={() => {
                  if (page >= pageCount) return;
                  const next = page + 1;
                  setPage(next);
                  loadUsers({ page: next });
                }}
                className="rounded-full border border-slate-300 bg-white px-3 py-1.5 text-xs font-medium hover:bg-slate-50 disabled:opacity-50 dark:border-slate-700 dark:bg-slate-900"
              >
                Next
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* MODAL: CREATE / EDIT USER */}
      {modalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm">
          <div className="w-full max-w-xl rounded-2xl border border-slate-300 bg-white p-6 shadow-xl dark:border-slate-700 dark:bg-slate-950">
            {/* HEADER */}
            <div className="mb-6 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <img src="/minal_gems_logo.svg" className="h-10 w-auto" />
                <div>
                  <h2 className="text-xl font-semibold text-slate-900 dark:text-white">
                    {modalMode === "create" ? "Create User" : "Edit User"}
                  </h2>
                  <p className="text-sm text-slate-500 dark:text-slate-400">
                    Manage admin and customer accounts securely.
                  </p>
                </div>
              </div>
              <button
                onClick={() => setModalOpen(false)}
                className="rounded-full border border-slate-300 px-3 py-1 text-sm hover:bg-slate-100 dark:border-slate-700 dark:hover:bg-slate-800"
              >
                Close
              </button>
            </div>

            {/* FORM */}
            <form onSubmit={handleSubmit} className="space-y-4 text-base">
              <div>
                <label className="mb-1 block text-sm font-medium">Email *</label>
                <input
                  type="email"
                  required
                  value={form.email}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, email: e.target.value }))
                  }
                  className="w-full rounded-lg border border-slate-300 bg-slate-50 px-3 py-2 text-base dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100"
                />
              </div>

              <div>
                <label className="mb-1 block text-sm font-medium">
                  Full Name
                </label>
                <input
                  value={form.full_name}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, full_name: e.target.value }))
                  }
                  className="w-full rounded-lg border border-slate-300 bg-slate-50 px-3 py-2 text-base dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="mb-1 block text-sm font-medium">
                    Role *
                  </label>
                  <select
                    value={form.role_id}
                    onChange={(e) =>
                      setForm((f) => ({ ...f, role_id: e.target.value }))
                    }
                    className="w-full rounded-lg border border-slate-300 bg-slate-50 px-3 py-2 text-sm dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100"
                  >
                    <option value="1">Admin</option>
                    <option value="2">Editor</option>
                    <option value="3">Customer</option>
                  </select>
                </div>
                <div className="flex items-center gap-2 pt-6">
                  <input
                    id="is_active"
                    type="checkbox"
                    className="h-4 w-4 rounded border-slate-300 text-slate-900 focus:ring-slate-900 dark:border-slate-600"
                    checked={form.is_active}
                    onChange={(e) =>
                      setForm((f) => ({ ...f, is_active: e.target.checked }))
                    }
                  />
                  <label
                    htmlFor="is_active"
                    className="text-sm text-slate-700 dark:text-slate-200"
                  >
                    Active
                  </label>
                </div>
              </div>

              <div>
                <label className="mb-1 block text-sm font-medium">
                  {modalMode === "create"
                    ? "Password *"
                    : "Password (leave blank to keep unchanged)"}
                </label>
                <input
                  type="password"
                  value={form.password}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, password: e.target.value }))
                  }
                  className="w-full rounded-lg border border-slate-300 bg-slate-50 px-3 py-2 text-base dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100"
                />
              </div>

              <div className="flex items-center justify-between pt-4">
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  Required fields are marked with *
                </p>
                <div className="flex items-center gap-3">
                  <button
                    type="button"
                    onClick={() => setModalOpen(false)}
                    className="rounded-full border border-slate-300 bg-white px-5 py-2 text-sm font-medium hover:bg-slate-100 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={saving}
                    className="rounded-full bg-slate-900 px-5 py-2 text-sm font-semibold text-white hover:bg-slate-800 disabled:opacity-60 dark:bg-slate-100 dark:text-slate-900"
                  >
                    {saving ? (
                      <Loader2 className="animate-spin" size={16} />
                    ) : modalMode === "create" ? (
                      "Create User"
                    ) : (
                      "Save Changes"
                    )}
                  </button>
                </div>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminUsersPage;
