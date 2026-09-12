"use client"

import * as React from "react"
import { Button, ButtonLink } from "../../_components/ui/button"
import { Chip } from "../../_components/ui/filters"
import { Input, Select, Textarea } from "../../_components/ui/field"
import { Plate } from "../../_components/ui/plate"
import { useAgentContext } from "../../_lib/Context/Agent"
import { useListingContext } from "../../_lib/Context/Listing"
import { ADMIN_WHATSAPP_NUMBER } from "../../_lib/config"
import { buildWhatsAppLink } from "../../_lib/format"
import { createLead } from "../../_lib/Actions/Leads"
import type { LeadIntent } from "../../_lib/Types/Lead"

const STANDARDS = [
  ["Visit and measure before listing", "Always"],
  ["Answer WhatsApp themselves", "Always"],
  ["Quote the service charge separately", "Always"],
  ["Ask you to register an account", "Never"],
  ["Charge a buyer or tenant a fee", "Never"],
] as const

const ENQUIRY_OPTIONS = [
  "Go-down / warehouse",
  "Office or retail",
  "House or apartment",
  "Selling or letting my property",
  "Something else",
] as const

const ENQUIRY_MAP: Record<
  (typeof ENQUIRY_OPTIONS)[number],
  { intent: LeadIntent; property_type?: string }
> = {
  "Go-down / warehouse": { intent: "general", property_type: "industrial" },
  "Office or retail": { intent: "general", property_type: "commercial" },
  "House or apartment": { intent: "general", property_type: "residential" },
  "Selling or letting my property": { intent: "sell" },
  "Something else": { intent: "general" },
}

export default function AgentsIndexPage() {
  const { agents } = useAgentContext(),
    { listings } = useListingContext(),
    mandateCount = (userId: string) =>
      listings.filter((listing) => listing.agent_id === userId).length,
    contactLine = (agent: (typeof agents)[number]) =>
      [agent.phone, agent.email_public].filter(Boolean).join(" · "),
    whatsappHref = (agent: (typeof agents)[number]) =>
      buildWhatsAppLink(
        agent.whatsapp_number || agent.phone || ADMIN_WHATSAPP_NUMBER,
        `Hi ${agent.display_name.split(" ")[0]}, I'd like to get in touch about a property.`
      ),
    officeWhatsappHref = buildWhatsAppLink(
      ADMIN_WHATSAPP_NUMBER,
      "Hi, I'd like to get in touch about a property."
    ),
    [status, setStatus] = React.useState<
      "idle" | "submitting" | "success" | "error"
    >("idle"),
    [error, setError] = React.useState<string | null>(null)

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault()

    const form = event.currentTarget,
      data = new FormData(form),
      choice = data.get("about") as (typeof ENQUIRY_OPTIONS)[number] | null,
      mapped = choice ? ENQUIRY_MAP[choice] : { intent: "general" as const },
      message = (data.get("message") as string) || ""

    setStatus("submitting")
    setError(null)

    try {
      await createLead({
        full_name: String(data.get("full_name") ?? ""),
        phone: String(data.get("phone") ?? ""),
        intent: mapped.intent,
        property_type: mapped.property_type as never,
        requirements: message || null,
        source: "contact_form",
        source_page: "/system/agents",
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
      {/* ── Masthead ── */}
      <section className="mt-2 px-3 pt-5 md:px-6 md:pt-6.5">
        <div className="cl-k text-neutral-600">
          Agents · Nairobi metropolitan area
        </div>
        <div className="mt-2.5 flex flex-col gap-2 border-b-2 border-(--color-text) pb-3 md:mt-3 md:flex-row md:items-end md:justify-between md:gap-7.5 md:pb-3.5">
          <h1 className="m-0 max-w-[26ch] text-[28px] leading-[1.12] font-normal md:text-[42px] md:leading-[1.08]">
            Meet the agents behind every listing
          </h1>
          <div className="cl-fig cl-mono flex-none text-[11.5px] text-neutral-600 md:text-right md:text-[12px]">
            {agents.length} agent{agents.length === 1 ? "" : "s"} ·{" "}
            {listings.length} listing{listings.length === 1 ? "" : "s"}
          </div>
        </div>
        <p className="mt-3 mb-0 max-w-[74ch] text-[13.5px] leading-[1.7] text-neutral-700 md:mt-4 md:text-[15px]">
          Every listing on this site names the agent who holds it, and that
          agent answers the phone. Not sure who to ask? Send the general enquiry
          below and we will route it ourselves.
        </p>
      </section>

      {/* ── Portraits, at equal weight (matched to bottom grid width & gap) ── */}
      <section className="hidden gap-6 px-3 pt-5.5 md:grid md:grid-cols-3 md:gap-6 md:px-6">
        {agents.map((agent) => (
          <Plate
            key={agent.slug}
            className="h-72.5 rounded-2xl border-4"
            label={agent.photo_url ?? agent.display_name}
            src={agent.photo_url}
            alt={agent.display_name}
          />
        ))}
      </section>

      <section className="grid gap-6 px-3 pt-4 md:grid-cols-3 md:gap-6 md:px-6 md:pt-6">
        {agents.map((agent) => (
          <article
            key={agent.slug}
            className="flex flex-col justify-between rounded-2xl border border-(--color-divider) bg-(--color-bg) p-5 shadow-sm transition-shadow hover:shadow-md md:p-6"
          >
            <div>
              <div className="relative overflow-hidden rounded-xl bg-neutral-100 md:hidden">
                <Plate
                  matted={false}
                  className="aspect-4/3 w-full"
                  label={agent.photo_url ?? agent.display_name}
                  src={agent.photo_url}
                  alt={agent.display_name}
                />
              </div>
              <h2 className="mt-4 mb-0 text-[24px] font-normal md:mt-0 md:text-[25px]">
                {agent.display_name}
              </h2>
              {agent.title ? (
                <div className="mt-1 font-(family-name:--font-heading) text-[17px] text-(--color-accent-700) md:text-[18px]">
                  {agent.title}
                </div>
              ) : null}
              <div className="mt-2.5 flex flex-wrap gap-1.75 md:mt-3">
                {agent.specializations.map((specialism) => (
                  <Chip
                    key={specialism}
                    className="rounded-md px-2.5 py-1 text-[12px]"
                  >
                    {specialism}
                  </Chip>
                ))}
              </div>
              {agent.bio ? (
                <p className="mt-2.5 mb-0 text-[13px] leading-[1.7] text-neutral-700 md:mt-3">
                  {agent.bio}
                </p>
              ) : null}

              <div className="mt-4 border-t border-(--color-divider) pt-3">
                <div className="cl-pair py-2">
                  <span className="text-[13px] text-neutral-700">
                    Mandates held
                  </span>
                  <span className="cl-fig text-[13px] font-semibold">
                    {mandateCount(agent.user_id)}
                  </span>
                </div>
                {agent.years_experience ? (
                  <div className="cl-pair py-2">
                    <span className="text-[13px] text-neutral-700">
                      Experience
                    </span>
                    <span className="cl-fig text-[13px] font-semibold">
                      {agent.years_experience} years
                    </span>
                  </div>
                ) : null}
              </div>
            </div>

            <div className="mt-5 border-t border-(--color-divider) pt-4">
              {contactLine(agent) ? (
                <div className="cl-fig mb-3 text-[12.5px] text-neutral-700">
                  {contactLine(agent)}
                </div>
              ) : null}
              <div className="flex gap-2">
                <ButtonLink
                  href={whatsappHref(agent)}
                  target="_blank"
                  rel="noopener noreferrer"
                  variant="primary"
                  className="flex-1 rounded-xl py-2"
                >
                  WhatsApp
                </ButtonLink>
                <ButtonLink
                  href={`/system/agents/${agent.slug}`}
                  variant="secondary"
                  className="flex-1 rounded-xl py-2"
                >
                  Profile
                </ButtonLink>
              </div>
            </div>
          </article>
        ))}
      </section>

      {/* ── Shared standards ── */}
      <section className="px-3 pt-7 md:px-6 md:pt-8.5">
        <div className="cl-snum">
          <span>What every agent here does the same way</span>
        </div>
        <div className="mt-2 max-w-[52ch]">
          {STANDARDS.map(([standard, answer], index) => (
            <div
              key={standard}
              className={
                "cl-pair text-[13px] md:text-[13.5px]" +
                (index === 0 ? " pt-3.5" : "") +
                (index === STANDARDS.length - 1 ? " border-b-0" : "")
              }
            >
              <span className="text-neutral-700">{standard}</span>
              <span
                className={
                  "cl-fig cl-k " +
                  (answer === "Never"
                    ? "text-(--color-accent-2)"
                    : "text-(--color-accent)")
                }
              >
                {answer}
              </span>
            </div>
          ))}
        </div>
      </section>

      {/* ── General enquiry ── */}
      <section
        id="general-enquiry"
        className="mx-3 mt-7 grid items-start gap-6 rounded-2xl border border-(--color-divider) bg-neutral-200 p-4 md:mx-6 md:mt-8.5 md:grid-cols-2 md:gap-9 md:p-6"
      >
        <div>
          <h3 className="mb-0 text-[21px] font-normal md:text-[27px]">
            Not sure who to ask?
          </h3>
          <p className="mt-2.5 mb-0 max-w-[52ch] text-[13px] leading-[1.7] text-neutral-700 md:text-[14px]">
            Send it here and it goes to whoever covers that patch — usually with
            a reply the same working day. No account, and no marketing unless
            you ask for it.
          </p>
          <a
            href={officeWhatsappHref}
            target="_blank"
            rel="noopener noreferrer"
            className="cl-fig mt-3.5 hidden text-[13px] text-neutral-700 hover:text-(--color-text) md:block"
          >
            Or WhatsApp the office
          </a>
        </div>
        <form
          onSubmit={handleSubmit}
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
          <Select
            name="about"
            className="rounded-xl md:col-span-2"
            defaultValue=""
          >
            <option value="">What is this about?</option>
            {ENQUIRY_OPTIONS.map((option) => (
              <option key={option}>{option}</option>
            ))}
          </Select>
          <Textarea
            name="message"
            placeholder="Size, location and timing"
            className="min-h-17.5 rounded-xl md:col-span-2"
          />
          <Button
            type="submit"
            variant="primary"
            block
            disabled={status === "submitting"}
            className="rounded-xl md:col-span-2"
          >
            {status === "submitting" ? "Sending…" : "Send the enquiry"}
          </Button>
          <div className="text-[12px] text-neutral-700 md:col-span-2">
            {status === "success"
              ? "Sent — an agent will be in touch shortly."
              : status === "error"
                ? `Something went wrong: ${error}`
                : null}
          </div>
        </form>
      </section>
    </>
  )
}
