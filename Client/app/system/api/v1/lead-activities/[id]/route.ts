import { ServerUrl } from "@/app/_lib/config"
import { RequestTokens } from "@/app/_lib/Middleware/Authorization"
import { NextRequest, NextResponse } from "next/server"

interface RouteParams {
  params: Promise<{ id: string }>
}

// `id` here is the lead id — returns just that lead's activity timeline.
export const GET = async (request: NextRequest, params: RouteParams) => {
  try {
    const user = RequestTokens(request),
      leadId = (await params.params).id

    const fetchRequest = await fetch(
        `${ServerUrl}/api/lead-activities/${leadId}`,
        {
          method: "GET",
          headers: {
            authorization: `Bearer ${user.accessToken}`,
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

    return NextResponse.json(fetchResponse.response.message, {
      status: fetchRequest.status,
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
