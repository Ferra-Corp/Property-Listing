import type { QueryResult } from "pg";
import type { Database } from "../../../../Configurations/Database.js";
import { RepositoryError } from "../../../Utilities/Http.js";
import type {
  createNotificationLogDTO,
  NotificationLog,
  NotificationRepository,
  UpdateNotificationLogDTO,
} from "./notification.types.js";

export class NotificationRepo implements NotificationRepository {
  constructor(private db: Database) {}

  async createNotification(
    details: createNotificationLogDTO,
  ): Promise<NotificationLog> {
    try {
      const sqlString: string =
          "INSERT INTO notification_logs(channel,template,recipient,related_type,related_id) VALUES($1,$2,$3,$4,$5) RETURNING *",
        sqlQuery = await this.db.query(sqlString, [
          details.channel,
          details.template,
          details.recipient,
          details.related_type ?? null,
          details.related_id ?? null,
        ]),
        notificationQuery = sqlQuery as QueryResult<NotificationLog>;

      return notificationQuery.rows[0]!;
    } catch (error) {
      throw new RepositoryError((error as Error).message, error);
    }
  }

  async updateNotification(
    id: number,
    details: UpdateNotificationLogDTO,
  ): Promise<NotificationLog> {
    try {
      let keys: string[] = [],
        values: any[] = [],
        paramIndex: number = 2;

      for (let [key, value] of Object.entries(details)) {
        keys.push(`${key}=$${paramIndex++}`);
        values.push(value);
      }

      const sqlString: string = `UPDATE notification_logs SET ${keys.join(",")} WHERE id=$1 RETURNING *`,
        sqlQuery = await this.db.query(sqlString, [id, ...values]),
        notificationQuery = sqlQuery as QueryResult<NotificationLog>;

      return notificationQuery.rows[0]!;
    } catch (error) {
      throw new RepositoryError((error as Error).message, error);
    }
  }

  async getNotifications(): Promise<NotificationLog[]> {
    try {
      const sqlString: string = "SELECT * FROM notification_logs",
        sqlQuery = await this.db.query(sqlString),
        notificationsQuery = sqlQuery as QueryResult<NotificationLog>;

      return notificationsQuery.rows;
    } catch (error) {
      throw new RepositoryError((error as Error).message, error);
    }
  }
}
