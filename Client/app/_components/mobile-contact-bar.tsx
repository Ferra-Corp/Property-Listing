"use client"

import { useEffect, useRef } from "react"
import { ButtonLink } from "./ui/button"
import { useContactPhone } from "../_lib/useSiteSettings"
import { buildWhatsAppLink } from "../_lib/format"

/** Sticky contact bar — small screens only, mirrors the mobile mock. */
export function MobileContactBar() {
  const ADMIN_WHATSAPP_NUMBER = useContactPhone(),
    whatsappHref = buildWhatsAppLink(
      ADMIN_WHATSAPP_NUMBER,
      "Hi, I'd like to get in touch about a property."
    ),
    callHref = `tel:+${ADMIN_WHATSAPP_NUMBER}`,
    barRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const el = barRef.current
    if (!el) return
    const root = document.documentElement

    // Publish the bar's rendered height so pages can reserve matching bottom
    // padding and never sit under a fixed CTA.
    const publishHeight = () => {
      const shown = getComputedStyle(el).display !== "none"
      root.style.setProperty(
        "--wa-bar-height",
        shown ? `${el.getBoundingClientRect().height}px` : "0px"
      )
    }
    publishHeight()

    const resizeObserver = new ResizeObserver(publishHeight)
    resizeObserver.observe(el)
    window.addEventListener("resize", publishHeight)
    window.addEventListener("orientationchange", publishHeight)

    // visualViewport shrinks when the soft keyboard opens; hide the bar so
    // it doesn't hover above the keyboard covering the focused field.
    const vv = window.visualViewport
    const onViewportResize = () => {
      if (!vv) return
      const keyboardOpen = window.innerHeight - vv.height > 150
      root.toggleAttribute("data-keyboard-open", keyboardOpen)
    }
    vv?.addEventListener("resize", onViewportResize)
    vv?.addEventListener("scroll", onViewportResize)

    return () => {
      resizeObserver.disconnect()
      window.removeEventListener("resize", publishHeight)
      window.removeEventListener("orientationchange", publishHeight)
      vv?.removeEventListener("resize", onViewportResize)
      vv?.removeEventListener("scroll", onViewportResize)
      root.style.setProperty("--wa-bar-height", "0px")
      root.removeAttribute("data-keyboard-open")
    }
  }, [])

  return (
    <div
      ref={barRef}
      className="mobile-contact-bar sticky bottom-0 z-20 border-t border-(--color-divider) bg-(--color-bg) px-4 pt-3 md:hidden"
      style={{
        paddingBottom: "calc(env(safe-area-inset-bottom, 0px) + 0.75rem)",
      }}
    >
      <div className="flex gap-2">
        <ButtonLink
          href={whatsappHref}
          target="_blank"
          rel="noopener noreferrer"
          variant="primary"
          className="flex-1 min-h-11"
        >
          WhatsApp us
        </ButtonLink>
        <ButtonLink href={callHref} variant="secondary" className="flex-1 min-h-11">
          Call
        </ButtonLink>
      </div>
    </div>
  )
}
