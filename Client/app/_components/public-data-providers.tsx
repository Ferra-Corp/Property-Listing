"use client"

import { usePathname } from "next/navigation"
import CurrencyContextProvider from "../_lib/Context/Currencies"
import RateContextProvider from "../_lib/Context/ExchangeRate"
import SelectedCurrencyProvider from "../_lib/Context/SelectedCurrency"
import ListingContextProvider from "../_lib/Context/Listing"
import AgentContextProvider from "../_lib/Context/Agent"
import InsightContextProvider from "../_lib/Context/Insight"
import ServiceContextProvider from "../_lib/Context/Service"
import SettingContextProvider from "../_lib/Context/Site Setting"

/**
 * These 8 contexts are shared by the public site AND the admin dashboard
 * (e.g. Site Settings and the Leads queue both read useSettingContext) —
 * so they can't be gated out of all of /admin, only out of /admin/auth,
 * which has no session yet and nothing to do with any of this data.
 */
export function PublicDataProviders({
  children,
}: {
  children: React.ReactNode
}) {
  const pathname = usePathname() ?? ""

  if (pathname.startsWith("/admin/auth")) return <>{children}</>

  return (
    <CurrencyContextProvider>
      <RateContextProvider>
        <SelectedCurrencyProvider>
          <ListingContextProvider>
            <AgentContextProvider>
              <InsightContextProvider>
                <ServiceContextProvider>
                  <SettingContextProvider>{children}</SettingContextProvider>
                </ServiceContextProvider>
              </InsightContextProvider>
            </AgentContextProvider>
          </ListingContextProvider>
        </SelectedCurrencyProvider>
      </RateContextProvider>
    </CurrencyContextProvider>
  )
}
