import type { QueryResult } from "pg";
import type { Database } from "../../../../Configurations/Database.js";
import { RepositoryError } from "../../../Utilities/Http.js";
import type {
  createViewingRequestDTO,
  UpdateViewingRequestDTO,
  ViewingRepository,
  ViewingRequest,
} from "./viewing.types.js";

export class ViewingRepo implements ViewingRepository {
  constructor(private db: Database) {}

  async createViewingRequest(
    details: createViewingRequestDTO,
  ): Promise<ViewingRequest> {
    try {
      const sqlString: string =
          "INSERT INTO viewing_requests(listing_id,lead_id,preferred_date,preferred_time_slot,alternate_date,assigned_agent_id,message) VALUES($1,$2,$3,$4,$5,$6,$7) RETURNING *",
        sqlQuery = await this.db.query(sqlString, [
          details.listing_id,
          details.lead_id,
          details.preferred_date,
          details.preferred_time_slot ?? null,
          details.alternate_date ?? null,
          details.assigned_agent_id ?? null,
          details.message ?? null,
        ]),
        viewingQuery = sqlQuery as QueryResult<ViewingRequest>;

      return viewingQuery.rows[0]!;
    } catch (error) {
      throw new RepositoryError((error as Error).message, error);
    }
  }

  async editViewingRequest(
    id: string,
    details: UpdateViewingRequestDTO,
  ): Promise<ViewingRequest> {
    try {
      let keys: string[] = [],
        values: any[] = [],
        paramIndex: number = 2;

      for (let [key, value] of Object.entries(details)) {
        keys.push(`${key}=$${paramIndex++}`);
        values.push(value);
      }

      keys.push("updated_at=now()");

      const sqlString: string = `UPDATE viewing_requests SET ${keys.join(",")} WHERE id=$1 AND deleted_at IS NULL RETURNING *`,
        sqlQuery = await this.db.query(sqlString, [id, ...values]),
        viewingQuery = sqlQuery as QueryResult<ViewingRequest>;

      return viewingQuery.rows[0]!;
    } catch (error) {
      throw new RepositoryError((error as Error).message, error);
    }
  }

  async getViewingRequest(id: string): Promise<ViewingRequest | null> {
    try {
      const sqlString: string =
          "SELECT * FROM viewing_requests WHERE id=$1 AND deleted_at IS NULL",
        sqlQuery = await this.db.query(sqlString, [id]),
        viewingQuery = sqlQuery as QueryResult<ViewingRequest>;

      return viewingQuery.rows[0] ?? null;
    } catch (error) {
      throw new RepositoryError((error as Error).message, error);
    }
  }

  async getViewingRequests(): Promise<ViewingRequest[]> {
    try {
      const sqlString: string =
          "SELECT * FROM viewing_requests WHERE deleted_at IS NULL",
        sqlQuery = await this.db.query(sqlString),
        viewingsQuery = sqlQuery as QueryResult<ViewingRequest>;

      return viewingsQuery.rows;
    } catch (error) {
      throw new RepositoryError((error as Error).message, error);
    }
  }

  async deleteViewingRequest(id: string): Promise<void> {
    try {
      const sqlString: string =
        "UPDATE viewing_requests SET deleted_at=now() WHERE id=$1 AND deleted_at IS NULL";

      await this.db.query(sqlString, [id]);
    } catch (error) {
      throw new RepositoryError((error as Error).message, error);
    }
  }
}
