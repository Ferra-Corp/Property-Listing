export type NotificationStatus = "queued" | "sent" | "failed" | "bounced";

export type NotificationLog = {
  id: number;
  channel: string;
  template: string;
  recipient: string;
  related_type: string | null;
  related_id: string | null;
  status: NotificationStatus;
  provider_message_id: string | null;
  error_message: string | null;
  sent_at: string | null;
  created_at: string;
};

export type createNotificationLogDTO = Omit<
  NotificationLog,
  | "id"
  | "created_at"
  | "status"
  | "provider_message_id"
  | "error_message"
  | "sent_at"
>;

export type UpdateNotificationLogDTO = Partial<
  Pick<
    NotificationLog,
    "status" | "provider_message_id" | "error_message" | "sent_at"
  >
>;

export interface NotificationRepository {
  createNotification: (
    details: createNotificationLogDTO,
  ) => Promise<NotificationLog>;
  updateNotification: (
    id: number,
    details: UpdateNotificationLogDTO,
  ) => Promise<NotificationLog>;
  getNotifications: () => Promise<NotificationLog[]>;
}

export interface NotificationService {
  createNotification: (
    details: createNotificationLogDTO,
  ) => Promise<NotificationLog>;
  updateNotification: (
    id: number,
    details: UpdateNotificationLogDTO,
  ) => Promise<NotificationLog>;
  getNotifications: () => Promise<NotificationLog[]>;
}
