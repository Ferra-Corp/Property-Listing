"use client"

import { usePathname } from "next/navigation"
import { AdminShell } from "./admin-shell"
import { ToastProvider } from "./motion"
import UserContextProvider from "../../_lib/Context/User"
import LogContextProvider from "../../_lib/Context/Audit"
import LeadContextProvider from "../../_lib/Context/Lead"
import ViewingContextProvider from "../../_lib/Context/Viewing Request"
import ValuationContextProvider from "../../_lib/Context/Valuation Request"
import InsightListingContextProvider from "../../_lib/Context/Insight Listing"
import InsightTagContextProvider from "../../_lib/Context/Insight Tag"
import TagContextProvider from "../../_lib/Context/Tag"
import MediaContextProvider from "../../_lib/Context/Media"
import ActivityContextProvider from "../../_lib/Context/Lead Activity"
import NotificationContextProvider from "../../_lib/Context/Notification"
import SubscriberContextProvider from "../../_lib/Context/Subscriber"

/**
 * The dashboard navbar and its ~11 data contexts have nothing to do before
 * anyone is signed in — /admin/auth/* renders through its own minimal
 * layout instead (see app/admin/auth/layout.tsx), with no session yet to
 * fetch any of this against. Gated the same way SiteChrome already gates
 * the public header/footer out of /admin.
 */
export function AdminShellGate({ children }: { children: React.ReactNode }) {
  const pathname = usePathname() ?? ""

  if (pathname.startsWith("/admin/auth")) return <>{children}</>

  return (
    <ToastProvider>
      <UserContextProvider>
        <LogContextProvider>
          <LeadContextProvider>
            <ViewingContextProvider>
              <ValuationContextProvider>
                <InsightListingContextProvider>
                  <InsightTagContextProvider>
                    <TagContextProvider>
                      <MediaContextProvider>
                        <ActivityContextProvider>
                          <NotificationContextProvider>
                            <SubscriberContextProvider>
                              <AdminShell>{children}</AdminShell>
                            </SubscriberContextProvider>
                          </NotificationContextProvider>
                        </ActivityContextProvider>
                      </MediaContextProvider>
                    </TagContextProvider>
                  </InsightTagContextProvider>
                </InsightListingContextProvider>
              </ValuationContextProvider>
            </ViewingContextProvider>
          </LeadContextProvider>
        </LogContextProvider>
      </UserContextProvider>
    </ToastProvider>
  )
}
