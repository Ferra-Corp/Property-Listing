import type { Metadata } from "next"
import { Cormorant_Garamond, Lora } from "next/font/google"
import { cn } from "cn"

import "./globals.css"
import "./classical.css"
import { SiteHeader } from "./_components/site-header"
import { SiteFooter } from "./_components/site-footer"
import { MobileContactBar } from "./_components/mobile-contact-bar"
import { PageTransition } from "./_components/page-transition"
import { ThemeProvider } from "@/components/theme-provider"
import CurrencyContextProvider from "./_lib/Context/Currencies"
import RateContextProvider from "./_lib/Context/ExchangeRate"
import SelectedCurrencyProvider from "./_lib/Context/SelectedCurrency"
import ListingContextProvider from "./_lib/Context/Listing"
import AgentContextProvider from "./_lib/Context/Agent"
import InsightContextProvider from "./_lib/Context/Insight"
import ServiceContextProvider from "./_lib/Context/Service"

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
          <CurrencyContextProvider>
            <RateContextProvider>
              <SelectedCurrencyProvider>
                <ListingContextProvider>
                  <AgentContextProvider>
                    <InsightContextProvider>
                      <ServiceContextProvider>
                        <div
                          className={cn(
                            "cl-root flex min-h-dvh flex-col",
                            cormorant.variable,
                            lora.variable
                          )}
                        >
                          <SiteHeader />
                          <main className="flex-1">
                            <PageTransition>{children}</PageTransition>
                          </main>
                          <SiteFooter />
                          <MobileContactBar />
                        </div>
                      </ServiceContextProvider>
                    </InsightContextProvider>
                  </AgentContextProvider>
                </ListingContextProvider>
              </SelectedCurrencyProvider>
            </RateContextProvider>
          </CurrencyContextProvider>
        </ThemeProvider>
      </body>
    </html>
  )
}
