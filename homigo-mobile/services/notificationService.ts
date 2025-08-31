import { apiDelete, apiGet, apiPut } from "./api";

export type NotificationItem = {
  id: number;
  user_id: number;
  title: string;
  message: string;
  type: string;
  ref_table: string | null;
  ref_id: number | null;
  is_read: boolean;
  created_at: string;
};

type NotificationsResponse = {
  ok: boolean;
  notifications: NotificationItem[];
};

type UnreadCountResponse = {
  ok: boolean;
  unread_count: number;
};

type GenericResponse = {
  ok: boolean;
  message: string;
};

export async function getMyNotifications(): Promise<NotificationItem[]> {
  const res = (await apiGet("/notifications")) as NotificationsResponse;
  return res.notifications || [];
}

export async function getUnreadNotificationCount(): Promise<number> {
  const res = (await apiGet(
    "/notifications/unread-count"
  )) as UnreadCountResponse;

  return res.unread_count || 0;
}

export async function markNotificationAsRead(
  id: number
): Promise<GenericResponse> {
  return (await apiPut(`/notifications/${id}/read`)) as GenericResponse;
}

export async function markAllNotificationsAsRead(): Promise<GenericResponse> {
  return (await apiPut("/notifications/read-all")) as GenericResponse;
}

export async function deleteNotification(id: number): Promise<GenericResponse> {
  return (await apiDelete(`/notifications/${id}`)) as GenericResponse;
}