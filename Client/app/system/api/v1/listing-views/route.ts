import { ServerUrl } from "@/app/_lib/config"
import {
  applyAuthCookies,
  authorizedFetch,
} from "@/app/_lib/Middleware/Authorization"
import { NextRequest, NextResponse } from "next/server"

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

// Public anonymous tracking beacon — visitors browsing listings are never logged in,
// so this forwards the beacon straight through with no token attached.
export const POST = async (request: NextRequest) => {
  try {
    const detailsBody = await request.json()

    const creationRequest = await fetch(`${ServerUrl}/api/listing-views`, {
        method: "POST",
        headers: {
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
    return NextResponse.json(
      { error: (error as Error).message },
      { status: 500 }
    )
  }
}
