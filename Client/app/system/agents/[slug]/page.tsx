"use client"

import * as React from "react"
import Link from "next/link"
import { useParams } from "next/navigation"
import { Button, ButtonLink } from "../../../_components/ui/button"
import { Card, CardKicker, CardTitle } from "../../../_components/ui/card"
import { Chip } from "../../../_components/ui/filters"
import { Input, Select, Textarea } from "../../../_components/ui/field"
import { Plate } from "../../../_components/ui/plate"
import { SectionHead } from "../../../_components/ui/section"
import { Tag } from "../../../_components/ui/tag"
import { useAgentContext } from "../../../_lib/Context/Agent"
import { useListingContext } from "../../../_lib/Context/Listing"
import { useInsightContext } from "../../../_lib/Context/Insight"
import { useContactPhone } from "../../../_lib/useSiteSettings"
import { buildWhatsAppLink, toWhatsAppDigits } from "../../../_lib/format"
import { createLead } from "../../../_lib/Actions/Leads"
import {
  toRowListing,
  useCurrencyConversion,
} from "../../listings/_components/listing-row"

const STATUS_LABEL: Record<string, string> = {
  sold: "Sold",
  rented: "Let",
  let: "Let",
}

const NEED_OPTIONS = [
  "Go-down / warehouse",
  "Yard / hardstanding",
  "Office or retail",
  "House or apartment",
  "Something else",
] as const

const NEED_MAP: Record<
  (typeof NEED_OPTIONS)[number],
  { property_type?: string; property_subtype?: string }
> = {
  "Go-down / warehouse": {
    property_type: "industrial",
    property_subtype: "go_down",
  },
  "Yard / hardstanding": {
    property_type: "industrial",
    property_subtype: "yard",
  },
  "Office or retail": { property_type: "commercial" },
  "House or apartment": { property_type: "residential" },
  "Something else": {},
}

export default function AgentDetailPage() {
  const { slug } = useParams<{ slug: string }>(),
    { agents } = useAgentContext(),
    { listings } = useListingContext(),
    { insights } = useInsightContext(),
    convertTo = useCurrencyConversion(),
    ADMIN_WHATSAPP_NUMBER = useContactPhone(),
    agent = agents.find((item) => item.slug === slug),
    [status, setStatus] = React.useState<
      "idle" | "submitting" | "success" | "error"
    >("idle"),
    [error, setError] = React.useState<string | null>(null)

  if (agents.length === 0)
    return (
      <div className="px-3 py-16 text-center text-[13.5px] text-neutral-600 md:px-6">
        Loading…
      </div>
    )

  if (!agent)
    return (
      <div className="px-3 py-16 text-center md:px-6">
        <h1 className="mb-2 text-[24px] font-normal">Agent not found</h1>
        <Link href="/system/agents" className="text-[13.5px]">
          ← Back to agents
        </Link>
      </div>
    )

  const agentListings = listings.filter(
      (listing) => listing.agent_id === agent.user_id
    ),
    mandates = agentListings
      .filter((listing) => listing.status === "published")
      .map((listing) => toRowListing(listing, convertTo)),
    transacted = agentListings
      .filter((listing) => ["sold", "rented"].includes(listing.status))
      .map((listing) => toRowListing(listing, convertTo)),
    notes = insights.filter((insight) => insight.author_id === agent.user_id),
    contact = [agent.phone, agent.whatsapp_number, agent.email_public].filter(
      Boolean
    ),
    firstName = agent.display_name.split(" ")[0],
    whatsappHref = buildWhatsAppLink(
      agent.whatsapp_number || agent.phone || ADMIN_WHATSAPP_NUMBER,
      `Hi ${firstName}, I'd like to get in touch about a property.`
    ),
    callHref = agent.phone
      ? `tel:+${toWhatsAppDigits(agent.phone)}`
      : `tel:+${ADMIN_WHATSAPP_NUMBER}`

  const handleRequirementSubmit = async (
    event: React.FormEvent<HTMLFormElement>
  ) => {
    event.preventDefault()

    const form = event.currentTarget,
      data = new FormData(form),
      needChoice = data.get("need") as (typeof NEED_OPTIONS)[number] | null,
      need = needChoice ? NEED_MAP[needChoice] : {},
      size = (data.get("size") as string) || "",
      ownMessage = (data.get("message") as string) || ""

    setStatus("submitting")
    setError(null)

    try {
      await createLead({
        full_name: String(data.get("full_name") ?? ""),
        phone: String(data.get("phone") ?? ""),
        email: (data.get("email") as string) || null,
        intent: "general",
        property_type: need.property_type as never,
        property_subtype: need.property_subtype as never,
        preferred_location: (data.get("location") as string) || null,
        requirements: [size ? `Size: ${size}.` : null, ownMessage]
          .filter(Boolean)
          .join(" "),
        assigned_agent_id: agent.user_id,
        source: "contact_form",
        source_page: `/system/agents/${agent.slug}`,
      })

      setStatus("success")
      form.reset()
    } catch (submitError) {
      setStatus("error")
      setError((submitError as Error).message)
    }
  }

  return (
    <>
      {/* ── The portrait is the plate ── */}
      <section className="grid items-start px-3 pt-3 md:grid-cols-[430px_1fr] md:px-6 md:pt-5.5">
        <div className="relative">
          <Plate
            matted={false}
            className="aspect-4/5 rounded-2xl md:aspect-auto md:h-117.5"
            label={agent.photo_url ?? agent.display_name}
            src={agent.photo_url}
            alt={agent.display_name}
          />
          {agent.title ? (
            <Tag className="absolute bottom-3.5 left-3.5 rounded-md border border-(--color-divider) bg-(--color-bg)/90 px-2 py-1 text-[9px] font-(--font-mono-cl) tracking-widest uppercase shadow-sm backdrop-blur-md md:hidden">
              {agent.title}
            </Tag>
          ) : null}
        </div>

        <div className="pt-4 md:pt-0 md:pl-8">
          <div className="flex items-center gap-2.5">
            <Link
              href="/system/agents"
              className="text-[12.5px] transition-opacity hover:opacity-70"
            >
              Agents
            </Link>
            <span className="cl-k text-neutral-500">/</span>
            <span className="cl-k text-neutral-600">{agent.display_name}</span>
          </div>

          <h1 className="mt-2.5 mb-0 text-[30px] leading-[1.1] font-normal md:mt-4 md:text-[46px] md:leading-[1.05]">
            {agent.display_name}
          </h1>
          {agent.title ? (
            <div className="mt-1.5 font-(family-name:--font-heading) text-[19px] text-(--color-accent-700) md:mt-2 md:text-[23px]">
              {agent.title}
            </div>
          ) : null}

          {agent.specializations.length > 0 ? (
            <div className="mt-3.5 flex flex-wrap gap-1.75 md:mt-4">
              {agent.specializations.map((specialism) => (
                <Chip
                  key={specialism}
                  className="rounded-md px-2.5 py-1 text-[12px]"
                >
                  {specialism}
                </Chip>
              ))}
            </div>
          ) : null}

          <div className="mt-4 grid grid-cols-2 border-t border-(--color-divider) md:mt-5.5 md:grid-cols-4 md:border-b">
            {[
              {
                label: "Mandates held",
                figure: String(mandates.length),
                unit: "",
              },
              agent.years_experience
                ? {
                    label: "In the trade",
                    figure: String(agent.years_experience),
                    unit: " yrs",
                  }
                : null,
              {
                label: "Let & sold",
                figure: String(transacted.length),
                unit: "",
              },
            ]
              .filter((item) => item !== null)
              .map((item, index) => (
                <div
                  key={item.label}
                  className={
                    "border-b border-(--color-divider) p-3 md:border-b-0 md:p-3.5 " +
                    (index % 2 === 1
                      ? "border-l border-(--color-divider)"
                      : "pl-0 md:pl-3.5") +
                    (index === 0
                      ? " md:pl-0"
                      : " md:border-l md:border-(--color-divider)")
                  }
                >
                  <div className="cl-k text-neutral-600">{item.label}</div>
                  <div className="cl-fig mt-1 font-(family-name:--font-heading) text-[22px] md:text-[26px]">
                    {item.figure}
                    {item.unit ? (
                      <span className="font-(family-name:--font-body) text-[12.5px] text-neutral-700">
                        {item.unit}
                      </span>
                    ) : null}
                  </div>
                </div>
              ))}
          </div>

          {agent.bio ? (
            <p className="mt-4 mb-3 text-[14px] leading-[1.7] [hyphens:auto] md:mt-5.5 md:text-justify md:text-[15px] md:leading-[1.75]">
              {agent.bio}
            </p>
          ) : null}
        </div>
      </section>

      <div className="grid items-start gap-8 px-3 pt-7 md:grid-cols-[1fr_320px] md:gap-14 md:px-6 md:pt-8.5">
        <div>
          {/* ── Mandates ── */}
          {mandates.length > 0 ? (
            <>
              <SectionHead
                title={`Mandates ${agent.display_name} holds`}
                href="/system/listings"
                linkLabel={`All ${mandates.length}`}
              />
              <div className="mt-4 grid gap-5 md:mt-6 md:grid-cols-3 md:gap-6">
                {mandates.map((mandate) => (
                  <Link
                    key={mandate.slug}
                    href={`/system/listings/${mandate.slug}`}
                    className="group contents"
                  >
                    <Card className="flex h-full flex-col overflow-hidden rounded-xl p-0 text-(--color-text) shadow-sm transition-transform duration-300 hover:-translate-y-1 hover:shadow-md">
                      <div className="relative overflow-hidden bg-neutral-100 dark:bg-neutral-800">
                        <Plate
                          matted={false}
                          className="aspect-16/10 w-full rounded-none! transition-transform duration-500 ease-out group-hover:scale-105"
                          label={mandate.plate}
                          src={mandate.plateImage}
                          alt={mandate.title}
                        />

                        <div className="absolute inset-0 bg-linear-to-b from-black/20 to-transparent opacity-60" />

                        {mandate.exclusive ? (
                          <Tag
                            variant="mark"
                            className="absolute top-3 left-3 rounded-md px-2 py-1 text-[10px] font-medium tracking-wide shadow-sm backdrop-blur-md"
                          >
                            Exclusive
                          </Tag>
                        ) : null}
                      </div>

                      <div className="flex flex-1 flex-col px-5 py-4">
                        <CardKicker className="text-xs font-medium tracking-wider uppercase">
                          {mandate.where}
                        </CardKicker>

                        <CardTitle className="mt-1.5 text-lg leading-tight font-medium">
                          {mandate.title}
                        </CardTitle>

                        <div className="mt-auto pt-5">
                          <div className="cl-fig flex items-baseline gap-1 text-[13px] text-neutral-700">
                            {mandate.price} {mandate.priceUnit}
                          </div>
                        </div>
                      </div>
                    </Card>
                  </Link>
                ))}
              </div>
            </>
          ) : null}

          {/* ── Recently let and sold ── */}
          {transacted.length > 0 ? (
            <div className="mt-7 md:mt-8.5">
              <SectionHead
                title={`Recently let and sold by ${agent.display_name}`}
              />
              {transacted.map((item, index) => (
                <div
                  key={item.slug}
                  className={
                    "cl-pair flex-col gap-1 text-[13px] md:flex-row md:gap-4 md:text-[13.5px]" +
                    (index === 0 ? " md:pt-3.5" : "")
                  }
                >
                  <span>{item.title}</span>
                  <span className="cl-fig text-[11px] tracking-[0.16em] text-neutral-600 uppercase md:text-[13.5px] md:tracking-normal md:text-neutral-700 md:normal-case">
                    {STATUS_LABEL[item.status] ?? item.status} · {item.price}{" "}
                    {item.priceUnit}
                  </span>
                </div>
              ))}
            </div>
          ) : null}

          {/* ── Notes ── */}
          {notes.length > 0 ? (
            <div className="mt-7 md:mt-8.5">
              <SectionHead
                title={`Notes written by ${agent.display_name}`}
                href="/system/insights"
                linkLabel="All insights"
              />
              <div className="mt-3.5 grid md:mt-4.5 md:grid-cols-2 md:gap-x-8.5">
                {notes.slice(0, 2).map((note, index) => (
                  <Link
                    key={note.id}
                    href={`/system/insights/${note.slug}`}
                    className={
                      "block border-b border-(--color-divider) py-3.5 md:border-b-0 md:py-0 " +
                      (index === 0
                        ? "md:border-r md:border-(--color-divider) md:pr-8.5"
                        : "")
                    }
                  >
                    <h4 className="mt-2 mb-0 text-[18px] leading-[1.3] font-normal md:text-[19px]">
                      {note.title}
                    </h4>
                    {note.summary ? (
                      <p className="mt-2 mb-0 hidden text-[13px] leading-[1.65] text-neutral-700 md:block">
                        {note.summary}
                      </p>
                    ) : null}
                    <div className="cl-k cl-fig mt-2.5 text-neutral-600">
                      {note.read_minutes} min read
                    </div>
                  </Link>
                ))}
              </div>
            </div>
          ) : null}

          {/* ── Requirement, addressed to this agent ── */}
          <div className="mt-7 grid items-start gap-6 rounded-2xl border border-(--color-divider) bg-neutral-200 p-4 md:mt-8.5 md:grid-cols-2 md:gap-9 md:p-6">
            <div>
              <h3 className="mb-0 text-[21px] font-normal md:text-[26px]">
                Send {agent.display_name.split(" ")[0]} a requirement
              </h3>
              <p className="mt-2.5 mb-0 text-[13px] leading-[1.7] text-neutral-700 md:text-[14px]">
                Tell them the size, the use and where it has to be. No account,
                no newsletter unless you ask for one.
              </p>
            </div>
            <form
              onSubmit={handleRequirementSubmit}
              className="grid grid-cols-1 gap-2.5 md:grid-cols-2"
            >
              <Input
                name="full_name"
                placeholder="Your name"
                className="rounded-xl"
                required
              />
              <Input
                name="phone"
                placeholder="Phone or WhatsApp"
                type="tel"
                className="rounded-xl"
                required
              />
              <Input
                name="email"
                placeholder="Email (optional)"
                type="email"
                className="rounded-xl md:col-span-2"
              />
              <Select name="need" defaultValue="" className="rounded-xl">
                <option value="">What do you need?</option>
                {NEED_OPTIONS.map((option) => (
                  <option key={option}>{option}</option>
                ))}
              </Select>
              <Input
                name="size"
                placeholder="Size, e.g. 15,000 sq ft"
                className="rounded-xl"
              />
              <Input
                name="location"
                placeholder="Where — Mombasa Rd, Ruiru…"
                className="rounded-xl md:col-span-2"
              />
              <Textarea
                name="message"
                placeholder="Anything else they should know — access, timing"
                className="min-h-18.5 rounded-xl md:col-span-2"
              />
              <Button
                type="submit"
                variant="primary"
                block
                disabled={status === "submitting"}
                className="rounded-xl md:col-span-2"
              >
                {status === "submitting" ? "Sending…" : `Send to ${firstName}`}
              </Button>
              <div className="text-[12px] text-neutral-700 md:col-span-2">
                {status === "success"
                  ? `Sent — ${firstName} will be in touch shortly.`
                  : status === "error"
                    ? `Something went wrong: ${error}`
                    : null}
              </div>
            </form>
          </div>
        </div>

        {/* ── Contact rail ── */}
        <aside className="flex flex-col gap-4 md:sticky md:top-20">
          <div className="cl-card flex flex-col gap-0 rounded-2xl border border-(--color-divider) p-6 shadow-sm">
            <div className="cl-k text-neutral-600">
              Speak to {agent.display_name.split(" ")[0]}
            </div>
            {agent.phone ? (
              <div className="cl-fig mt-2.5 text-[15px] font-medium">
                {agent.phone}
              </div>
            ) : null}
            {agent.email_public ? (
              <div className="cl-fig mt-1 text-[13px] text-neutral-700">
                {agent.email_public}
              </div>
            ) : null}
            <div className="mt-5 flex flex-col gap-2.5">
              <ButtonLink
                href={whatsappHref}
                target="_blank"
                rel="noopener noreferrer"
                variant="primary"
                className="rounded-xl py-2.5 transition-transform hover:scale-[1.02] active:scale-[0.98]"
                block
              >
                WhatsApp {firstName}
              </ButtonLink>
              <ButtonLink
                href={callHref}
                variant="secondary"
                className="rounded-xl py-2.5 transition-transform hover:scale-[1.02] active:scale-[0.98]"
                block
              >
                Call now
              </ButtonLink>
              <ButtonLink
                href="/system/viewing-requests"
                variant="secondary"
                className="rounded-xl py-2.5 transition-transform hover:scale-[1.02] active:scale-[0.98]"
                block
              >
                Book a site visit
              </ButtonLink>
            </div>
            {agent.languages.length > 0 ? (
              <>
                <hr className="cl-hr my-5" />
                <div className="cl-pair border-b-0 py-1.5 text-[12.5px]">
                  <span className="text-neutral-700">Languages</span>
                  <span className="cl-fig font-medium">
                    {agent.languages.join(", ")}
                  </span>
                </div>
              </>
            ) : null}
          </div>

          <div className="border-l-2 border-(--color-accent) py-0.5 pl-4">
            <p className="m-0 text-[12.5px] leading-[1.65] text-neutral-700">
              Enquiries need no account. Quote the reference code of any listing
              when you call and they will pull the file.
            </p>
          </div>

          {agent.linkedin_url || agent.instagram_url ? (
            <div className="hidden gap-2.5 md:flex">
              {agent.linkedin_url ? (
                <ButtonLink
                  href={agent.linkedin_url}
                  variant="secondary"
                  className="flex-1 rounded-xl py-2"
                >
                  LinkedIn
                </ButtonLink>
              ) : null}
              {agent.instagram_url ? (
                <ButtonLink
                  href={agent.instagram_url}
                  variant="secondary"
                  className="flex-1 rounded-xl py-2"
                >
                  Instagram
                </ButtonLink>
              ) : null}
            </div>
          ) : null}
        </aside>
      </div>

      <div className="h-8" />
    </>
  )
}
