import { ServerUrl } from "@/app/_lib/config"
import { applyAuthCookies, authorizedFetch } from "@/app/_lib/Middleware/Authorization"
import { NextRequest, NextResponse } from "next/server"

// Pulls today's rates for every active currency from the backend's
// configured primary source and upserts them — admin-only, mirrors the
// base /exchange-rates POST's auth shape exactly.
export const POST = async (request: NextRequest) => {
  try {
    const { response: refreshRequest, rotatedCookies } = await authorizedFetch(
        request,
        `${ServerUrl}/api/exchange-rates/refresh`,
        { method: "POST" }
      ),
      refreshResponse = await refreshRequest.json()

    if (!refreshRequest.ok)
      return NextResponse.json(
        { error: refreshResponse.response.message },
        { status: refreshRequest.status }
      )

    const response = NextResponse.json(refreshResponse.response.message, {
      status: refreshRequest.status,
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
