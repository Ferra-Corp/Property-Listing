import type { QueryResult } from "pg";
import type { Database } from "../../../../Configurations/Database.js";
import { RepositoryError } from "../../../Utilities/Http.js";
import type {
  createTagDTO,
  Tag,
  TagRepository,
  UpdateTagDTO,
} from "./tag.types.js";

export class TagRepo implements TagRepository {
  constructor(private db: Database) {}

  async createTag(details: createTagDTO): Promise<Tag> {
    try {
      const sqlString: string =
          "INSERT INTO tags(name,slug) VALUES($1,$2) RETURNING *",
        sqlQuery = await this.db.query(sqlString, [details.name, details.slug]),
        tagQuery = sqlQuery as QueryResult<Tag>;

      return tagQuery.rows[0]!;
    } catch (error) {
      throw new RepositoryError((error as Error).message, error);
    }
  }

  async editTag(id: string, details: UpdateTagDTO): Promise<Tag> {
    try {
      let keys: string[] = [],
        values: any[] = [],
        paramIndex: number = 2;

      for (let [key, value] of Object.entries(details)) {
        keys.push(`${key}=$${paramIndex++}`);
        values.push(value);
      }

      const sqlString: string = `UPDATE tags SET ${keys.join(",")} WHERE id=$1 RETURNING *`,
        sqlQuery = await this.db.query(sqlString, [id, ...values]),
        tagQuery = sqlQuery as QueryResult<Tag>;

      return tagQuery.rows[0]!;
    } catch (error) {
      throw new RepositoryError((error as Error).message, error);
    }
  }

  async getTag(id: string): Promise<Tag | null> {
    try {
      const sqlString: string = "SELECT * FROM tags WHERE id=$1",
        sqlQuery = await this.db.query(sqlString, [id]),
        tagQuery = sqlQuery as QueryResult<Tag>;

      return tagQuery.rows[0] ?? null;
    } catch (error) {
      throw new RepositoryError((error as Error).message, error);
    }
  }

  async getTags(): Promise<Tag[]> {
    try {
      const sqlString: string = "SELECT * FROM tags",
        sqlQuery = await this.db.query(sqlString),
        tagsQuery = sqlQuery as QueryResult<Tag>;

      return tagsQuery.rows;
    } catch (error) {
      throw new RepositoryError((error as Error).message, error);
    }
  }

  /** Genuine hard delete — `tags` has no deleted_at column, and insight_tags cascades away via FK. */
  async deleteTag(id: string): Promise<void> {
    try {
      const sqlString: string = "DELETE FROM tags WHERE id=$1";

      await this.db.query(sqlString, [id]);
    } catch (error) {
      throw new RepositoryError((error as Error).message, error);
    }
  }
}
