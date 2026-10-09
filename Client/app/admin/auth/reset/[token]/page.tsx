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
      title="A new password, nothing else."
      lead="Your account, your listings and your sign-in settings stay as they are. Only the password changes."
      facts={[
        { label: "Link lasts", value: "One hour · one use" },
      ]}
      desk
      back={{ href: "/admin/auth/sign-in", label: "Sign in" }}
      footNote={
        <>
          Did not ask for this?{" "}
          <Link href="/system/contact">Contact the office</Link> — your
          password stays as it is until this form is submitted.
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
