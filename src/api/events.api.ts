import { API_ROUTES, API_BASE_URL } from "@/lib/apiClient";


/* =========================================================
   BASE
========================================================= */

const BASE = `${API_BASE_URL}${API_ROUTES.events}`;
/* =========================================================
   TYPES
========================================================= */

export type SseConnectedEvent = {
  clientId: string;
  ts: string;
  userId: string | null;
  topics: string[];
  isAdmin: boolean;
};

export type SseEventPayload<T = any> = {
  event: string;
  data: T;
};

/* =========================================================
   SSE CONNECTION
========================================================= */

/**
 * Open an SSE connection.
 *
 * @param options
 *   topics?: string[]     -> subscribe to topics
 *   userId?: string       -> testing without auth
 *   isAdmin?: boolean     -> testing admin
 *   onEvent               -> callback for events
 *   onError               -> callback for errors
 *
 * @returns EventSource instance (caller must close)
 */
export function connectEventsSse(options: {
  topics?: string[];
  userId?: string;
  isAdmin?: boolean;
  onEvent: (event: MessageEvent) => void;
  onError?: (err: Event) => void;
}): EventSource {
  const { topics, userId, isAdmin, onEvent, onError } = options;

  const params = new URLSearchParams();

  if (topics && topics.length) {
    params.set("topics", topics.join(","));
  }

  if (userId) {
    params.set("user_id", userId);
  }

  if (isAdmin) {
    params.set("admin", "true");
  }

  const url = `${BASE}/sse${params.toString() ? `?${params.toString()}` : ""}`;

  const es = new EventSource(url, {
    withCredentials: true,
  });

  es.onmessage = onEvent;

  es.onerror = err => {
    console.error("[SSE] connection error", err);
    if (onError) onError(err);
  };

  return es;
}

/* =========================================================
   SSE EVENT HELPERS
========================================================= */

/**
 * Attach typed event listeners to an EventSource.
 */
export function registerSseHandlers(
  es: EventSource,
  handlers: {
    connected?: (payload: SseConnectedEvent) => void;
    ping?: (payload: { ts: string }) => void;
    notification?: (payload: any) => void;
    packet?: (payload: any) => void;
    inventory?: (payload: any) => void;
    order?: (payload: any) => void;
    generic?: (event: string, payload: any) => void;
  }
) {
  function listen<T>(event: string, cb?: (p: T) => void) {
    if (!cb) return;
    es.addEventListener(event, ev => {
      try {
        cb(JSON.parse(ev.data));
      } catch {
        // ignore malformed payloads
      }
    });
  }

  listen("connected", handlers.connected);
  listen("ping", handlers.ping);
  listen("notification", handlers.notification);
  listen("packet", handlers.packet);
  listen("inventory", handlers.inventory);
  listen("order", handlers.order);

  if (handlers.generic) {
    es.onmessage = ev => {
      try {
        handlers.generic(ev.type, JSON.parse(ev.data));
      } catch {
        handlers.generic(ev.type, ev.data);
      }
    };
  }
}

/* =========================================================
   CLEANUP
========================================================= */

/**
 * Safely close an SSE connection.
 */
export function closeEventsSse(es?: EventSource | null) {
  try {
    es?.close();
  } catch {
    // ignore
  }
}
