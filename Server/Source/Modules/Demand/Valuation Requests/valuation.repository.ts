import type { QueryResult } from "pg";
import type { Database } from "../../../../Configurations/Database.js";
import { RepositoryError } from "../../../Utilities/Http.js";
import type {
  createValuationRequestDTO,
  UpdateValuationRequestDTO,
  ValuationRepository,
  ValuationRequest,
} from "./valuation.types.js";

export class ValuationRepo implements ValuationRepository {
  constructor(private db: Database) {}

  async createValuationRequest(
    details: createValuationRequestDTO,
  ): Promise<ValuationRequest> {
    try {
      const fields: Record<string, any> = {
          lead_id: details.lead_id,
          property_type: details.property_type,
          property_subtype: details.property_subtype ?? null,
          location_label: details.location_label,
          country_code: details.country_code ?? "KE",
          state_region: details.state_region ?? null,
          city: details.city ?? null,
          neighbourhood: details.neighbourhood ?? null,
          bedrooms: details.bedrooms ?? null,
          bathrooms: details.bathrooms ?? null,
          floor_area: details.floor_area ?? null,
          floor_area_unit: details.floor_area_unit ?? null,
          land_area: details.land_area ?? null,
          land_area_unit: details.land_area_unit ?? null,
          owner_expectation: details.owner_expectation ?? null,
          message: details.message ?? null,
        },
        columns = Object.keys(fields),
        values = Object.values(fields),
        placeholders = columns.map((_, index) => `$${index + 1}`);

      const sqlString: string = `INSERT INTO valuation_requests(${columns.join(",")}) VALUES(${placeholders.join(",")}) RETURNING *`,
        sqlQuery = await this.db.query(sqlString, values),
        valuationQuery = sqlQuery as QueryResult<ValuationRequest>;

      return valuationQuery.rows[0]!;
    } catch (error) {
      throw new RepositoryError((error as Error).message, error);
    }
  }

  async editValuationRequest(
    id: string,
    details: UpdateValuationRequestDTO,
  ): Promise<ValuationRequest> {
    try {
      let keys: string[] = [],
        values: any[] = [],
        paramIndex: number = 2;

      for (let [key, value] of Object.entries(details)) {
        keys.push(`${key}=$${paramIndex++}`);
        values.push(value);
      }

      keys.push("updated_at=now()");

      const sqlString: string = `UPDATE valuation_requests SET ${keys.join(",")} WHERE id=$1 AND deleted_at IS NULL RETURNING *`,
        sqlQuery = await this.db.query(sqlString, [id, ...values]),
        valuationQuery = sqlQuery as QueryResult<ValuationRequest>;

      return valuationQuery.rows[0]!;
    } catch (error) {
      throw new RepositoryError((error as Error).message, error);
    }
  }

  async getValuationRequest(id: string): Promise<ValuationRequest | null> {
    try {
      const sqlString: string =
          "SELECT * FROM valuation_requests WHERE id=$1 AND deleted_at IS NULL",
        sqlQuery = await this.db.query(sqlString, [id]),
        valuationQuery = sqlQuery as QueryResult<ValuationRequest>;

      return valuationQuery.rows[0] ?? null;
    } catch (error) {
      throw new RepositoryError((error as Error).message, error);
    }
  }

  async getValuationRequests(): Promise<ValuationRequest[]> {
    try {
      const sqlString: string =
          "SELECT * FROM valuation_requests WHERE deleted_at IS NULL",
        sqlQuery = await this.db.query(sqlString),
        valuationsQuery = sqlQuery as QueryResult<ValuationRequest>;

      return valuationsQuery.rows;
    } catch (error) {
      throw new RepositoryError((error as Error).message, error);
    }
  }

  async deleteValuationRequest(id: string): Promise<void> {
    try {
      const sqlString: string =
        "UPDATE valuation_requests SET deleted_at=now() WHERE id=$1 AND deleted_at IS NULL";

      await this.db.query(sqlString, [id]);
    } catch (error) {
      throw new RepositoryError((error as Error).message, error);
    }
  }
}
