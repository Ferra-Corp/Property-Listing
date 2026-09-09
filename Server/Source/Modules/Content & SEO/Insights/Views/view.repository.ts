import type { QueryResult } from "pg";
import type { Database } from "../../../../../Configurations/Database.js";
import { RepositoryError } from "../../../../Utilities/Http.js";
import type {
  createInsightViewDTO,
  InsightView,
  InsightViewRepository,
} from "./view.types.js";

export class InsightViewRepo implements InsightViewRepository {
  constructor(private db: Database) {}

  async createView(details: createInsightViewDTO): Promise<InsightView> {
    try {
      const sqlString: string =
          "INSERT INTO insight_views(insight_id,session_hash,country_code,referrer,utm_source,device) VALUES($1,$2,$3,$4,$5,$6) RETURNING *",
        sqlQuery = await this.db.query(sqlString, [
          details.insight_id,
          details.session_hash ?? null,
          details.country_code ?? null,
          details.referrer ?? null,
          details.utm_source ?? null,
          details.device ?? null,
        ]),
        viewQuery = sqlQuery as QueryResult<InsightView>;

      // The insight_views row is the durable analytics record; this is just the
      // fast-path denormalized counter on insights.view_count kept in step with it.
      await this.db.query(
        "UPDATE insights SET view_count = view_count + 1 WHERE id=$1",
        [details.insight_id],
      );

      return viewQuery.rows[0]!;
    } catch (error) {
      throw new RepositoryError((error as Error).message, error);
    }
  }

  async getViews(): Promise<InsightView[]> {
    try {
      const sqlString: string =
          "SELECT * FROM insight_views ORDER BY created_at DESC",
        sqlQuery = await this.db.query(sqlString),
        viewsQuery = sqlQuery as QueryResult<InsightView>;

      return viewsQuery.rows;
    } catch (error) {
      throw new RepositoryError((error as Error).message, error);
    }
  }
}
