import { ServerUrl } from "@/app/_lib/config"
import {
  applyAuthCookies,
  authorizedFetch,
  optionalAuthorizedFetch,
} from "@/app/_lib/Middleware/Authorization"
import { NextRequest, NextResponse } from "next/server"

// GET is public — an anonymous visitor sees active services only, a staff
// session (if present) sees everything.
export const GET = async (request: NextRequest) => {
  try {
    const { response: servicesFetch, rotatedCookies } =
        await optionalAuthorizedFetch(request, `${ServerUrl}/api/services`, {
          method: "GET",
          headers: {
            accept: "application/json",
          },
        }),
      servicesResponse = await servicesFetch.json()

    if (!servicesFetch.ok)
      return NextResponse.json(
        {
          error: servicesResponse.response.message,
        },
        {
          status: servicesFetch.status,
        }
      )

    const response = NextResponse.json(servicesResponse.response.message, {
      status: servicesFetch.status,
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
    const body = await request.json()

    const { response: creationRequest, rotatedCookies } = await authorizedFetch(
        request,
        `${ServerUrl}/api/services`,
        {
          method: "POST",
          headers: {
            "content-type": "application/json",
          },
          body: JSON.stringify(body),
        }
      ),
      creationResponse = await creationRequest.json()

    if (!creationRequest.ok)
      return NextResponse.json(
        {
          error: creationResponse.response.message,
        },
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
