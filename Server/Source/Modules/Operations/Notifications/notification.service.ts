import { ServiceError } from "../../../Utilities/Http.js";
import { Cache, CacheKeys, Resource } from "../../../../Configurations/Cache.js";
import type {
  createNotificationLogDTO,
  NotificationLog,
  NotificationRepository,
  NotificationService,
  UpdateNotificationLogDTO,
} from "./notification.types.js";

export class NotificationServ implements NotificationService {
  constructor(
    private repo: NotificationRepository,
    private cache: Cache,
  ) {}

  async createNotification(
    details: createNotificationLogDTO,
  ): Promise<NotificationLog> {
    if (!details)
      throw new ServiceError("Notification details must be provided", 400);

    const allowedFields: (keyof createNotificationLogDTO)[] = [
      "channel",
      "template",
      "recipient",
    ];

    for (let key of allowedFields) {
      const value = details[key];

      if (value == undefined || value == null)
        throw new ServiceError(`${key} has an invalid value`, 400);
    }

    const newNotification = await this.repo.createNotification(details);

    await this.cache.invalidate(CacheKeys.all(Resource.Notification));

    return newNotification;
  }

  async updateNotification(
    id: number,
    details: UpdateNotificationLogDTO,
  ): Promise<NotificationLog> {
    if (!id || !details)
      throw new ServiceError(
        "Notification id and details must be provided",
        400,
      );

    const allowedFields: (keyof UpdateNotificationLogDTO)[] = [
      "status",
      "provider_message_id",
      "error_message",
      "sent_at",
    ];

    let filteredDetails: UpdateNotificationLogDTO = {};

    for (let key of allowedFields) {
      const value = details[key];

      if (value == undefined || value == null) continue;

      filteredDetails[key] = value as never;
    }

    if (Object.keys(filteredDetails).length == 0)
      throw new ServiceError("Nothing to update", 400);

    const patchedNotification = await this.repo.updateNotification(
      id,
      filteredDetails,
    );

    await this.cache.invalidate(CacheKeys.all(Resource.Notification));

    return patchedNotification;
  }

  async getNotifications(): Promise<NotificationLog[]> {
    return this.cache.remember(CacheKeys.all(Resource.Notification), () =>
      this.repo.getNotifications(),
    );
  }
}
