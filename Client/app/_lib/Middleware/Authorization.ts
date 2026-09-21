import { NextRequest, NextResponse } from "next/server"

const ACCESS_TOKEN_COOKIE = "accessToken",
  REFRESH_TOKEN_COOKIE = "refreshToken"

export const RequestTokens = (request: NextRequest) => {
  try {
    const cookies = request.cookies,
      accessToken = cookies.get(ACCESS_TOKEN_COOKIE),
      refreshToken = cookies.get(REFRESH_TOKEN_COOKIE)

    if (!accessToken || !refreshToken)
      throw new Error("Access token and refresh token aren't provided")

    return {
      accessToken: accessToken.value,
      refreshToken: refreshToken.value,
    }
  } catch (error) {
    throw error
  }
}

/**
 * Same as `RequestTokens`, but for routes a visitor may hit anonymously (e.g.
 * a public listing/insight/agent/service page). Returns `null` instead of
 * throwing when there's no staff session, so the caller can forward the
 * request without a Bearer token and let the backend's own public-read
 * filtering apply, rather than blocking the request outright.
 */
export const OptionalRequestTokens = (request: NextRequest) => {
  try {
    return RequestTokens(request)
  } catch {
    return null
  }
}

type BackendCookie = { value: string; maxAgeSeconds: number | null }

/** Backend `Set-Cookie` values only ever exist on this server-to-server
 * fetch response — the browser never sees them — so they must be parsed
 * out by hand rather than read via `request.cookies`. */
export function parseSetCookie(
  setCookieHeaders: string[],
  name: string
): BackendCookie | null {
  for (const raw of setCookieHeaders) {
    const [pair, ...attributes] = raw.split(";").map((part) => part.trim()),
      separatorIndex = pair.indexOf("=")

    if (separatorIndex === -1 || pair.slice(0, separatorIndex) !== name)
      continue

    const maxAgeAttribute = attributes.find((attribute) =>
      attribute.toLowerCase().startsWith("max-age=")
    )

    return {
      value: decodeURIComponent(pair.slice(separatorIndex + 1)),
      maxAgeSeconds: maxAgeAttribute
        ? Number(maxAgeAttribute.split("=")[1])
        : null,
    }
  }

  return null
}

const isSecureCookie = process.env.NODE_ENV === "production"

/**
 * Reads the backend's own `access_token`/`refresh_token` Set-Cookie headers
 * and re-issues them as this app's own `accessToken`/`refreshToken`
 * cookies, so `RequestTokens` above can find them on later requests.
 * Returns false without setting anything when the backend didn't actually
 * complete a login — e.g. an `mfaRequired` response carries no tokens yet.
 */
export function applyAuthCookies(
  response: NextResponse,
  setCookieHeaders: string[]
): boolean {
  const access = parseSetCookie(setCookieHeaders, "access_token"),
    refresh = parseSetCookie(setCookieHeaders, "refresh_token")

  if (!access || !refresh) return false

  response.cookies.set(ACCESS_TOKEN_COOKIE, access.value, {
    httpOnly: true,
    secure: isSecureCookie,
    sameSite: "lax",
    path: "/",
    ...(access.maxAgeSeconds != null ? { maxAge: access.maxAgeSeconds } : {}),
  })

  response.cookies.set(REFRESH_TOKEN_COOKIE, refresh.value, {
    httpOnly: true,
    secure: isSecureCookie,
    sameSite: "lax",
    path: "/",
    ...(refresh.maxAgeSeconds != null
      ? { maxAge: refresh.maxAgeSeconds }
      : {}),
  })

  return true
}

export function clearAuthCookies(response: NextResponse): void {
  response.cookies.delete(ACCESS_TOKEN_COOKIE)
  response.cookies.delete(REFRESH_TOKEN_COOKIE)
}

/** Builds the raw `Cookie` header the backend's own `refresh`/`logout`
 * actions expect — they read a `refresh_token` cookie by name, which only
 * ever exists on this server-to-server call, never in the browser. */
export function backendRefreshCookieHeader(refreshToken: string): string {
  return `refresh_token=${encodeURIComponent(refreshToken)}`
}
