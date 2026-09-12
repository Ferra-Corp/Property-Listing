import { NextRequest } from "next/server"

export const RequestTokens = (request: NextRequest) => {
  try {
    const cookies = request.cookies,
      accessToken = cookies.get("accessToken"),
      refreshToken = cookies.get("refreshToken")

    if (!accessToken || !refreshToken)
      throw new Error("Access token and refresh token aren't provided")

    return {
      accessToken: accessToken.value,
      refreshToken: refreshToken.value,
    }
  } catch (error) {
    throw error
  }
}

/**
 * Same as `RequestTokens`, but for routes a visitor may hit anonymously (e.g.
 * a public listing/insight/agent/service page). Returns `null` instead of
 * throwing when there's no staff session, so the caller can forward the
 * request without a Bearer token and let the backend's own public-read
 * filtering apply, rather than blocking the request outright.
 */
export const OptionalRequestTokens = (request: NextRequest) => {
  try {
    return RequestTokens(request)
  } catch {
    return null
  }
}
