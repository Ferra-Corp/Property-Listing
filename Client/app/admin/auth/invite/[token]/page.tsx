import Link from "next/link"
import { AuthShell } from "../../../../_components/Admin/Auth/auth-shell"
import { SetPasswordForm } from "../../../../_components/Admin/Auth/set-password-form"

/** Reached by a token in the address and nothing else — no account is
 * signed in yet, and the backend can't tell us whose invite this is (or
 * what it's for) until the token is actually submitted, so the copy here
 * stays generic on purpose. */
export default async function InvitePage({
  params,
}: {
  params: Promise<{ token: string }>
}) {
  const { token } = await params

  return (
    <AuthShell
      plateLabel="Photograph · the front office at opening · 3:2"
      title="Welcome to the register."
      lead="An account has been made for you. Set a password and it is yours — everything you do under it from here on carries your name in the ledger."
      quote="One account, one hand. Never share it, not even for an afternoon."
      facts={[
        { label: "Link lasts", value: "One hour · one use" },
        { label: "The desk", value: "+254 20 ••• 4400 · ext. 200" },
      ]}
      footNote={
        <>
          Not expecting this?{" "}
          <Link href="/system/contact">Tell the desk</Link> and do not use
          this link.
        </>
      }
    >
      <SetPasswordForm
        token={token}
        variant="invite"
        submitLabel="Set password and sign in"
        onSuccessHref="/admin/auth/sign-in?invited=1"
      />
    </AuthShell>
  )
}
