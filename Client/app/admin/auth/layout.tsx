import type { Metadata } from "next"
import { Cormorant_Garamond, Lora } from "next/font/google"
import { cn } from "cn"

import "../../classical.css"

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
  title: "Sign in — D&G Realtors admin",
  description: "Staff access to the register, the diary and the ledger.",
  robots: { index: false, follow: false },
}

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <div
      className={cn(
        "cl-root min-h-dvh bg-(--color-bg) text-(--color-text)",
        cormorant.variable,
        lora.variable
      )}
    >
      {children}
    </div>
  )
}
