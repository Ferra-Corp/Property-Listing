"use client"

import * as React from "react"
import {
  DEFAULT_CONTACT_EMAIL,
  DEFAULT_CONTACT_PHONE,
  DEFAULT_OFFICE_ADDRESS,
} from "../../../_lib/useSiteSettings"
import { formatPhoneDisplay } from "../../../_lib/format"
import type { SiteSetting } from "../../../_lib/Types/Site Setting"
import type { Fact } from "./auth-shell"

type Contact = { phone: string; email: string; address: string }

/**
 * The firm's real contact details for the admin sign-in screens. These pages
 * sit under /admin/auth, where no data contexts are mounted (there is no
 * session yet), so the public settings endpoint is read directly — the same
 * `contact.*` keys the rest of the site reads, edited from Site settings.
 * `ready` stays false until that read settles, so the panel never flashes a
 * default that an admin has since replaced.
 */
export function useAuthContact(): { ready: boolean } & Contact {
  const [state, setState] = React.useState<{
    ready: boolean
    contact: Contact
  }>({
    ready: false,
    contact: {
      phone: DEFAULT_CONTACT_PHONE,
      email: DEFAULT_CONTACT_EMAIL,
      address: DEFAULT_OFFICE_ADDRESS,
    },
  })

  React.useEffect(() => {
    let cancelled = false

    ;(async () => {
      try {
        const request = await fetch("/system/api/v1/settings"),
          response: SiteSetting[] = await request.json()

        if (!request.ok || !Array.isArray(response)) throw new Error()

        const read = (key: string, fallback: string) => {
          const raw = response.find((setting) => setting.key === key)?.value
            ?.value
          return raw == null || raw === "" ? fallback : String(raw)
        }

        if (!cancelled)
          setState({
            ready: true,
            contact: {
              phone: read("contact.phone", DEFAULT_CONTACT_PHONE),
              email: read("contact.email", DEFAULT_CONTACT_EMAIL),
              address: read("contact.office_address", DEFAULT_OFFICE_ADDRESS),
            },
          })
      } catch {
        // Settings unreachable — the site-wide defaults are still the
        // firm's real fallback contact, so show those rather than nothing.
        if (!cancelled) setState((previous) => ({ ...previous, ready: true }))
      }
    })()

    return () => {
      cancelled = true
    }
  }, [])

  return { ready: state.ready, ...state.contact }
}

/** Stacks lines with <br/> between them. */
export function Lines({ lines }: { lines: string[] }) {
  return (
    <>
      {lines.map((line, index) => (
        <React.Fragment key={index}>
          {index > 0 ? <br /> : null}
          {line}
        </React.Fragment>
      ))}
    </>
  )
}

/** The phone number and enquiries address, as one panel fact. */
export function deskFact({ phone, email }: Contact): Fact {
  return {
    label: "The desk",
    value: <Lines lines={[formatPhoneDisplay(phone), email]} />,
  }
}

/** The office address, one line per `\n` in the setting. */
export function officeFact({ address }: Contact): Fact {
  return {
    label: "Office",
    value: (
      <Lines
        lines={address
          .split("\n")
          .map((line) => line.trim())
          .filter(Boolean)}
      />
    ),
  }
}
