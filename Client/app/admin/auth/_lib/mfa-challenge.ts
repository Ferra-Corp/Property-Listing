export const MFA_CHALLENGE_KEY = "admin-mfa-challenge"

export type MfaChallenge = {
  challenge: string
  email: string
  expiresAt: number
  /** Where to land after the code is verified — carried over from
   * sign-in's own `next` so the redirect survives the MFA hop too. */
  next: string
}

/**
 * `next` comes from a URL query param — anyone can craft a link with
 * `?next=https://evil.example`. Only ever treat it as a destination when
 * it's a same-app admin path (`/admin/...`, and not a protocol-relative
 * `//host/...` that browsers would still treat as external), otherwise
 * fall back to the dashboard.
 */
export function safeAdminPath(next: string | null | undefined): string {
  if (!next) return "/admin"
  if (!next.startsWith("/admin")) return "/admin"
  if (next.startsWith("//")) return "/admin"
  return next
}

/**
 * The MFA challenge from a `login` response only ever needs to survive the
 * one hop from /sign-in to /two-factor — sessionStorage rather than a query
 * param keeps the challenge token out of the URL/browser history, and
 * rather than a shared React context so a hard refresh on /two-factor still
 * works (as long as the challenge hasn't expired).
 */
export function readMfaChallenge(): MfaChallenge | null {
  try {
    const raw = sessionStorage.getItem(MFA_CHALLENGE_KEY)
    if (!raw) return null

    const parsed = JSON.parse(raw) as MfaChallenge

    if (!parsed.challenge || !parsed.expiresAt) return null
    if (Date.now() >= parsed.expiresAt) {
      sessionStorage.removeItem(MFA_CHALLENGE_KEY)
      return null
    }

    return parsed
  } catch {
    return null
  }
}

export function writeMfaChallenge(challenge: MfaChallenge): void {
  try {
    sessionStorage.setItem(MFA_CHALLENGE_KEY, JSON.stringify(challenge))
  } catch {
    // Private-browsing / storage-disabled — the two-factor page will just
    // bounce the user back to sign in if it can't find a challenge either.
  }
}

export function clearMfaChallenge(): void {
  try {
    sessionStorage.removeItem(MFA_CHALLENGE_KEY)
  } catch {
    // Private-browsing / storage-disabled — nothing to clean up.
  }
}
