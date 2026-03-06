// src/types/notification.ts
export interface NotificationPayload {
  id: string;
  title: string;
  body?: string;
  data?: Record<string, any>;
  created_at?: string;
  sent?: boolean;
  scheduled_at?: string | null;
}

export interface NotificationListItem extends NotificationPayload {
  // any server-side metadata (optional)
}



