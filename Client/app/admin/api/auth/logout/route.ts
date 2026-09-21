import { NextResponse } from "next/server"
import type { NextRequest } from "next/server"
import { ServerUrl } from "@/app/_lib/config"
import {
  backendRefreshCookieHeader,
  clearAuthCookies,
  OptionalRequestTokens,
} from "@/app/_lib/Middleware/Authorization"

// Mirrors the backend's "logout" auth action — not one of the routes the
// admin folder was scaffolded with yet, but there's no way to actually sign
// out (revoking the session server-side) without it. Always clears this
// app's own cookies, even if the backend call fails or there was never a
// valid session to begin with — logging out should never get "stuck".
export const POST = async (request: NextRequest) => {
  const user = OptionalRequestTokens(request)

  if (user) {
    try {
      await fetch(`${ServerUrl}/api/auth/logout`, {
        method: "POST",
        headers: { cookie: backendRefreshCookieHeader(user.refreshToken) },
      })
    } catch {
      // Best-effort revoke — the cookies get cleared below regardless.
    }
  }

  const response = NextResponse.json({ message: "Logged out" })

  clearAuthCookies(response)

  return response
}
