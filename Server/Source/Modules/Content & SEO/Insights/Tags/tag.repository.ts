import type { QueryResult } from "pg";
import type { Database } from "../../../../../Configurations/Database.js";
import { RepositoryError } from "../../../../Utilities/Http.js";
import type {
  attachTagDTO,
  InsightTag,
  InsightTagRepository,
} from "./tag.types.js";

export class InsightTagRepo implements InsightTagRepository {
  constructor(private db: Database) {}

  /** Idempotent attach — already-linked tags are left as-is. */
  async attachTag(details: attachTagDTO): Promise<InsightTag> {
    try {
      const sqlString: string =
        "INSERT INTO insight_tags(insight_id,tag_id) VALUES($1,$2) ON CONFLICT (insight_id,tag_id) DO NOTHING";

      await this.db.query(sqlString, [details.insight_id, details.tag_id]);

      return { insight_id: details.insight_id, tag_id: details.tag_id };
    } catch (error) {
      throw new RepositoryError((error as Error).message, error);
    }
  }

  async detachTag(insightId: string, tagId: string): Promise<void> {
    try {
      const sqlString: string =
        "DELETE FROM insight_tags WHERE insight_id=$1 AND tag_id=$2";

      await this.db.query(sqlString, [insightId, tagId]);
    } catch (error) {
      throw new RepositoryError((error as Error).message, error);
    }
  }

  async getTagsForInsight(insightId: string): Promise<InsightTag[]> {
    try {
      const sqlString: string =
          "SELECT * FROM insight_tags WHERE insight_id=$1",
        sqlQuery = await this.db.query(sqlString, [insightId]),
        insightTagsQuery = sqlQuery as QueryResult<InsightTag>;

      return insightTagsQuery.rows;
    } catch (error) {
      throw new RepositoryError((error as Error).message, error);
    }
  }
}
