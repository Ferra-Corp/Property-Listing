import type { Metadata } from "next"
import { Cormorant_Garamond, Lora } from "next/font/google"
import { cn } from "cn"
import { AdminShellGate } from "./../_components/Admin/admin-shell-gate"

import "../classical.css"

const cormorant = Cormorant_Garamond({
  subsets: ["latin"],
  weight: ["400", "600"],
  variable: "--font-cormorant",
})

const lora = Lora({
  subsets: ["latin"],
  weight: ["400", "600"],
  variable: "--font-lora",
})

export const metadata: Metadata = {
  title: "Admin — D&G Realtors",
  description: "The register, the diary and the ledger.",
  robots: { index: false, follow: false },
}

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <div
      className={cn(
        "cl-root min-h-dvh bg-neutral-200 text-(--color-text)",
        cormorant.variable,
        lora.variable
      )}
    >
      <AdminShellGate>{children}</AdminShellGate>
    </div>
  )
}
