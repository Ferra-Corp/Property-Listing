"use client"

import * as React from "react"
import Link from "next/link"
import { Button, ButtonLink } from "../../_components/ui/button"
import { Chip } from "../../_components/ui/filters"
import { Input, Segmented, Select, Textarea } from "../../_components/ui/field"
import { Plate } from "../../_components/ui/plate"
import { Disclosure } from "../../_components/ui/section"
import { createLead } from "../../_lib/Actions/Leads"
import type { LeadIntent } from "../../_lib/Types/Lead"
import { useAgentContext } from "../../_lib/Context/Agent"
import { ADMIN_WHATSAPP_NUMBER } from "../../_lib/config"
import { buildWhatsAppLink, toWhatsAppDigits } from "../../_lib/format"

const INTENT_OPTIONS = [
  "Renting or leasing",
  "Buying",
  "Selling or letting",
  "Something else",
] as const

const INTENT_MAP: Record<(typeof INTENT_OPTIONS)[number], LeadIntent> = {
  "Renting or leasing": "rent",
  Buying: "buy",
  "Selling or letting": "sell",
  "Something else": "general",
}

const SPACE_OPTIONS = [
  "Any — I will explain below",
  "Go-down / warehouse",
  "Industrial park unit",
  "Yard / hardstanding",
  "Office",
  "Retail / showroom",
  "House or apartment",
  "Land / plot",
] as const

const SPACE_MAP: Record<
  (typeof SPACE_OPTIONS)[number],
  { property_type?: string; property_subtype?: string }
> = {
  "Any — I will explain below": {},
  "Go-down / warehouse": {
    property_type: "industrial",
    property_subtype: "go_down",
  },
  "Industrial park unit": {
    property_type: "industrial",
    property_subtype: "industrial_park",
  },
  "Yard / hardstanding": {
    property_type: "industrial",
    property_subtype: "yard",
  },
  Office: { property_type: "commercial", property_subtype: "office" },
  "Retail / showroom": {
    property_type: "commercial",
    property_subtype: "retail",
  },
  "House or apartment": { property_type: "residential" },
  "Land / plot": { property_type: "land", property_subtype: "plot" },
}

const COUNTRY_OPTIONS = [
  "Kenya",
  "United States",
  "United Kingdom",
  "United Arab Emirates",
  "Elsewhere",
] as const

const COUNTRY_MAP: Record<(typeof COUNTRY_OPTIONS)[number], string | null> = {
  Kenya: "KE",
  "United States": "US",
  "United Kingdom": "GB",
  "United Arab Emirates": "AE",
  Elsewhere: null,
}

function FieldRow({
  label,
  optional,
  className,
  children,
}: {
  label: React.ReactNode
  optional?: string
  className?: string
  children: React.ReactNode
}) {
  return (
    <div className={"cl-fl" + (className ? ` ${className}` : "")}>
      <div className="cl-k">
        {label}
        {optional ? <span className="cl-opt"> ({optional})</span> : null}
      </div>
      {children}
    </div>
  )
}

const OFFICE_CHANNEL = {
  code: "OFC",
  title: "The office",
  detail: (
    <>
      2nd floor, Muthithi Road
      <br />
      Westlands, Nairobi
      <br />
      Visits by appointment
    </>
  ),
  href: null as string | null,
}

const NEXT = [
  {
    n: "01",
    title: "An agent reads it",
    body: "Not a bot and not a queue — the enquiry goes to whoever covers that patch.",
  },
  {
    n: "02",
    title: "A call or a WhatsApp",
    body: "Usually within two working hours, to fill in what the form could not.",
  },
  {
    n: "03",
    title: "A shortlist, not a catalogue",
    body: "Three or four buildings that fit, with rates, plans and photographs.",
  },
]

const FAQ = [
  {
    q: "Do I need an account?",
    a: "No — and you never will. There are no buyer logins on this site by design.",
  },
  {
    q: "Can you send me things that are not listed?",
    a: "Often, yes. A good part of our stock is quiet — owners who would let or sell but do not want a board on the gate.",
  },
  {
    q: "Will you pass my details on?",
    a: "Only to the landlord or owner when you ask us to arrange a viewing, and never to a list broker.",
  },
]

export default function ContactPage() {
  const { agents } = useAgentContext(),
    // Whoever holds the general contact WhatsApp line right now (Amina) —
    // resolved from the real agent record so name/email/phone stay in sync
    // if that designation ever changes (see ADMIN_WHATSAPP_NUMBER).
    contactAgent = agents.find(
      (agent) =>
        toWhatsAppDigits(agent.whatsapp_number || agent.phone || "") ===
        ADMIN_WHATSAPP_NUMBER
    ),
    contactPhone = contactAgent?.phone ?? `+${ADMIN_WHATSAPP_NUMBER}`,
    contactEmail = contactAgent?.email_public ?? "hello@entity.co.ke",
    whatsappHref = buildWhatsAppLink(
      ADMIN_WHATSAPP_NUMBER,
      "Hi, I'd like to get in touch about a property."
    ),
    callHref = `tel:+${ADMIN_WHATSAPP_NUMBER}`,
    [intent, setIntent] = React.useState<(typeof INTENT_OPTIONS)[number]>(
      INTENT_OPTIONS[0]
    ),
    [status, setStatus] = React.useState<
      "idle" | "submitting" | "success" | "error"
    >("idle"),
    [error, setError] = React.useState<string | null>(null)

  const CHANNELS = [
    {
      code: "WA",
      title: "WhatsApp",
      detail: `${contactPhone} · fastest, 7 days`,
      href: whatsappHref,
    },
    {
      code: "TEL",
      title: "Telephone",
      detail: `${contactPhone} · Mon–Sat, 8–6`,
      href: callHref,
    },
    {
      code: "EM",
      title: "Email",
      detail: contactEmail,
      href: `mailto:${contactEmail}`,
    },
    OFFICE_CHANNEL,
  ]

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault()

    const form = event.currentTarget,
      data = new FormData(form),
      space =
        SPACE_MAP[
          (data.get("space") as (typeof SPACE_OPTIONS)[number]) ??
            SPACE_OPTIONS[0]
        ],
      country =
        COUNTRY_MAP[
          (data.get("country") as (typeof COUNTRY_OPTIONS)[number]) ??
            COUNTRY_OPTIONS[0]
        ],
      budgetMin = data.get("budget_min"),
      budgetMax = data.get("budget_max"),
      howFound = data.get("how_found") as string | null,
      assignedAgentId = (data.get("assigned_agent_id") as string) || null

    setStatus("submitting")
    setError(null)

    try {
      await createLead({
        full_name: String(data.get("full_name") ?? ""),
        phone: String(data.get("phone") ?? ""),
        whatsapp_number: (data.get("whatsapp_number") as string) || null,
        email: (data.get("email") as string) || null,
        country_code: country,
        intent: INTENT_MAP[intent],
        property_type: space.property_type as never,
        property_subtype: space.property_subtype as never,
        preferred_location: (data.get("preferred_location") as string) || null,
        budget_min: budgetMin ? Number(budgetMin) : null,
        budget_max: budgetMax ? Number(budgetMax) : null,
        currency_code: (data.get("currency_code") as string) || undefined,
        requirements: (data.get("requirements") as string) || null,
        assigned_agent_id: assignedAgentId,
        source: "contact_form",
        utm_source:
          howFound && howFound !== "Prefer not to say" ? howFound : null,
        consent_marketing: data.get("consent_marketing") === "on",
      })

      setStatus("success")
      form.reset()
      setIntent(INTENT_OPTIONS[0])
    } catch (submitError) {
      setStatus("error")
      setError((submitError as Error).message)
    }
  }

  return (
    <>
      <div className="mt-4 px-3 pt-3 md:px-6 md:pt-1.25">
        <Plate
          className="aspect-video border-0 md:aspect-auto md:h-62.5 md:border-4"
          label="Plate 01 — The office, Westlands · 1900×620"
        />
      </div>

      {/* ── Ask a person ── */}
      <section className="grid items-start gap-6 px-4 pt-5 md:grid-cols-[1fr_340px] md:gap-14 md:px-10 md:pt-9">
        <div>
          <div className="cl-k text-neutral-600">Contact · enquiries</div>
          <h1 className="mt-2.5 mb-0 max-w-[22ch] text-[29px] leading-[1.12] font-normal md:mt-4 md:text-[46px] md:leading-[1.08]">
            Ask a person, not a portal
          </h1>
          <p className="mt-2.5 mb-0 max-w-[62ch] text-[14px] leading-[1.7] text-neutral-700 md:mt-3.5 md:text-[16px]">
            WhatsApp is quickest. If you would rather write it down, the form
            below reaches the same {agents.length || "few"} agent
            {agents.length === 1 ? "" : "s"} — no account, no password, and no
            marketing unless you ask for it.
          </p>
          <div className="mt-3 flex flex-wrap gap-1.75 md:mt-4">
            <Chip>Replies in about 2 hours</Chip>
            <Chip>Mon–Sat, 8–6 EAT</Chip>
            <Chip className="hidden md:inline-flex">
              Diaspora calls by arrangement
            </Chip>
          </div>
        </div>

        <div className="border-l-2 border-(--color-accent) py-1 pl-4">
          <div className="cl-k text-neutral-600">Quickest</div>
          <div className="cl-fig mt-2 text-[15px]">{contactPhone}</div>
          <div className="cl-fig mt-1 text-[13px] text-neutral-700">
            {contactEmail}
          </div>
          <div className="mt-3.5 flex flex-col gap-2">
            <ButtonLink
              href={whatsappHref}
              target="_blank"
              rel="noopener noreferrer"
              variant="primary"
              block
            >
              WhatsApp us
            </ButtonLink>
            <ButtonLink href={callHref} variant="secondary" block>
              Call the office
            </ButtonLink>
          </div>
        </div>
      </section>

      <div className="grid items-start gap-8 px-4 pt-7 md:grid-cols-[1fr_340px] md:gap-14 md:px-10 md:pt-8.5">
        <form onSubmit={handleSubmit}>
          <div className="cl-snum">
            <span>Send an enquiry</span>
            <span className="cl-k hidden text-neutral-600 md:inline">
              Name and a phone number is the minimum
            </span>
          </div>

          <FieldRow label="What is this about?" className="mt-4 md:mt-4.5">
            <Segmented
              name="enquiry-intent"
              options={[...INTENT_OPTIONS]}
              value={intent}
              onChange={(value) =>
                setIntent(value as (typeof INTENT_OPTIONS)[number])
              }
              fill
              className="hidden md:inline-flex"
            />
            <Select
              className="md:hidden"
              value={intent}
              onChange={(event) =>
                setIntent(event.target.value as (typeof INTENT_OPTIONS)[number])
              }
            >
              {INTENT_OPTIONS.map((option) => (
                <option key={option}>{option}</option>
              ))}
            </Select>
          </FieldRow>

          <div className="mt-3 grid gap-3 md:mt-4.5 md:grid-cols-2 md:gap-4">
            <FieldRow label="Your name">
              <Input name="full_name" placeholder="Full name" required />
            </FieldRow>
            <FieldRow label="Phone">
              <Input
                name="phone"
                placeholder="+254 7•• ••• •••"
                type="tel"
                required
              />
            </FieldRow>
            <FieldRow
              label="WhatsApp"
              optional="if different"
              className="hidden md:flex"
            >
              <Input
                name="whatsapp_number"
                placeholder="+254 7•• ••• •••"
                type="tel"
              />
            </FieldRow>
            <FieldRow label="Email" optional="optional">
              <Input name="email" placeholder="you@example.com" type="email" />
            </FieldRow>
            <FieldRow label="Where are you based?">
              <Select name="country" defaultValue={COUNTRY_OPTIONS[0]}>
                {COUNTRY_OPTIONS.map((option) => (
                  <option key={option}>{option}</option>
                ))}
              </Select>
            </FieldRow>
            <FieldRow label="Best time to call" className="hidden md:flex">
              <Select>
                <option>Any time, working hours</option>
                <option>Morning (EAT)</option>
                <option>Afternoon (EAT)</option>
                <option>Evening (EAT)</option>
              </Select>
            </FieldRow>
          </div>

          <div className="mt-4 grid gap-3 border-t border-(--color-divider) pt-4 md:mt-5.5 md:grid-cols-2 md:gap-4 md:pt-5">
            <FieldRow label="What kind of space?">
              <Select name="space" defaultValue={SPACE_OPTIONS[0]}>
                {SPACE_OPTIONS.map((option) => (
                  <option key={option}>{option}</option>
                ))}
              </Select>
            </FieldRow>
            <FieldRow label="Preferred location">
              <Input
                name="preferred_location"
                placeholder="Mombasa Rd, Westlands, Karen…"
              />
            </FieldRow>
            <FieldRow label="Size you need" optional="optional">
              <div className="flex gap-2">
                <Input placeholder="e.g. 15,000" />
                <Select className="w-26">
                  <option>sq ft</option>
                  <option>sq m</option>
                  <option>acres</option>
                </Select>
              </div>
            </FieldRow>
            <FieldRow label="Budget" optional="optional">
              <div className="flex gap-2">
                <Select name="currency_code" className="w-23">
                  <option>KES</option>
                  <option>USD</option>
                  <option>GBP</option>
                  <option>AED</option>
                </Select>
                <Input name="budget_min" placeholder="From" type="number" />
                <Input name="budget_max" placeholder="To" type="number" />
              </div>
            </FieldRow>
            <FieldRow
              label="Tell us what you are looking for"
              className="md:col-span-2"
            >
              <Textarea
                name="requirements"
                placeholder="Use, timing, eaves height or bedrooms, power, access, anything a listing would not tell you…"
                className="min-h-26"
              />
            </FieldRow>
            <FieldRow label="A particular agent?" optional="optional">
              <Select name="assigned_agent_id" defaultValue="">
                <option value="">Whoever is best placed</option>
                {agents.map((agent) => (
                  <option key={agent.slug} value={agent.user_id}>
                    {agent.display_name}
                    {agent.title ? ` — ${agent.title}` : ""}
                  </option>
                ))}
              </Select>
            </FieldRow>
            <FieldRow
              label="How did you find us?"
              optional="optional"
              className="hidden md:flex"
            >
              <Select name="how_found">
                <option>Prefer not to say</option>
                <option>Google search</option>
                <option>A referral</option>
                <option>Instagram or LinkedIn</option>
                <option>Saw a board on site</option>
              </Select>
            </FieldRow>
            <label className="flex items-start gap-2 text-[12px] leading-[1.6] text-neutral-700 md:col-span-2 md:text-[12.5px]">
              <input
                name="consent_marketing"
                type="checkbox"
                className="mt-0.75 accent-(--color-accent)"
              />
              Send me new listings and market notes that match this brief. We
              hold your details only to answer you, under the Data Protection
              Act 2019, and you can ask us to delete them at any time.
            </label>
          </div>

          <div className="mt-5 flex flex-col gap-3 border-t-2 border-(--color-text) pt-4 md:flex-row md:items-center md:gap-4 md:pt-4.5">
            <Button
              type="submit"
              variant="primary"
              block
              disabled={status === "submitting"}
              className="px-5.5 md:w-auto md:flex-none"
            >
              {status === "submitting" ? "Sending…" : "Send the enquiry"}
            </Button>
            <div className="cl-fig text-[12.5px] text-neutral-600">
              {status === "success"
                ? "Sent — an agent will be in touch shortly."
                : status === "error"
                  ? `Something went wrong: ${error}`
                  : "Or WhatsApp the same message — we read both inboxes."}
            </div>
          </div>

          {/* ── What happens next ── */}
          <div className="mt-7 md:mt-8.5">
            <div className="cl-snum">
              <span>What happens next</span>
            </div>
            <div className="mt-4 grid gap-3.5 md:mt-4.5 md:grid-cols-3 md:gap-x-8.5">
              {NEXT.map((step, index) => (
                <div
                  key={step.n}
                  className={
                    index < NEXT.length - 1
                      ? "md:border-r md:border-(--color-divider) md:pr-8.5"
                      : undefined
                  }
                >
                  <div className="cl-k cl-fig cl-mono text-(--color-accent)">
                    {step.n}
                  </div>
                  <h4 className="mt-2 mb-0 text-[18px] font-normal md:text-[19px]">
                    {step.title}
                  </h4>
                  <p className="mt-1.5 mb-0 text-[13px] leading-[1.65] text-neutral-700">
                    {step.body}
                  </p>
                </div>
              ))}
            </div>
          </div>

          {/* ── FAQ ── */}
          <div className="mt-6 md:mt-7.5">
            <div className="cl-snum">
              <span>Before you write in</span>
            </div>
            {FAQ.map((item) => (
              <Disclosure key={item.q} question={item.q}>
                {item.a}
              </Disclosure>
            ))}
          </div>
        </form>

        {/* ── Channels ── */}
        <aside className="flex flex-col gap-4 md:sticky md:top-20">
          <div className="cl-card gap-0 p-4 md:p-5">
            <div className="cl-k text-neutral-600">Ways to reach us</div>
            {CHANNELS.map((channel, index) => {
              const Wrapper = channel.href ? "a" : "div"
              return (
                <Wrapper
                  key={channel.code}
                  {...(channel.href
                    ? {
                        href: channel.href,
                        target: channel.href.startsWith("http")
                          ? "_blank"
                          : undefined,
                        rel: channel.href.startsWith("http")
                          ? "noopener noreferrer"
                          : undefined,
                      }
                    : {})}
                  className={
                    "flex items-start gap-3 border-b border-(--color-divider) py-3.5" +
                    (channel.href
                      ? " text-(--color-text) hover:bg-neutral-100"
                      : "") +
                    (index === 0 ? " pt-3.5" : "") +
                    (index === CHANNELS.length - 1 ? " border-b-0" : "")
                  }
                >
                  <span className="cl-fig cl-mono pt-0.5 text-[11px] text-(--color-accent)">
                    {channel.code}
                  </span>
                  <div>
                    <div className="text-[13.5px] md:text-[14px]">
                      {channel.title}
                    </div>
                    <div className="cl-fig mt-1 text-[12.5px] leading-[1.6] text-neutral-700">
                      {channel.detail}
                    </div>
                  </div>
                </Wrapper>
              )
            })}
          </div>

          <Plate
            matted={false}
            className="hidden aspect-4/3 md:grid"
            label={
              <>
                Plate — the entrance on Muthithi Road
                <br />
                1200×900
              </>
            }
          />

          <div className="rounded-(--cl-radius-lg) border border-(--color-divider) bg-neutral-100 p-4 md:p-4.5">
            <div className="cl-k text-neutral-600">
              Or write to an agent directly
            </div>
            {agents.map((agent, index) => (
              <div
                key={agent.slug}
                className={
                  "cl-pair py-2.5 text-[13px]" +
                  (index === agents.length - 1 ? " border-b-0" : "")
                }
              >
                <Link href={`/system/agents/${agent.slug}`}>
                  {agent.display_name}
                </Link>
                <span className="cl-fig text-[12px] text-neutral-600">
                  {agent.title ?? agent.specializations[0] ?? ""}
                </span>
              </div>
            ))}
          </div>

          <div className="border-l-2 border-(--color-accent-2) py-0.5 pl-3.5">
            <p className="m-0 text-[12.5px] leading-[1.65] text-neutral-700">
              Landlord or owner? The valuation form asks the right questions and
              reaches the same desk.
            </p>
            <Link
              href="/system/valuation-requests"
              className="mt-1.5 inline-block text-[12.5px]"
            >
              Sell or value my property →
            </Link>
          </div>
        </aside>
      </div>

      <div className="h-8" />
    </>
  )
}
