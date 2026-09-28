"use client"

import Link from "next/link"
import { useSelectedCurrency } from "../_lib/Context/SelectedCurrency"
import { useAgentContext } from "../_lib/Context/Agent"
import {
  useContactEmail,
  useContactPhone,
  useSocialLinks,
} from "../_lib/useSiteSettings"
import { toWhatsAppDigits } from "../_lib/format"

const COLUMNS = [
  {
    heading: "Property",
    links: [
      { label: "Go-downs", href: "/system/listings?subtype=go_down" },
      { label: "Offices", href: "/system/listings?subtype=office" },
      { label: "Retail", href: "/system/listings?subtype=retail" },
      { label: "Residential", href: "/system/listings?type=residential" },
    ],
  },
  {
    heading: "Company",
    links: [
      { label: "About", href: "/system/about" },
      { label: "Agents", href: "/system/agents" },
      { label: "Services", href: "/system/services" },
      { label: "Insights", href: "/system/insights" },
    ],
  },
  {
    heading: "Owners",
    links: [
      { label: "Sell or value", href: "/system/valuation-requests" },
      {
        label: "Let your property",
        href: "/system/valuation-requests?intent=let",
      },
      { label: "Contact", href: "/system/contact" },
    ],
  },
]

/** lucide-react ships no brand marks, so LinkedIn/Instagram are inline. */
function LinkedinMark({ size = 16 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor" aria-hidden>
      <path d="M4.98 3.5a2.5 2.5 0 1 1 0 5.001 2.5 2.5 0 0 1 0-5.001ZM3 9h4v12H3V9Zm7 0h3.83v1.64h.05c.53-1 1.85-2.06 3.81-2.06 4.08 0 4.83 2.68 4.83 6.17V21h-4v-5.7c0-1.36-.02-3.1-1.89-3.1-1.9 0-2.19 1.48-2.19 3v5.8h-4V9Z" />
    </svg>
  )
}

function InstagramMark({ size = 16 }: { size?: number }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.7}
      aria-hidden
    >
      <rect x="3" y="3" width="18" height="18" rx="5" />
      <circle cx="12" cy="12" r="4" />
      <circle cx="17.2" cy="6.8" r="1" fill="currentColor" stroke="none" />
    </svg>
  )
}

/** Colophon foot — the one deep ground on the page. */
export function SiteFooter() {
  const { currency } = useSelectedCurrency(),
    { agents } = useAgentContext(),
    ADMIN_WHATSAPP_NUMBER = useContactPhone(),
    fallbackEmail = useContactEmail(),
    contactAgent = agents.find(
      (agent) =>
        toWhatsAppDigits(agent.whatsapp_number || agent.phone || "") ===
        ADMIN_WHATSAPP_NUMBER
    ),
    contactPhone = contactAgent?.phone ?? `+${ADMIN_WHATSAPP_NUMBER}`,
    contactEmail = contactAgent?.email_public ?? fallbackEmail,
    { linkedin, instagram } = useSocialLinks()

  return (
    <footer className="mt-10 bg-(--color-footer-bg) px-4 py-6 text-(--color-footer-text) md:px-10 md:pt-8.5 md:pb-7.5">
      <div className="grid gap-y-6 gap-x-6 grid-cols-2 md:gap-9 md:grid-cols-[1.4fr_1fr_1fr_1fr]">
        <div className="col-span-2 md:col-span-1">
          <div className="flex items-baseline gap-2">
            <span className="font-(family-name:--font-heading) text-[21px] leading-none text-(--color-footer-text) md:text-[23px]">
              D&amp;G
            </span>
            <span className="cl-mono text-[11px] tracking-[0.18em] text-(--color-footer-muted) uppercase">
              Realtors
            </span>
          </div>
          <p className="mt-2.5 mb-0 max-w-[34ch] text-[12.5px] leading-[1.7] text-(--color-footer-muted) md:mt-3 md:text-[13px]">
            Commercial and upmarket residential property, Nairobi metropolitan
            area. Registered agents, EARB.
          </p>
          <div className="cl-fig mt-3 flex flex-wrap gap-x-1.5 text-[12.5px] text-(--color-footer-text) md:mt-3.5 md:text-[13px]">
            <a href={`tel:+${toWhatsAppDigits(contactPhone)}`}>
              {contactPhone}
            </a>
            <span>·</span>
            <a href={`mailto:${contactEmail}`}>{contactEmail}</a>
          </div>
          {linkedin || instagram ? (
            <div className="mt-3.5 flex items-center gap-3 text-(--color-footer-text) md:mt-4">
              {linkedin ? (
                <a
                  href={linkedin}
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label="LinkedIn"
                  className="opacity-80 transition-opacity hover:opacity-100"
                >
                  <LinkedinMark size={16} />
                </a>
              ) : null}
              {instagram ? (
                <a
                  href={instagram}
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label="Instagram"
                  className="opacity-80 transition-opacity hover:opacity-100"
                >
                  <InstagramMark size={16} />
                </a>
              ) : null}
            </div>
          ) : null}
        </div>

        {COLUMNS.map((column) => (
          <div key={column.heading}>
            <div className="cl-k text-(--color-footer-muted-2)">
              {column.heading}
            </div>
            <div className="mt-3 flex flex-col gap-2 text-[13px]">
              {column.links.map((link) => (
                <Link
                  key={link.label}
                  href={link.href}
                  className="text-(--color-footer-link) hover:text-(--color-footer-link-hover)"
                >
                  {link.label}
                </Link>
              ))}
            </div>
          </div>
        ))}
      </div>

      <div className="mt-6.5 flex flex-col gap-3 border-t border-(--color-footer-border) pt-3.5 md:flex-row md:items-center md:justify-between">
        <div className="cl-k text-(--color-footer-muted-2)">
          Prices shown in {currency} · converted figures are indicative
        </div>
        <div className="cl-k text-(--color-footer-muted-2)">© 2026</div>
      </div>
    </footer>
  )
}
