import type { QueryResult } from "pg";
import type { Database } from "../../../../Configurations/Database.js";
import { RepositoryError } from "../../../Utilities/Http.js";
import type {
  createTestimonialDTO,
  Testimonial,
  TestimonialRepository,
  UpdateTestimonialDTO,
} from "./testimonial.types.js";

export class TestimonialRepo implements TestimonialRepository {
  constructor(private db: Database) {}

  async createTestimonial(details: createTestimonialDTO): Promise<Testimonial> {
    try {
      const sqlString: string =
          "INSERT INTO testimonials(name,quote,rating,company_name,profile_picture,is_active) VALUES($1,$2,$3,$4,$5,$6) RETURNING *",
        sqlQuery = await this.db.query(sqlString, [
          details.name,
          details.quote,
          details.rating ?? 5,
          details.company_name ?? null,
          details.profile_picture ?? null,
          details.is_active ?? true,
        ]),
        testimonialQuery = sqlQuery as QueryResult<Testimonial>;

      return testimonialQuery.rows[0]!;
    } catch (error) {
      throw new RepositoryError((error as Error).message, error);
    }
  }

  async editTestimonial(
    id: string,
    details: UpdateTestimonialDTO,
  ): Promise<Testimonial> {
    try {
      let keys: string[] = [],
        values: any[] = [],
        paramIndex: number = 2;

      for (let [key, value] of Object.entries(details)) {
        keys.push(`${key}=$${paramIndex++}`);
        values.push(value);
      }

      keys.push("updated_at=now()");

      const sqlString: string = `UPDATE testimonials SET ${keys.join(",")} WHERE id=$1 AND deleted_at IS NULL RETURNING *`,
        sqlQuery = await this.db.query(sqlString, [id, ...values]),
        testimonialQuery = sqlQuery as QueryResult<Testimonial>;

      return testimonialQuery.rows[0]!;
    } catch (error) {
      throw new RepositoryError((error as Error).message, error);
    }
  }

  async getTestimonial(
    id: string,
    publicOnly = false,
  ): Promise<Testimonial | null> {
    try {
      const sqlString: string = `
          SELECT * FROM testimonials
          WHERE id=$1 AND deleted_at IS NULL
          ${publicOnly ? "AND is_active = true" : ""}
        `,
        sqlQuery = await this.db.query(sqlString, [id]),
        testimonialQuery = sqlQuery as QueryResult<Testimonial>;

      return testimonialQuery.rows[0] ?? null;
    } catch (error) {
      throw new RepositoryError((error as Error).message, error);
    }
  }

  async getTestimonials(publicOnly = false): Promise<Testimonial[]> {
    try {
      const sqlString: string = `
          SELECT * FROM testimonials
          WHERE deleted_at IS NULL
          ${publicOnly ? "AND is_active = true" : ""}
          ORDER BY created_at DESC
        `,
        sqlQuery = await this.db.query(sqlString),
        testimonialsQuery = sqlQuery as QueryResult<Testimonial>;

      return testimonialsQuery.rows;
    } catch (error) {
      throw new RepositoryError((error as Error).message, error);
    }
  }

  async deleteTestimonial(id: string): Promise<void> {
    try {
      const sqlString: string =
        "UPDATE testimonials SET deleted_at=now() WHERE id=$1 AND deleted_at IS NULL";

      await this.db.query(sqlString, [id]);
    } catch (error) {
      throw new RepositoryError((error as Error).message, error);
    }
  }
}
