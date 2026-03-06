import React from "react";
import type { NotificationItem } from "../../api/core/notifications.api";

interface StatusPillProps {
  notification: NotificationItem;
}

const StatusPill: React.FC<StatusPillProps> = ({ notification }) => {
  const now = Date.now();
  const scheduledAt = notification.scheduled_at
    ? new Date(notification.scheduled_at).getTime()
    : null;

  let label = "Pending";
  let base =
    "inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-[11px] font-medium";
  let cls = "";

  if (notification.sent) {
    label = "Sent";
    cls = `${base} bg-emerald-50 text-emerald-700 border border-emerald-200 dark:bg-emerald-900/40 dark:text-emerald-200 dark:border-emerald-700`;
  } else if (scheduledAt && scheduledAt > now) {
    label = "Scheduled";
    cls = `${base} bg-sky-50 text-sky-700 border border-sky-200 dark:bg-sky-900/40 dark:text-sky-200 dark:border-sky-700`;
  } else if (scheduledAt && scheduledAt <= now) {
    label = "Processing";
    cls = `${base} bg-amber-50 text-amber-700 border border-amber-200 dark:bg-amber-900/40 dark:text-amber-200 dark:border-amber-700`;
  } else {
    label = "Pending";
    cls = `${base} bg-slate-50 text-slate-700 border border-slate-200 dark:bg-slate-800 dark:text-slate-200 dark:border-slate-600`;
  }

  return (
    <span className={cls}>
      <span className="h-1.5 w-1.5 rounded-full bg-current" />
      {label}
    </span>
  );
};

export default StatusPill;
