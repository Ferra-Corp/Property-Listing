import type { Metadata, Viewport } from "next"
import { Cormorant_Garamond, Lora } from "next/font/google"
import { cn } from "cn"

import "./globals.css"
import "./classical.css"
import { SiteChrome } from "./_components/site-chrome"
import { PublicDataProviders } from "./_components/public-data-providers"
import { ThemeProvider } from "@/components/theme-provider"
import ReactLenis from "lenis/react"

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
  title: "D&G Realtors — Real Estate Agency",
  description:
    "Go-downs, offices, retail and yards across the Nairobi metropolitan area, alongside a short list of upmarket homes.",
  // Browser tab icon uses the same D&G mark the header does. The two
  // variants swap by browser-chrome theme: dg-logo-light.png is drawn for
  // a light background (dark strokes), dg-logo-dark.png for a dark one
  // (light strokes) — same naming convention the AdminShell logo uses.
  icons: {
    icon: [
      {
        url: "/dg-logo-light.png",
        type: "image/png",
        media: "(prefers-color-scheme: light)",
      },
      {
        url: "/dg-logo-dark.png",
        type: "image/png",
        media: "(prefers-color-scheme: dark)",
      },
    ],
    shortcut: "/dg-logo-light.png",
    apple: "/dg-logo-light.png",
  },
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
        <ReactLenis
          root
          options={{ lerp: 0.1, duration: 1.5, smoothWheel: true }}
        >
          <ThemeProvider>
            <PublicDataProviders>
              <SiteChrome>{children}</SiteChrome>
            </PublicDataProviders>
          </ThemeProvider>
        </ReactLenis>
      </body>
    </html>
  )
}
