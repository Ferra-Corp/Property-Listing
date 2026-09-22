import { ServerUrl } from "@/app/_lib/config"
import {
  applyAuthCookies,
  optionalAuthorizedFetch,
} from "@/app/_lib/Middleware/Authorization"
import { NextRequest, NextResponse } from "next/server"

// GET is public — an anonymous visitor sees active agents only, a staff
// session (if present) sees everything. See agent.controller.ts.
export const GET = async (request: NextRequest) => {
  try {
    const { response: fetchRequest, rotatedCookies } =
        await optionalAuthorizedFetch(request, `${ServerUrl}/api/agents`, {
          method: "GET",
          headers: {
            accept: "application/json",
          },
        }),
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
    return NextResponse.json(
      { error: (error as Error).message },
      { status: 500 }
    )
  }
}
