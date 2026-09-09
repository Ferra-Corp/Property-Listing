import type { QueryResult } from "pg";
import type { Database } from "../../../../../Configurations/Database.js";
import { RepositoryError } from "../../../../Utilities/Http.js";
import type {
  createLeadDTO,
  Lead,
  LeadRepository,
  UpdateLeadDTO,
} from "./lead.types.js";

export class LeadRepo implements LeadRepository {
  constructor(private db: Database) {}

  async createLead(details: createLeadDTO): Promise<Lead> {
    try {
      const fields: Record<string, any> = {
          full_name: details.full_name,
          email: details.email ?? null,
          phone: details.phone,
          whatsapp_number: details.whatsapp_number ?? null,
          country_code: details.country_code ?? null,
          state_region: details.state_region ?? null,
          city: details.city ?? null,
          intent: details.intent ?? "general",
          property_type: details.property_type ?? null,
          property_subtype: details.property_subtype ?? null,
          preferred_location: details.preferred_location ?? null,
          budget_min: details.budget_min ?? null,
          budget_max: details.budget_max ?? null,
          currency_code: details.currency_code ?? "KES",
          requirements: details.requirements ?? null,
          listing_id: details.listing_id ?? null,
          user_id: details.user_id ?? null,
          source: details.source ?? "contact_form",
          source_page: details.source_page ?? null,
          referrer: details.referrer ?? null,
          utm_source: details.utm_source ?? null,
          utm_medium: details.utm_medium ?? null,
          utm_campaign: details.utm_campaign ?? null,
          utm_term: details.utm_term ?? null,
          utm_content: details.utm_content ?? null,
          assigned_agent_id: details.assigned_agent_id ?? null,
          first_contacted_at: details.first_contacted_at ?? null,
          ip_address: details.ip_address ?? null,
          user_agent: details.user_agent ?? null,
          consent_marketing: details.consent_marketing ?? false,
        },
        columns = Object.keys(fields),
        values = Object.values(fields),
        placeholders = columns.map((_, index) => `$${index + 1}`);

      const sqlString: string = `INSERT INTO leads(${columns.join(",")}) VALUES(${placeholders.join(",")}) RETURNING *`,
        sqlQuery = await this.db.query(sqlString, values),
        leadQuery = sqlQuery as QueryResult<Lead>;

      return leadQuery.rows[0]!;
    } catch (error) {
      throw new RepositoryError((error as Error).message, error);
    }
  }

  async editLead(id: string, details: UpdateLeadDTO): Promise<Lead> {
    try {
      let keys: string[] = [],
        values: any[] = [],
        paramIndex: number = 2;

      for (let [key, value] of Object.entries(details)) {
        keys.push(`${key}=$${paramIndex++}`);
        values.push(value);
      }

      keys.push("updated_at=now()");

      const sqlString: string = `UPDATE leads SET ${keys.join(",")} WHERE id=$1 AND deleted_at IS NULL RETURNING *`,
        sqlQuery = await this.db.query(sqlString, [id, ...values]),
        leadQuery = sqlQuery as QueryResult<Lead>;

      return leadQuery.rows[0]!;
    } catch (error) {
      throw new RepositoryError((error as Error).message, error);
    }
  }

  async getLead(id: string): Promise<Lead | null> {
    try {
      const sqlString: string =
          "SELECT * FROM leads WHERE id=$1 AND deleted_at IS NULL",
        sqlQuery = await this.db.query(sqlString, [id]),
        leadQuery = sqlQuery as QueryResult<Lead>;

      return leadQuery.rows[0] ?? null;
    } catch (error) {
      throw new RepositoryError((error as Error).message, error);
    }
  }

  async findLeadByPhone(phone: string): Promise<Lead | null> {
    try {
      const sqlString: string =
          "SELECT * FROM leads WHERE phone=$1 AND deleted_at IS NULL ORDER BY created_at DESC LIMIT 1",
        sqlQuery = await this.db.query(sqlString, [phone]),
        leadQuery = sqlQuery as QueryResult<Lead>;

      return leadQuery.rows[0] ?? null;
    } catch (error) {
      throw new RepositoryError((error as Error).message, error);
    }
  }

  async getLeads(): Promise<Lead[]> {
    try {
      const sqlString: string = "SELECT * FROM leads WHERE deleted_at IS NULL",
        sqlQuery = await this.db.query(sqlString),
        leadsQuery = sqlQuery as QueryResult<Lead>;

      return leadsQuery.rows;
    } catch (error) {
      throw new RepositoryError((error as Error).message, error);
    }
  }

  async deleteLead(id: string): Promise<void> {
    try {
      const sqlString: string =
        "UPDATE leads SET deleted_at=now() WHERE id=$1 AND deleted_at IS NULL";

      await this.db.query(sqlString, [id]);
    } catch (error) {
      throw new RepositoryError((error as Error).message, error);
    }
  }
}
