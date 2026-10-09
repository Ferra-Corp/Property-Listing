"use client"

import * as React from "react"
import Link from "next/link"
import { useRouter, useSearchParams } from "next/navigation"
import { Button, ButtonLink } from "../../../_components/ui/button"
import { Input } from "../../../_components/ui/field"
import {
  AuthShell,
  Notice,
  PairList,
  PaneHead,
  StateMark,
} from "../../../_components/Admin/Auth/auth-shell"

/**
 * Both states of the forgotten-password ask live here: the form, and — at
 * `?sent=1` — the deliberately uninformative confirmation (the backend
 * always responds the same way whether or not the address is on file).
 */
export default function ForgotPasswordPage() {
  return (
    <React.Suspense fallback={null}>
      <ForgotPasswordForm />
    </React.Suspense>
  )
}

function ForgotPasswordForm() {
  const router = useRouter(),
    searchParams = useSearchParams(),
    sent = searchParams.get("sent") === "1",
    [email, setEmail] = React.useState(""),
    [submitting, setSubmitting] = React.useState(false),
    [error, setError] = React.useState<string | null>(null)

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault()
    setError(null)
    setSubmitting(true)

    try {
      const forgotRequest = await fetch("/admin/api/auth/forgotpass", {
          method: "POST",
          headers: { "content-type": "application/json" },
          body: JSON.stringify({ email }),
        }),
        forgotResponse = await forgotRequest.json()

      if (!forgotRequest.ok) throw new Error(forgotResponse.error)

      router.push("/admin/auth/forgot-password?sent=1")
    } catch (submitError) {
      setError((submitError as Error).message)
    } finally {
      setSubmitting(false)
    }
  }

  if (sent) {
    return (
      <AuthShell
        compact
        title="Sent, if the address is one of ours."
        lead="We do not say which addresses are on file — that would tell a stranger who works here."
        facts={[
          {
            label: "Nothing arrives?",
            value: "Check the junk folder, then contact the office",
          },
        ]}
        back={{
          href: "/admin/auth/forgot-password",
          label: "Use another address",
        }}
      >
        <StateMark>
          <svg
            width="20"
            height="20"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.5"
            strokeLinecap="round"
            strokeLinejoin="round"
            aria-hidden
          >
            <rect x="2" y="4" width="20" height="16" rx="2" />
            <path d="m2 7 10 6 10-6" />
          </svg>
        </StateMark>
        <h2 className="mt-4 mb-0 text-[26px] leading-[1.15] font-normal md:text-[30px]">
          Check your email
        </h2>
        <p className="mt-3 mb-0 text-[13.5px] leading-[1.75] text-neutral-700 md:text-[14px]">
          If that address is on file, a reset link is on its way to it now.
        </p>
        <div className="mt-4.5">
          <PairList
            rows={[
              ["The link lasts", "One hour · one use"],
              ["Your second factor", "Untouched"],
            ]}
          />
        </div>
        <div className="mt-4.5 grid gap-2 md:flex md:flex-wrap">
          <ButtonLink href="/admin/auth/forgot-password" variant="secondary">
            Send it again
          </ButtonLink>
          <ButtonLink href="/admin/auth/sign-in" variant="ghost">
            Back to sign in
          </ButtonLink>
        </div>
      </AuthShell>
    )
  }

  return (
    <AuthShell
      compact
      title="It happens. Give us the address."
      lead="A link goes to the work address on your account. Nothing changes until you follow it."
      desk
      back={{ href: "/admin/auth/sign-in", label: "Back to sign in" }}
      footNote="The link lasts one hour and can be used once"
    >
      <form onSubmit={handleSubmit}>
        <PaneHead kicker="Forgotten password" title="Send me a reset link">
          Enter your work address. We will email a link that lets you set a new
          password.
        </PaneHead>

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
            placeholder="name@•••.co.ke"
            required
            className="min-h-11.5 text-[15px] md:min-h-9 md:text-[14.5px]"
          />
        </label>

        <Button
          type="submit"
          variant="primary"
          block
          disabled={submitting}
          className="mt-5 min-h-12 md:min-h-9"
        >
          {submitting ? "Sending…" : "Send reset email"}
        </Button>

        <div className="cl-k mt-4 leading-[1.7] text-neutral-600">
          Remembered it? <Link href="/admin/auth/sign-in">Sign in instead</Link>
        </div>
      </form>
    </AuthShell>
  )
}
