"use client"

import * as React from "react"
import Image from "next/image"
import { useRouter, useSearchParams } from "next/navigation"
import { Button } from "../../../_components/ui/button"
import {
  AuthShell,
  Notice,
  PaneHead,
  Step,
} from "../../../_components/Admin/Auth/auth-shell"
import {
  deskFact,
  useAuthContact,
} from "../../../_components/Admin/Auth/useAuthContact"
import { OtpInput } from "../../../_components/Admin/Auth/otp-input"
import { safeAdminPath } from "../_lib/mfa-challenge"

/** Groups a raw base32 secret into 4-character blocks for easier reading —
 * purely cosmetic, doesn't change the value submitted anywhere. */
function formatSecret(secret: string): string {
  return secret.replace(/(.{4})/g, "$1 ").trim()
}

export default function PairAuthenticatorPage() {
  return (
    <React.Suspense fallback={null}>
      <PairAuthenticatorForm />
    </React.Suspense>
  )
}

function PairAuthenticatorForm() {
  const contact = useAuthContact(),
    router = useRouter(),
    searchParams = useSearchParams(),
    next = safeAdminPath(searchParams.get("next")),
    [loading, setLoading] = React.useState(true),
    [setup, setSetup] = React.useState<{
      qrcode: string
      secret: string
    } | null>(null),
    [loadError, setLoadError] = React.useState<string | null>(null),
    [copied, setCopied] = React.useState(false),
    [code, setCode] = React.useState(""),
    [submitting, setSubmitting] = React.useState(false),
    [error, setError] = React.useState<string | null>(null)

  React.useEffect(() => {
    let cancelled = false

    ;(async () => {
      try {
        const generateRequest = await fetch("/admin/api/auth/2fasetup", {
            method: "POST",
          }),
          generateResponse = await generateRequest.json()

        if (!generateRequest.ok) {
          if (generateRequest.status === 401) {
            router.replace("/admin/auth/sign-in")
            return
          }
          throw new Error(generateResponse.error)
        }

        if (!cancelled) setSetup(generateResponse)
      } catch (fetchError) {
        if (!cancelled) setLoadError((fetchError as Error).message)
      } finally {
        if (!cancelled) setLoading(false)
      }
    })()

    return () => {
      cancelled = true
    }
  }, [router])

  const copyKey = async () => {
    if (!setup) return
    try {
      await navigator.clipboard.writeText(setup.secret)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch {
      // Clipboard access denied — the key is still visible to copy by hand.
    }
  }

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault()
    setError(null)
    setSubmitting(true)

    try {
      const verifyRequest = await fetch("/admin/api/auth/2fasetup", {
          method: "PUT",
          headers: { "content-type": "application/json" },
          body: JSON.stringify({ code }),
        }),
        verifyResponse = await verifyRequest.json()

      if (!verifyRequest.ok) throw new Error(verifyResponse.error)

      // This page sits under /admin/auth, which AdminShellGate deliberately
      // renders with none of the admin data contexts mounted — so there's
      // no live UserContext here to refresh, and a soft router.push would
      // land on a fresh remount of it that isn't guaranteed to have
      // resolved its own fetch yet. A full navigation sidesteps both: the
      // destination mounts once and reads the account this setup just
      // changed, not whatever was cached from before.
      window.location.href = next
    } catch (submitError) {
      setError((submitError as Error).message)
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <AuthShell
      title="Your own device, once."
      lead="Pair a phone to your account and it becomes the second half of your sign-in. Once paired, every sign-in asks for a code from it as well as your password."
      facts={
        contact.ready
          ? [
              {
                label: "Works with",
                value: (
                  <>
                    Any authenticator app
                    <br />
                    No firm app to install
                  </>
                ),
              },
              deskFact(contact),
            ]
          : []
      }
      back={{ href: next, label: "Back to the admin" }}
    >
      {loading ? (
        <div className="cl-k text-neutral-600">
          Preparing your authenticator setup…
        </div>
      ) : loadError || !setup ? (
        <Notice>{loadError ?? "Couldn't start 2FA setup"}</Notice>
      ) : (
        <form onSubmit={handleSubmit}>
          <PaneHead kicker="Second factor" title="Pair your authenticator" />

          {error ? (
            <div className="mt-4">
              <Notice>{error}</Notice>
            </div>
          ) : null}

          <div className="mt-4.5 grid gap-3">
            <Step n="01">
              Open your authenticator app and choose to add an account.
            </Step>
            <Step n="02">
              <div>Point it at this square.</div>
              <div className="mt-3 flex flex-col items-start gap-4 md:flex-row">
                <Image
                  src={setup.qrcode}
                  alt="Authenticator QR code"
                  width={172}
                  height={172}
                  unoptimized
                  className="h-55 w-full flex-none rounded-(--cl-radius-md) object-contain md:h-43 md:w-43"
                />
                <div className="min-w-0 flex-1">
                  <div className="cl-k text-neutral-600">
                    Or type this key in
                  </div>
                  <div className="cl-fig cl-mono mt-2 text-[13px] leading-[1.9] break-all text-neutral-800">
                    {formatSecret(setup.secret)}
                  </div>
                  <Button
                    type="button"
                    variant="secondary"
                    onClick={copyKey}
                    className="mt-2.5"
                  >
                    {copied ? "Copied" : "Copy the key"}
                  </Button>
                </div>
              </div>
            </Step>
            <Step n="03">
              <div>
                Read off the six figures it shows, to prove the pairing took.
              </div>
              <OtpInput onChange={setCode} />
            </Step>
          </div>

          <Button
            type="submit"
            variant="primary"
            block
            disabled={submitting || code.length !== 6}
            className="mt-5 min-h-12 md:min-h-9"
          >
            {submitting ? "Finishing…" : "Finish pairing"}
          </Button>
        </form>
      )}
    </AuthShell>
  )
}
