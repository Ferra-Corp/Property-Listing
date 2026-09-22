import { ServerUrl } from "@/app/_lib/config"
import {
  applyAuthCookies,
  authorizedFetch,
} from "@/app/_lib/Middleware/Authorization"
import { NextRequest, NextResponse } from "next/server"

interface RouteParams {
  params: Promise<{ insightId: string; tagId: string }>
}

export const DELETE = async (request: NextRequest, params: RouteParams) => {
  try {
    const { insightId, tagId } = await params.params

    const { response: deleteRequest, rotatedCookies } = await authorizedFetch(
      request,
      `${ServerUrl}/api/insight-tags/${insightId}/${tagId}`,
      {
        method: "DELETE",
        headers: {},
      }
    )

    if (!deleteRequest.ok) {
      const deleteResponse = await deleteRequest.json()
      return NextResponse.json(
        { error: deleteResponse.response.message },
        { status: deleteRequest.status }
      )
    }

    const response = new NextResponse(null, { status: deleteRequest.status })
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
