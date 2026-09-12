"use client"

import Link from "next/link"
import { useSelectedCurrency } from "../_lib/Context/SelectedCurrency"
import { useAgentContext } from "../_lib/Context/Agent"
import { ADMIN_WHATSAPP_NUMBER } from "../_lib/config"
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

/** Colophon foot — the one deep ground on the page. */
export function SiteFooter() {
  const { currency } = useSelectedCurrency(),
    { agents } = useAgentContext(),
    contactAgent = agents.find(
      (agent) =>
        toWhatsAppDigits(agent.whatsapp_number || agent.phone || "") ===
        ADMIN_WHATSAPP_NUMBER
    ),
    contactPhone = contactAgent?.phone ?? `+${ADMIN_WHATSAPP_NUMBER}`,
    contactEmail = contactAgent?.email_public ?? "hello@entity.co.ke"

  return (
    <footer className="mt-10 bg-(--color-footer-bg) px-4 py-6 text-(--color-footer-text) md:px-10 md:pt-8.5 md:pb-7.5">
      <div className="grid gap-9 md:grid-cols-[1.4fr_1fr_1fr_1fr]">
        <div>
          <div className="cl-mono text-[13px] tracking-[0.16em] uppercase md:text-[15px]">
            [ entity ]
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

      <div className="mt-6.5 flex flex-col gap-2 border-t border-(--color-footer-border) pt-3.5 md:flex-row md:items-baseline md:justify-between">
        <div className="cl-k text-(--color-footer-muted-2)">
          Prices shown in {currency} · converted figures are indicative
        </div>
        <div className="cl-k text-(--color-footer-muted-2)">© 2026</div>
      </div>
    </footer>
  )
}
