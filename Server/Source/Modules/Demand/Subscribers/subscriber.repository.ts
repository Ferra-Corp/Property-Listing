import type { QueryResult } from "pg";
import type { Database } from "../../../../Configurations/Database.js";
import { RepositoryError } from "../../../Utilities/Http.js";
import type {
  SubscribeDTO,
  Subscriber,
  SubscriberInterest,
  SubscriberRepository,
  UpdateSubscriberDTO,
} from "./subscriber.types.js";

export class SubscriberRepo implements SubscriberRepository {
  constructor(private db: Database) {}

  async upsertSubscriber(
    details: SubscribeDTO & { resend_contact_id: string | null },
  ): Promise<Subscriber> {
    try {
      const sqlString: string = `
          INSERT INTO subscribers(email, interest, resend_contact_id)
          VALUES ($1, $2, $3)
          ON CONFLICT (email) DO UPDATE SET
            interest = EXCLUDED.interest,
            resend_contact_id = COALESCE(EXCLUDED.resend_contact_id, subscribers.resend_contact_id),
            unsubscribed_at = NULL,
            updated_at = now()
          RETURNING *
        `,
        sqlQuery = await this.db.query(sqlString, [
          details.email,
          details.interest,
          details.resend_contact_id,
        ]),
        subscriberQuery = sqlQuery as QueryResult<Subscriber>;

      return subscriberQuery.rows[0]!;
    } catch (error) {
      throw new RepositoryError((error as Error).message, error);
    }
  }

  async getSubscribers(): Promise<Subscriber[]> {
    try {
      const sqlString: string =
          "SELECT * FROM subscribers ORDER BY created_at DESC",
        sqlQuery = await this.db.query(sqlString),
        subscribersQuery = sqlQuery as QueryResult<Subscriber>;

      return subscribersQuery.rows;
    } catch (error) {
      throw new RepositoryError((error as Error).message, error);
    }
  }

  async getActiveSubscribersByInterest(
    interest: SubscriberInterest,
  ): Promise<Subscriber[]> {
    try {
      const sqlString: string =
          "SELECT * FROM subscribers WHERE interest=$1 AND unsubscribed_at IS NULL",
        sqlQuery = await this.db.query(sqlString, [interest]),
        subscribersQuery = sqlQuery as QueryResult<Subscriber>;

      return subscribersQuery.rows;
    } catch (error) {
      throw new RepositoryError((error as Error).message, error);
    }
  }

  async editSubscriber(
    id: string,
    details: UpdateSubscriberDTO,
  ): Promise<Subscriber> {
    try {
      let keys: string[] = ["updated_at=now()"],
        values: any[] = [];

      if (details.interest != null) {
        values.push(details.interest);
        keys.push(`interest=$${values.length + 1}`);
      }

      if (details.unsubscribed != null) {
        values.push(details.unsubscribed ? new Date().toISOString() : null);
        keys.push(`unsubscribed_at=$${values.length + 1}`);
      }

      const sqlString: string = `UPDATE subscribers SET ${keys.join(",")} WHERE id=$1 RETURNING *`,
        sqlQuery = await this.db.query(sqlString, [id, ...values]),
        subscriberQuery = sqlQuery as QueryResult<Subscriber>;

      return subscriberQuery.rows[0]!;
    } catch (error) {
      throw new RepositoryError((error as Error).message, error);
    }
  }

  async unsubscribe(id: string): Promise<Subscriber | null> {
    try {
      const sqlString: string =
          "UPDATE subscribers SET unsubscribed_at=now(), updated_at=now() WHERE id=$1 AND unsubscribed_at IS NULL RETURNING *",
        sqlQuery = await this.db.query(sqlString, [id]),
        subscriberQuery = sqlQuery as QueryResult<Subscriber>;

      return subscriberQuery.rows[0] ?? null;
    } catch (error) {
      throw new RepositoryError((error as Error).message, error);
    }
  }

  async deleteSubscriber(id: string): Promise<Subscriber | null> {
    try {
      const sqlString: string =
          "DELETE FROM subscribers WHERE id=$1 RETURNING *",
        sqlQuery = await this.db.query(sqlString, [id]),
        subscriberQuery = sqlQuery as QueryResult<Subscriber>;

      return subscriberQuery.rows[0] ?? null;
    } catch (error) {
      throw new RepositoryError((error as Error).message, error);
    }
  }
}
