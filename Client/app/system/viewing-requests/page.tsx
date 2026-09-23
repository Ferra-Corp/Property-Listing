"use client"

import * as React from "react"
import { Suspense } from "react"
import Link from "next/link"
import { useSearchParams } from "next/navigation"
import { Button, ButtonLink } from "../../_components/ui/button"
import { Chip } from "../../_components/ui/filters"
import { Input, Select, Textarea } from "../../_components/ui/field"
import { Plate } from "../../_components/ui/plate"
import { Disclosure } from "../../_components/ui/section"
import { createViewingRequest } from "../../_lib/Actions/Viewing Requests"
import { useListingContext } from "../../_lib/Context/Listing"
import { useAgentContext } from "../../_lib/Context/Agent"
import { buildWhatsAppLink, formatPrice } from "../../_lib/format"
import { useContactPhone } from "../../_lib/useSiteSettings"

/** Kicker label over a control — the form's unit throughout this page. */
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

const AFTER_SEND = [
  [
    "We confirm the slot",
    "Same day in office hours, by WhatsApp or a call — usually within two hours.",
  ],
  [
    "The agent meets you there",
    "The one holding the mandate, not whoever is free — they know the building.",
  ],
  [
    "You see it properly",
    "Keys, meters, the parts a photograph does not show. Bring your own tape measure.",
  ],
] as const

const READY = [
  ["A second date", "In case the first does not suit the agent"],
  ["Anyone joining you", "So the agent can let them in too"],
] as const

const FAQ = [
  {
    q: "Do I need to book, or can I just show up?",
    a: "Book first — most buildings are occupied or gated, and the agent holding the mandate needs to arrange access.",
  },
  {
    q: "Can I change the time after I book?",
    a: "Yes, WhatsApp the agent directly once they confirm, or send another request with the new time.",
  },
  {
    q: "Is there a fee to view a property?",
    a: "No — viewing is free whether you are renting, buying or just looking.",
  },
]

function ViewingRequestContent() {
  const searchParams = useSearchParams(),
    { listings } = useListingContext(),
    { agents } = useAgentContext(),
    ADMIN_WHATSAPP_NUMBER = useContactPhone(),
    preselectedSlug = searchParams.get("listing"),
    preselected = listings.find((l) => l.slug === preselectedSlug) ?? null,
    [manualListingId, setManualListingId] = React.useState(""),
    [preferredAgentId, setPreferredAgentId] = React.useState(""),
    [status, setStatus] = React.useState<
      "idle" | "submitting" | "success" | "error"
    >("idle"),
    [error, setError] = React.useState<string | null>(null)

  const targetListing =
    preselected ?? listings.find((l) => l.id === manualListingId) ?? null

  // Once the chosen listing's own agent is known, default to them — the
  // visitor can still pick someone else or "No preference".
  React.useEffect(() => {
    if (targetListing?.agent_id) setPreferredAgentId(targetListing.agent_id)
  }, [targetListing?.agent_id])

  // Derived, not stored — agents load asynchronously, so a useEffect+state
  // pair here would only find a match once and could go stale once the
  // agent list actually finishes loading. Reading it fresh off `agents` on
  // every render avoids that race entirely.
  const preferredAgent =
    agents.find((agent) => agent.user_id === preferredAgentId) ?? null

  const whatsappHref = buildWhatsAppLink(
    ADMIN_WHATSAPP_NUMBER,
    targetListing
      ? `Hi, I'd like to arrange a viewing for ${targetListing.title} (Ref: ${targetListing.reference_code}).`
      : "Hi, I'd like to arrange a viewing."
  )

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault()

    const form = event.currentTarget,
      data = new FormData(form),
      listingId = preselected
        ? preselected.id
        : String(data.get("listing_id") ?? "")

    if (!listingId) {
      setStatus("error")
      setError("Choose which listing you'd like to view")
      return
    }

    setStatus("submitting")
    setError(null)

    try {
      await createViewingRequest({
        listing_id: listingId,
        full_name: String(data.get("full_name") ?? ""),
        phone: String(data.get("phone") ?? ""),
        whatsapp_number: (data.get("whatsapp_number") as string) || null,
        email: (data.get("email") as string) || null,
        preferred_date: String(data.get("preferred_date") ?? ""),
        preferred_time_slot:
          (data.get("preferred_time_slot") as string) || null,
        alternate_date: (data.get("alternate_date") as string) || null,
        assigned_agent_id: (data.get("assigned_agent_id") as string) || null,
        message: (data.get("message") as string) || null,
      })

      setStatus("success")
      form.reset()
      setPreferredAgentId("")
    } catch (submitError) {
      setStatus("error")
      setError((submitError as Error).message)
    }
  }

  if (status === "success")
    return (
      <div className="px-3 py-16 text-center md:px-6">
        <h1 className="mb-2 text-[24px] font-normal">Viewing requested</h1>
        <p className="text-neutral-600) mb-4 text-[13.5px]">
          An agent will confirm the slot shortly — usually within two hours
          during office hours.
        </p>
        {targetListing ? (
          <Link
            href={`/system/listings/${targetListing.slug}`}
            className="text-[13.5px]"
          >
            ← Back to the listing
          </Link>
        ) : (
          <Link href="/system/listings" className="text-[13.5px]">
            ← Back to listings
          </Link>
        )}
      </div>
    )

  return (
    <>
      {/* ── Plate ──
          px-3 / md:px-6 mirrors the site header's own mx-3 / md:mx-6 margin
          (12px / 24px), so this section's outer edge lines up with the
          header's outer edge instead of bleeding wider than it. */}
      <section className="mt-4 grid gap-1 px-3 pt-3 md:grid-cols-[1.35fr_1fr] md:gap-1.25 md:px-6 md:pt-1.25">
        <Plate
          className="aspect-16/10 border-0 md:aspect-auto md:h-75 md:border-4"
          label={targetListing?.title ?? "Book a viewing"}
          src={targetListing?.thumbnail_url}
          alt={targetListing?.title ?? "Book a viewing"}
        />
        <Plate
          className="hidden md:grid md:h-75 md:border-4"
          label="02 · An agent, keys in hand"
        />
      </section>

      {/* ── The premise ── */}
      <section className="grid items-start gap-6 px-3 pt-5 md:grid-cols-[1fr_340px] md:gap-14 md:px-6 md:pt-9">
        <div>
          <div className="cl-k text-neutral-600)">Viewings · book a slot</div>
          <h1 className="mt-2.5 mb-0 max-w-[24ch] text-[29px] leading-[1.12] font-normal md:mt-4 md:text-[46px] md:leading-[1.08]">
            {targetListing
              ? `See ${targetListing.title} in person`
              : "Book a viewing"}
          </h1>
          <p className="text-neutral-700) mt-2.5 mb-0 max-w-[62ch] text-[14px] leading-[1.7] md:mt-3.5 md:text-[16px]">
            Tell us when suits you and the agent holding the mandate will
            confirm a slot — usually the same day.
          </p>
          <div className="mt-3 flex flex-wrap gap-1.75 md:mt-4">
            <Chip>Free, no obligation</Chip>
            <Chip>Confirmed within 2 hours</Chip>
            <Chip>No account needed</Chip>
          </div>
        </div>

        <div className="border-l-2 border-(--color-accent) py-1 pl-4">
          <div className="cl-k text-neutral-600)">Rather just talk?</div>
          <p className="mt-2 mb-3.5 text-[13.5px] leading-[1.65]">
            Send the property and your availability by WhatsApp and we will
            confirm on the spot.
          </p>
          <div className="flex flex-col gap-2">
            <ButtonLink
              href={whatsappHref}
              target="_blank"
              rel="noopener noreferrer"
              variant="primary"
              block
            >
              WhatsApp us
            </ButtonLink>
            <ButtonLink href="/system/contact" variant="secondary" block>
              Send a message instead
            </ButtonLink>
          </div>
        </div>
      </section>

      <div className="grid items-start gap-8 px-3 pt-7 md:grid-cols-[1fr_340px] md:gap-14 md:px-6 md:pt-8.5">
        <form onSubmit={handleSubmit}>
          <div className="cl-snum">
            <span>The property</span>
          </div>
          <div className="mt-4 grid gap-3 md:mt-4.5">
            {targetListing ? (
              <div className="cl-card flex-row items-center justify-between gap-3 py-3">
                <div>
                  <div className="text-[14px]">{targetListing.title}</div>
                  <div className="cl-fig cl-k text-neutral-600) mt-0.5">
                    {targetListing.location_label} ·{" "}
                    {targetListing.reference_code}
                    {targetListing.price
                      ? ` · ${formatPrice(targetListing.price, targetListing.currency_code, targetListing.price_period, targetListing.price_on_request).price}`
                      : ""}
                  </div>
                </div>
                <Link
                  href="/system/listings"
                  className="cl-fig text-[12.5px] whitespace-nowrap"
                >
                  Change →
                </Link>
              </div>
            ) : (
              <FieldRow label="Which listing would you like to view?">
                <Select
                  name="listing_id"
                  value={manualListingId}
                  onChange={(e) => setManualListingId(e.target.value)}
                  required
                >
                  <option value="">Choose a listing</option>
                  {listings
                    .filter((l) => l.status === "published")
                    .map((listing) => (
                      <option key={listing.id} value={listing.id}>
                        {listing.title} — {listing.location_label}
                      </option>
                    ))}
                </Select>
              </FieldRow>
            )}
            {agents.length > 0 ? (
              <FieldRow label="Preferred agent" optional="optional">
                <Select
                  name="assigned_agent_id"
                  value={preferredAgentId}
                  onChange={(e) => setPreferredAgentId(e.target.value)}
                >
                  <option value="">No preference — whoever is free</option>
                  {agents.map((agent) => (
                    <option key={agent.user_id} value={agent.user_id}>
                      {agent.display_name}
                      {agent.title ? ` — ${agent.title}` : ""}
                      {targetListing?.agent_id === agent.user_id
                        ? " (holds this mandate)"
                        : ""}
                    </option>
                  ))}
                </Select>
              </FieldRow>
            ) : null}
          </div>

          <div className="cl-snum mt-7 md:mt-9">
            <span>When suits you</span>
          </div>
          <div className="mt-4 grid gap-3 md:mt-4.5 md:grid-cols-2 md:gap-4">
            <FieldRow label="Preferred date">
              <Input name="preferred_date" type="date" required />
            </FieldRow>
            <FieldRow label="Preferred time" optional="optional">
              <Select name="preferred_time_slot" defaultValue="">
                <option value="">Any time</option>
                <option value="Morning">Morning</option>
                <option value="Afternoon">Afternoon</option>
                <option value="Evening">Evening</option>
              </Select>
            </FieldRow>
            <FieldRow
              label="Alternate date"
              optional="if the first doesn't work"
              className="md:col-span-2"
            >
              <Input name="alternate_date" type="date" />
            </FieldRow>
          </div>

          <div className="cl-snum mt-7 md:mt-9">
            <span>How we reach you</span>
          </div>
          <div className="mt-4 grid gap-3 md:mt-4.5 md:grid-cols-2 md:gap-4">
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
            <FieldRow
              label="Anything the agent should know"
              optional="optional"
              className="md:col-span-2"
            >
              <Textarea
                name="message"
                placeholder="Who is joining you, access notes, anything else…"
                className="min-h-21.5"
              />
            </FieldRow>
          </div>

          <div className="mt-5 flex flex-col gap-3 border-t-2 border-(--color-text) pt-4 md:flex-row md:items-center md:gap-4 md:pt-4.5">
            <Button
              type="submit"
              variant="primary"
              block
              disabled={status === "submitting"}
              className="px-5.5 md:w-auto md:flex-none"
            >
              {status === "submitting" ? "Sending…" : "Request the viewing"}
            </Button>
            <div className="cl-fig text-neutral-600) text-[12.5px]">
              {status === "error"
                ? `Something went wrong: ${error}`
                : preferredAgent
                  ? `${preferredAgent.display_name} will read this — usually confirming within two hours during office hours. `
                  : "One agent reads this — usually confirming within two hours during office hours."}
            </div>
          </div>

          {/* ── FAQ ── */}
          <div className="mt-6 md:mt-7.5">
            <div className="cl-snum">
              <span>Questions before you book</span>
            </div>
            {FAQ.map((item) => (
              <Disclosure key={item.q} question={item.q}>
                {item.a}
              </Disclosure>
            ))}
          </div>
        </form>

        {/* ── Rail ── */}
        <aside className="flex flex-col gap-4 md:sticky md:top-20">
          <div className="cl-card gap-0 p-4 md:p-5">
            <div className="cl-k text-neutral-600">After you press send</div>
            <div className="mt-3 flex flex-col gap-3 md:mt-3.5 md:gap-3.5">
              {AFTER_SEND.map(([title, body], index) => (
                <div key={title} className="flex gap-3">
                  <span className="cl-fig cl-mono pt-0.5 text-[11px] text-(--color-accent)">
                    {String(index + 1).padStart(2, "0")}
                  </span>
                  <div>
                    <div className="text-[14px]">{title}</div>
                    <div className="mt-1 text-[12.5px] leading-[1.6] text-neutral-700">
                      {body}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="hidden rounded-(--cl-radius-lg) border border-(--color-divider) bg-neutral-100 p-4.5 md:block">
            <div className="cl-k text-neutral-600)">Useful to have ready</div>
            {READY.map(([label, note], index) => (
              <div
                key={label}
                className={
                  "cl-pair py-2 text-[13px]" +
                  (index === READY.length - 1 ? " border-b-0" : "")
                }
              >
                <span className="text-neutral-700)">{label}</span>
                <span className="cl-fig">{note}</span>
              </div>
            ))}
          </div>

          <div className="border-l-2 border-(--color-accent-2) py-0.5 pl-3.5">
            <p className="m-0 text-[12.5px] leading-[1.65] text-neutral-700">
              Enquiries need no account. Quote the reference code above when you
              call.
            </p>
          </div>
        </aside>
      </div>

      <div className="h-8" />
    </>
  )
}

export default function ViewingRequestPage() {
  return (
    <Suspense fallback={null}>
      <ViewingRequestContent />
    </Suspense>
  )
}
