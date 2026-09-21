import { ServerUrl } from "@/app/_lib/config"
import {
  OptionalRequestTokens,
  RequestTokens,
} from "@/app/_lib/Middleware/Authorization"
import { NextRequest, NextResponse } from "next/server"

// GET is public — the marketing site reads real contact/office settings
// with no session. See settings.controller.ts.
export const GET = async (request: NextRequest) => {
  try {
    const user = OptionalRequestTokens(request)

    const fetchRequest = await fetch(`${ServerUrl}/api/settings`, {
        method: "GET",
        headers: {
          ...(user ? { authorization: `Bearer ${user.accessToken}` } : {}),
          accept: "application/json",
        },
      }),
      fetchResponse = await fetchRequest.json()

    if (!fetchRequest.ok)
      return NextResponse.json(
        { error: fetchResponse.response.message },
        { status: fetchRequest.status }
      )

    return NextResponse.json(fetchResponse.response.message, {
      status: fetchRequest.status,
    })
  } catch (error) {
    return NextResponse.json(
      { error: (error as Error).message },
      { status: 500 }
    )
  }
}

export const POST = async (request: NextRequest) => {
  try {
    const user = RequestTokens(request),
      detailsBody = await request.json()

    const creationRequest = await fetch(`${ServerUrl}/api/settings`, {
        method: "POST",
        headers: {
          authorization: `Bearer ${user.accessToken}`,
          "content-type": "application/json",
        },
        body: JSON.stringify(detailsBody),
      }),
      creationResponse = await creationRequest.json()

    if (!creationRequest.ok)
      return NextResponse.json(
        { error: creationResponse.response.message },
        { status: creationRequest.status }
      )

    return NextResponse.json(creationResponse.response.message, {
      status: creationRequest.status,
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
