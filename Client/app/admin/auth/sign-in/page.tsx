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
  Lines,
  officeFact,
  useAuthContact,
} from "../../../_components/Admin/Auth/useAuthContact"
import { PasswordField } from "../../../_components/Admin/Auth/password-field"
import { formatPhoneDisplay } from "../../../_lib/format"
import { safeAdminPath, writeMfaChallenge } from "../_lib/mfa-challenge"

export default function SignInPage() {
  return (
    <React.Suspense fallback={null}>
      <SignInForm />
    </React.Suspense>
  )
}

function SignInForm() {
  const contact = useAuthContact(),
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
      plateLabel="Photograph · the firm's staircase, Industrial Area · 3:2"
      title="The register, the diary and the ledger."
      lead="Eighty-four instructions, nine agents and every enquiry that has come through the door since 2011 — all of it kept in one place, and every change to it recorded against a name."
      quote="Walk a site twice. Once with the owner, once alone."
      facts={
        contact.ready
          ? [
              officeFact(contact),
              {
                label: "Phone",
                value: <Lines lines={[formatPhoneDisplay(contact.phone)]} />,
              },
              { label: "Email", value: contact.email },
            ]
          : []
      }
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
          Sign-ins are recorded against your name ·{" "}
          <Link href="/system/about">How the firm handles your data</Link>
        </>
      }
    >
      <form onSubmit={handleSubmit}>
        <PaneHead kicker="Staff only" title="Sign in to the admin">
          Use the work address the firm issued you. Accounts are added on the
          Agents page — there is nothing to register here.
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
