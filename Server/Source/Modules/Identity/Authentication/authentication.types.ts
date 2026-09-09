import type { PublicUser, UserRole } from "../Profiles/User/user.types.js";

export type RegisterDTO = {
  name: string;
  email: string;
  password: string;
  phone?: string | null;
  whatsapp_number?: string | null;
};

export type GoogleVerificationCode = {
  qrcode: string;
  secret: string;
};

export type LoginDTO = {
  email: string;
  password: string;
};

export type RequestContext = {
  userAgent: string | null;
  ipAddress: string | null;
};

export type AuthTokens = {
  access_token: string;
  refresh_token: string;
  expires_in: number;
};

export type AuthResult = {
  user: PublicUser;
  tokens: AuthTokens;
};

export type AccessTokenPayload = {
  sub: string;
  role: UserRole;
};

/** The subset of `users` auth-state columns needed to verify a login. Never returned to a caller. */
export type AuthUser = {
  id: string;
  email: string;
  password_hash: string;
  role: UserRole;
  is_active: boolean;
  failed_login_count: number;
  locked_until: string | null;
  google_auth_secret: string | null;
};

/** Returned by login() when the account has 2FA enabled — no tokens yet, the client must complete
 * the challenge via the verify-mfa action before real access/refresh tokens are issued. */
export type MfaRequiredResult = {
  mfaRequired: true;
  challenge: string;
  expires_in: number;
};

export type LoginResult = AuthResult | MfaRequiredResult;

export type AuthSession = {
  id: string;
  user_id: string;
  refresh_token_hash: string;
  user_agent: string | null;
  ip_address: string | null;
  expires_at: string;
  revoked_at: string | null;
  created_at: string;
};

export type createSessionDTO = {
  user_id: string;
  refresh_token_hash: string;
  user_agent: string | null;
  ip_address: string | null;
  expires_at: string;
};

export type PasswordResetToken = {
  id: string;
  user_id: string;
  token_hash: string;
  expires_at: string;
  used_at: string | null;
  created_at: string;
};

export type createPasswordResetDTO = {
  user_id: string;
  token_hash: string;
  expires_at: string;
};

export interface AuthRepository {
  getAuthUserByEmail: (email: string) => Promise<AuthUser | null>;
  getAuthUserById: (userId: string) => Promise<AuthUser | null>;
  incrementFailedLoginCount: (userId: string) => Promise<number>;
  lockUser: (userId: string, until: string) => Promise<void>;
  /** Clears the failure counter and lock without touching last_login_at — used when a lock has naturally expired. */
  resetFailedLoginState: (userId: string) => Promise<void>;
  recordSuccessfulLogin: (userId: string) => Promise<void>;
  updatePasswordHash: (userId: string, passwordHash: string) => Promise<void>;
  getGoogleAuthSecret: (userId: string) => Promise<string | null>;
  setGoogleAuthSecret: (userId: string, secret: string) => Promise<void>;
  createSession: (details: createSessionDTO) => Promise<AuthSession>;
  getSessionByTokenHash: (tokenHash: string) => Promise<AuthSession | null>;
  revokeSession: (id: string) => Promise<void>;
  revokeAllUserSessions: (userId: string) => Promise<void>;
  createPasswordResetToken: (
    details: createPasswordResetDTO,
  ) => Promise<PasswordResetToken>;
  getPasswordResetToken: (
    tokenHash: string,
  ) => Promise<PasswordResetToken | null>;
  markPasswordResetTokenUsed: (id: string) => Promise<void>;
}

export interface AuthService {
  register: (
    details: RegisterDTO,
    context: RequestContext,
  ) => Promise<AuthResult>;
  login: (details: LoginDTO, context: RequestContext) => Promise<LoginResult>;
  completeMfaLogin: (
    challenge: string,
    code: string,
    context: RequestContext,
  ) => Promise<AuthResult>;
  refresh: (
    refreshToken: string,
    context: RequestContext,
  ) => Promise<AuthTokens>;
  logout: (refreshToken: string) => Promise<void>;
  forgotPassword: (email: string) => Promise<void>;
  resetPassword: (token: string, newPassword: string) => Promise<void>;
  getCurrentUser: (accessToken: string) => Promise<PublicUser>;
  generateOTPSecret: (userId: string) => Promise<GoogleVerificationCode>;
  verifyOTPCode: (userId: string, code: string) => Promise<boolean>;
  /** A bcrypt hash of a cryptographically random, never-disclosed password — for accounts
   * (e.g. invited agents) that must exist before anyone has chosen a real password yet. */
  generateRandomPasswordHash: () => Promise<string>;
  /** Issues a one-time, short-lived password-setup token (the same mechanism as forgotPassword)
   * without sending any email itself, so the caller can use its own email copy/template. */
  createPasswordSetupToken: (userId: string) => Promise<string>;
}
