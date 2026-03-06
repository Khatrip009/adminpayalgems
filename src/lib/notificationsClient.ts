// src/lib/notificationsClient.ts
import { apiFetch } from "../lib/apiClient";
import type { NotificationPayload } from "../types/notification";

export async function fetchUnreadNotifications(): Promise<{
  ok: boolean;
  items: NotificationPayload[];
}> {
  return apiFetch("/crm/notifications/unread");
}

export async function markNotificationRead(notificationId: string): Promise<{ ok: boolean }> {
  return apiFetch(`/crm/notifications/${notificationId}/read`, {
    method: "POST",
  });
}
