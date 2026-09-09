import bcrypt from "bcryptjs";
import crypto from "node:crypto";
import jwt from "jsonwebtoken";
import { OTP } from "otplib";
import qrcode from "qrcode";
import { JWT_SECRET, REDIRECT_LINK } from "../../../../Configurations/Env.js";
import { Info } from "../../../Utilities/Logger.js";
import { ServiceError } from "../../../Utilities/Http.js";
import { PasswordResetMail } from "../../../Utilities/Mail.js";
import type { PublicUser, UserService } from "../Profiles/User/user.types.js";
import type {
  AccessTokenPayload,
  AuthRepository,
  AuthResult,
  AuthService,
  AuthTokens,
  AuthUser,
  GoogleVerificationCode,
  LoginDTO,
  LoginResult,
  RegisterDTO,
  RequestContext,
} from "./authentication.types.js";

if (!JWT_SECRET) throw new Error("JWT_SECRET must be provided in .env");

const SECRET: string = JWT_SECRET;

const BCRYPT_COST = 12,
  MIN_PASSWORD_LENGTH = 8,
  ACCESS_TOKEN_TTL_SECONDS = 15 * 60,
  REFRESH_TOKEN_TTL_MS = 30 * 24 * 60 * 60 * 1000,
  PASSWORD_RESET_TTL_MS = 60 * 60 * 1000,
  MAX_FAILED_LOGIN_ATTEMPTS = 5,
  ACCOUNT_LOCK_DURATION_MS = 15 * 60 * 1000,
  MFA_CHALLENGE_TTL_SECONDS = 5 * 60;

const MFA_CHALLENGE_PURPOSE = "mfa_login";

const otp = new OTP();

const hashToken = (token: string): string =>
  crypto.createHash("sha256").update(token).digest("hex");

export function verifyAccessToken(token: string): AccessTokenPayload {
  try {
    const decoded = jwt.verify(token, SECRET);

    if (typeof decoded === "string" || !decoded.sub || !decoded.role)
      throw new ServiceError("Invalid access token", 401);

    return {
      sub: decoded.sub as string,
      role: decoded.role as AccessTokenPayload["role"],
    };
  } catch (error) {
    if (error instanceof ServiceError) throw error;

    throw new ServiceError("Invalid or expired access token", 401);
  }
}

/** Signs a short-lived, single-purpose token for the pending second factor of a login —
 * distinct from a real access token so it can never be used to authenticate a normal request. */
function signMfaChallenge(userId: string): string {
  return jwt.sign({ sub: userId, purpose: MFA_CHALLENGE_PURPOSE }, SECRET, {
    expiresIn: MFA_CHALLENGE_TTL_SECONDS,
  });
}

function verifyMfaChallenge(token: string): string {
  try {
    const decoded = jwt.verify(token, SECRET);

    if (
      typeof decoded === "string" ||
      !decoded.sub ||
      decoded.purpose !== MFA_CHALLENGE_PURPOSE
    )
      throw new ServiceError("Invalid or expired MFA challenge", 401);

    return decoded.sub as string;
  } catch (error) {
    if (error instanceof ServiceError) throw error;

    throw new ServiceError("Invalid or expired MFA challenge", 401);
  }
}

export class AuthServ implements AuthService {
  constructor(
    private repo: AuthRepository,
    private userService: UserService,
  ) {}

  private async issueTokens(
    userId: string,
    role: AccessTokenPayload["role"],
    context: RequestContext,
  ): Promise<AuthTokens> {
    const access_token = jwt.sign({ sub: userId, role }, SECRET, {
      expiresIn: ACCESS_TOKEN_TTL_SECONDS,
    });

    const refreshToken = crypto.randomBytes(48).toString("hex"),
      refreshTokenHash = hashToken(refreshToken),
      expiresAt = new Date(Date.now() + REFRESH_TOKEN_TTL_MS).toISOString();

    await this.repo.createSession({
      user_id: userId,
      refresh_token_hash: refreshTokenHash,
      user_agent: context.userAgent,
      ip_address: context.ipAddress,
      expires_at: expiresAt,
    });

    return {
      access_token,
      refresh_token: refreshToken,
      expires_in: ACCESS_TOKEN_TTL_SECONDS,
    };
  }

  /**
   * Locked accounts stay locked until locked_until passes, at which point the next attempt
   * gets a clean slate (failed_login_count reset) rather than immediately re-triggering a lock
   * off whatever count it had reached before.
   */
  private async assertNotLocked(authUser: AuthUser): Promise<void> {
    if (!authUser.locked_until) return;

    const lockExpired = new Date(authUser.locked_until).getTime() <= Date.now();

    if (!lockExpired)
      throw new ServiceError(
        "Account is temporarily locked. Try again later.",
        423,
      );

    await this.repo.resetFailedLoginState(authUser.id);
    authUser.locked_until = null;
    authUser.failed_login_count = 0;
  }

  /** Shared by both the password check and the OTP check — either failure counts toward the same lock. */
  private async recordFailedAttempt(userId: string): Promise<void> {
    const failedCount = await this.repo.incrementFailedLoginCount(userId);

    if (failedCount >= MAX_FAILED_LOGIN_ATTEMPTS)
      await this.repo.lockUser(
        userId,
        new Date(Date.now() + ACCOUNT_LOCK_DURATION_MS).toISOString(),
      );
  }

  async register(
    details: RegisterDTO,
    context: RequestContext,
  ): Promise<AuthResult> {
    if (!details || !details.name || !details.email || !details.password)
      throw new ServiceError("name, email and password are required", 400);

    if (details.password.length < MIN_PASSWORD_LENGTH)
      throw new ServiceError(
        `Password must be at least ${MIN_PASSWORD_LENGTH} characters`,
        400,
      );

    const password_hash = await bcrypt.hash(details.password, BCRYPT_COST),
      phone = details.phone ?? null,
      whatsapp_number = details.whatsapp_number ?? null;

    const user = await this.userService.createUser({
      name: details.name,
      email: details.email,
      password_hash,
      phone,
      whatsapp_number,
    });

    const tokens = await this.issueTokens(user.id, user.role, context);

    return { user, tokens };
  }

  async login(
    details: LoginDTO,
    context: RequestContext,
  ): Promise<LoginResult> {
    if (!details || !details.email || !details.password)
      throw new ServiceError("email and password are required", 400);

    const authUser = await this.repo.getAuthUserByEmail(details.email);

    if (!authUser) throw new ServiceError("Invalid email or password", 401);

    await this.assertNotLocked(authUser);

    if (!authUser.is_active) throw new ServiceError("Account is inactive", 403);

    const passwordMatches = await bcrypt.compare(
      details.password,
      authUser.password_hash,
    );

    if (!passwordMatches) {
      await this.recordFailedAttempt(authUser.id);

      throw new ServiceError("Invalid email or password", 401);
    }

    if (authUser.google_auth_secret) {
      return {
        mfaRequired: true,
        challenge: signMfaChallenge(authUser.id),
        expires_in: MFA_CHALLENGE_TTL_SECONDS,
      };
    }

    await this.repo.recordSuccessfulLogin(authUser.id);

    const user = await this.userService.getUser(authUser.id),
      tokens = await this.issueTokens(user.id, user.role, context);

    return { user, tokens };
  }

  async completeMfaLogin(
    challenge: string,
    code: string,
    context: RequestContext,
  ): Promise<AuthResult> {
    if (!challenge || !code)
      throw new ServiceError("challenge and code are required", 400);

    const userId = verifyMfaChallenge(challenge),
      authUser = await this.repo.getAuthUserById(userId);

    if (!authUser)
      throw new ServiceError("Invalid or expired MFA challenge", 401);

    await this.assertNotLocked(authUser);

    if (!authUser.is_active) throw new ServiceError("Account is inactive", 403);

    if (!authUser.google_auth_secret)
      throw new ServiceError("2FA is not enabled for this account", 400);

    const result = await otp.verify({
      secret: authUser.google_auth_secret,
      token: code,
    });

    if (!result.valid) {
      await this.recordFailedAttempt(authUser.id);

      throw new ServiceError("Invalid verification code", 401);
    }

    await this.repo.recordSuccessfulLogin(authUser.id);

    const user = await this.userService.getUser(authUser.id),
      tokens = await this.issueTokens(user.id, user.role, context);

    return { user, tokens };
  }

  async refresh(
    refreshToken: string,
    context: RequestContext,
  ): Promise<AuthTokens> {
    if (!refreshToken)
      throw new ServiceError("Refresh token must be provided", 400);

    const tokenHash = hashToken(refreshToken),
      session = await this.repo.getSessionByTokenHash(tokenHash);

    if (!session)
      throw new ServiceError("Invalid or expired refresh token", 401);

    await this.repo.revokeSession(session.id);

    const user = await this.userService.getUser(session.user_id);

    return this.issueTokens(user.id, user.role, context);
  }

  async logout(refreshToken: string): Promise<void> {
    if (!refreshToken) return;

    const tokenHash = hashToken(refreshToken),
      session = await this.repo.getSessionByTokenHash(tokenHash);

    if (session) await this.repo.revokeSession(session.id);
  }

  async forgotPassword(email: string): Promise<void> {
    if (!email) throw new ServiceError("Email must be provided", 400);

    const authUser = await this.repo.getAuthUserByEmail(email);

    if (!authUser) return;

    const resetToken = await this.createPasswordSetupToken(authUser.id),
      passwordResetUrl = `${REDIRECT_LINK}/resetpass?token=${resetToken}`;

    await PasswordResetMail(authUser.email, passwordResetUrl);

    Info(`Password reset requested for ${email}.`);
  }

  async createPasswordSetupToken(userId: string): Promise<string> {
    const resetToken = crypto.randomBytes(32).toString("hex"),
      tokenHash = hashToken(resetToken),
      expiresAt = new Date(Date.now() + PASSWORD_RESET_TTL_MS).toISOString();

    await this.repo.createPasswordResetToken({
      user_id: userId,
      token_hash: tokenHash,
      expires_at: expiresAt,
    });

    return resetToken;
  }

  async generateRandomPasswordHash(): Promise<string> {
    const randomPassword = crypto.randomBytes(32).toString("hex");

    return bcrypt.hash(randomPassword, BCRYPT_COST);
  }

  async resetPassword(token: string, newPassword: string): Promise<void> {
    if (!token || !newPassword)
      throw new ServiceError("Token and new password must be provided", 400);

    if (newPassword.length < MIN_PASSWORD_LENGTH)
      throw new ServiceError(
        `Password must be at least ${MIN_PASSWORD_LENGTH} characters`,
        400,
      );

    const tokenHash = hashToken(token),
      record = await this.repo.getPasswordResetToken(tokenHash);

    if (!record) throw new ServiceError("Invalid or expired reset token", 400);

    const password_hash = await bcrypt.hash(newPassword, BCRYPT_COST);

    await this.repo.updatePasswordHash(record.user_id, password_hash);
    await this.repo.markPasswordResetTokenUsed(record.id);
    await this.repo.revokeAllUserSessions(record.user_id);
  }

  async getCurrentUser(accessToken: string): Promise<PublicUser> {
    if (!accessToken)
      throw new ServiceError("Access token must be provided", 401);

    const payload = verifyAccessToken(accessToken);

    return this.userService.getUser(payload.sub);
  }

  async generateOTPSecret(userId: string): Promise<GoogleVerificationCode> {
    const user = await this.userService.getUser(userId),
      secret = otp.generateSecret();

    const otpAuth = otp.generateURI({
        issuer: "Ferra Properties",
        label: user.email,
        secret,
      }),
      qrCodeDataURL = await qrcode.toDataURL(otpAuth);

    await this.repo.setGoogleAuthSecret(userId, secret);

    return {
      qrcode: qrCodeDataURL,
      secret,
    };
  }

  async verifyOTPCode(userId: string, code: string): Promise<boolean> {
    const secret = await this.repo.getGoogleAuthSecret(userId);

    if (!secret)
      throw new ServiceError("2FA has not been set up for this account", 400);

    const result = await otp.verify({ secret, token: code });

    return result.valid;
  }
}
