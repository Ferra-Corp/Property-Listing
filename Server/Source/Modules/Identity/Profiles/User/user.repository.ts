import type { QueryResult } from "pg";
import type { Database } from "../../../../../Configurations/Database.js";
import { RepositoryError } from "../../../../Utilities/Http.js";
import type {
  createUserDTO,
  PublicUser,
  UpdateUserDTO,
  UserRepository,
} from "./user.types.js";

const PUBLIC_USER_COLUMNS =
  "id,name,email,phone,whatsapp_number,role,is_active,email_verified_at,last_login_at,failed_login_count,locked_until,created_at,updated_at,deleted_at,(google_auth_secret IS NOT NULL) AS mfa_enabled";

export class UserRepo implements UserRepository {
  constructor(private db: Database) {}

  async createUser(details: createUserDTO): Promise<PublicUser> {
    try {
      const sqlString: string = `INSERT INTO users(name,email,phone,whatsapp_number,password_hash,role,is_active) VALUES($1,$2,$3,$4,$5,$6,$7) RETURNING ${PUBLIC_USER_COLUMNS}`,
        sqlQuery = await this.db.query(sqlString, [
          details.name,
          details.email,
          details.phone ?? null,
          details.whatsapp_number ?? null,
          details.password_hash,
          details.role ?? "viewer",
          details.is_active ?? true,
        ]),
        userQuery = sqlQuery as QueryResult<PublicUser>;

      return userQuery.rows[0]!;
    } catch (error) {
      throw new RepositoryError((error as Error).message, error);
    }
  }

  async editUser(id: string, details: UpdateUserDTO): Promise<PublicUser> {
    try {
      let keys: string[] = [],
        values: any[] = [],
        paramIndex: number = 2;

      for (let [key, value] of Object.entries(details)) {
        keys.push(`${key}=$${paramIndex++}`);
        values.push(value);
      }

      keys.push("updated_at=now()");

      const sqlString: string = `UPDATE users SET ${keys.join(",")} WHERE id=$1 AND deleted_at IS NULL RETURNING ${PUBLIC_USER_COLUMNS}`,
        sqlQuery = await this.db.query(sqlString, [id, ...values]),
        userQuery = sqlQuery as QueryResult<PublicUser>;

      return userQuery.rows[0]!;
    } catch (error) {
      throw new RepositoryError((error as Error).message, error);
    }
  }

  async getUser(id: string): Promise<PublicUser | null> {
    try {
      const sqlString: string = `SELECT ${PUBLIC_USER_COLUMNS} FROM users WHERE id=$1 AND deleted_at IS NULL`,
        sqlQuery = await this.db.query(sqlString, [id]),
        userQuery = sqlQuery as QueryResult<PublicUser>;

      return userQuery.rows[0] ?? null;
    } catch (error) {
      throw new RepositoryError((error as Error).message, error);
    }
  }

  async getUsers(): Promise<PublicUser[]> {
    try {
      const sqlString: string = `SELECT ${PUBLIC_USER_COLUMNS} FROM users WHERE deleted_at IS NULL`,
        sqlQuery = await this.db.query(sqlString),
        usersQuery = sqlQuery as QueryResult<PublicUser>;

      return usersQuery.rows;
    } catch (error) {
      throw new RepositoryError((error as Error).message, error);
    }
  }

  async deleteUser(id: string): Promise<void> {
    try {
      const sqlString: string =
        "UPDATE users SET deleted_at=now() WHERE id=$1 AND deleted_at IS NULL";

      await this.db.query(sqlString, [id]);
    } catch (error) {
      throw new RepositoryError((error as Error).message, error);
    }
  }
}
