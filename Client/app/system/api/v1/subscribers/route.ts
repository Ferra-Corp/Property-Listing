import { ServerUrl } from "@/app/_lib/config"
import {
  applyAuthCookies,
  authorizedFetch,
} from "@/app/_lib/Middleware/Authorization"
import { NextRequest, NextResponse } from "next/server"

// Two different callers share this one path: the public one-click
// unsubscribe link (?id=, no session) and the admin subscriber list (no
// query, authenticated) — see subscriber.controller.ts on the backend for
// the same split.
export const GET = async (request: NextRequest) => {
  try {
    const id = request.nextUrl.searchParams.get("id")

    if (id) {
      const unsubscribeRequest = await fetch(
          `${ServerUrl}/api/subscribers?id=${encodeURIComponent(id)}`
        ),
        unsubscribeResponse = await unsubscribeRequest.json()

      if (!unsubscribeRequest.ok)
        return NextResponse.json(
          { error: unsubscribeResponse.response.message },
          { status: unsubscribeRequest.status }
        )

      return NextResponse.json(unsubscribeResponse.response.message, {
        status: unsubscribeRequest.status,
      })
    }

    const { response: listRequest, rotatedCookies } = await authorizedFetch(
        request,
        `${ServerUrl}/api/subscribers`,
        { headers: { accept: "application/json" } }
      ),
      listResponse = await listRequest.json()

    if (!listRequest.ok)
      return NextResponse.json(
        { error: listResponse.response.message },
        { status: listRequest.status }
      )

    const response = NextResponse.json(listResponse.response.message, {
      status: listRequest.status,
    })
    if (rotatedCookies) applyAuthCookies(response, rotatedCookies)
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

// Public "new listings by email" form in the homepage footer — visitors
// signing up are never logged in, so this forwards straight through with
// no token attached, same as the leads/valuation-request forms. Also used
// by the admin's "Add subscriber" action when signed in — the backend
// upsert behaves identically either way.
export const POST = async (request: NextRequest) => {
  try {
    const detailsBody = await request.json()

    const subscribeRequest = await fetch(`${ServerUrl}/api/subscribers`, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify(detailsBody),
      }),
      subscribeResponse = await subscribeRequest.json()

    if (!subscribeRequest.ok)
      return NextResponse.json(
        { error: subscribeResponse.response.message },
        { status: subscribeRequest.status }
      )

    return NextResponse.json(subscribeResponse.response.message, {
      status: subscribeRequest.status,
    })
  } catch (error) {
    return NextResponse.json(
      { error: (error as Error).message },
      { status: 500 }
    )
  }
}
