import { NextRequest, NextResponse } from "next/server"
import { ServerUrl } from "@/app/_lib/config"

// Mirrors the backend's "forgot-password" auth action — always responds the
// same way whether or not the email matches an account, so this route never
// reveals which emails are registered.
export const POST = async (request: NextRequest) => {
  try {
    const { email } = await request.json()

    const forgotRequest = await fetch(`${ServerUrl}/api/auth/forgot-password`, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ email }),
      }),
      forgotResponse = await forgotRequest.json()

    if (!forgotRequest.ok)
      return NextResponse.json(
        { error: forgotResponse.response.message },
        { status: forgotRequest.status }
      )

    return NextResponse.json(
      { message: forgotResponse.response.message },
      { status: 200 }
    )
  } catch (error) {
    return NextResponse.json(
      { error: (error as Error).message },
      { status: 500 }
    )
  }
}
