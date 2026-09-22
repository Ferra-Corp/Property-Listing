import { ServerUrl } from "@/app/_lib/config"
import {
  applyAuthCookies,
  authorizedFetch,
} from "@/app/_lib/Middleware/Authorization"
import { NextRequest, NextResponse } from "next/server"

export const POST = async (request: NextRequest) => {
  try {
    const detailsBody = await request.json().catch(() => ({}))

    const { response: signRequest, rotatedCookies } = await authorizedFetch(
        request,
        `${ServerUrl}/api/uploads`,
        {
          method: "POST",
          headers: {
            "content-type": "application/json",
          },
          body: JSON.stringify(detailsBody),
        }
      ),
      signResponse = await signRequest.json()

    if (!signRequest.ok)
      return NextResponse.json(
        { error: signResponse.response.message },
        { status: signRequest.status }
      )

    const response = NextResponse.json(signResponse.response.message, {
      status: signRequest.status,
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
