import type { Metadata, Viewport } from "next"
import { Cormorant_Garamond, Lora } from "next/font/google"
import { cn } from "cn"

import "./globals.css"
import "./classical.css"
import { SiteChrome } from "./_components/site-chrome"
import { PublicDataProviders } from "./_components/public-data-providers"
import { ThemeProvider } from "@/components/theme-provider"

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
  title: "Entity — commercial & upmarket residential property, Nairobi",
  description:
    "Go-downs, offices, retail and yards across the Nairobi metropolitan area, alongside a short list of upmarket homes.",
}

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#f7f3e3" },
    { media: "(prefers-color-scheme: dark)", color: "#0a0a0a" },
  ],
}

export default function SystemLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html
      lang="en"
      suppressHydrationWarning
      className={cn(
        "antialiased",
        cormorant.variable,
        "font-sans",
        lora.variable
      )}
    >
      <body>
        <ThemeProvider>
          <PublicDataProviders>
            <SiteChrome>{children}</SiteChrome>
          </PublicDataProviders>
        </ThemeProvider>
      </body>
    </html>
  )
}
