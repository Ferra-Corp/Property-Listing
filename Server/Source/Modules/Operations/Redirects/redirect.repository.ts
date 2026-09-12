import type { QueryResult } from "pg";
import type { Database } from "../../../../Configurations/Database.js";
import { RepositoryError } from "../../../Utilities/Http.js";
import type {
  createRedirectDTO,
  Redirect,
  RedirectRepository,
  UpdateRedirectDTO,
} from "./redirect.types.js";

export class RedirectRepo implements RedirectRepository {
  constructor(private db: Database) {}

  async createRedirect(details: createRedirectDTO): Promise<Redirect> {
    try {
      const sqlString: string =
          "INSERT INTO redirects(from_path,to_path,status_code) VALUES($1,$2,$3) RETURNING *",
        sqlQuery = await this.db.query(sqlString, [
          details.from_path,
          details.to_path,
          details.status_code ?? 301,
        ]),
        redirectQuery = sqlQuery as QueryResult<Redirect>;

      return redirectQuery.rows[0]!;
    } catch (error) {
      throw new RepositoryError((error as Error).message, error);
    }
  }

  async editRedirect(
    id: string,
    details: UpdateRedirectDTO,
  ): Promise<Redirect> {
    try {
      let keys: string[] = [],
        values: any[] = [],
        paramIndex: number = 2;

      for (let [key, value] of Object.entries(details)) {
        keys.push(`${key}=$${paramIndex++}`);
        values.push(value);
      }

      const sqlString: string = `UPDATE redirects SET ${keys.join(",")} WHERE id=$1 RETURNING *`,
        sqlQuery = await this.db.query(sqlString, [id, ...values]),
        redirectQuery = sqlQuery as QueryResult<Redirect>;

      return redirectQuery.rows[0]!;
    } catch (error) {
      throw new RepositoryError((error as Error).message, error);
    }
  }

  async getRedirects(): Promise<Redirect[]> {
    try {
      const sqlString: string = "SELECT * FROM redirects",
        sqlQuery = await this.db.query(sqlString),
        redirectsQuery = sqlQuery as QueryResult<Redirect>;

      return redirectsQuery.rows;
    } catch (error) {
      throw new RepositoryError((error as Error).message, error);
    }
  }

  /** Looks up a redirect by its exact from_path and counts the hit in the
   * same statement — resolving a redirect *is* a hit, so there is no
   * separate increment step to keep in sync. Returns null when there is
   * no rule for that path (nothing to increment). */
  async resolveRedirect(fromPath: string): Promise<Redirect | null> {
    try {
      const sqlString: string =
          "UPDATE redirects SET hits = hits + 1 WHERE from_path = $1 RETURNING *",
        sqlQuery = await this.db.query(sqlString, [fromPath]),
        redirectQuery = sqlQuery as QueryResult<Redirect>;

      return redirectQuery.rows[0] ?? null;
    } catch (error) {
      throw new RepositoryError((error as Error).message, error);
    }
  }

  async deleteRedirect(id: string): Promise<void> {
    try {
      const sqlString: string = "DELETE FROM redirects WHERE id=$1";

      await this.db.query(sqlString, [id]);
    } catch (error) {
      throw new RepositoryError((error as Error).message, error);
    }
  }
}
