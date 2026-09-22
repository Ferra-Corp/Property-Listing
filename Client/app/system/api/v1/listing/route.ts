import { ServerUrl } from "@/app/_lib/config"
import {
  applyAuthCookies,
  authorizedFetch,
  optionalAuthorizedFetch,
} from "@/app/_lib/Middleware/Authorization"
import { NextRequest, NextResponse } from "next/server"

// GET is public — an anonymous visitor sees published listings only, a
// staff session (if present) sees everything. See listing.controller.ts.
export const GET = async (request: NextRequest) => {
  try {
    const { response: listFetch, rotatedCookies } =
        await optionalAuthorizedFetch(request, `${ServerUrl}/api/listings`, {
          method: "GET",
          headers: {
            accept: "application/json",
          },
        }),
      fetchResponse = await listFetch.json()

    if (!listFetch.ok)
      return NextResponse.json(
        {
          error: fetchResponse.response.message,
        },
        {
          status: listFetch.status,
        }
      )

    const response = NextResponse.json(fetchResponse.response.message, {
      status: 200,
    })
    if (rotatedCookies) applyAuthCookies(response, rotatedCookies)
    return response
  } catch (error) {
    return NextResponse.json(
      { error: (error as Error).message },
      { status: 500 }
    )
  }
}

export const POST = async (request: NextRequest) => {
  try {
    const detailsBody = await request.json()

    const { response: creationRequest, rotatedCookies } = await authorizedFetch(
        request,
        `${ServerUrl}/api/listings`,
        {
          method: "POST",
          headers: {
            "content-type": "application/json",
          },
          body: JSON.stringify(detailsBody),
        }
      ),
      creationResponse = await creationRequest.json()

    if (!creationRequest.ok)
      return NextResponse.json(
        {
          error: creationResponse.response.message,
        },
        {
          status: creationRequest.status,
        }
      )

    const response = NextResponse.json(creationResponse.response.message, {
      status: creationRequest.status,
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
