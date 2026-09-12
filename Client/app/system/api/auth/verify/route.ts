import { NextResponse } from "next/server"

// Placeholder — real auth (account/2FA verification) is being finalized
// separately. This only exists so the file is a valid route module and the
// production build doesn't fail on an empty file.
export const POST = async () => {
  return NextResponse.json({ error: "Not implemented yet" }, { status: 501 })
}
