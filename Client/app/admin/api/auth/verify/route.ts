import { NextRequest, NextResponse } from "next/server"
import { ServerUrl } from "@/app/_lib/config"
import { applyAuthCookies } from "@/app/_lib/Middleware/Authorization"

// Completes a login that came back `mfaRequired` from /admin/api/auth/login —
// mirrors the backend's "verify-mfa" auth action.
export const POST = async (request: NextRequest) => {
  try {
    const { challenge, code } = await request.json()

    const verifyRequest = await fetch(`${ServerUrl}/api/auth/verify-mfa`, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ challenge, code }),
      }),
      verifyResponse = await verifyRequest.json()

    if (!verifyRequest.ok)
      return NextResponse.json(
        { error: verifyResponse.response.message },
        { status: verifyRequest.status }
      )

    const response = NextResponse.json({
      message: verifyResponse.response.message,
    })

    applyAuthCookies(response, verifyRequest.headers.getSetCookie())

    return response
  } catch (error) {
    return NextResponse.json(
      { error: (error as Error).message },
      { status: 500 }
    )
  }
}
