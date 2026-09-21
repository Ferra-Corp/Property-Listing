import { NextRequest, NextResponse } from "next/server"
import { ServerUrl } from "./app/_lib/config"

/**
 * Every `/admin/*` page except the auth screens themselves needs a real
 * session — checked here, once, before any of the nested admin layouts or
 * their contexts ever mount, rather than inside that (fairly entangled)
 * client tree. `/admin/api/*` is excluded by the matcher below: those BFF
 * routes return JSON and already 401 for themselves, an HTML redirect would
 * just break whatever called them.
 *
 * The actual "is this session valid" question — including transparently
 * retrying on the refresh token when the 15-minute access token has simply
 * expired — is answered by /admin/api/auth/me, so this stays a thin
 * consumer of that one answer instead of a second copy of the same logic.
 */
async function guardAdminRoute(request: NextRequest): Promise<NextResponse> {
  const hasSession =
    request.cookies.has("accessToken") || request.cookies.has("refreshToken")

  const signInUrl = new URL("/admin/auth/sign-in", request.url)
  signInUrl.searchParams.set(
    "next",
    request.nextUrl.pathname + request.nextUrl.search
  )

  if (!hasSession) return NextResponse.redirect(signInUrl)

  try {
    const meCheck = await fetch(new URL("/admin/api/auth/me", request.url), {
      headers: { cookie: request.headers.get("cookie") ?? "" },
    })

    if (!meCheck.ok) {
      const response = NextResponse.redirect(signInUrl)
      response.cookies.delete("accessToken")
      response.cookies.delete("refreshToken")
      return response
    }

    // /me may have just rotated the session (the access token had expired
    // and it fell back to the refresh token) — carry those new cookies
    // through to the browser on this same response, rather than have it
    // arrive with tokens the browser was never actually given.
    const response = NextResponse.next()
    for (const cookie of meCheck.headers.getSetCookie()) {
      response.headers.append("set-cookie", cookie)
    }
    return response
  } catch {
    // Backend unreachable — fail open rather than locking every admin out
    // during a backend hiccup; each page's own BFF calls will still 401.
    return NextResponse.next()
  }
}

/**
 * Redirects are a fixed, admin-maintained list of "old path → new path"
 * mappings (e.g. a listing slug that changed) — there is no way to invent a
 * destination for a URL nobody ever told us about. Anything with no rule
 * falls straight through to the normal router, which ends at the site's own
 * not-found page.
 *
 * The backend resolves the path and counts the hit in one atomic call
 * (`GET /api/redirects?path=`) — resolving a redirect *is* a hit, so there
 * is no separate "record a hit" request to keep in sync, and nothing here
 * needs its own cache: the lookup is a single indexed query on a unique
 * column, cheap enough to run per request.
 */
export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl

  if (pathname.startsWith("/admin")) {
    if (pathname.startsWith("/admin/auth")) return NextResponse.next()
    return guardAdminRoute(request)
  }

  try {
    const lookup = await fetch(
      `${ServerUrl}/api/redirects?path=${encodeURIComponent(pathname)}`,
      { headers: { accept: "application/json" } }
    )

    if (lookup.ok) {
      // The backend wraps every response as {success, response: {message}}
      // — this hits it directly (not through the Next proxy routes, which
      // unwrap this for the frontend), so it has to unwrap it here too.
      const body = await lookup.json(),
        match = body?.response?.message as {
          to_path: string
          status_code: number
        } | null

      if (match) {
        return NextResponse.redirect(
          new URL(match.to_path, request.url),
          match.status_code
        )
      }
    }
  } catch {
    // Backend unreachable — fall through to normal routing rather than
    // breaking every request on the site.
  }

  return NextResponse.next()
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|admin/api|system/api).*)",
  ],
}
