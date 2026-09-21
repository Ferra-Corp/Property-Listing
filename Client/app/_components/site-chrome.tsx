"use client"

import { usePathname } from "next/navigation"
import { SiteHeader } from "./site-header"
import { SiteFooter } from "./site-footer"
import { MobileContactBar } from "./mobile-contact-bar"
import { PageTransition } from "./page-transition"

/**
 * The public marketing site's header/footer/mobile-bar/page-transition —
 * gated out for `/admin/*`, which has its own shell (`AdminShell`) and
 * would otherwise get both stacked, since `app/admin/layout.tsx` nests
 * inside this root layout like every other route does.
 */
export function SiteChrome({ children }: { children: React.ReactNode }) {
  const pathname = usePathname() ?? ""

  if (pathname.startsWith("/admin")) return <>{children}</>

  return (
    <div className="cl-root flex min-h-dvh flex-col">
      <SiteHeader />
      <main className="flex-1">
        <PageTransition>{children}</PageTransition>
      </main>
      <SiteFooter />
      <MobileContactBar />
    </div>
  )
}
