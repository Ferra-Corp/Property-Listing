import { NextRequest, NextResponse } from "next/server"
import { ServerUrl } from "../config"

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
    ...(refresh.maxAgeSeconds != null ? { maxAge: refresh.maxAgeSeconds } : {}),
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

type AuthorizedFetchResult = {
  response: Response
  /** Set-Cookie headers from a refresh this call had to spend — pass to
   * `applyAuthCookies` so the browser gets the rotated pair, or the next
   * request arrives with a refresh token the backend already revoked. */
  rotatedCookies: string[] | null
}

async function attemptWithRefresh(
  tokens: { accessToken: string; refreshToken: string },
  url: string,
  init: RequestInit,
  /** The browser-side AbortSignal from the incoming NextRequest. Forwarded
   * to the initial attempt and the retry so nginx stops seeing 499s when the
   * client navigates away before the server responds. Deliberately NOT passed
   * to the refresh fetch — aborting that mid-flight revokes the old session
   * without delivering the new token pair, silently destroying a valid session. */
  signal?: AbortSignal
): Promise<AuthorizedFetchResult> {
  const attempt = (accessToken: string) =>
    fetch(url, {
      ...init,
      signal,
      headers: { ...init.headers, authorization: `Bearer ${accessToken}` },
    })

  const first = await attempt(tokens.accessToken)

  if (first.status !== 401) return { response: first, rotatedCookies: null }

  // The access token lives 15 minutes; the refresh token is good for 30
  // days. A bare 401 this far in almost always just means the former
  // expired mid-session — spend the latter once, transparently, rather
  // than bounce an otherwise-valid session back to sign-in.
  // No signal here — see JSDoc above.
  const refreshRequest = await fetch(`${ServerUrl}/api/auth/refresh`, {
    method: "POST",
    headers: { cookie: backendRefreshCookieHeader(tokens.refreshToken) },
  })

  if (!refreshRequest.ok) return { response: first, rotatedCookies: null }

  const setCookieHeaders = refreshRequest.headers.getSetCookie(),
    newAccessToken = parseSetCookie(setCookieHeaders, "access_token")?.value

  if (!newAccessToken) return { response: first, rotatedCookies: null }

  // The retry carries the signal just like the first attempt — but we wrap
  // it so that an AbortError (browser cancelled after the refresh already
  // completed and the old session was revoked) doesn't silently lose the
  // newly-issued token pair. If the retry throws for any reason we fall
  // back to the original 401 response but still hand back rotatedCookies,
  // so the caller can write the fresh cookies to the browser. The next
  // request the browser makes will then succeed with the new access token
  // instead of being met with a stale refresh token and a forced logout.
  let retry: Response
  try {
    retry = await attempt(newAccessToken)
  } catch {
    return { response: first, rotatedCookies: setCookieHeaders }
  }

  return { response: retry, rotatedCookies: setCookieHeaders }
}

/**
 * The authenticated counterpart of a plain `fetch` to the backend: attaches
 * the caller's access token, and on a 401 spends the refresh token once and
 * retries before giving up. Every BFF route that requires a session should
 * call the backend through this rather than `fetch` directly — without it,
 * a session dies after 15 minutes of activity instead of lasting the full
 * 30-day refresh window, forcing a re-login the rest of the session doesn't
 * expect.
 *
 * The browser's AbortSignal is forwarded so that when the client cancels
 * (navigates away, component unmounts, etc.) the downstream fetch is also
 * aborted — preventing nginx from logging 499s for dangling connections.
 */
export async function authorizedFetch(
  request: NextRequest,
  url: string,
  init: RequestInit = {}
): Promise<AuthorizedFetchResult> {
  return attemptWithRefresh(RequestTokens(request), url, init, request.signal)
}

/**
 * Same retry-once-on-401 behavior as `authorizedFetch`, for a route an
 * anonymous visitor may also hit: with no session at all it just forwards
 * the plain request, and if a present session's tokens are both dead (the
 * refresh failed too) it falls back to one final anonymous request rather
 * than surface a staff member's expired session as an error on a public page.
 *
 * The browser's AbortSignal is forwarded on all three fetch paths for the
 * same reason as `authorizedFetch`.
 */
export async function optionalAuthorizedFetch(
  request: NextRequest,
  url: string,
  init: RequestInit = {}
): Promise<AuthorizedFetchResult> {
  const tokens = OptionalRequestTokens(request)

  if (!tokens)
    return { response: await fetch(url, { ...init, signal: request.signal }), rotatedCookies: null }

  const result = await attemptWithRefresh(tokens, url, init, request.signal)

  if (result.response.status !== 401) return result

  return { response: await fetch(url, { ...init, signal: request.signal }), rotatedCookies: null }
}
