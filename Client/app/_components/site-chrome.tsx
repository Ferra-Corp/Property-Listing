"use client"

import { useEffect } from "react"
import { usePathname } from "next/navigation"
import { SiteHeader } from "./site-header"
import { SiteFooter } from "./site-footer"
import { MobileContactBar } from "./mobile-contact-bar"
import { PageTransition } from "./page-transition"
import { ToastProvider } from "./toast-provider"

/** Sets a data-scrolled attribute on <html> once the viewport has scrolled
 *  past a threshold, so the sticky header can render its firmer surface. */
function ScrolledWatcher() {
  useEffect(() => {
    const root = document.documentElement
    const update = () => {
      root.toggleAttribute("data-scrolled", window.scrollY > 8)
    }
    update()
    window.addEventListener("scroll", update, { passive: true })
    return () => {
      window.removeEventListener("scroll", update)
      root.removeAttribute("data-scrolled")
    }
  }, [])
  return null
}

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
    <ToastProvider>
      <div className="cl-root flex min-h-dvh flex-col">
        <ScrolledWatcher />
        <SiteHeader />
        <main className="flex-1">
          <PageTransition>{children}</PageTransition>
        </main>
        <SiteFooter />
        <MobileContactBar />
      </div>
    </ToastProvider>
  )
}
