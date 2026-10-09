import { ButtonLink } from "../../../_components/ui/button"
import {
  AuthShell,
  StateMark,
} from "../../../_components/Admin/Auth/auth-shell"

/**
 * Reached for any reset/invite token the backend rejects. It deliberately
 * doesn't say *why* — used, expired, or simply wrong — because the backend
 * treats all three identically (`getPasswordResetToken` returns nothing for
 * any of them), so there's no honest way to tell them apart here.
 */
export default function LinkExpiredPage() {
  return (
    <AuthShell
      compact
      title="This link no longer works."
      lead="Links last an hour and can be used once. Asking for another takes a moment and costs nothing."
      desk
      footNote="For a lapsed invitation, ask an admin to send you a new one"
    >
      <StateMark tone="warn">
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
          <circle cx="12" cy="12" r="9" />
          <path d="M12 7v5l3 2" />
        </svg>
      </StateMark>

      <h2 className="mt-4 mb-0 text-[26px] leading-[1.15] font-normal md:text-[29px]">
        That link no longer works
      </h2>
      <p className="mt-3 mb-0 text-[13.5px] leading-[1.75] text-neutral-700 md:text-[14px]">
        It may already have been used, or more than an hour has passed since it
        was sent. If you didn&apos;t ask for a reset, your password is unchanged
        — contact the office if that concerns you.
      </p>

      <div className="mt-4.5 grid gap-2 md:flex md:flex-wrap">
        <ButtonLink href="/admin/auth/forgot-password" variant="primary">
          Ask for another
        </ButtonLink>
        <ButtonLink href="/admin/auth/sign-in" variant="ghost">
          Back to sign in
        </ButtonLink>
      </div>
    </AuthShell>
  )
}
