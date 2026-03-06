// src/pages/LeadsPage.tsx

import React, { useEffect, useMemo, useState } from "react";
import {
  Search,
  Filter,
  RefreshCw,
  Plus,
  MoreVertical,
  X,
  Loader2,
  LayoutGrid,
  List,
} from "lucide-react";

import { AdminPageHeader } from "@/components/admin/AdminPageHeader";
import type { Lead, LeadNote, LeadStatus } from "@/api/crm/leads.api";
import {
  addLeadNote,
  createLead,
  deleteLead,
  fetchLeadNotes,
  fetchLeads,
  fetchLeadStats,
  updateLead,
} from "@/api/crm/leads.api";
import { toast } from "@/lib/toast";

const STATUS_OPTIONS: { value: LeadStatus | ""; label: string }[] = [
  { value: "", label: "All statuses" },
  { value: "new", label: "New" },
  { value: "contacted", label: "Contacted" },
  { value: "qualified", label: "Qualified" },
  { value: "won", label: "Won" },
  { value: "lost", label: "Lost" },
];

const KANBAN_COLUMNS: { key: LeadStatus; title: string; description: string }[] =
  [
    { key: "new", title: "New", description: "Fresh enquiries" },
    { key: "contacted", title: "Contacted", description: "We reached out" },
    { key: "qualified", title: "Qualified", description: "Good potential" },
    { key: "won", title: "Won", description: "Converted customers" },
    { key: "lost", title: "Lost", description: "Not moving forward" },
  ];

function statusClasses(status: LeadStatus) {
  const s = String(status || "").toLowerCase();
  switch (s) {
    case "new":
      return "bg-sky-100 text-sky-800 border-sky-300 dark:bg-sky-900/40 dark:text-sky-200 dark:border-sky-700/60";
    case "contacted":
      return "bg-amber-100 text-amber-800 border-amber-300 dark:bg-amber-900/40 dark:text-amber-200 dark:border-amber-700/60";
    case "qualified":
      return "bg-violet-100 text-violet-800 border-violet-300 dark:bg-violet-900/40 dark:text-violet-200 dark:border-violet-700/60";
    case "won":
      return "bg-emerald-100 text-emerald-800 border-emerald-300 dark:bg-emerald-900/40 dark:text-emerald-200 dark:border-emerald-700/60";
    case "lost":
      return "bg-rose-100 text-rose-800 border-rose-300 dark:bg-rose-900/40 dark:text-rose-200 dark:border-rose-700/60";
    default:
      return "bg-slate-100 text-slate-700 border-slate-300 dark:bg-slate-900/40 dark:text-slate-200 dark:border-slate-700/60";
  }
}

const LeadsPage: React.FC = () => {
  const [leads, setLeads] = useState<Lead[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [limit] = useState(20);
  const [q, setQ] = useState("");
  const [status, setStatus] = useState<LeadStatus | "">("");
  const [loading, setLoading] = useState(false);

  // Stats
  const [stats, setStats] = useState<{
    today: number;
    this_week: number;
    total: number;
    delta: number;
  } | null>(null);
  const [statsLoading, setStatsLoading] = useState(false);

  // Detail panel
  const [selectedLead, setSelectedLead] = useState<Lead | null>(null);
  const [detailOpen, setDetailOpen] = useState(false);
  const [notes, setNotes] = useState<LeadNote[]>([]);
  const [notesLoading, setNotesLoading] = useState(false);
  const [newNote, setNewNote] = useState("");
  const [savingNote, setSavingNote] = useState(false);

  // Create Lead Modal
  const [createOpen, setCreateOpen] = useState(false);
  const [createLoading, setCreateLoading] = useState(false);

  const [createForm, setCreateForm] = useState({
    name: "",
    email: "",
    phone: "",
    company: "",
    country: "",
    product_interest: "",
    message: "",
    source: "admin",
  });

  // Table or Board
  const [viewMode, setViewMode] = useState<"table" | "board">("table");

  const pageCount = useMemo(
    () => (total > 0 ? Math.ceil(total / limit) : 1),
    [total, limit]
  );

  async function loadLeads(opts?: { keepPage?: boolean }) {
    setLoading(true);
    try {
      const res = await fetchLeads({
        q,
        status: status || undefined,
        page: opts?.keepPage ? page : 1,
        limit,
      });
      setLeads(res.leads || []);
      setTotal(res.total || 0);
      if (!opts?.keepPage) setPage(res.page || 1);
    } catch (err) {
      console.error("Failed to load leads", err);
      toast.error("Failed to load leads.");
    } finally {
      setLoading(false);
    }
  }

  async function loadStats() {
    setStatsLoading(true);
    try {
      const res = await fetchLeadStats();
      setStats(res.stats);
    } catch (err) {
      console.error("Failed to load lead stats", err);
      toast.error("Failed to load lead stats.");
    } finally {
      setStatsLoading(false);
    }
  }

  async function loadNotes(leadId: string) {
    setNotesLoading(true);
    try {
      const res = await fetchLeadNotes(leadId);
      setNotes(res.notes || []);
    } catch (err) {
      console.error("Failed to load notes", err);
      toast.error("Failed to load notes.");
    } finally {
      setNotesLoading(false);
    }
  }

  useEffect(() => {
    loadLeads();
    loadStats();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    loadLeads();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [status]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    loadLeads();
  };

  const handleOpenDetail = (lead: Lead) => {
    setSelectedLead(lead);
    setDetailOpen(true);
    loadNotes(lead.id);
  };

  const handleCloseDetail = () => {
    setDetailOpen(false);
    setSelectedLead(null);
    setNotes([]);
    setNewNote("");
  };

  const handleAddNote = async () => {
    if (!selectedLead || !newNote.trim()) return;
    setSavingNote(true);
    try {
      const res = await addLeadNote(selectedLead.id, newNote.trim());
      setNotes((prev) => [res.note, ...prev]);
      setNewNote("");
      toast.success("Note added.");
    } catch (err) {
      console.error("Failed to add note", err);
      toast.error("Failed to add note.");
    } finally {
      setSavingNote(false);
    }
  };

  const handleDelete = async (lead: Lead) => {
    if (!window.confirm(`Delete lead "${lead.name}"?`)) return;
    try {
      await deleteLead(lead.id);
      setLeads((prev) => prev.filter((l) => l.id !== lead.id));
      setTotal((t) => Math.max(0, t - 1));
      if (selectedLead?.id === lead.id) handleCloseDetail();
      toast.success("Lead deleted.");
    } catch (err) {
      console.error("Failed to delete lead", err);
      toast.error("Failed to delete lead.");
    }
  };

  const handleCreateSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!createForm.name.trim() || !createForm.email.trim()) return;

    setCreateLoading(true);
    try {
      await createLead({
        name: createForm.name.trim(),
        email: createForm.email.trim(),
        phone: createForm.phone || undefined,
        company: createForm.company || undefined,
        country: createForm.country || undefined,
        product_interest: createForm.product_interest || undefined,
        message: createForm.message || undefined,
        source: createForm.source || "admin",
      });
      setCreateOpen(false);
      setCreateForm({
        name: "",
        email: "",
        phone: "",
        company: "",
        country: "",
        product_interest: "",
        message: "",
        source: "admin",
      });
      await loadLeads();
      await loadStats();
      toast.success("Lead created.");
    } catch (err) {
      console.error("Failed to create lead", err);
      toast.error("Failed to create lead.");
    } finally {
      setCreateLoading(false);
    }
  };

  // Status update with toast + local state update
  const handleStatusChange = async (newStatus: LeadStatus) => {
    if (!selectedLead) return;
    const prev = selectedLead;

    // Optimistic UI update
    setSelectedLead({ ...prev, status: newStatus });
    setLeads((prevLeads) =>
      prevLeads.map((l) =>
        l.id === prev.id ? { ...l, status: newStatus } : l
      )
    );

    try {
      const res = await updateLead(selectedLead.id, { status: newStatus });
      if (res.lead) {
        setSelectedLead(res.lead);
        setLeads((prevLeads) =>
          prevLeads.map((l) => (l.id === res.lead.id ? res.lead : l))
        );
      }
      toast.success("Lead status updated.");
    } catch (err) {
      console.error("Failed to update lead status", err);
      // rollback
      setSelectedLead(prev);
      setLeads((prevLeads) =>
        prevLeads.map((l) => (l.id === prev.id ? prev : l))
      );
      toast.error("Failed to update status.");
    }
  };

  // Group for kanban
  const groupedByStatus: Record<LeadStatus, Lead[]> = useMemo(() => {
    const map: Record<string, Lead[]> = {};
    for (const lead of leads) {
      const key = (lead.status || "new").toLowerCase();
      if (!map[key]) map[key] = [];
      map[key].push(lead);
    }
    return map as Record<LeadStatus, Lead[]>;
  }, [leads]);

  return (
    <div className="relative">
      <AdminPageHeader
        title="Leads"
        subtitle="Track enquiries, follow-ups and conversions."
        breadcrumbs={[{ label: "Dashboard", path: "/" }, { label: "Leads" }]}
        actions={
          <div className="flex items-center gap-2">
            {/* View Mode Toggle */}
            <div className="inline-flex rounded-full border border-slate-300 bg-white p-1 text-sm shadow-sm dark:border-slate-700 dark:bg-slate-900">
              <button
                onClick={() => setViewMode("table")}
                className={`px-3 py-1.5 rounded-full flex items-center gap-1 ${
                  viewMode === "table"
                    ? "bg-slate-900 text-white dark:bg-slate-100 dark:text-slate-900"
                    : "text-slate-600 dark:text-slate-300"
                }`}
              >
                <List size={16} /> Table
              </button>

              <button
                onClick={() => setViewMode("board")}
                className={`px-3 py-1.5 rounded-full flex items-center gap-1 ${
                  viewMode === "board"
                    ? "bg-slate-900 text-white dark:bg-slate-100 dark:text-slate-900"
                    : "text-slate-600 dark:text-slate-300"
                }`}
              >
                <LayoutGrid size={16} /> Board
              </button>
            </div>

            <button
              onClick={() => setCreateOpen(true)}
              className="flex items-center gap-2 rounded-full bg-gradient-to-r from-emerald-500 via-teal-500 to-sky-500 px-5 py-2.5 text-sm font-semibold text-white shadow-md hover:brightness-110"
            >
              <Plus size={16} /> New Lead
            </button>
          </div>
        }
      />

      {/* =========== MAIN CONTENT =========== */}
      <div className="px-6 pt-4 pb-8 space-y-8">
        {/* -------------------- STATS BAR -------------------- */}
        <div className="grid gap-4 sm:grid-cols-3">
          {/* TODAY */}
          <div className="rounded-xl border border-slate-300 bg-white px-5 py-4 shadow-sm dark:border-slate-700 dark:bg-slate-900">
            <div className="text-xs uppercase tracking-wide text-slate-600 dark:text-slate-400">
              Today
            </div>
            <div className="mt-2 flex items-baseline gap-3">
              <span className="text-3xl font-bold text-slate-900 dark:text-white">
                {statsLoading ? "…" : stats?.today ?? "–"}
              </span>
            </div>
          </div>

          {/* WEEK */}
          <div className="rounded-xl border border-slate-300 bg-white px-5 py-4 shadow-sm dark:border-slate-700 dark:bg-slate-900">
            <div className="text-xs uppercase tracking-wide text-slate-600 dark:text-slate-400">
              This Week
            </div>
            <div className="mt-2 text-3xl font-bold text-slate-900 dark:text-white">
              {statsLoading ? "…" : stats?.this_week ?? "–"}
            </div>
          </div>

          {/* TOTAL */}
          <div className="rounded-xl border border-slate-300 bg-white px-5 py-4 shadow-sm dark:border-slate-700 dark:bg-slate-900">
            <div className="text-xs uppercase tracking-wide text-slate-600 dark:text-slate-400">
              Total Leads
            </div>
            <div className="mt-2 text-3xl font-bold text-slate-900 dark:text-white">
              {statsLoading ? "…" : stats?.total ?? "–"}
            </div>
          </div>
        </div>

        {/* -------------------- FILTER BAR -------------------- */}
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
                placeholder="Search by name or email..."
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

          <select
            value={status}
            onChange={(e) => setStatus(e.target.value as LeadStatus | "")}
            className="rounded-full border border-slate-300 bg-white px-4 py-2.5 text-sm text-slate-800 shadow-sm focus:border-sky-500 focus:ring-sky-300 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200"
          >
            {STATUS_OPTIONS.map((opt) => (
              <option key={opt.value || "all"} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </select>

          <button
            onClick={() => {
              loadLeads({ keepPage: true });
              loadStats();
            }}
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

        {/* ---------------- TABLE OR BOARD ---------------- */}
        {viewMode === "table" ? (
          <>
            {/* TABLE */}
            <div className="overflow-hidden rounded-2xl border border-slate-300 bg-white shadow-sm dark:border-slate-700 dark:bg-slate-900">
              <div className="overflow-x-auto">
                <table className="min-w-full text-left text-base text-slate-800 dark:text-slate-200">
                  <thead className="bg-slate-100 text-sm uppercase tracking-wide text-slate-600 dark:bg-slate-800 dark:text-slate-400">
                    <tr>
                      <th className="px-6 py-4">Name</th>
                      <th className="px-6 py-4">Contact</th>
                      <th className="px-6 py-4">Product</th>
                      <th className="px-6 py-4">Status</th>
                      <th className="px-6 py-4">Source</th>
                      <th className="px-6 py-4">Created</th>
                      <th className="px-6 py-4 text-right">Actions</th>
                    </tr>
                  </thead>

                  <tbody>
                    {loading ? (
                      <tr>
                        <td colSpan={7} className="py-8 text-center text-lg">
                          <Loader2 className="mx-auto animate-spin" />
                          Loading...
                        </td>
                      </tr>
                    ) : leads.length === 0 ? (
                      <tr>
                        <td colSpan={7} className="py-8 text-center text-lg">
                          No leads found
                        </td>
                      </tr>
                    ) : (
                      leads.map((lead) => (
                        <tr
                          key={lead.id}
                          className="border-t border-slate-200 hover:bg-slate-50 dark:border-slate-700 dark:hover:bg-slate-800"
                        >
                          <td className="px-6 py-4 font-medium">{lead.name}</td>

                          <td className="px-6 py-4">
                            <div>{lead.email}</div>
                            {lead.phone && (
                              <div className="text-sm text-slate-500">
                                {lead.phone}
                              </div>
                            )}
                          </td>

                          <td className="px-6 py-4">
                            {lead.product_interest || "—"}
                          </td>

                          <td className="px-6 py-4">
                            <span
                              className={`inline-flex items-center gap-2 rounded-full border px-3 py-1 text-sm font-medium ${statusClasses(
                                lead.status
                              )}`}
                            >
                              {lead.status}
                            </span>
                          </td>

                          <td className="px-6 py-4">{lead.source}</td>

                          <td className="px-6 py-4">
                            {new Date(lead.created_at).toLocaleString()}
                          </td>

                          <td className="px-6 py-4 text-right space-x-2">
                            <button
                              onClick={() => handleOpenDetail(lead)}
                              className="rounded-full border border-slate-300 px-3 py-1.5 text-sm hover:bg-slate-100 dark:border-slate-700 dark:hover:bg-slate-800"
                            >
                              View
                            </button>

                            <button
                              onClick={() => handleDelete(lead)}
                              className="rounded-full border border-rose-300 bg-rose-50 px-3 py-1.5 text-sm text-rose-700 hover:bg-rose-100 dark:border-rose-700 dark:bg-rose-900/40 dark:text-rose-200"
                            >
                              Delete
                            </button>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </>
        ) : (
          <>
            {/* KANBAN BOARD */}
            <div className="flex gap-4 overflow-x-auto pb-4 h-[75vh]">
              {KANBAN_COLUMNS.map((col) => {
                const colList = groupedByStatus[col.key] || [];

                return (
                  <div
                    key={col.key}
                    className="flex flex-col min-w-[260px] max-w-xs flex-1 rounded-2xl border border-slate-300 bg-slate-100 p-4 dark:border-slate-700 dark:bg-slate-900"
                  >
                    <div className="mb-4">
                      <h3 className="text-lg font-bold text-slate-900 dark:text-white">
                        {col.title}
                      </h3>
                      <p className="text-sm text-slate-600 dark:text-slate-400">
                        {col.description}
                      </p>
                    </div>

                    <div className="flex-1 overflow-y-auto space-y-3">
                      {colList.length === 0 ? (
                        <p className="text-sm text-slate-500 text-center py-4">
                          No leads
                        </p>
                      ) : (
                        colList.map((lead) => (
                          <div
                            key={lead.id}
                            draggable
                            className="rounded-xl border border-slate-300 bg-white p-4 shadow-sm hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-950 dark:hover:bg-slate-900"
                          >
                            <div className="font-semibold text-slate-900 dark:text-white">
                              {lead.name}
                            </div>

                            <div className="text-sm text-slate-500">
                              {lead.email}
                            </div>
                            {lead.company && (
                              <div className="text-sm text-slate-400">
                                {lead.company}
                              </div>
                            )}

                            <div className="mt-3 flex justify-between items-center">
                              <span
                                className={`rounded-full border px-3 py-1 text-xs font-medium ${statusClasses(
                                  lead.status
                                )}`}
                              >
                                {lead.status}
                              </span>

                              <button
                                onClick={() => handleOpenDetail(lead)}
                                className="rounded-full bg-slate-200 p-1 hover:bg-slate-300 dark:bg-slate-800 dark:hover:bg-slate-700"
                              >
                                <MoreVertical size={16} />
                              </button>
                            </div>
                          </div>
                        ))
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </>
        )}
      </div>

      {/* ---------------------------- DETAIL SLIDEOVER ---------------------------- */}
      {detailOpen && selectedLead && (
        <div className="fixed inset-0 z-40 flex justify-end bg-black/40 backdrop-blur-sm">
          <div className="h-full w-full max-w-md bg-white shadow-xl dark:bg-slate-950">
            {/* HEADER WITH LOGO */}
            <div className="flex items-center justify-between border-b border-slate-300 px-4 py-4 dark:border-slate-700">
              <div className="flex items-center gap-3">
                <img src="/minal_gems_logo.svg" className="h-10 w-auto" />

                <div>
                  <div className="text-lg font-semibold text-slate-900 dark:text-slate-50">
                    {selectedLead.name}
                  </div>
                  <div className="text-sm text-slate-500 dark:text-slate-400">
                    Lead Details & Notes
                  </div>
                </div>
              </div>

              <button
                onClick={handleCloseDetail}
                className="rounded-full border border-slate-300 p-2 hover:bg-slate-100 dark:border-slate-700 dark:hover:bg-slate-800"
              >
                <X size={18} />
              </button>
            </div>

            {/* BODY */}
            <div className="h-[calc(100%-64px)] overflow-y-auto px-4 py-4 text-base">
              {/* CONTACT BLOCK */}
              <div className="mb-5 rounded-xl border border-slate-300 bg-slate-100 p-4 dark:border-slate-700 dark:bg-slate-900">
                <div className="mb-2 text-sm font-semibold uppercase tracking-wide text-slate-600 dark:text-slate-400">
                  Contact Information
                </div>

                <div className="space-y-2 text-base">
                  <div>
                    <b>Email:</b> {selectedLead.email}
                  </div>
                  {selectedLead.phone && (
                    <div>
                      <b>Phone:</b> {selectedLead.phone}
                    </div>
                  )}
                  {selectedLead.company && (
                    <div>
                      <b>Company:</b> {selectedLead.company}
                    </div>
                  )}
                  {selectedLead.country && (
                    <div>
                      <b>Country:</b> {selectedLead.country}
                    </div>
                  )}
                  <div>
                    <b>Source:</b> {selectedLead.source || "contact_form"}
                  </div>
                </div>
              </div>

              {/* SUMMARY BLOCK */}
              <div className="mb-5 rounded-xl border border-slate-300 bg-white p-4 dark:border-slate-700 dark:bg-slate-900">
                <div className="mb-2 text-sm font-semibold uppercase tracking-wide text-slate-600 dark:text-slate-400">
                  Summary
                </div>

                <div className="space-y-3 text-base">
                  <div>
                    <b>Product Interest:</b>{" "}
                    {selectedLead.product_interest || "—"}
                  </div>

                  <div className="flex items-center gap-2">
                    <b>Status:</b>
                    <select
                      value={selectedLead.status}
                      onChange={(e) =>
                        handleStatusChange(e.target.value as LeadStatus)
                      }
                      className="rounded-full border border-slate-300 bg-white px-3 py-1.5 text-sm dark:border-slate-600 dark:bg-slate-900 dark:text-slate-100"
                    >
                      {STATUS_OPTIONS.filter((s) => s.value).map((opt) => (
                        <option key={opt.value} value={opt.value}>
                          {opt.label}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                {selectedLead.message && (
                  <div className="mt-4">
                    <div className="mb-1 text-sm font-medium text-slate-500 dark:text-slate-400">
                      Message
                    </div>
                    <p className="rounded-lg bg-slate-100 p-3 text-base dark:bg-slate-900 dark:text-slate-200">
                      {selectedLead.message}
                    </p>
                  </div>
                )}
              </div>

              {/* NOTES BLOCK */}
              <div className="mb-24 rounded-xl border border-slate-300 bg-white p-4 dark:border-slate-700 dark:bg-slate-900">
                <div className="mb-3 text-sm font-semibold uppercase tracking-wide text-slate-600 dark:text-slate-400">
                  Internal Notes
                </div>

                {/* ADD NOTE */}
                <textarea
                  value={newNote}
                  onChange={(e) => setNewNote(e.target.value)}
                  placeholder="Write a note…"
                  rows={3}
                  className="w-full rounded-lg border border-slate-300 bg-slate-50 px-3 py-2 text-base text-slate-900 focus:border-sky-500 focus:ring-sky-300 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-100"
                />

                <div className="flex justify-end mt-2">
                  <button
                    onClick={handleAddNote}
                    disabled={savingNote || !newNote.trim()}
                    className="rounded-full bg-slate-900 px-5 py-2 text-sm font-semibold text-white hover:bg-slate-800 disabled:opacity-60 dark:bg-slate-100 dark:text-slate-900"
                  >
                    {savingNote ? (
                      <Loader2 className="animate-spin" size={16} />
                    ) : (
                      "Save Note"
                    )}
                  </button>
                </div>

                {/* NOTES LIST */}
                <div className="mt-4 space-y-3">
                  {notesLoading ? (
                    <p className="text-center text-base">Loading notes…</p>
                  ) : notes.length === 0 ? (
                    <p className="text-center text-base">No notes yet.</p>
                  ) : (
                    notes.map((n) => (
                      <div
                        key={n.id}
                        className="rounded-lg border border-slate-300 bg-slate-50 p-3 dark:border-slate-700 dark:bg-slate-950"
                      >
                        <div className="mb-1 text-sm text-slate-500 dark:text-slate-400">
                          {new Date(n.created_at).toLocaleString()}
                        </div>
                        <div className="text-base">{n.note}</div>
                      </div>
                    ))
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ---------------------------- CREATE LEAD MODAL ---------------------------- */}
      {createOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm">
          <div className="w-full max-w-xl rounded-2xl border border-slate-300 bg-white p-6 shadow-xl dark:border-slate-700 dark:bg-slate-950">
            {/* HEADER with Logo */}
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-3">
                <img src="/minal_gems_logo.svg" className="h-10 w-auto" />
                <div>
                  <h2 className="text-xl font-semibold text-slate-900 dark:text-white">
                    Create New Lead
                  </h2>
                  <p className="text-sm text-slate-500 dark:text-slate-400">
                    Add a lead manually from phone, WhatsApp, or store visit.
                  </p>
                </div>
              </div>

              <button
                onClick={() => setCreateOpen(false)}
                className="rounded-full border border-slate-300 p-2 hover:bg-slate-100 dark:border-slate-700 dark:hover:bg-slate-800"
              >
                <X size={18} />
              </button>
            </div>

            {/* FORM */}
            <form onSubmit={handleCreateSubmit} className="space-y-4 text-base">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-1">
                    Name *
                  </label>
                  <input
                    required
                    value={createForm.name}
                    onChange={(e) =>
                      setCreateForm((f) => ({ ...f, name: e.target.value }))
                    }
                    className="w-full rounded-lg border border-slate-300 bg-slate-50 px-3 py-2 text-base dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium mb-1">
                    Email *
                  </label>
                  <input
                    type="email"
                    required
                    value={createForm.email}
                    onChange={(e) =>
                      setCreateForm((f) => ({ ...f, email: e.target.value }))
                    }
                    className="w-full rounded-lg border border-slate-300 bg-slate-50 px-3 py-2 text-base dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-1">Phone</label>
                  <input
                    value={createForm.phone}
                    onChange={(e) =>
                      setCreateForm((f) => ({ ...f, phone: e.target.value }))
                    }
                    className="w-full rounded-lg border border-slate-300 bg-slate-50 px-3 py-2 text-base dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium mb-1">
                    Company
                  </label>
                  <input
                    value={createForm.company}
                    onChange={(e) =>
                      setCreateForm((f) => ({ ...f, company: e.target.value }))
                    }
                    className="w-full rounded-lg border border-slate-300 bg-slate-50 px-3 py-2 text-base dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-1">
                    Country
                  </label>
                  <input
                    value={createForm.country}
                    onChange={(e) =>
                      setCreateForm((f) => ({ ...f, country: e.target.value }))
                    }
                    className="w-full rounded-lg border border-slate-300 bg-slate-50 px-3 py-2 text-base dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium mb-1">
                    Product Interest
                  </label>
                  <input
                    value={createForm.product_interest}
                    onChange={(e) =>
                      setCreateForm((f) => ({
                        ...f,
                        product_interest: e.target.value,
                      }))
                    }
                    className="w-full rounded-lg border border-slate-300 bg-slate-50 px-3 py-2 text-base dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">
                  Message
                </label>
                <textarea
                  rows={3}
                  value={createForm.message}
                  onChange={(e) =>
                    setCreateForm((f) => ({ ...f, message: e.target.value }))
                  }
                  className="w-full rounded-lg border border-slate-300 bg-slate-50 px-3 py-2 text-base dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100"
                />
              </div>

              {/* ACTIONS */}
              <div className="flex items-center justify-between pt-4">
                <p className="text-sm text-slate-500 dark:text-slate-400">
                  Required fields are marked with *
                </p>

                <div className="flex items-center gap-3">
                  <button
                    type="button"
                    onClick={() => setCreateOpen(false)}
                    className="rounded-full border border-slate-300 bg-white px-5 py-2 text-sm font-medium hover:bg-slate-100 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200"
                  >
                    Cancel
                  </button>

                  <button
                    type="submit"
                    disabled={createLoading}
                    className="rounded-full bg-slate-900 px-5 py-2 text-sm font-semibold text-white hover:bg-slate-800 disabled:opacity-60 dark:bg-slate-100 dark:text-slate-900"
                  >
                    {createLoading ? (
                      <Loader2 className="animate-spin" size={16} />
                    ) : (
                      "Create Lead"
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

export default LeadsPage;
