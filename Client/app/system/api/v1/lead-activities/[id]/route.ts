import { ServerUrl } from "@/app/_lib/config"
import {
  applyAuthCookies,
  authorizedFetch,
} from "@/app/_lib/Middleware/Authorization"
import { NextRequest, NextResponse } from "next/server"

interface RouteParams {
  params: Promise<{ id: string }>
}

// `id` here is the lead id — returns just that lead's activity timeline.
export const GET = async (request: NextRequest, params: RouteParams) => {
  try {
    const leadId = (await params.params).id

    const { response: fetchRequest, rotatedCookies } = await authorizedFetch(
        request,
        `${ServerUrl}/api/lead-activities/${leadId}`,
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
