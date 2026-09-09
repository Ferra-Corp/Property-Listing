import type { QueryResult } from "pg";
import type { Database } from "../../../../Configurations/Database.js";
import { RepositoryError } from "../../../Utilities/Http.js";
import type {
  AuthRepository,
  AuthSession,
  AuthUser,
  createPasswordResetDTO,
  createSessionDTO,
  PasswordResetToken,
} from "./authentication.types.js";

export class AuthRepo implements AuthRepository {
  constructor(private db: Database) {}

  async getAuthUserByEmail(email: string): Promise<AuthUser | null> {
    try {
      const sqlString: string =
          "SELECT id,email,password_hash,role,is_active,failed_login_count,locked_until,google_auth_secret FROM users WHERE email=$1 AND deleted_at IS NULL",
        sqlQuery = await this.db.query(sqlString, [email]),
        userQuery = sqlQuery as QueryResult<AuthUser>;

      return userQuery.rows[0] ?? null;
    } catch (error) {
      throw new RepositoryError((error as Error).message, error);
    }
  }

  async getAuthUserById(userId: string): Promise<AuthUser | null> {
    try {
      const sqlString: string =
          "SELECT id,email,password_hash,role,is_active,failed_login_count,locked_until,google_auth_secret FROM users WHERE id=$1 AND deleted_at IS NULL",
        sqlQuery = await this.db.query(sqlString, [userId]),
        userQuery = sqlQuery as QueryResult<AuthUser>;

      return userQuery.rows[0] ?? null;
    } catch (error) {
      throw new RepositoryError((error as Error).message, error);
    }
  }

  async incrementFailedLoginCount(userId: string): Promise<number> {
    try {
      const sqlString: string =
          "UPDATE users SET failed_login_count=failed_login_count+1 WHERE id=$1 RETURNING failed_login_count",
        sqlQuery = await this.db.query(sqlString, [userId]),
        userQuery = sqlQuery as QueryResult<{ failed_login_count: number }>;

      return userQuery.rows[0]!.failed_login_count;
    } catch (error) {
      throw new RepositoryError((error as Error).message, error);
    }
  }

  async lockUser(userId: string, until: string): Promise<void> {
    try {
      const sqlString: string = "UPDATE users SET locked_until=$2 WHERE id=$1";

      await this.db.query(sqlString, [userId, until]);
    } catch (error) {
      throw new RepositoryError((error as Error).message, error);
    }
  }

  async recordSuccessfulLogin(userId: string): Promise<void> {
    try {
      const sqlString: string =
        "UPDATE users SET failed_login_count=0, locked_until=NULL, last_login_at=now() WHERE id=$1";

      await this.db.query(sqlString, [userId]);
    } catch (error) {
      throw new RepositoryError((error as Error).message, error);
    }
  }

  async resetFailedLoginState(userId: string): Promise<void> {
    try {
      const sqlString: string =
        "UPDATE users SET failed_login_count=0, locked_until=NULL WHERE id=$1";

      await this.db.query(sqlString, [userId]);
    } catch (error) {
      throw new RepositoryError((error as Error).message, error);
    }
  }

  async updatePasswordHash(
    userId: string,
    passwordHash: string,
  ): Promise<void> {
    try {
      const sqlString: string =
        "UPDATE users SET password_hash=$2, updated_at=now() WHERE id=$1";

      await this.db.query(sqlString, [userId, passwordHash]);
    } catch (error) {
      throw new RepositoryError((error as Error).message, error);
    }
  }

  async getGoogleAuthSecret(userId: string): Promise<string | null> {
    try {
      const sqlString: string =
          "SELECT google_auth_secret FROM users WHERE id=$1 AND deleted_at IS NULL",
        sqlQuery = await this.db.query(sqlString, [userId]),
        userQuery = sqlQuery as QueryResult<{
          google_auth_secret: string | null;
        }>;

      return userQuery.rows[0]?.google_auth_secret ?? null;
    } catch (error) {
      throw new RepositoryError((error as Error).message, error);
    }
  }

  async setGoogleAuthSecret(userId: string, secret: string): Promise<void> {
    try {
      const sqlString: string =
        "UPDATE users SET google_auth_secret=$2, updated_at=now() WHERE id=$1";

      await this.db.query(sqlString, [userId, secret]);
    } catch (error) {
      throw new RepositoryError((error as Error).message, error);
    }
  }

  async createSession(details: createSessionDTO): Promise<AuthSession> {
    try {
      const sqlString: string =
          "INSERT INTO auth_sessions(user_id,refresh_token_hash,user_agent,ip_address,expires_at) VALUES($1,$2,$3,$4,$5) RETURNING *",
        sqlQuery = await this.db.query(sqlString, [
          details.user_id,
          details.refresh_token_hash,
          details.user_agent,
          details.ip_address,
          details.expires_at,
        ]),
        sessionQuery = sqlQuery as QueryResult<AuthSession>;

      return sessionQuery.rows[0]!;
    } catch (error) {
      throw new RepositoryError((error as Error).message, error);
    }
  }

  async getSessionByTokenHash(tokenHash: string): Promise<AuthSession | null> {
    try {
      const sqlString: string =
          "SELECT * FROM auth_sessions WHERE refresh_token_hash=$1 AND revoked_at IS NULL AND expires_at > now()",
        sqlQuery = await this.db.query(sqlString, [tokenHash]),
        sessionQuery = sqlQuery as QueryResult<AuthSession>;

      return sessionQuery.rows[0] ?? null;
    } catch (error) {
      throw new RepositoryError((error as Error).message, error);
    }
  }

  async revokeSession(id: string): Promise<void> {
    try {
      const sqlString: string =
        "UPDATE auth_sessions SET revoked_at=now() WHERE id=$1 AND revoked_at IS NULL";

      await this.db.query(sqlString, [id]);
    } catch (error) {
      throw new RepositoryError((error as Error).message, error);
    }
  }

  async revokeAllUserSessions(userId: string): Promise<void> {
    try {
      const sqlString: string =
        "UPDATE auth_sessions SET revoked_at=now() WHERE user_id=$1 AND revoked_at IS NULL";

      await this.db.query(sqlString, [userId]);
    } catch (error) {
      throw new RepositoryError((error as Error).message, error);
    }
  }

  async createPasswordResetToken(
    details: createPasswordResetDTO,
  ): Promise<PasswordResetToken> {
    try {
      const sqlString: string =
          "INSERT INTO password_reset_tokens(user_id,token_hash,expires_at) VALUES($1,$2,$3) RETURNING *",
        sqlQuery = await this.db.query(sqlString, [
          details.user_id,
          details.token_hash,
          details.expires_at,
        ]),
        tokenQuery = sqlQuery as QueryResult<PasswordResetToken>;

      return tokenQuery.rows[0]!;
    } catch (error) {
      throw new RepositoryError((error as Error).message, error);
    }
  }

  async getPasswordResetToken(
    tokenHash: string,
  ): Promise<PasswordResetToken | null> {
    try {
      const sqlString: string =
          "SELECT * FROM password_reset_tokens WHERE token_hash=$1 AND used_at IS NULL AND expires_at > now()",
        sqlQuery = await this.db.query(sqlString, [tokenHash]),
        tokenQuery = sqlQuery as QueryResult<PasswordResetToken>;

      return tokenQuery.rows[0] ?? null;
    } catch (error) {
      throw new RepositoryError((error as Error).message, error);
    }
  }

  async markPasswordResetTokenUsed(id: string): Promise<void> {
    try {
      const sqlString: string =
        "UPDATE password_reset_tokens SET used_at=now() WHERE id=$1";

      await this.db.query(sqlString, [id]);
    } catch (error) {
      throw new RepositoryError((error as Error).message, error);
    }
  }
}
