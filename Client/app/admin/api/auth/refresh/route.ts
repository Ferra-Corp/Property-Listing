import { NextRequest, NextResponse } from "next/server"
import { ServerUrl } from "@/app/_lib/config"
import {
  applyAuthCookies,
  backendRefreshCookieHeader,
  clearAuthCookies,
  RequestTokens,
} from "@/app/_lib/Middleware/Authorization"

// Mirrors the backend's "refresh" auth action — not one of the routes the
// admin folder was scaffolded with yet, but a real login can't stay signed
// in without it (the access token expires every 15 minutes), so it belongs
// alongside the others here.
export const POST = async (request: NextRequest) => {
  try {
    const user = RequestTokens(request)

    const refreshRequest = await fetch(`${ServerUrl}/api/auth/refresh`, {
        method: "POST",
        headers: { cookie: backendRefreshCookieHeader(user.refreshToken) },
      }),
      refreshResponse = await refreshRequest.json()

    if (!refreshRequest.ok) {
      const response = NextResponse.json(
        { error: refreshResponse.response.message },
        { status: refreshRequest.status }
      )

      clearAuthCookies(response)
      return response
    }

    const response = NextResponse.json({
      message: refreshResponse.response.message,
    })

    applyAuthCookies(response, refreshRequest.headers.getSetCookie())

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
