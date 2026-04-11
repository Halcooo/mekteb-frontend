import apiClient from "./apiClient";

export type NotificationType = "COMMENT_ADDED" | "COMMENT_REPLIED";

export interface NotificationItem {
  id: number;
  recipientUserId: number;
  actorUserId: number | null;
  type: NotificationType;
  title: string;
  message: string;
  studentId: number | null;
  commentId: number | null;
  commentDate: string | null;
  isRead: number;
  readAt: string | null;
  createdAt: string;
  actorUsername?: string;
  studentName?: string;
}

interface ApiResponse<T> {
  success: boolean;
  data: T;
  message?: string;
  error?: string;
}

export const notificationsApi = {
  getAll: async (params?: {
    limit?: number;
    unreadOnly?: boolean;
  }): Promise<NotificationItem[]> => {
    const query = new URLSearchParams();
    if (params?.limit) query.set("limit", String(params.limit));
    if (params?.unreadOnly) query.set("unreadOnly", "true");

    const suffix = query.toString() ? `?${query.toString()}` : "";
    const response = await apiClient.get<ApiResponse<NotificationItem[]>>(
      `/notifications${suffix}`,
    );
    return response.data.data;
  },

  getUnreadCount: async (): Promise<number> => {
    const response = await apiClient.get<ApiResponse<{ count: number }>>(
      "/notifications/unread-count",
    );
    return response.data.data.count || 0;
  },

  markAsRead: async (id: number): Promise<void> => {
    await apiClient.patch(`/notifications/${id}/read`);
  },

  markAllAsRead: async (): Promise<number> => {
    const response = await apiClient.patch<
      ApiResponse<{ updatedCount: number }>
    >("/notifications/read-all");
    return response.data.data.updatedCount || 0;
  },
};

export default notificationsApi;
