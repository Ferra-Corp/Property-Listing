import { NextRequest, NextResponse } from "next/server"
import { ServerUrl } from "@/app/_lib/config"

// Mirrors the backend's "reset-password" auth action — `token` is the
// one-time reset token issued via the forgot-password email link.
export const POST = async (request: NextRequest) => {
  try {
    const { token, password } = await request.json()

    const resetRequest = await fetch(`${ServerUrl}/api/auth/reset-password`, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ token, password }),
      }),
      resetResponse = await resetRequest.json()

    if (!resetRequest.ok)
      return NextResponse.json(
        { error: resetResponse.response.message },
        { status: resetRequest.status }
      )

    return NextResponse.json(
      { message: resetResponse.response.message },
      { status: 200 }
    )
  } catch (error) {
    return NextResponse.json(
      { error: (error as Error).message },
      { status: 500 }
    )
  }
}
