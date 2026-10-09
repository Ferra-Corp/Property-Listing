"use client"

import * as React from "react"
import Link from "next/link"
import { useRouter, useSearchParams } from "next/navigation"
import { Button } from "../../../_components/ui/button"
import { Input } from "../../../_components/ui/field"
import {
  AuthShell,
  Notice,
  PaneHead,
} from "../../../_components/Admin/Auth/auth-shell"
import {
  officeFact,
  useAuthContact,
} from "../../../_components/Admin/Auth/useAuthContact"
import { useAuthStats, type AuthStats } from "../../../_components/Admin/Auth/useAuthPublicData"
import { PasswordField } from "../../../_components/Admin/Auth/password-field"
import { safeAdminPath, writeMfaChallenge } from "../_lib/mfa-challenge"

export default function SignInPage() {
  return (
    <React.Suspense fallback={null}>
      <SignInForm />
    </React.Suspense>
  )
}

/** The panel's standing line, from live public figures — never a number
 * that isn't true. Counts that are zero (or still loading) are left out. */
function leadFrom(stats: AuthStats): string {
  const parts = [
    stats.publishedListings > 0 &&
      `${stats.publishedListings} live listing${stats.publishedListings === 1 ? "" : "s"}`,
    stats.agents > 0 &&
      `${stats.agents} agent${stats.agents === 1 ? "" : "s"}`,
  ].filter(Boolean)

  const kept =
    "every enquiry, viewing and valuation, kept in one place, and every change to it recorded against a name."

  return parts.length > 0
    ? `${parts.join(" and ")}, plus ${kept}`
    : `Every listing, ${kept}`
}

function SignInForm() {
  const contact = useAuthContact(),
    stats = useAuthStats(),
    router = useRouter(),
    searchParams = useSearchParams(),
    [email, setEmail] = React.useState(""),
    [password, setPassword] = React.useState(""),
    [submitting, setSubmitting] = React.useState(false),
    [error, setError] = React.useState<string | null>(null)

  const justReset = searchParams.get("reset") === "1",
    justInvited = searchParams.get("invited") === "1",
    next = safeAdminPath(searchParams.get("next"))

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault()
    setError(null)
    setSubmitting(true)

    try {
      const loginRequest = await fetch("/admin/api/auth/login", {
          method: "POST",
          headers: { "content-type": "application/json" },
          body: JSON.stringify({ email, password }),
        }),
        loginResponse = await loginRequest.json()

      if (!loginRequest.ok) throw new Error(loginResponse.error)

      if (loginResponse.mfaRequired) {
        writeMfaChallenge({
          challenge: loginResponse.challenge,
          email,
          expiresAt: Date.now() + loginResponse.expires_in * 1000,
          next,
        })
        router.push("/admin/auth/two-factor")
        return
      }

      router.push(next)
    } catch (submitError) {
      setError((submitError as Error).message)
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <AuthShell
      title="The register, the diary and the ledger."
      lead={leadFrom(stats)}
      quote={
        stats.testimonial ? (
          <>
            “{stats.testimonial.quote}”
            <span className="cl-k mt-2 block text-[#dbbb8f]">
              {[stats.testimonial.name, stats.testimonial.company_name]
                .filter(Boolean)
                .join(" · ")}
            </span>
          </>
        ) : undefined
      }
      facts={contact.ready ? [officeFact(contact)] : []}
      desk
      topRight={
        <div className="flex items-center gap-2.5">
          <Link href="/" className="cl-k text-neutral-600">
            Public site
          </Link>
          <span className="cl-k text-neutral-400">·</span>
          <Link href="/system/contact" className="cl-k text-neutral-600">
            Help
          </Link>
        </div>
      }
      footNote={
        <>
          Changes you make are recorded against your name in the audit log
        </>
      }
    >
      <form onSubmit={handleSubmit}>
        <PaneHead kicker="Staff only" title="Sign in to the admin">
          Use the work address the firm issued you. Accounts are issued by the
          admin.
        </PaneHead>

        {justReset || justInvited ? (
          <div className="mt-4">
            <Notice tone="quiet">
              {justInvited
                ? "Password set. Sign in with it below."
                : "Password updated. Sign in with your new password."}
            </Notice>
          </div>
        ) : null}

        {error ? (
          <div className="mt-4">
            <Notice>{error}</Notice>
          </div>
        ) : null}

        <label className="mt-4 flex flex-col gap-2">
          <span className="cl-k text-neutral-600">Work address</span>
          <Input
            type="email"
            name="email"
            autoComplete="username"
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            required
            className="min-h-11.5 text-[15px] md:min-h-9 md:text-[14.5px]"
          />
        </label>

        <PasswordField
          label="Password"
          name="password"
          autoComplete="current-password"
          value={password}
          onChange={(event) => setPassword(event.target.value)}
          required
        />

        <div className="mt-4 flex flex-wrap items-center gap-3.5">
          <span className="flex-1" />
          <Link
            href="/admin/auth/forgot-password"
            className="text-[13px] whitespace-nowrap"
          >
            Forgotten it?
          </Link>
        </div>

        <Button
          type="submit"
          variant="primary"
          block
          disabled={submitting}
          className="mt-5 min-h-12 md:min-h-9"
        >
          {submitting ? "Signing in…" : "Sign in"}
        </Button>

        <div className="mt-4.5">
          <Notice tone="quiet">
            Anyone who may publish is asked for a second factor on the next
            screen.
          </Notice>
        </div>
      </form>
    </AuthShell>
  )
}
