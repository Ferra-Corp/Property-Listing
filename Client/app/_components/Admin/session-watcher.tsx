"use client"

import * as React from "react"

const RECHECK_INTERVAL_MS = 2 * 60 * 1000,
  CONFIRM_DELAY_MS = 1000

/**
 * proxy.ts only guards page loads and navigations. Once an admin is sitting
 * on a page, nothing noticed when the session died underneath them — the
 * refresh token revoked, the account deactivated, a sign-in elsewhere — so
 * every request just failed quietly and the page stayed up, looking alive.
 *
 * This notices it from three angles and sends them to sign in:
 *   - any admin/system API call that comes back 401,
 *   - the tab regaining focus or visibility (the likeliest time to find out),
 *   - a slow background poll while the page is open.
 *
 * Each of those only *triggers* a check. The check is /admin/api/auth/me,
 * which already tries the refresh token before giving up, so a 401 from it
 * means the session is genuinely over. It's asked twice, a moment apart: two
 * requests can race to spend the same rotating refresh token, and the loser
 * sees a 401 even though the session is fine — the second ask finds the
 * winner's fresh cookies. Anything other than a 401 (backend down, offline)
 * is never treated as a logout.
 */
export function SessionWatcher() {
  React.useEffect(() => {
    const originalFetch = window.fetch.bind(window)
    let ending = false,
      checking = false

    const endSession = async () => {
      if (ending) return
      ending = true

      // Clears the now-useless cookies so the sign-in page starts clean;
      // best effort, the redirect happens either way.
      try {
        await originalFetch("/admin/api/auth/logout", { method: "POST" })
      } catch {}

      const next = window.location.pathname + window.location.search
      window.location.assign(
        `/admin/auth/sign-in?expired=1&next=${encodeURIComponent(next)}`
      )
    }

    const isExpired = async (): Promise<boolean> => {
      try {
        const response = await originalFetch("/admin/api/auth/me", {
          cache: "no-store",
        })
        return response.status === 401
      } catch {
        return false
      }
    }

    const verify = async () => {
      if (ending || checking) return
      checking = true

      try {
        if (!(await isExpired())) return
        await new Promise((resolve) => setTimeout(resolve, CONFIRM_DELAY_MS))
        if (await isExpired()) await endSession()
      } finally {
        checking = false
      }
    }

    const isApiCall = (input: RequestInfo | URL): boolean => {
      try {
        const href =
            typeof input === "string"
              ? input
              : input instanceof URL
                ? input.href
                : input.url,
          url = new URL(href, window.location.origin)

        return (
          url.origin === window.location.origin &&
          (url.pathname.startsWith("/system/api/") ||
            (url.pathname.startsWith("/admin/api/") &&
              !url.pathname.startsWith("/admin/api/auth/")))
        )
      } catch {
        return false
      }
    }

    const watchedFetch: typeof window.fetch = async (input, init) => {
      const response = await originalFetch(input, init)
      if (response.status === 401 && isApiCall(input)) void verify()
      return response
    }
    window.fetch = watchedFetch

    const onVisible = () => {
      if (document.visibilityState === "visible") void verify()
    }
    document.addEventListener("visibilitychange", onVisible)
    window.addEventListener("focus", onVisible)
    const interval = window.setInterval(verify, RECHECK_INTERVAL_MS)

    void verify()

    return () => {
      if (window.fetch === watchedFetch) window.fetch = originalFetch
      document.removeEventListener("visibilitychange", onVisible)
      window.removeEventListener("focus", onVisible)
      window.clearInterval(interval)
    }
  }, [])

  return null
}
