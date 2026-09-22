import { ServerUrl } from "@/app/_lib/config"
import {
  applyAuthCookies,
  authorizedFetch,
  OptionalRequestTokens,
} from "@/app/_lib/Middleware/Authorization"
import { NextRequest, NextResponse } from "next/server"

const VISITOR_COOKIE = "vid",
  VISITOR_COOKIE_MAX_AGE_SECONDS = 400 * 24 * 60 * 60 // ~400 days — the longest Chrome will honor for a first-party cookie.

/** Hashes the visitor cookie's value rather than forwarding it as-is, so the
 * backend never sees (or stores) anything that identifies a browser on its
 * own — matching the `listing_views.session_hash` column's own intent
 * ("hashed; no raw IP retained"), just keyed off a cookie instead of an IP. */
async function hashVisitorId(id: string): Promise<string> {
  const digest = await crypto.subtle.digest(
    "SHA-256",
    new TextEncoder().encode(id),
  )
  return Array.from(new Uint8Array(digest))
    .map((byte) => byte.toString(16).padStart(2, "0"))
    .join("")
}

/** Coarse device bucket from the User-Agent — good enough for the
 * `device VARCHAR(20)` column without pulling in a full UA-parsing library. */
function deviceFromUserAgent(userAgent: string | null): string | null {
  if (!userAgent) return null
  if (/tablet|ipad/i.test(userAgent)) return "tablet"
  if (/mobile|android|iphone/i.test(userAgent)) return "mobile"
  return "desktop"
}

export const GET = async (request: NextRequest) => {
  try {
    const { response: fetchRequest, rotatedCookies } = await authorizedFetch(
        request,
        `${ServerUrl}/api/listing-views`,
        {
          method: "GET",
          headers: {
            accept: "application/json",
          },
        }
      ),
      fetchResponse = await fetchRequest.json()

    if (!fetchRequest.ok)
      return NextResponse.json(
        { error: fetchResponse.response.message },
        { status: fetchRequest.status }
      )

    const response = NextResponse.json(fetchResponse.response.message, {
      status: fetchRequest.status,
    })
    if (rotatedCookies) applyAuthCookies(response, rotatedCookies)
    return response
  } catch (error) {
    switch ((error as Error).message) {
      case "Access token and refresh token aren't provided":
        return NextResponse.json(
          {
            error: "Authentication tokens not provided, unkwown user",
          },
          {
            status: 401,
          }
        )
      default:
        return NextResponse.json(
          { error: (error as Error).message },
          {
            status: 500,
          }
        )
    }
  }
}

// Public anonymous tracking beacon — but "public" only means it never
// requires a session, not that a signed-in one is ignored: a staff member
// still carries their admin cookies while previewing a listing's public
// page (e.g. via "View public page"), and their visits must never count.
export const POST = async (request: NextRequest) => {
  try {
    // Presence of a staff session is enough on its own — no need to spend
    // a round trip verifying the token is still live just to exclude it.
    if (OptionalRequestTokens(request)) {
      return NextResponse.json({ counted: false, reason: "staff" })
    }

    const detailsBody = await request.json()

    const existingVisitorId = request.cookies.get(VISITOR_COOKIE)?.value,
      visitorId = existingVisitorId ?? crypto.randomUUID(),
      session_hash = await hashVisitorId(visitorId)

    const creationRequest = await fetch(`${ServerUrl}/api/listing-views`, {
        method: "POST",
        headers: {
          "content-type": "application/json",
        },
        body: JSON.stringify({
          ...detailsBody,
          session_hash,
          referrer: detailsBody.referrer ?? request.headers.get("referer"),
          device: deviceFromUserAgent(request.headers.get("user-agent")),
        }),
      }),
      creationResponse = await creationRequest.json()

    if (!creationRequest.ok)
      return NextResponse.json(
        { error: creationResponse.response.message },
        { status: creationRequest.status }
      )

    const response = NextResponse.json(creationResponse.response.message, {
      status: creationRequest.status,
    })

    if (!existingVisitorId) {
      response.cookies.set(VISITOR_COOKIE, visitorId, {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "lax",
        path: "/",
        maxAge: VISITOR_COOKIE_MAX_AGE_SECONDS,
      })
    }

    return response
  } catch (error) {
    return NextResponse.json(
      { error: (error as Error).message },
      { status: 500 }
    )
  }
}
