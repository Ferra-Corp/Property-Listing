import type { IncomingMessage, ServerResponse } from "node:http";
import { UAParser } from "ua-parser-js";

export interface ResponseBody {
  success: boolean;
  response: Record<string, any>;
}

export interface FormattedError {
  statusCode: number;
  message: string;
}

export interface ClientDetails {
  ipAddress: string;
  deviceName: string;
  os: string;
}

export async function getRequestBody(request: IncomingMessage) {
  return new Promise<Record<string, any>>((resolve, reject) => {
    let unparsedRequestBody: string = "";

    /** Hard ceiling: reject if the full body hasn't arrived within 30 s.
     * Prevents a stalled or slow-drip client from holding a connection
     * slot open indefinitely. */
    const timeout = setTimeout(() => {
      reject(new Error("Request body read timed out"));
    }, 30_000);

    const cleanup = () => clearTimeout(timeout);

    request.on("data", (data: Buffer) => {
      unparsedRequestBody += data.toString();
    });

    request.on("end", () => {
      cleanup();
      try {
        const parsedRequestBody = JSON.parse(unparsedRequestBody || "{}");
        resolve(parsedRequestBody);
      } catch (error) {
        reject(error);
      }
    });

    /** Stream error — e.g. malformed TCP framing, connection reset. */
    request.on("error", (error: Error) => {
      cleanup();
      reject(error);
    });

    /** Client closed the connection before sending the full body.
     * The "close" event fires before "end" in this case, so if "end"
     * never arrives we reject rather than hang. */
    request.on("close", () => {
      cleanup();
      if (!request.complete)
        reject(new Error("Client disconnected before the request body was fully received"));
    });
  });
}

export const sendResponseMessage = (
  statusCode: number,
  error: boolean,
  message: any,
  response: ServerResponse<IncomingMessage>,
) => {
  if (response.writableEnded) return;

  let responseMsg: ResponseBody = {
    success: error == true ? false : true,
    response: { message },
  };

  if (!response.headersSent)
    response.writeHead(statusCode, {
      "content-type": "application/json",
    });

  response.end(JSON.stringify(responseMsg));
};

export interface CookieOptions {
  httpOnly?: boolean;
  secure?: boolean;
  sameSite?: "Strict" | "Lax" | "None";
  path?: string;
  maxAgeSeconds?: number;
}

export function serializeCookie(
  name: string,
  value: string,
  options: CookieOptions = {},
): string {
  const segments = [`${name}=${encodeURIComponent(value)}`];

  segments.push(`Path=${options.path ?? "/"}`);

  if (options.maxAgeSeconds != null)
    segments.push(`Max-Age=${options.maxAgeSeconds}`);
  if (options.httpOnly ?? true) segments.push("HttpOnly");
  if (options.secure) segments.push("Secure");

  segments.push(`SameSite=${options.sameSite ?? "Lax"}`);

  return segments.join("; ");
}

export function clearCookie(name: string, path: string = "/"): string {
  return `${name}=; Path=${path}; Max-Age=0; HttpOnly`;
}

export function appendSetCookie(
  response: ServerResponse<IncomingMessage>,
  cookie: string,
): void {
  const existing = response.getHeader("Set-Cookie"),
    cookies = existing
      ? Array.isArray(existing)
        ? existing.map(String)
        : [String(existing)]
      : [];

  cookies.push(cookie);
  response.setHeader("Set-Cookie", cookies);
}

export function parseCookies(request: IncomingMessage): Record<string, string> {
  const header = request.headers.cookie,
    cookies: Record<string, string> = {};

  if (!header) return cookies;

  for (let pair of header.split(";")) {
    const separatorIndex = pair.indexOf("=");

    if (separatorIndex === -1) continue;

    const key = pair.slice(0, separatorIndex).trim(),
      value = pair.slice(separatorIndex + 1).trim();

    if (key) cookies[key] = decodeURIComponent(value);
  }

  return cookies;
}

export async function getClientDetails(
  request: IncomingMessage,
): Promise<ClientDetails> {
  const forwardedFor = request.headers["x-forwarded-for"];
  let rawIp: string | undefined;

  if (Array.isArray(forwardedFor)) rawIp = forwardedFor[0];
  else if (typeof forwardedFor === "string")
    rawIp = forwardedFor.split(",")[0]?.trim();

  const ipAddress: string =
    rawIp || request.socket.remoteAddress || "Unknown IP";

  let deviceName: string = "",
    operatingSystem: string = "";

  // 3. User-Agent parsing

  const rawUserAgent = request.headers["user-agent"],
    userAgent: string = Array.isArray(rawUserAgent)
      ? (rawUserAgent[0] ?? "")
      : (rawUserAgent ?? "");

  const parser = new UAParser(userAgent),
    device = parser.getDevice(),
    os = parser.getOS(),
    browser = parser.getBrowser();

  operatingSystem = os.name
    ? `${os.name}${os.version ? ` ${os.version}` : ""}`
    : "Unknown Operating System";

  if (device.vendor && device.model)
    // Mobile and Tablet devices typically report vendor and model
    deviceName = `${device.vendor} ${device.model}`;
  else if (os.name) {
    // Desktop browsers (macOS, Windows, Linux) intentionally do not report hardware models for privacy.
    // Build a useful desktop string like "macOS Computer (Chrome)"
    const browserInfo = browser.name ? ` (${browser.name})` : "";
    deviceName = `${os.name} Computer, ${browserInfo}`;
  } else deviceName = "Unknown Device";

  return {
    ipAddress,
    deviceName,
    os: operatingSystem,
  };
}

export class RepositoryError extends Error {
  constructor(
    message: string,
    public readonly cause?: unknown,
  ) {
    super(message);
    this.name = "RepositoryError";
  }
}

export class ServiceError extends Error {
  constructor(
    message: string,
    public readonly statusCode: number = 400,
  ) {
    super(message);
    this.name = "ServiceError";
  }
}

export class MiddlewareError extends Error {
  constructor(
    message: string,
    public readonly statusCode: number = 400,
  ) {
    super(message);
    this.name = "MiddlewareError";
  }
}

export const PathnameValidator = (pathnames: string[]): string => {
  if (!pathnames[2])
    throw new ServiceError("Specify extra argument in url segment", 400);

  return pathnames[2];
};

export function ErrorFormatter(error: Error): FormattedError {
  if (error instanceof ServiceError)
    return { statusCode: error.statusCode, message: error.message };

  if (error instanceof MiddlewareError)
    return { statusCode: error.statusCode, message: error.message };

  if (error instanceof RepositoryError) {
    console.error(error.message, error.cause ?? error);

    return { statusCode: 500, message: "A database error occurred" };
  }

  console.error(error);

  return { statusCode: 500, message: "An unexpected error occurred" };
}
