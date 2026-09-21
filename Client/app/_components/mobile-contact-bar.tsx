"use client"

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
    callHref = `tel:+${ADMIN_WHATSAPP_NUMBER}`

  return (
    <div className="sticky bottom-0 z-20 border-t border-(--color-divider) bg-(--color-bg) px-4 py-3 md:hidden">
      <div className="flex gap-2">
        <ButtonLink
          href={whatsappHref}
          target="_blank"
          rel="noopener noreferrer"
          variant="primary"
          className="flex-1"
        >
          WhatsApp us
        </ButtonLink>
        <ButtonLink href={callHref} variant="secondary" className="flex-1">
          Call
        </ButtonLink>
      </div>
    </div>
  )
}
