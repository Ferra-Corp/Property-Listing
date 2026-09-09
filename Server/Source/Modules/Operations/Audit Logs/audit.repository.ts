import type { QueryResult } from "pg";
import type { Database } from "../../../../Configurations/Database.js";
import { RepositoryError } from "../../../Utilities/Http.js";
import type { createLogDTO, Log, LogRepository } from "./audit.types.js";

export class LogRepo implements LogRepository {
  constructor(private db: Database) {}

  async createLog(details: createLogDTO): Promise<Log> {
    const sqlString =
      "INSERT INTO audit_logs(user_id,entity_type,entity_id,action,changes,ip_address,user_agent) VALUES($1,$2,$3,$4,$5,$6,$7) RETURNING *";

    try {
      const sqlQuery = await this.db.query(sqlString, [
          details.user_id,
          details.entity_type,
          details.entity_id,
          details.action,
          JSON.stringify(details.changes ?? {}),
          details.ip_address ?? null,
          details.user_agent ?? null,
        ]),
        logQuery = sqlQuery as QueryResult<Log>;

      return logQuery.rows[0]!;
    } catch (error) {
      throw new RepositoryError("Failed to create audit log", error);
    }
  }

  async getLogs(): Promise<Log[]> {
    const sqlString = "SELECT * FROM audit_logs";

    try {
      const sqlQuery = await this.db.query(sqlString),
        logsQuery = sqlQuery as QueryResult<Log>;

      return logsQuery.rows;
    } catch (error) {
      throw new RepositoryError("Failed to fetch audit logs", error);
    }
  }
}
