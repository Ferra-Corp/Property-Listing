import type { QueryResult } from "pg";
import type { Database } from "../../../../Configurations/Database.js";
import { RepositoryError } from "../../../Utilities/Http.js";
import type {
  createSiteSettingDTO,
  SettingsRepository,
  SiteSetting,
  UpdateSiteSettingDTO,
} from "./settings.types.js";

export class SettingsRepo implements SettingsRepository {
  constructor(private db: Database) {}

  async createSetting(details: createSiteSettingDTO): Promise<SiteSetting> {
    try {
      const sqlString: string =
          "INSERT INTO site_settings(key,value,group_name,updated_by) VALUES($1,$2,$3,$4) RETURNING *",
        sqlQuery = await this.db.query(sqlString, [
          details.key,
          JSON.stringify(details.value),
          details.group_name ?? "general",
          details.updated_by ?? null,
        ]),
        settingQuery = sqlQuery as QueryResult<SiteSetting>;

      return settingQuery.rows[0]!;
    } catch (error) {
      throw new RepositoryError((error as Error).message, error);
    }
  }

  async editSetting(
    key: string,
    details: UpdateSiteSettingDTO,
  ): Promise<SiteSetting> {
    try {
      let keys: string[] = [],
        values: any[] = [],
        paramIndex: number = 2;

      for (let [field, value] of Object.entries(details)) {
        keys.push(`${field}=$${paramIndex++}`);
        values.push(field === "value" ? JSON.stringify(value) : value);
      }

      keys.push("updated_at=now()");

      const sqlString: string = `UPDATE site_settings SET ${keys.join(",")} WHERE key=$1 RETURNING *`,
        sqlQuery = await this.db.query(sqlString, [key, ...values]),
        settingQuery = sqlQuery as QueryResult<SiteSetting>;

      return settingQuery.rows[0]!;
    } catch (error) {
      throw new RepositoryError((error as Error).message, error);
    }
  }

  async getSettings(): Promise<SiteSetting[]> {
    try {
      const sqlString: string = "SELECT * FROM site_settings",
        sqlQuery = await this.db.query(sqlString),
        settingsQuery = sqlQuery as QueryResult<SiteSetting>;

      return settingsQuery.rows;
    } catch (error) {
      throw new RepositoryError((error as Error).message, error);
    }
  }

  async deleteSetting(key: string): Promise<void> {
    try {
      const sqlString: string = "DELETE FROM site_settings WHERE key=$1";

      await this.db.query(sqlString, [key]);
    } catch (error) {
      throw new RepositoryError((error as Error).message, error);
    }
  }
}
