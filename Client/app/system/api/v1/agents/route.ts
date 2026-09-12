import { ServerUrl } from "@/app/_lib/config"
import { OptionalRequestTokens } from "@/app/_lib/Middleware/Authorization"
import { NextRequest, NextResponse } from "next/server"

// GET is public — an anonymous visitor sees active agents only, a staff
// session (if present) sees everything. See agent.controller.ts.
export const GET = async (request: NextRequest) => {
  try {
    const user = OptionalRequestTokens(request)

    const fetchRequest = await fetch(`${ServerUrl}/api/agents`, {
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
