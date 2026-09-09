import type { QueryResult } from "pg";
import type { Database } from "../../../../Configurations/Database.js";
import { RepositoryError } from "../../../Utilities/Http.js";
import type {
  createServiceDTO,
  Service,
  ServiceRepository,
  UpdateServiceDTO,
} from "./service.types.js";

export class ServiceRepo implements ServiceRepository {
  constructor(private db: Database) {}

  async createService(details: createServiceDTO): Promise<Service> {
    try {
      const sqlString: string =
          "INSERT INTO services(slug,title,summary,description,icon,image_url,meta_title,meta_description,sort_order,is_active) VALUES($1,$2,$3,$4,$5,$6,$7,$8,$9,$10) RETURNING *",
        sqlQuery = await this.db.query(sqlString, [
          details.slug,
          details.title,
          details.summary ?? null,
          details.description ?? null,
          details.icon ?? null,
          details.image_url ?? null,
          details.meta_title ?? null,
          details.meta_description ?? null,
          details.sort_order ?? 0,
          details.is_active ?? true,
        ]),
        serviceQuery = sqlQuery as QueryResult<Service>;

      return serviceQuery.rows[0]!;
    } catch (error) {
      throw new RepositoryError((error as Error).message, error);
    }
  }

  async editService(id: string, details: UpdateServiceDTO): Promise<Service> {
    try {
      let keys: string[] = [],
        values: any[] = [],
        paramIndex: number = 2;

      for (let [key, value] of Object.entries(details)) {
        keys.push(`${key}=$${paramIndex++}`);
        values.push(value);
      }

      keys.push("updated_at=now()");

      const sqlString: string = `UPDATE services SET ${keys.join(",")} WHERE id=$1 AND deleted_at IS NULL RETURNING *`,
        sqlQuery = await this.db.query(sqlString, [id, ...values]),
        serviceQuery = sqlQuery as QueryResult<Service>;

      return serviceQuery.rows[0]!;
    } catch (error) {
      throw new RepositoryError((error as Error).message, error);
    }
  }

  async getService(id: string): Promise<Service | null> {
    try {
      const sqlString: string =
          "SELECT * FROM services WHERE id=$1 AND deleted_at IS NULL",
        sqlQuery = await this.db.query(sqlString, [id]),
        serviceQuery = sqlQuery as QueryResult<Service>;

      return serviceQuery.rows[0] ?? null;
    } catch (error) {
      throw new RepositoryError((error as Error).message, error);
    }
  }

  async getServices(): Promise<Service[]> {
    try {
      const sqlString: string =
          "SELECT * FROM services WHERE deleted_at IS NULL",
        sqlQuery = await this.db.query(sqlString),
        servicesQuery = sqlQuery as QueryResult<Service>;

      return servicesQuery.rows;
    } catch (error) {
      throw new RepositoryError((error as Error).message, error);
    }
  }

  async deleteService(id: string): Promise<void> {
    try {
      const sqlString: string =
        "UPDATE services SET deleted_at=now() WHERE id=$1 AND deleted_at IS NULL";

      await this.db.query(sqlString, [id]);
    } catch (error) {
      throw new RepositoryError((error as Error).message, error);
    }
  }
}
