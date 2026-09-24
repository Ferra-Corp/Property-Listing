import type { QueryResult } from "pg";
import type { Database } from "../../../../Configurations/Database.js";
import { RepositoryError } from "../../../Utilities/Http.js";
import type {
  createExchangeRateDTO,
  ExchangeRate,
  RateRepository,
  UpdateExchangeRateDTO,
} from "./rates.types.js";

export class RateRepo implements RateRepository {
  constructor(private db: Database) {}

  async createRate(details: createExchangeRateDTO): Promise<ExchangeRate> {
    try {
      const sqlString: string =
          "INSERT INTO exchange_rates(base_currency,target_currency,rate,source,rate_date) VALUES($1,$2,$3,$4,$5) RETURNING *",
        sqlQuery = await this.db.query(sqlString, [
          details["base_currency"],
          details["target_currency"],
          details["rate"],
          details["source"],
          details["rate_date"],
        ]),
        rateQuery = sqlQuery as QueryResult<ExchangeRate>;

      return rateQuery.rows[0]!;
    } catch (error) {
      throw new RepositoryError((error as Error).message, error);
    }
  }

  async editRate(
    id: string,
    details: UpdateExchangeRateDTO,
  ): Promise<ExchangeRate> {
    try {
      let keys: string[] = [],
        values: any[] = [],
        paramIndex: number = 2;

      for (let [key, value] of Object.entries(details)) {
        keys.push(`${key}=$${paramIndex++}`);
        values.push(value);
      }

      const sqlString: string = `UPDATE exchange_rates SET ${keys.join(",")} WHERE id=$1 RETURNING *`,
        sqlQuery = await this.db.query(sqlString, [id, ...values]),
        rateQuery = sqlQuery as QueryResult<ExchangeRate>;

      return rateQuery.rows[0]!;
    } catch (error) {
      throw new RepositoryError((error as Error).message, error);
    }
  }

  async getRates(): Promise<ExchangeRate[]> {
    try {
      const sqlString: string = "SELECT * FROM exchange_rates",
        sqlQuery = await this.db.query(sqlString),
        rateQuery = sqlQuery as QueryResult<ExchangeRate>;

      return rateQuery.rows;
    } catch (error) {
      throw new RepositoryError((error as Error).message, error);
    }
  }

  async deleteRate(id: string): Promise<void> {
    try {
      const sqlString: string = "DELETE FROM exchange_rates WHERE id=$1";

      await this.db.query(sqlString, [id]);
    } catch (error) {
      throw new RepositoryError((error as Error).message, error);
    }
  }

  async upsertRate(details: createExchangeRateDTO): Promise<ExchangeRate> {
    try {
      const sqlString: string =
          `INSERT INTO exchange_rates(base_currency,target_currency,rate,source,rate_date)
           VALUES($1,$2,$3,$4,$5)
           ON CONFLICT (base_currency, target_currency, rate_date)
           DO UPDATE SET rate=EXCLUDED.rate, source=EXCLUDED.source, fetched_at=now()
           RETURNING *`,
        sqlQuery = await this.db.query(sqlString, [
          details["base_currency"],
          details["target_currency"],
          details["rate"],
          details["source"],
          details["rate_date"],
        ]),
        rateQuery = sqlQuery as QueryResult<ExchangeRate>;

      return rateQuery.rows[0]!;
    } catch (error) {
      throw new RepositoryError((error as Error).message, error);
    }
  }
}
