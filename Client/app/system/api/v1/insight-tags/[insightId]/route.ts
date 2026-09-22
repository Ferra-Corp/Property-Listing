import { ServerUrl } from "@/app/_lib/config"
import {
  applyAuthCookies,
  authorizedFetch,
} from "@/app/_lib/Middleware/Authorization"
import { NextRequest, NextResponse } from "next/server"

interface RouteParams {
  params: Promise<{ insightId: string }>
}

export const GET = async (request: NextRequest, params: RouteParams) => {
  try {
    const insightId = (await params.params).insightId

    const { response: fetchRequest, rotatedCookies } = await authorizedFetch(
        request,
        `${ServerUrl}/api/insight-tags/${insightId}`,
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

export const POST = async (request: NextRequest, params: RouteParams) => {
  try {
    const insightId = (await params.params).insightId,
      detailsBody = await request.json()

    const { response: creationRequest, rotatedCookies } = await authorizedFetch(
        request,
        `${ServerUrl}/api/insight-tags/${insightId}`,
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
        { error: creationResponse.response.message },
        { status: creationRequest.status }
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
