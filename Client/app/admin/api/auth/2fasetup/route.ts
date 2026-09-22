import { NextRequest, NextResponse } from "next/server"
import { ServerUrl } from "@/app/_lib/config"
import {
  applyAuthCookies,
  authorizedFetch,
} from "@/app/_lib/Middleware/Authorization"

// Two-step 2FA enrolment for the signed-in user, mirroring the backend's
// "generateotp" and "verifyotp" auth actions:
//   POST  -> issue a new TOTP secret + QR code
//   PUT   -> confirm the code the user scanned it into their app

export const POST = async (request: NextRequest) => {
  try {
    const { response: generateRequest, rotatedCookies } = await authorizedFetch(
        request,
        `${ServerUrl}/api/auth/generateotp`,
        {
          method: "POST",
        }
      ),
      generateResponse = await generateRequest.json()

    if (!generateRequest.ok)
      return NextResponse.json(
        { error: generateResponse.response.message },
        { status: generateRequest.status }
      )

    const response = NextResponse.json(generateResponse.response.message, {
      status: 200,
    })
    if (rotatedCookies) applyAuthCookies(response, rotatedCookies)
    return response
  } catch (error) {
    switch ((error as Error).message) {
      case "Access token and refresh token aren't provided":
        return NextResponse.json(
          { error: "Authentication tokens not provided, unkwown user" },
          { status: 401 }
        )
      default:
        return NextResponse.json(
          { error: (error as Error).message },
          { status: 500 }
        )
    }
  }
}

export const PUT = async (request: NextRequest) => {
  try {
    const { code } = await request.json()

    const { response: verifyRequest, rotatedCookies } = await authorizedFetch(
        request,
        `${ServerUrl}/api/auth/verifyotp`,
        {
          method: "POST",
          headers: {
            "content-type": "application/json",
          },
          body: JSON.stringify({ code }),
        }
      ),
      verifyResponse = await verifyRequest.json()

    if (!verifyRequest.ok)
      return NextResponse.json(
        { error: verifyResponse.response.message },
        { status: verifyRequest.status }
      )

    const response = NextResponse.json(
      { message: verifyResponse.response.message },
      { status: 200 }
    )
    if (rotatedCookies) applyAuthCookies(response, rotatedCookies)
    return response
  } catch (error) {
    switch ((error as Error).message) {
      case "Access token and refresh token aren't provided":
        return NextResponse.json(
          { error: "Authentication tokens not provided, unkwown user" },
          { status: 401 }
        )
      default:
        return NextResponse.json(
          { error: (error as Error).message },
          { status: 500 }
        )
    }
  }
}
