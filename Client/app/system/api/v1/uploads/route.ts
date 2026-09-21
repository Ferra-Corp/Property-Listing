import { ServerUrl } from "@/app/_lib/config"
import { RequestTokens } from "@/app/_lib/Middleware/Authorization"
import { NextRequest, NextResponse } from "next/server"

export const POST = async (request: NextRequest) => {
  try {
    const user = RequestTokens(request),
      detailsBody = await request.json().catch(() => ({}))

    const signRequest = await fetch(`${ServerUrl}/api/uploads`, {
        method: "POST",
        headers: {
          authorization: `Bearer ${user.accessToken}`,
          "content-type": "application/json",
        },
        body: JSON.stringify(detailsBody),
      }),
      signResponse = await signRequest.json()

    if (!signRequest.ok)
      return NextResponse.json(
        { error: signResponse.response.message },
        { status: signRequest.status }
      )

    return NextResponse.json(signResponse.response.message, {
      status: signRequest.status,
    })
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
