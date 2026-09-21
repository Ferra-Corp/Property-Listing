import { NextRequest, NextResponse } from "next/server"
import { ServerUrl } from "@/app/_lib/config"
import { applyAuthCookies } from "@/app/_lib/Middleware/Authorization"

// Mirrors the backend's "login" auth action. A 2FA-enabled account gets
// `{ mfaRequired: true, challenge, expires_in }` back with no cookies set
// yet — the client must then call /admin/api/auth/verify with that
// challenge and a TOTP code to actually complete the login.
export const POST = async (request: NextRequest) => {
  try {
    const { email, password } = await request.json()

    const loginRequest = await fetch(`${ServerUrl}/api/auth/login`, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ email, password }),
      }),
      loginResponse = await loginRequest.json()

    if (!loginRequest.ok)
      return NextResponse.json(
        { error: loginResponse.response.message },
        { status: loginRequest.status }
      )

    const message = loginResponse.response.message

    if (message && typeof message === "object" && "mfaRequired" in message)
      return NextResponse.json(message, { status: 200 })

    const response = NextResponse.json(
      { mfaRequired: false, message },
      { status: 200 }
    )

    applyAuthCookies(response, loginRequest.headers.getSetCookie())

    return response
  } catch (error) {
    return NextResponse.json(
      { error: (error as Error).message },
      { status: 500 }
    )
  }
}
