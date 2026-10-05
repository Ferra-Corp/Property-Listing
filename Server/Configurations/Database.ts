import pg, { Pool, type QueryResult } from "pg";
import { DATABASE_URL } from "./Env.js";

if (!DATABASE_URL || DATABASE_URL.length <= 0)
  throw new Error("Database URL must be provided first in .env");

export class Database {
  pool: Pool;

  constructor() {
    this.pool = new pg.Pool({
      connectionString: DATABASE_URL,
    });
  }

  async query(query: string, values?: any[]): Promise<QueryResult<any>> {
    const client = await this.pool.connect();

    try {
      await client.query("BEGIN");
      const sqlQuery = await client.query(query, values);
      await client.query("COMMIT");

      return sqlQuery;
    } catch (error) {
      await client.query("ROLLBACK");
      throw error;
    } finally {
      client.release();
    }
  }

  async close(): Promise<void> {
    await this.pool.end();
  }
}
