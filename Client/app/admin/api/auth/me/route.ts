import { NextRequest, NextResponse } from "next/server"
import { ServerUrl } from "@/app/_lib/config"
import {
  applyAuthCookies,
  backendRefreshCookieHeader,
  parseSetCookie,
  RequestTokens,
} from "@/app/_lib/Middleware/Authorization"

// Mirrors the backend's "me" auth action — it's how the frontend finds out
// who is signed in (and with what role), since login itself never returns
// the user record. The access token only lives 15 minutes, so a plain
// visit here after a short idle period would otherwise 401 even though the
// refresh token (good for 30 days) is still perfectly valid — this tries
// the refresh once, transparently, before actually giving up.
export const GET = async (request: NextRequest) => {
  try {
    const user = RequestTokens(request)

    const meRequest = await fetch(`${ServerUrl}/api/auth/me`, {
        method: "GET",
        headers: { authorization: `Bearer ${user.accessToken}` },
      }),
      meResponse = await meRequest.json()

    if (meRequest.ok)
      return NextResponse.json(meResponse.response.message, { status: 200 })

    if (meRequest.status !== 401)
      return NextResponse.json(
        { error: meResponse.response.message },
        { status: meRequest.status }
      )

    // Access token looks expired/invalid — the backend's own refresh action
    // reads the refresh token from a `refresh_token` cookie by name (never
    // from the body), so that's how it has to be forwarded here too.
    const refreshRequest = await fetch(`${ServerUrl}/api/auth/refresh`, {
        method: "POST",
        headers: { cookie: backendRefreshCookieHeader(user.refreshToken) },
      }),
      refreshResponse = await refreshRequest.json()

    if (!refreshRequest.ok)
      return NextResponse.json(
        { error: refreshResponse.response.message },
        { status: refreshRequest.status }
      )

    // The new tokens only ever exist in the backend's own Set-Cookie
    // headers on this response, never in the JSON body.
    const setCookieHeaders = refreshRequest.headers.getSetCookie(),
      newAccessToken = parseSetCookie(setCookieHeaders, "access_token")?.value

    if (!newAccessToken)
      return NextResponse.json(
        { error: "Session refresh didn't return a usable token" },
        { status: 401 }
      )

    const retryRequest = await fetch(`${ServerUrl}/api/auth/me`, {
        method: "GET",
        headers: { authorization: `Bearer ${newAccessToken}` },
      }),
      retryResponse = await retryRequest.json()

    if (!retryRequest.ok)
      return NextResponse.json(
        { error: retryResponse.response.message },
        { status: retryRequest.status }
      )

    const response = NextResponse.json(retryResponse.response.message, {
      status: 200,
    })

    applyAuthCookies(response, setCookieHeaders)

    return response
  } catch (error) {
    switch ((error as Error).message) {
      case "Access token and refresh token aren't provided":
        return NextResponse.json(
          { error: "Authentication tokens not provided, unkwown user" },
          { status: 401 }
        )
      default:
        return NextResponse.json(
          { error: (error as Error).message },
          { status: 500 }
        )
    }
  }
}
