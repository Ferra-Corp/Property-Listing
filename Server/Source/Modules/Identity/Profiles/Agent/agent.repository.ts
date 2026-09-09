import type { QueryResult } from "pg";
import type { Database } from "../../../../../Configurations/Database.js";
import { RepositoryError } from "../../../../Utilities/Http.js";
import { isArrayFieldOp } from "./agent.types.js";
import type {
  AgentProfile,
  AgentRepository,
  createAgentProfileDTO,
  UpdateAgentProfileDTO,
} from "./agent.types.js";

const ARRAY_FIELDS = new Set(["specializations", "languages"]);

export class AgentRepo implements AgentRepository {
  constructor(private db: Database) {}

  async createAgentProfile(
    details: createAgentProfileDTO,
  ): Promise<AgentProfile> {
    try {
      const fields: Record<string, any> = {
          user_id: details.user_id,
          slug: details.slug,
          display_name: details.display_name,
          title: details.title ?? null,
          bio: details.bio ?? null,
          photo_url: details.photo_url ?? null,
          license_number: details.license_number ?? null,
          phone: details.phone ?? null,
          whatsapp_number: details.whatsapp_number ?? null,
          email_public: details.email_public ?? null,
          specializations: details.specializations ?? [],
          languages: details.languages ?? [],
          years_experience: details.years_experience ?? null,
          linkedin_url: details.linkedin_url ?? null,
          instagram_url: details.instagram_url ?? null,
          meta_title: details.meta_title ?? null,
          meta_description: details.meta_description ?? null,
          is_active: details.is_active ?? true,
          sort_order: details.sort_order ?? 0,
        },
        columns = Object.keys(fields),
        values = Object.values(fields),
        placeholders = columns.map((_, index) => `$${index + 1}`);

      const sqlString: string = `INSERT INTO agent_profiles(${columns.join(",")}) VALUES(${placeholders.join(",")}) RETURNING *`,
        sqlQuery = await this.db.query(sqlString, values),
        agentQuery = sqlQuery as QueryResult<AgentProfile>;

      return agentQuery.rows[0]!;
    } catch (error) {
      throw new RepositoryError((error as Error).message, error);
    }
  }

  async editAgentProfile(
    id: string,
    details: UpdateAgentProfileDTO,
  ): Promise<AgentProfile> {
    try {
      let keys: string[] = [],
        values: any[] = [],
        paramIndex: number = 2;

      for (let [key, value] of Object.entries(details)) {
        if (ARRAY_FIELDS.has(key) && isArrayFieldOp(value)) {
          const expression =
            value.action === "add"
              ? `ARRAY(SELECT DISTINCT e FROM unnest(${key} || $${paramIndex}::text[]) AS e)`
              : `ARRAY(SELECT e FROM unnest(${key}) AS e WHERE e <> ALL($${paramIndex}::text[]))`;

          keys.push(`${key}=${expression}`);
          values.push(value.values);
          paramIndex++;
          continue;
        }

        keys.push(`${key}=$${paramIndex++}`);
        values.push(value);
      }

      keys.push("updated_at=now()");

      const sqlString: string = `UPDATE agent_profiles SET ${keys.join(",")} WHERE id=$1 AND deleted_at IS NULL RETURNING *`,
        sqlQuery = await this.db.query(sqlString, [id, ...values]),
        agentQuery = sqlQuery as QueryResult<AgentProfile>;

      return agentQuery.rows[0]!;
    } catch (error) {
      throw new RepositoryError((error as Error).message, error);
    }
  }

  async getAgentProfile(id: string): Promise<AgentProfile | null> {
    try {
      const sqlString: string =
          "SELECT * FROM agent_profiles WHERE id=$1 AND deleted_at IS NULL",
        sqlQuery = await this.db.query(sqlString, [id]),
        agentQuery = sqlQuery as QueryResult<AgentProfile>;

      return agentQuery.rows[0] ?? null;
    } catch (error) {
      throw new RepositoryError((error as Error).message, error);
    }
  }

  async getAgentProfiles(): Promise<AgentProfile[]> {
    try {
      const sqlString: string =
          "SELECT * FROM agent_profiles WHERE deleted_at IS NULL",
        sqlQuery = await this.db.query(sqlString),
        agentsQuery = sqlQuery as QueryResult<AgentProfile>;

      return agentsQuery.rows;
    } catch (error) {
      throw new RepositoryError((error as Error).message, error);
    }
  }

  async deleteAgentProfile(id: string): Promise<void> {
    try {
      const sqlString: string =
        "UPDATE agent_profiles SET deleted_at=now() WHERE id=$1 AND deleted_at IS NULL";

      await this.db.query(sqlString, [id]);
    } catch (error) {
      throw new RepositoryError((error as Error).message, error);
    }
  }
}
