import { ServerUrl } from "@/app/_lib/config"
import {
  applyAuthCookies,
  authorizedFetch,
} from "@/app/_lib/Middleware/Authorization"
import { NextRequest, NextResponse } from "next/server"

interface RouteParams {
  params: Promise<{ id: string }>
}

export const PATCH = async (request: NextRequest, params: RouteParams) => {
  try {
    const mediaId = (await params.params).id,
      newDetails = await request.json()

    const { response: patchRequest, rotatedCookies } = await authorizedFetch(
        request,
        `${ServerUrl}/api/media/${mediaId}`,
        {
          method: "PATCH",
          headers: {
            "content-type": "application/json",
          },
          body: JSON.stringify(newDetails),
        }
      ),
      patchResponse = await patchRequest.json()

    if (!patchRequest.ok)
      return NextResponse.json(
        { error: patchResponse.response.message },
        { status: patchRequest.status }
      )

    const response = NextResponse.json(patchResponse.response.message, {
      status: patchRequest.status,
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

export const DELETE = async (request: NextRequest, params: RouteParams) => {
  try {
    const mediaId = (await params.params).id

    const { response: deleteRequest, rotatedCookies } = await authorizedFetch(
      request,
      `${ServerUrl}/api/media/${mediaId}`,
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
