import { NextRequest, NextResponse } from "next/server"
import { ServerUrl } from "./app/_lib/config"

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
    "/((?!_next/static|_next/image|favicon.ico|admin|system/api).*)",
  ],
}
