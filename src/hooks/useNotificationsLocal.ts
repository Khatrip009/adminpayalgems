// src/hooks/useNotificationsLocal.ts
import { useNotifications } from "../context/NotificationsContext";

export function useUnreadCount() {
  const { unreadCount, unreadItems, connected } = useNotifications();
  return { unreadCount, unreadItems, connected };
}
