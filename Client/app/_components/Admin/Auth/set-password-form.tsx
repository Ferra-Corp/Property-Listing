"use client"

import * as React from "react"
import { useRouter } from "next/navigation"
import { Button } from "../../ui/button"
import { Notice, PaneHead } from "./auth-shell"
import { PasswordField, RuleList, Strength } from "./password-field"

const MIN_LENGTH = 8

function strengthOf(password: string): {
  pct: number
  note: string
  weak: boolean
} {
  if (!password) return { pct: 0, note: "Not started", weak: true }

  let score = 0
  if (password.length >= MIN_LENGTH) score += 40
  if (password.length >= 14) score += 20
  if (/[0-9]/.test(password)) score += 15
  if (/[^A-Za-z0-9]/.test(password)) score += 15
  if (/[a-z]/.test(password) && /[A-Z]/.test(password)) score += 10

  const pct = Math.min(100, score)

  if (pct < 40) return { pct, note: "Too short", weak: true }
  if (pct < 70)
    return { pct, note: "Fair · add a few more characters", weak: true }
  return { pct, note: "Strong", weak: false }
}

/**
 * Both the "reset your password" and "accept your invitation" screens are
 * the same backend action underneath — the backend issues both kinds of
 * token from the same table and checks them with the same `reset-password`
 * call, so there is nothing account-specific this form can honestly show
 * before it's submitted.
 */
export function SetPasswordForm({
  token,
  variant,
  submitLabel,
  onSuccessHref,
}: {
  token: string
  variant: "reset" | "invite"
  submitLabel: string
  onSuccessHref: string
}) {
  const router = useRouter(),
    [password, setPassword] = React.useState(""),
    [confirm, setConfirm] = React.useState(""),
    [submitting, setSubmitting] = React.useState(false),
    [error, setError] = React.useState<string | null>(null)

  const strength = strengthOf(password),
    lengthMet = password.length >= MIN_LENGTH,
    matchMet = confirm.length > 0 && password === confirm

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault()
    setError(null)

    if (!lengthMet) {
      setError(`Password must be at least ${MIN_LENGTH} characters`)
      return
    }
    if (!matchMet) {
      setError("The two passwords don't match")
      return
    }

    setSubmitting(true)

    try {
      const resetRequest = await fetch("/admin/api/auth/resetpass", {
          method: "POST",
          headers: { "content-type": "application/json" },
          body: JSON.stringify({ token, password }),
        }),
        resetResponse = await resetRequest.json()

      if (!resetRequest.ok) throw new Error(resetResponse.error)

      router.push(onSuccessHref)
    } catch (submitError) {
      const message = (submitError as Error).message

      if (/invalid or expired/i.test(message)) {
        router.push("/admin/auth/link-expired")
        return
      }

      setError(message)
      setSubmitting(false)
    }
  }

  return (
    <form onSubmit={handleSubmit}>
      <PaneHead
        kicker={variant === "invite" ? "Invitation" : "Reset"}
        title="Choose a password"
      >
        {variant === "invite"
          ? "This is how you'll sign in from now on."
          : "You will sign in again with it, and with a code from your phone if your account has one paired."}
      </PaneHead>

      {error ? (
        <div className="mt-4">
          <Notice>{error}</Notice>
        </div>
      ) : null}

      <PasswordField
        label="New password"
        name="password"
        autoComplete="new-password"
        value={password}
        onChange={(event) => setPassword(event.target.value)}
        required
      />
      <Strength pct={strength.pct} note={strength.note} weak={strength.weak} />

      <PasswordField
        label="Once more"
        name="confirm"
        reveal={false}
        autoComplete="new-password"
        value={confirm}
        onChange={(event) => setConfirm(event.target.value)}
        required
      />

      <RuleList
        rules={[
          { text: `At least ${MIN_LENGTH} characters`, met: lengthMet },
          { text: "Both fields match", met: matchMet },
        ]}
      />

      <div className="cl-k mt-4.5 leading-[1.7] text-neutral-600">
        Setting this signs you out of every other device that&apos;s currently
        signed in.
      </div>

      <Button
        type="submit"
        variant="primary"
        block
        disabled={submitting}
        className="mt-5 min-h-12 md:min-h-9"
      >
        {submitting ? "Setting password…" : submitLabel}
      </Button>
    </form>
  )
}
