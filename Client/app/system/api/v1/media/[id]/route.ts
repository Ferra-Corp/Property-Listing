import { ServerUrl } from "@/app/_lib/config"
import { RequestTokens } from "@/app/_lib/Middleware/Authorization"
import { NextRequest, NextResponse } from "next/server"

interface RouteParams {
  params: Promise<{ id: string }>
}

export const PATCH = async (request: NextRequest, params: RouteParams) => {
  try {
    const user = RequestTokens(request),
      mediaId = (await params.params).id,
      newDetails = await request.json()

    const patchRequest = await fetch(`${ServerUrl}/api/media/${mediaId}`, {
        method: "PATCH",
        headers: {
          authorization: `Bearer ${user.accessToken}`,
          "content-type": "application/json",
        },
        body: JSON.stringify(newDetails),
      }),
      patchResponse = await patchRequest.json()

    if (!patchRequest.ok)
      return NextResponse.json(
        { error: patchResponse.response.message },
        { status: patchRequest.status }
      )

    return NextResponse.json(patchResponse.response.message, {
      status: patchRequest.status,
    })
  } catch (error) {
    return NextResponse.json(
      { error: (error as Error).message },
      { status: 500 }
    )
  }
}

export const DELETE = async (request: NextRequest, params: RouteParams) => {
  try {
    const user = RequestTokens(request),
      mediaId = (await params.params).id

    const deleteRequest = await fetch(`${ServerUrl}/api/media/${mediaId}`, {
      method: "DELETE",
      headers: {
        authorization: `Bearer ${user.accessToken}`,
      },
    })

    if (!deleteRequest.ok) {
      const deleteResponse = await deleteRequest.json()
      return NextResponse.json(
        { error: deleteResponse.response.message },
        { status: deleteRequest.status }
      )
    }

    return new NextResponse(null, { status: deleteRequest.status })
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
