import { redirect } from "next/navigation"

export default function AuthIndex() {
  redirect("/admin/auth/sign-in")
}
