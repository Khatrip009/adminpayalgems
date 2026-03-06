// src/components/admin/CreateNotificationModal.tsx
import React, { useEffect, useRef, useState } from "react";
import { X, Loader2 } from "lucide-react";

export interface CreateNotificationPayload {
  title: string;
  body?: string | null;
  target_query?: any;
  scheduled_at?: string | null;
}

interface CreateNotificationModalProps {
  open: boolean;
  creating?: boolean;
  initial?: Partial<CreateNotificationPayload>;
  onClose: () => void;
  onCreate: (payload: CreateNotificationPayload) => Promise<void> | void;
}

/**
 * CreateNotificationModal
 * - uses logo at public/logo_minalgems.png -> accessible at "/logo_minalgems.png"
 * - sticky header with logo
 * - scrolling body (max height limited to viewport)
 * - high z-index and fixed positioning so it sits on top of everything
 */
const CreateNotificationModal: React.FC<CreateNotificationModalProps> = ({
  open,
  creating = false,
  initial = {},
  onClose,
  onCreate,
}) => {
  const [title, setTitle] = useState(initial.title || "");
  const [body, setBody] = useState(initial.body || "");
  const [audience, setAudience] = useState<"all" | "user">("all");
  const [userIdOrEmail, setUserIdOrEmail] = useState("");
  const [sendMode, setSendMode] = useState<"now" | "schedule">("now");
  const [scheduledAt, setScheduledAt] = useState<string>("");

  const modalRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (open) {
      // reset form on open (optional)
      setTitle(initial.title || "");
      setBody(initial.body || "");
      setAudience(initial.target_query?.type === "user" ? "user" : "all");
      setUserIdOrEmail(initial.target_query?.user_id || "");
      setSendMode(initial.scheduled_at ? "schedule" : "now");
      setScheduledAt(initial.scheduled_at ? new Date(initial.scheduled_at).toISOString().slice(0, 16) : "");
      // trap scroll behind modal
      document.body.style.overflow = "hidden";
      // focus first input
      setTimeout(() => modalRef.current?.querySelector<HTMLInputElement>("input[name='title']")?.focus(), 50);
    } else {
      document.body.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = "";
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  if (!open) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;

    const payload: CreateNotificationPayload = {
      title: title.trim(),
      body: body.trim() || null,
      target_query:
        audience === "all"
          ? { type: "all" }
          : { type: "user", user_id: userIdOrEmail.trim() },
      scheduled_at: sendMode === "schedule" && scheduledAt ? new Date(scheduledAt).toISOString() : null,
    };

    try {
      await onCreate(payload);
    } catch (err) {
      // Let parent handle errors; swallow here so modal doesn't auto-close on error
      // optionally you can display local error state here
      console.error("create notification failed", err);
    }
  };

  return (
    <div
      className="fixed inset-0 z-[2000] flex items-start justify-end"
      aria-modal="true"
      role="dialog"
    >
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/30 backdrop-blur-sm"
        onClick={() => onClose()}
      />

      {/* Modal panel */}
      <div
        ref={modalRef}
        className="relative z-[2010] h-full w-full max-w-md bg-white dark:bg-slate-900 shadow-xl overflow-hidden"
        role="document"
      >
        {/* Header (sticky) */}
        <div className="sticky top-0 z-20 flex items-center justify-between gap-3 border-b border-slate-100 dark:border-slate-700 bg-white/95 dark:bg-slate-900/95 px-4 py-3">
          <div className="flex items-center gap-3">
            <img
              src="/logo_minalgems.png"
              alt="Minal Gems"
              className="h-10 w-auto rounded-md object-contain"
              onError={(e) => {
                // if image missing, hide without breaking layout
                (e.target as HTMLImageElement).style.display = "none";
              }}
            />
            <div className="flex flex-col">
              <div className="text-sm font-semibold text-slate-900 dark:text-slate-50">
                New notification
              </div>
              <div className="text-[11px] text-slate-500 dark:text-slate-400">
                Send a broadcast or targeted message
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => {
                // close without submitting
                onClose();
              }}
              aria-label="Close"
              className="rounded-full p-1 text-slate-600 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-800"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        </div>

        {/* Body - scrollable */}
        <form
          onSubmit={handleSubmit}
          className="overflow-y-auto px-4 py-4"
          style={{ maxHeight: "calc(100vh - 64px)" }} // header height allowance
        >
          {/* Title */}
          <div className="space-y-1 mb-3">
            <label className="block text-[13px] font-medium text-slate-700 dark:text-slate-200">
              Title <span className="text-rose-500">*</span>
            </label>
            <input
              name="title"
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="E.g. Diwali offer – flat 10% off"
              className="w-full rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-800 shadow-sm outline-none focus:border-sky-400 focus:ring-2 focus:ring-sky-100 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-50"
              required
            />
          </div>

          {/* Message */}
          <div className="space-y-1 mb-3">
            <label className="block text-[13px] font-medium text-slate-700 dark:text-slate-200">
              Message
            </label>
            <textarea
              value={body}
              onChange={(e) => setBody(e.target.value)}
              rows={6}
              className="w-full resize-y rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-800 shadow-sm outline-none focus:border-sky-400 focus:ring-2 focus:ring-sky-100 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-50"
              placeholder="This will be visible in your web push / in-app messages…"
            />
          </div>

          {/* Audience */}
          <div className="space-y-1 mb-3">
            <label className="block text-[13px] font-medium text-slate-700 dark:text-slate-200">
              Audience
            </label>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => setAudience("all")}
                className={`flex-1 rounded-lg px-3 py-2 text-sm font-medium ${audience === "all" ? "bg-slate-900 text-white" : "bg-slate-100 text-slate-700 hover:bg-slate-200"}`}
              >
                All customers
              </button>
              <button
                type="button"
                onClick={() => setAudience("user")}
                className={`flex-1 rounded-lg px-3 py-2 text-sm font-medium ${audience === "user" ? "bg-slate-900 text-white" : "bg-slate-100 text-slate-700 hover:bg-slate-200"}`}
              >
                Specific user
              </button>
            </div>

            {audience === "user" && (
              <input
                type="text"
                value={userIdOrEmail}
                onChange={(e) => setUserIdOrEmail(e.target.value)}
                className="mt-2 w-full rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-800 shadow-sm outline-none focus:border-sky-400 focus:ring-2 focus:ring-sky-100 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-50"
                placeholder="User ID or email (backend expects user_id)"
              />
            )}
          </div>

          {/* Delivery */}
          <div className="space-y-1 mb-6">
            <label className="block text-[13px] font-medium text-slate-700 dark:text-slate-200">
              Delivery
            </label>

            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => setSendMode("now")}
                className={`flex-1 rounded-lg px-3 py-2 text-sm font-medium ${sendMode === "now" ? "bg-slate-900 text-white" : "bg-slate-100 text-slate-700 hover:bg-slate-200"}`}
              >
                Send now
              </button>
              <button
                type="button"
                onClick={() => setSendMode("schedule")}
                className={`flex-1 rounded-lg px-3 py-2 text-sm font-medium ${sendMode === "schedule" ? "bg-slate-900 text-white" : "bg-slate-100 text-slate-700 hover:bg-slate-200"}`}
              >
                Schedule
              </button>
            </div>

            {sendMode === "schedule" && (
              <input
                type="datetime-local"
                value={scheduledAt}
                onChange={(e) => setScheduledAt(e.target.value)}
                className="mt-2 w-full rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-800 shadow-sm outline-none focus:border-sky-400 focus:ring-2 focus:ring-sky-100 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-50"
              />
            )}
          </div>

          {/* Footer actions (sticky bottom inside scroll area not required) */}
          <div className="pt-2 pb-6">
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => onClose()}
                className="flex-1 rounded-full border border-slate-200 px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50 dark:border-slate-700 dark:text-slate-200"
              >
                Cancel
              </button>

              <button
                type="submit"
                disabled={creating || !title.trim() || (audience === "user" && !userIdOrEmail.trim())}
                className="inline-flex items-center justify-center gap-2 rounded-full bg-gradient-to-r from-pink-500 via-rose-500 to-orange-400 px-4 py-2 text-sm font-semibold text-white shadow-md disabled:opacity-60"
              >
                {creating ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Creating...
                  </>
                ) : (
                  "Create notification"
                )}
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};

export default CreateNotificationModal;
