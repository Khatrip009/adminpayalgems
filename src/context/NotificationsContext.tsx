// src/context/NotificationsContext.tsx
// Production-grade Notifications Context with correct SSE integration

import React, {
  createContext,
  useContext,
  useEffect,
  useRef,
  useState,
  useCallback,
} from "react";

import type { NotificationListItem } from "../types/notification";
import {
  fetchLatestNotifications,
  fetchNotificationsPage,
  fetchUnreadNotifications,
  markNotificationRead,
  markAllAsRead,
} from "../api/core/notifications.api";

import {
  connectEventsSse,
  registerSseHandlers,
  closeEventsSse,
} from "@/api/events.api";

import toast from "react-hot-toast";

/* =========================================================
   TYPES
========================================================= */

interface NotificationsContextValue {
  unreadCount: number;
  latest: NotificationListItem[];
  fetchPage: (
    page: number,
    limit?: number
  ) => Promise<{
    items: NotificationListItem[];
    total: number;
    page: number;
    pages: number;
  }>;
  markRead: (id: string) => Promise<void>;
  markAllRead: () => Promise<void>;
  subscribeReady: boolean;
}

const NotificationsContext =
  createContext<NotificationsContextValue | undefined>(undefined);

/* =========================================================
   PROVIDER
========================================================= */

export const NotificationsProvider: React.FC<{
  children: React.ReactNode;
}> = ({ children }) => {
  const [latest, setLatest] = useState<NotificationListItem[]>([]);
  const [unreadCount, setUnreadCount] = useState<number>(0);

  const sseRef = useRef<EventSource | null>(null);
  const backoffRef = useRef<number>(1000);
  const subscribeReadyRef = useRef<boolean>(false);

  // Deduplication set
  const seenIdsRef = useRef<Set<string>>(new Set());

  // Notification sound
  const audioRef = useRef<HTMLAudioElement | null>(null);

  /* =====================================================
     AUDIO INIT
  ===================================================== */
  useEffect(() => {
    try {
      const sound =
        (import.meta.env.VITE_NOTIFY_SOUND as string) ||
        "/sounds/notify.mp3";
      audioRef.current = new Audio(sound);
      audioRef.current.load();
    } catch {
      audioRef.current = null;
    }
  }, []);

  /* =====================================================
     INITIAL LOAD (LATEST + UNREAD)
  ===================================================== */
  useEffect(() => {
    let mounted = true;

    (async () => {
      try {
        const items = await fetchLatestNotifications(8);
        if (!mounted) return;

        setLatest(items || []);
        items?.forEach((n) => {
          if (n?.id) seenIdsRef.current.add(String(n.id));
        });
      } catch {
        if (mounted) setLatest([]);
      }

      try {
        const unread = await fetchUnreadNotifications();
        if (!mounted) return;

        setUnreadCount(Array.isArray(unread) ? unread.length : 0);
        unread?.forEach((n) => {
          if (n?.id) seenIdsRef.current.add(String(n.id));
        });
      } catch {
        if (mounted) setUnreadCount(0);
      }
    })();

    return () => {
      mounted = false;
    };
  }, []);

  /* =====================================================
     SSE SUBSCRIPTION (FIXED)
  ===================================================== */
  useEffect(() => {
    let closed = false;

    const connect = () => {
      if (closed) return;

      const es = connectEventsSse({
        topics: ["notifications"],
        onEvent: () => {},
        onError: () => {
          closeEventsSse(es);
          backoffRef.current = Math.min(
            Math.floor(backoffRef.current * 1.8),
            60000
          );
          setTimeout(connect, backoffRef.current);
        },
      });

      sseRef.current = es;

      registerSseHandlers(es, {
        connected: () => {
          backoffRef.current = 1000;
          subscribeReadyRef.current = true;
        },

        notification: (notif: NotificationListItem) => {
          if (!notif?.id) return;

          const idStr = String(notif.id);
          if (seenIdsRef.current.has(idStr)) return;

          seenIdsRef.current.add(idStr);

          setLatest((prev) => {
            const next = [notif, ...(prev || [])];
            if (next.length > 12) next.length = 12;
            return next;
          });

          setUnreadCount((c) => c + 1);

          try {
            audioRef.current?.play().catch(() => {});
          } catch {}

          toast.custom(
            <div className="rounded-md bg-white p-3 shadow-md border">
              <div className="font-semibold text-sm">
                {notif.title || "Notification"}
              </div>
              {notif.body && (
                <div className="text-xs text-slate-600 mt-1 line-clamp-2">
                  {notif.body}
                </div>
              )}
              <div className="text-[11px] text-slate-400 mt-1">
                {new Date(
                  notif.created_at || Date.now()
                ).toLocaleString()}
              </div>
            </div>,
            { duration: 6500 }
          );
        },
      });
    };

    connect();

    return () => {
      closed = true;
      subscribeReadyRef.current = false;
      closeEventsSse(sseRef.current);
    };
  }, []);

  /* =====================================================
     API HELPERS
  ===================================================== */
  const fetchPage = useCallback(
    async (page: number, limit = 20) => {
      return fetchNotificationsPage(page, limit);
    },
    []
  );

  const markRead = useCallback(async (id: string) => {
    if (!id) return;
    try {
      await markNotificationRead(id);
      setUnreadCount((c) => Math.max(0, c - 1));
      seenIdsRef.current.add(String(id));
    } catch {
      /* best-effort */
    }
  }, []);

  const markAllRead = useCallback(async () => {
    try {
      await markAllAsRead();
      setUnreadCount(0);
    } catch {
      setUnreadCount(0);
    }
  }, []);

  /* =====================================================
     CONTEXT VALUE
  ===================================================== */
  const value: NotificationsContextValue = {
    unreadCount,
    latest,
    fetchPage,
    markRead,
    markAllRead,
    subscribeReady: subscribeReadyRef.current,
  };

  return (
    <NotificationsContext.Provider value={value}>
      {children}
    </NotificationsContext.Provider>
  );
};

/* =========================================================
   HOOK
========================================================= */

export function useNotifications() {
  const ctx = useContext(NotificationsContext);
  if (!ctx) {
    throw new Error(
      "useNotifications must be used inside <NotificationsProvider>"
    );
  }
  return ctx;
}
