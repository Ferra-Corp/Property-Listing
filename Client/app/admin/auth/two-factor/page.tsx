"use client"

import * as React from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { Button } from "../../../_components/ui/button"
import {
  AuthShell,
  Notice,
  PaneHead,
} from "../../../_components/Admin/Auth/auth-shell"
import {
  deskFact,
  useAuthContact,
} from "../../../_components/Admin/Auth/useAuthContact"
import { OtpInput } from "../../../_components/Admin/Auth/otp-input"
import { clearMfaChallenge, readMfaChallenge } from "../_lib/mfa-challenge"

// No subscription actually exists — this only exists to get React's own
// "has this component committed on the client yet" primitive (true from the
// first client render onward, false during SSR/the first paint), so reading
// sessionStorage below never runs during server rendering.
const subscribeNever = () => () => {}

function formatCountdown(msRemaining: number): string {
  const totalSeconds = Math.max(0, Math.ceil(msRemaining / 1000)),
    minutes = Math.floor(totalSeconds / 60),
    seconds = totalSeconds % 60

  return `${minutes}:${String(seconds).padStart(2, "0")}`
}

export default function TwoFactorPage() {
  const contact = useAuthContact(),
    router = useRouter(),
    mounted = React.useSyncExternalStore(
      subscribeNever,
      () => true,
      () => false
    ),
    // Recomputed each render rather than held in state — sessionStorage is
    // the source of truth (and naturally self-expires), so there's nothing
    // here for React to synchronize via an effect.
    pending = mounted ? readMfaChallenge() : null,
    hasPending = !!pending,
    [code, setCode] = React.useState(""),
    [submitting, setSubmitting] = React.useState(false),
    [error, setError] = React.useState<string | null>(null),
    [now, setNow] = React.useState(() => Date.now()),
    // Suppresses the watchdog redirect below once a code has actually been
    // accepted — clearing the challenge on success looks identical to it
    // having expired, and without this flag the redirect back to sign-in
    // would fire (and race the real "/admin" push) on every successful code.
    [verified, setVerified] = React.useState(false)

  React.useEffect(() => {
    if (mounted && !hasPending && !verified)
      router.replace("/admin/auth/sign-in")
  }, [mounted, hasPending, verified, router])

  React.useEffect(() => {
    const interval = setInterval(() => setNow(Date.now()), 1000)
    return () => clearInterval(interval)
  }, [])

  const msRemaining = pending ? pending.expiresAt - now : 0

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault()
    if (!pending) return

    setError(null)
    setSubmitting(true)

    try {
      const verifyRequest = await fetch("/admin/api/auth/verify", {
          method: "POST",
          headers: { "content-type": "application/json" },
          body: JSON.stringify({ challenge: pending.challenge, code }),
        }),
        verifyResponse = await verifyRequest.json()

      if (!verifyRequest.ok) throw new Error(verifyResponse.error)

      setVerified(true)
      const destination = pending.next
      clearMfaChallenge()
      router.push(destination)
    } catch (submitError) {
      setError((submitError as Error).message)
    } finally {
      setSubmitting(false)
    }
  }

  if (!mounted || !pending) return null

  return (
    <AuthShell
      plateLabel="Photograph · a go-down yard at first light · 3:2"
      title="Two things, not one."
      lead="Publishing a listing puts the firm's licence behind it. Anyone who may publish signs in with a password and a figure from their own device — so a lost password is never enough on its own."
      quote="Every change lands in the ledger, against a name."
      facts={
        contact.ready
          ? [
              { label: "Lost the device?", value: "Call or email the desk" },
              deskFact(contact),
            ]
          : []
      }
      back={{ href: "/admin/auth/sign-in", label: "Back to sign in" }}
      topRight={
        <Link href="/system/contact" className="cl-k text-neutral-600">
          Help
        </Link>
      }
      footNote={
        <>
          Signing in as <span className="cl-fig">{pending.email}</span> ·{" "}
          <Link href="/admin/auth/sign-in">not you?</Link>
        </>
      }
    >
      <form onSubmit={handleSubmit}>
        {error ? (
          <Notice>
            <div className="text-[13px] leading-[1.6] text-(--color-accent-2-700) md:text-[13.5px]">
              {error}
            </div>
          </Notice>
        ) : null}

        <PaneHead
          kicker="Second factor"
          title="Six figures from your device"
          className="mt-6"
        >
          Open the authenticator on your phone and read off the figures showing
          now.
        </PaneHead>

        <OtpInput onChange={setCode} />
        <div className="cl-k cl-fig mt-2.5 text-neutral-600">
          This request lapses in {formatCountdown(msRemaining)}
        </div>

        <Button
          type="submit"
          variant="primary"
          block
          disabled={submitting || code.length !== 6}
          className="mt-5 min-h-12 md:min-h-9"
        >
          {submitting ? "Checking…" : "Continue"}
        </Button>

        <div className="mt-4.5 border-t border-(--color-divider) pt-3.5">
          <div className="cl-k text-neutral-600">
            If the device is not to hand
          </div>
          <div className="mt-2.5 grid gap-2 md:flex md:flex-wrap">
            <Link href="/system/contact" className="cl-btn cl-btn-ghost">
              Ring the desk · ext. 200
            </Link>
          </div>
        </div>
      </form>
    </AuthShell>
  )
}
