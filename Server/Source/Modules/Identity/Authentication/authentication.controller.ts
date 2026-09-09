import type { IncomingMessage, ServerResponse } from "node:http";
import { authService } from "../../../Data Objects/DTO.js";
import { REDIRECT_LINK } from "../../../../Configurations/Env.js";
import type { AuthTokens, RequestContext } from "./authentication.types.js";
import {
  appendSetCookie,
  clearCookie,
  ErrorFormatter,
  getClientDetails,
  getRequestBody,
  parseCookies,
  PathnameValidator,
  sendResponseMessage,
  serializeCookie,
} from "../../../Utilities/Http.js";
import { AuthToken } from "../../../Middleware/Authentication.js";

const ACCESS_TOKEN_COOKIE = "access_token",
  REFRESH_TOKEN_COOKIE = "refresh_token",
  REFRESH_TOKEN_PATH = "/api/auth",
  REFRESH_TOKEN_MAX_AGE_SECONDS = 30 * 24 * 60 * 60;

const isSecure = REDIRECT_LINK?.startsWith("https://") ?? false;

const buildContext = async (
  request: IncomingMessage,
): Promise<RequestContext> => {
  const { ipAddress } = await getClientDetails(request),
    rawUserAgent = request.headers["user-agent"];

  return {
    userAgent: typeof rawUserAgent === "string" ? rawUserAgent : null,
    ipAddress,
  };
};

/** Sets the access/refresh tokens as httpOnly cookies instead of exposing them in the JSON body. */
const setAuthCookies = (
  response: ServerResponse<IncomingMessage>,
  tokens: AuthTokens,
): void => {
  appendSetCookie(
    response,
    serializeCookie(ACCESS_TOKEN_COOKIE, tokens.access_token, {
      httpOnly: true,
      secure: isSecure,
      sameSite: "Lax",
      path: "/",
      maxAgeSeconds: tokens.expires_in,
    }),
  );

  appendSetCookie(
    response,
    serializeCookie(REFRESH_TOKEN_COOKIE, tokens.refresh_token, {
      httpOnly: true,
      secure: isSecure,
      sameSite: "Lax",
      path: REFRESH_TOKEN_PATH,
      maxAgeSeconds: REFRESH_TOKEN_MAX_AGE_SECONDS,
    }),
  );
};

const clearAuthCookies = (response: ServerResponse<IncomingMessage>): void => {
  appendSetCookie(response, clearCookie(ACCESS_TOKEN_COOKIE, "/"));
  appendSetCookie(
    response,
    clearCookie(REFRESH_TOKEN_COOKIE, REFRESH_TOKEN_PATH),
  );
};

export const AuthenticationController = async (
  request: IncomingMessage,
  response: ServerResponse<IncomingMessage>,
) => {
  const requestUrl = new URL(request.url!, `http://${request.headers.host}`),
    pathnames = requestUrl.pathname.split("/").filter(Boolean);

  const service = authService;

  try {
    const action = PathnameValidator(pathnames);

    if (request.method === "GET" && action === "me") {
      const user = await AuthToken(request);

      sendResponseMessage(200, false, user, response);
      return;
    }

    if (request.method !== "POST") {
      sendResponseMessage(405, true, "Invalid HTTP Header method", response);
      return;
    }

    const body: any = await getRequestBody(request);

    switch (action) {
      case "login": {
        const context = await buildContext(request),
          result = await service.login(body, context);

        if ("mfaRequired" in result) {
          sendResponseMessage(200, false, result, response);
          break;
        }

        setAuthCookies(response, result.tokens);
        sendResponseMessage(200, false, "Logged in successfully", response);
        break;
      }
      case "verify-mfa": {
        const context = await buildContext(request),
          { tokens } = await service.completeMfaLogin(
            body.challenge,
            body.code,
            context,
          );

        setAuthCookies(response, tokens);
        sendResponseMessage(200, false, "Logged in successfully", response);
        break;
      }
      case "generateotp":
        const generateUser = await AuthToken(request),
          userOtp = await service.generateOTPSecret(generateUser.id);

        sendResponseMessage(200, false, userOtp, response);
        break;
      case "verifyotp":
        const verifyUser = await AuthToken(request);

        const verifyStatus = await service.verifyOTPCode(
          verifyUser.id,
          body.code,
        );
        if (!verifyStatus)
          sendResponseMessage(403, false, "Wrong verification code", response);
        else
          sendResponseMessage(200, false, "Verification successful", response);

        break;

      case "refresh": {
        const cookies = parseCookies(request),
          context = await buildContext(request),
          tokens = await service.refresh(
            cookies[REFRESH_TOKEN_COOKIE] ?? "",
            context,
          );

        setAuthCookies(response, tokens);
        sendResponseMessage(200, false, "Session refreshed", response);
        break;
      }
      case "logout": {
        const cookies = parseCookies(request);

        await service.logout(cookies[REFRESH_TOKEN_COOKIE] ?? "");

        clearAuthCookies(response);
        sendResponseMessage(204, false, null, response);
        break;
      }
      case "forgot-password":
        await service.forgotPassword(body.email);

        sendResponseMessage(
          200,
          false,
          "If an account exists for that email, a reset link has been sent",
          response,
        );
        break;
      case "reset-password":
        await service.resetPassword(body.token, body.password);

        sendResponseMessage(200, false, "Password has been reset", response);
        break;
      default:
        sendResponseMessage(404, true, "Invalid auth action", response);
        break;
    }
  } catch (error) {
    const { statusCode, message } = ErrorFormatter(error as Error);

    sendResponseMessage(statusCode, true, message, response);
  }
};
