import Link from "next/link"
import { AuthShell } from "../../../../_components/Admin/Auth/auth-shell"
import { SetPasswordForm } from "../../../../_components/Admin/Auth/set-password-form"

export default async function ResetPage({
  params,
}: {
  params: Promise<{ token: string }>
}) {
  const { token } = await params

  return (
    <AuthShell
      plateLabel="Photograph · a locksmith's bench · 3:2"
      title="A new password, nothing else."
      lead="Your patch, your listings and your second factor stay as they are. Only the password changes — and the ledger records that it did, without recording what it is."
      quote="If you did not ask for this, ring the desk before you go on."
      facts={[
        { label: "Link lasts", value: "One hour · one use" },
        { label: "The desk", value: "+254 20 ••• 4400 · ext. 200" },
      ]}
      back={{ href: "/admin/auth/sign-in", label: "Sign in" }}
      footNote={
        <>
          Did not ask for this?{" "}
          <Link href="/system/contact">Ring the desk</Link> — the link can be
          cancelled.
        </>
      }
    >
      <SetPasswordForm
        token={token}
        variant="reset"
        submitLabel="Set the new password"
        onSuccessHref="/admin/auth/sign-in?reset=1"
      />
    </AuthShell>
  )
}
