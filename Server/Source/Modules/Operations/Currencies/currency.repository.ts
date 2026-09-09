import type { QueryResult } from "pg";
import type { Database } from "../../../../Configurations/Database.js";
import { RepositoryError } from "../../../Utilities/Http.js";
import type {
  Currency,
  CurrencyRepository,
  UpdateCurrencyDTO,
} from "./currency.types.js";

export class CurrencyRepo implements CurrencyRepository {
  constructor(private db: Database) {}

  async createCurrency(details: Currency): Promise<Currency> {
    try {
      const sqlString: string =
          "INSERT INTO currencies(code,symbol,name,decimal_places,is_active,sort_order) VALUES($1,$2,$3,$4,$5,$6) RETURNING *",
        sqlQuery = await this.db.query(sqlString, [
          details["code"],
          details["symbol"],
          details["name"],
          details["decimal_places"] ?? null,
          details["is_active"],
          details["sort_order"],
        ]),
        currencyQuery = sqlQuery as QueryResult<Currency>;

      return currencyQuery.rows[0]!;
    } catch (error) {
      throw new RepositoryError((error as Error).message, error);
    }
  }

  async editCurrency(
    code: string,
    details: UpdateCurrencyDTO,
  ): Promise<Currency> {
    try {
      let keys: string[] = [],
        values: any[] = [],
        paramIndex: number = 2;

      for (let [key, value] of Object.entries(details)) {
        keys.push(`${key}=$${paramIndex++}`);
        values.push(value);
      }

      const sqlString: string = `UPDATE currencies SET ${keys.join(",")} WHERE code=$1 RETURNING *`,
        sqlQuery = await this.db.query(sqlString, [code, ...values]),
        currencyQuery = sqlQuery as QueryResult<Currency>;

      return currencyQuery.rows[0]!;
    } catch (error) {
      throw new RepositoryError((error as Error).message, error);
    }
  }

  async getCurrencies(): Promise<Currency[]> {
    try {
      const sqlString: string = "SELECT * FROM currencies",
        sqlQuery = await this.db.query(sqlString),
        currencyQuery = sqlQuery as QueryResult<Currency>;

      return currencyQuery.rows;
    } catch (error) {
      throw new RepositoryError((error as Error).message, error);
    }
  }

  async deleteCurrency(code: string): Promise<void> {
    try {
      const sqlString: string = "DELETE FROM currencies WHERE code=$1";

      await this.db.query(sqlString, [code]);
    } catch (error) {
      throw new RepositoryError((error as Error).message, error);
    }
  }
}
