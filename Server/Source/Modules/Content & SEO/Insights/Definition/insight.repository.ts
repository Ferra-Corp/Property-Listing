import type { QueryResult } from "pg";
import type { Database } from "../../../../../Configurations/Database.js";
import { RepositoryError } from "../../../../Utilities/Http.js";
import type {
  createInsightDTO,
  Insight,
  InsightRepository,
  InsightWithTags,
  UpdateInsightDTO,
} from "./insight.types.js";

export class InsightRepo implements InsightRepository {
  constructor(private db: Database) {}

  async createInsight(details: createInsightDTO): Promise<Insight> {
    try {
      const fields: Record<string, any> = {
          slug: details.slug,
          title: details.title,
          summary: details.summary ?? null,
          content: details.content,
          cover_image_url: details.cover_image_url ?? null,
          cover_image_alt: details.cover_image_alt ?? null,
          author_id: details.author_id ?? null,
          status: details.status ?? "draft",
          target_country_code: details.target_country_code ?? null,
          target_state_region: details.target_state_region ?? null,
          target_city: details.target_city ?? null,
          meta_title: details.meta_title ?? null,
          meta_description: details.meta_description ?? null,
          canonical_url: details.canonical_url ?? null,
          og_image_url: details.og_image_url ?? null,
          noindex: details.noindex ?? false,
          word_count: details.word_count ?? 0,
          published_at: details.published_at ?? null,
        },
        columns = Object.keys(fields),
        values = Object.values(fields),
        placeholders = columns.map((_, index) => `$${index + 1}`);

      const sqlString: string = `INSERT INTO insights(${columns.join(",")}) VALUES(${placeholders.join(",")}) RETURNING *`,
        sqlQuery = await this.db.query(sqlString, values),
        insightQuery = sqlQuery as QueryResult<Insight>;

      return insightQuery.rows[0]!;
    } catch (error) {
      throw new RepositoryError((error as Error).message, error);
    }
  }

  async editInsight(id: string, details: UpdateInsightDTO): Promise<Insight> {
    try {
      let keys: string[] = [],
        values: any[] = [],
        paramIndex: number = 2;

      for (let [key, value] of Object.entries(details)) {
        keys.push(`${key}=$${paramIndex++}`);
        values.push(value);
      }

      keys.push("updated_at=now()");

      const sqlString: string = `UPDATE insights SET ${keys.join(",")} WHERE id=$1 AND deleted_at IS NULL RETURNING *`,
        sqlQuery = await this.db.query(sqlString, [id, ...values]),
        insightQuery = sqlQuery as QueryResult<Insight>;

      return insightQuery.rows[0]!;
    } catch (error) {
      throw new RepositoryError((error as Error).message, error);
    }
  }

  async getInsight(id: string): Promise<InsightWithTags | null> {
    try {
      const sqlString: string = `
          SELECT
            i.*,
            COALESCE(
              JSON_AGG(t.*) FILTER (WHERE t.id IS NOT NULL),
              '[]'
            ) AS tags
          FROM insights i
          LEFT JOIN insight_tags it ON it.insight_id = i.id
          LEFT JOIN tags t ON t.id = it.tag_id
          WHERE i.id = $1 AND i.deleted_at IS NULL
          GROUP BY i.id
        `,
        sqlQuery = await this.db.query(sqlString, [id]),
        insightQuery = sqlQuery as QueryResult<InsightWithTags>;

      return insightQuery.rows[0] ?? null;
    } catch (error) {
      throw new RepositoryError((error as Error).message, error);
    }
  }

  async getInsights(): Promise<InsightWithTags[]> {
    try {
      const sqlString: string = `
          SELECT
            i.*,
            COALESCE(
              JSON_AGG(t.*) FILTER (WHERE t.id IS NOT NULL),
              '[]'
            ) AS tags
          FROM insights i
          LEFT JOIN insight_tags it ON it.insight_id = i.id
          LEFT JOIN tags t ON t.id = it.tag_id
          WHERE i.deleted_at IS NULL
          GROUP BY i.id
        `,
        sqlQuery = await this.db.query(sqlString),
        insightsQuery = sqlQuery as QueryResult<InsightWithTags>;

      return insightsQuery.rows;
    } catch (error) {
      throw new RepositoryError((error as Error).message, error);
    }
  }

  async deleteInsight(id: string): Promise<void> {
    try {
      const sqlString: string =
        "UPDATE insights SET deleted_at=now() WHERE id=$1 AND deleted_at IS NULL";

      await this.db.query(sqlString, [id]);
    } catch (error) {
      throw new RepositoryError((error as Error).message, error);
    }
  }
}
