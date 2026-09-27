"use client"

import * as React from "react"
import { Button, ButtonLink } from "../../_components/ui/button"
import { Chip } from "../../_components/ui/filters"
import { Input, Segmented, Select, Textarea } from "../../_components/ui/field"
import { Plate } from "../../_components/ui/plate"
import { Disclosure } from "../../_components/ui/section"
import { createValuationRequest } from "../../_lib/Actions/Valuation Requests"
import { useContactPhone } from "../../_lib/useSiteSettings"
import { buildWhatsAppLink } from "../../_lib/format"
import { useToast } from "../../_components/toast-provider"
import { haptic } from "@/lib/haptics"

const TYPE_OPTIONS = [
  "Go-down / warehouse",
  "Industrial park unit",
  "Yard / hardstanding",
  "Office",
  "Retail / showroom",
  "House / villa",
  "Apartment",
  "Land / plot",
] as const

const TYPE_MAP: Record<
  (typeof TYPE_OPTIONS)[number],
  { property_type: string; property_subtype: string }
> = {
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
  "House / villa": { property_type: "residential", property_subtype: "villa" },
  Apartment: { property_type: "residential", property_subtype: "apartment" },
  "Land / plot": { property_type: "land", property_subtype: "plot" },
}

const CONDITION_OPTIONS = ["Good", "Average", "Poor"] as const

const INTENTION_OPTIONS = [
  "Value it only",
  "Let it out",
  "Sell it",
  "Not sure yet",
] as const

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
    "We call you back",
    "Same day in office hours, to confirm the details and agree a visit.",
  ],
  [
    "The site visit",
    "Measured on site, photographed, and the condition noted. Around an hour.",
  ],
  [
    "The written figure",
    "Within five working days, with the comparable evidence behind it.",
  ],
  [
    "Your decision",
    "List it with us, or keep the figure and do nothing. Both are fine.",
  ],
] as const

const READY = [
  ["Title or lease copy", "If to hand"],
  ["Approved plans", "Helpful"],
  ["Current rent, if let", "Confidential"],
] as const

const RECENT = [
  [
    "Go-down, 12,000 sq ft — Industrial Area",
    "Valued KES 92 M · let in 6 weeks",
  ],
  ["Family home, 0.4 acre — Lavington", "Valued KES 88 M · sold at 92 M"],
  [
    "Industrial plot, 1.1 acre — Athi River",
    "Valued KES 96 M · sold in 11 weeks",
  ],
] as const

const FAQ = [
  {
    q: "What does the valuation cost?",
    a: "Nothing when it comes with an instruction to let or sell. A standalone written valuation for a bank or a probate is quoted on the size and use of the property, and we tell you the figure before we visit.",
  },
  {
    q: "Am I committing to list with you?",
    a: "No. You get the figure and the evidence, and you decide afterwards. If you do instruct us, we will ask for an exclusive period — it is the only way to justify photographing the building properly.",
  },
  {
    q: "Can you do this if I live abroad?",
    a: "Yes — most of our diaspora work starts this way. We arrange access with whoever holds the keys, send you the photographs and the plan, and deal with your advocate here.",
  },
]

export default function ValuationRequestPage() {
  const { toast } = useToast()
  const [condition, setCondition] = React.useState<
      (typeof CONDITION_OPTIONS)[number]
    >(CONDITION_OPTIONS[0]),
    [intention, setIntention] = React.useState<
      (typeof INTENTION_OPTIONS)[number]
    >(INTENTION_OPTIONS[0]),
    [status, setStatus] = React.useState<
      "idle" | "submitting" | "success" | "error"
    >("idle"),
    [error, setError] = React.useState<string | null>(null),
    ADMIN_WHATSAPP_NUMBER = useContactPhone(),
    whatsappHref = buildWhatsAppLink(
      ADMIN_WHATSAPP_NUMBER,
      "Hi, I'd like a valuation — here's the location and size."
    ),
    callHref = `tel:+${ADMIN_WHATSAPP_NUMBER}`

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault()

    const form = event.currentTarget,
      data = new FormData(form),
      typeChoice = data.get("property_kind") as
        (typeof TYPE_OPTIONS)[number] | null,
      type = typeChoice ? TYPE_MAP[typeChoice] : null,
      floorArea = data.get("floor_area"),
      landArea = data.get("land_area"),
      bedrooms = data.get("bedrooms"),
      ownerExpectation = data.get("owner_expectation"),
      figureCurrency = data.get("figure_currency") as string | null,
      tenancy = data.get("tenancy") as string | null,
      moveTiming = data.get("move_timing") as string | null,
      ownMessage = (data.get("message") as string) || ""

    if (!type) {
      setStatus("error")
      setError("Choose a property type")
      haptic("error")
      toast("Choose a property type", "error")
      return
    }

    const notes = [
      `Condition stated by owner: ${condition}.`,
      `Owner's intention: ${intention}.`,
      ownerExpectation
        ? `Figure in mind: ${figureCurrency ?? "KES"} ${ownerExpectation}.`
        : null,
      tenancy && tenancy !== "None of these"
        ? `Tenancy/legal status: ${tenancy}.`
        : null,
      moveTiming ? `Timing: ${moveTiming}.` : null,
    ].filter(Boolean)

    setStatus("submitting")
    setError(null)

    try {
      await createValuationRequest({
        full_name: String(data.get("full_name") ?? ""),
        phone: String(data.get("phone") ?? ""),
        whatsapp_number: (data.get("whatsapp_number") as string) || null,
        email: (data.get("email") as string) || null,
        property_type: type.property_type as never,
        property_subtype: type.property_subtype as never,
        location_label: String(data.get("location_label") ?? ""),
        state_region: (data.get("state_region") as string) || null,
        neighbourhood: (data.get("neighbourhood") as string) || null,
        floor_area: floorArea ? Number(floorArea) : null,
        floor_area_unit: (data.get("floor_area_unit") as never) || undefined,
        land_area: landArea ? Number(landArea) : null,
        land_area_unit: (data.get("land_area_unit") as never) || undefined,
        bedrooms: bedrooms ? Number(bedrooms) : null,
        owner_expectation: ownerExpectation ? Number(ownerExpectation) : null,
        message: [ownMessage, ...notes].filter(Boolean).join(" "),
      })

      setStatus("success")
      form.reset()
      setCondition(CONDITION_OPTIONS[0])
      setIntention(INTENTION_OPTIONS[0])
      haptic("success")
      toast("Sent — an agent will arrange a visit shortly.", "success")
    } catch (submitError) {
      setStatus("error")
      setError((submitError as Error).message)
      haptic("error")
      toast("Something went wrong. Please try again.", "error")
    }
  }

  return (
    <>
      {/* ── Two plates ── */}
      <section className="mt-4 grid gap-1 px-3 pt-3 md:grid-cols-[1.35fr_1fr] md:gap-1.25 md:px-6 md:pt-1.25">
        <Plate
          className="aspect-16/10 border-0 md:aspect-auto md:h-75 md:border-4"
          label={
            <>
              Plate 01 — Owner&rsquo;s go-down, measured and photographed
              <br />
              1600×1000
            </>
          }
        />
        <Plate
          className="hidden md:grid md:h-75 md:border-4"
          label="02 · The written figure, on file"
        />
      </section>

      {/* ── The premise ── */}
      <section className="grid items-start gap-6 px-4 pt-5 md:grid-cols-[1fr_340px] md:gap-14 md:px-10 md:pt-9">
        <div>
          <div className="cl-k text-neutral-600)">
            Owners &amp; landlords · valuation and instruction
          </div>
          <h1 className="mt-2.5 mb-0 max-w-[24ch] text-[29px] leading-[1.12] font-normal md:mt-4 md:text-[46px] md:leading-[1.08]">
            Sell, let or simply find out what your property is worth
          </h1>
          <p className="text-neutral-700) mt-2.5 mb-0 max-w-[62ch] text-[14px] leading-[1.7] md:mt-3.5 md:text-[16px]">
            Send the details below and an agent will visit, measure, photograph
            and give you a written figure with the comparable evidence behind
            it. If you then instruct us, there is no fee until the property is
            let or sold.
          </p>
          <div className="mt-3 flex flex-wrap gap-1.75 md:mt-4">
            <Chip>Free with an instruction</Chip>
            <Chip>Visit within 5 working days</Chip>
            <Chip>No account needed</Chip>
          </div>
        </div>

        <div className="border-l-2 border-(--color-accent) py-1 pl-4">
          <div className="cl-k text-neutral-600)">Rather just talk?</div>
          <p className="mt-2 mb-3.5 text-[13.5px] leading-[1.65]">
            Send the location and the size by WhatsApp and we will tell you on
            the phone whether a visit is worth your time.
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
            <ButtonLink href={callHref} variant="secondary" block>
              Call the office
            </ButtonLink>
          </div>
        </div>
      </section>

      <div className="grid items-start gap-8 px-4 pt-7 md:grid-cols-[1fr_340px] md:gap-14 md:px-10 md:pt-8.5">
        <form onSubmit={handleSubmit}>
          {/* ── Part one ── */}
          <div className="cl-snum">
            <span>Part one — the property</span>
            <span className="cl-k hidden text-neutral-600 md:inline">
              All fields required unless marked
            </span>
          </div>
          <div className="mt-4 grid gap-3 md:mt-4.5 md:grid-cols-2 md:gap-4">
            <FieldRow label="What is it?">
              <Select name="property_kind" defaultValue="" required>
                <option value="">Choose a type</option>
                {TYPE_OPTIONS.map((option) => (
                  <option key={option}>{option}</option>
                ))}
              </Select>
            </FieldRow>
            <FieldRow label="Condition">
              <Segmented
                name="condition"
                options={[...CONDITION_OPTIONS]}
                value={condition}
                onChange={(value) =>
                  setCondition(value as (typeof CONDITION_OPTIONS)[number])
                }
                fill
              />
            </FieldRow>
            <FieldRow
              label="Where is it? Street or estate is enough"
              className="md:col-span-2"
            >
              <Input
                name="location_label"
                placeholder="e.g. Off Lunga Lunga Road, Industrial Area"
                required
              />
            </FieldRow>
            <FieldRow label="County or region">
              <Select name="state_region">
                <option>Nairobi</option>
                <option>Kiambu</option>
                <option>Machakos</option>
                <option>Kajiado</option>
                <option>Mombasa</option>
                <option>Elsewhere in Kenya</option>
              </Select>
            </FieldRow>
            <FieldRow label="Neighbourhood" optional="optional">
              <Input
                name="neighbourhood"
                placeholder="Karen, Westlands, Ruiru…"
              />
            </FieldRow>
            <FieldRow label="Built area">
              <div className="flex gap-2">
                <Input
                  name="floor_area"
                  placeholder="e.g. 12,000"
                  type="number"
                  inputMode="numeric"
                />
                <Select name="floor_area_unit" className="w-26">
                  <option value="sqft">sq ft</option>
                  <option value="sqm">sq m</option>
                </Select>
              </div>
            </FieldRow>
            <FieldRow label="Land area" optional="optional">
              <div className="flex gap-2">
                <Input name="land_area" placeholder="e.g. 1.5" type="number" inputMode="decimal" />
                <Select name="land_area_unit" className="w-26">
                  <option value="acre">acres</option>
                  <option value="hectare">hectares</option>
                  <option value="sqm">sq m</option>
                </Select>
              </div>
            </FieldRow>
            <FieldRow
              label="Bedrooms"
              optional="homes only"
              className="hidden md:flex"
            >
              <Input name="bedrooms" placeholder="—" type="number" inputMode="numeric" />
            </FieldRow>
            <FieldRow
              label="Year built"
              optional="optional"
              className="hidden md:flex"
            >
              <Input placeholder="e.g. 2018" />
            </FieldRow>
          </div>

          {/* ── Part two ── */}
          <div className="cl-snum mt-7 md:mt-9">
            <span>Part two — what you would like to do</span>
          </div>
          <div className="mt-4 grid gap-3 md:mt-4.5 md:grid-cols-2 md:gap-4">
            <FieldRow label="Your intention" className="md:col-span-2">
              <Segmented
                name="intention"
                options={[...INTENTION_OPTIONS]}
                value={intention}
                onChange={(value) =>
                  setIntention(value as (typeof INTENTION_OPTIONS)[number])
                }
                fill
                className="hidden md:inline-flex"
              />
              <Select
                className="md:hidden"
                value={intention}
                onChange={(event) =>
                  setIntention(
                    event.target.value as (typeof INTENTION_OPTIONS)[number]
                  )
                }
              >
                {INTENTION_OPTIONS.map((option) => (
                  <option key={option}>{option}</option>
                ))}
              </Select>
            </FieldRow>
            <FieldRow label="Figure you have in mind" optional="optional">
              <div className="flex gap-2">
                <Select name="figure_currency" className="w-24">
                  <option>KES</option>
                  <option>USD</option>
                  <option>GBP</option>
                  <option>AED</option>
                </Select>
                <Input
                  name="owner_expectation"
                  placeholder="e.g. 120,000,000"
                  type="number"
                  inputMode="numeric"
                />
              </div>
            </FieldRow>
            <FieldRow label="When would you want to move?">
              <Select name="move_timing">
                <option>As soon as possible</option>
                <option>Within three months</option>
                <option>Within six months</option>
                <option>Just planning ahead</option>
              </Select>
            </FieldRow>
            <FieldRow
              label="Is it tenanted, mortgaged or under any dispute?"
              className="md:col-span-2"
            >
              <Select name="tenancy">
                <option>None of these</option>
                <option>Currently tenanted</option>
                <option>Charged to a bank</option>
                <option>Title or boundary issue</option>
                <option>Prefer to discuss</option>
              </Select>
            </FieldRow>
          </div>

          {/* ── Part three ── */}
          <div className="cl-snum mt-7 md:mt-9">
            <span>Part three — how we reach you</span>
          </div>
          <div className="mt-4 grid gap-3 md:mt-4.5 md:grid-cols-2 md:gap-4">
            <FieldRow label="Your name">
              <Input name="full_name" placeholder="Full name" autoComplete="name" enterKeyHint="next" required />
            </FieldRow>
            <FieldRow label="Phone">
              <Input
                name="phone"
                placeholder="+254 7•• ••• •••"
                type="tel"
                inputMode="tel"
                autoComplete="tel"
                enterKeyHint="next"
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
                inputMode="tel"
                autoComplete="tel"
              />
            </FieldRow>
            <FieldRow label="Email" optional="optional">
              <Input name="email" placeholder="you@example.com" type="email" inputMode="email" autoComplete="email" enterKeyHint="send" />
            </FieldRow>
            <FieldRow label="Where are you based?">
              <Select>
                <option>Kenya</option>
                <option>United States</option>
                <option>United Kingdom</option>
                <option>United Arab Emirates</option>
                <option>Elsewhere</option>
              </Select>
            </FieldRow>
            <FieldRow label="Best time to call" className="hidden md:flex">
              <Select>
                <option>Any time, working hours</option>
                <option>Morning</option>
                <option>Afternoon</option>
                <option>Evening (EAT)</option>
              </Select>
            </FieldRow>
            <FieldRow
              label="Anything else we should know"
              optional="optional"
              className="md:col-span-2"
            >
              <Textarea
                name="message"
                placeholder="Access, keys, who is on site, why you are considering a sale…"
                className="min-h-21.5"
              />
            </FieldRow>
            <label className="flex items-start gap-2 text-[12px] leading-[1.6] text-neutral-700 md:col-span-2 md:text-[12.5px]">
              <input
                type="checkbox"
                className="mt-0.75 accent-(--color-accent)"
              />
              Send me relevant market notes for this area. We hold your details
              only to answer you, under the Data Protection Act 2019, and you
              can ask us to delete them at any time.
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
              {status === "submitting" ? "Sending…" : "Request the valuation"}
            </Button>
            <div className="cl-fig text-neutral-600) text-[12.5px]">
              {status === "success"
                ? "Sent — an agent will arrange a visit shortly."
                : status === "error"
                  ? `Something went wrong: ${error}`
                  : "One agent reads this — usually replying within two hours during office hours."}
            </div>
          </div>

          {/* ── Recent valuations ── */}
          <div className="mt-7 md:mt-8.5">
            <div className="cl-snum">
              <span>Valuations completed recently</span>
              <span className="cl-k text-neutral-600) hidden md:inline">
                Owner&rsquo;s permission given
              </span>
            </div>
            {RECENT.map(([what, outcome], index) => (
              <div
                key={what}
                className={
                  "cl-pair flex-col gap-1 text-[13px] md:flex-row md:gap-4 md:text-[13.5px]" +
                  (index === 0 ? " md:pt-3.5" : "") +
                  (index === RECENT.length - 1 ? " border-b-0" : "")
                }
              >
                <span>{what}</span>
                <span className="cl-fig text-neutral-700">{outcome}</span>
              </div>
            ))}
          </div>

          {/* ── FAQ ── */}
          <div className="mt-6 md:mt-7.5">
            <div className="cl-snum">
              <span>Questions owners ask</span>
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
            <div className="cl-k text-neutral-600">Useful to have ready</div>
            {READY.map(([label, note], index) => (
              <div
                key={label}
                className={
                  "cl-pair py-2 text-[13px]" +
                  (index === READY.length - 1 ? " border-b-0" : "")
                }
              >
                <span className="text-neutral-700">{label}</span>
                <span className="cl-fig">{note}</span>
              </div>
            ))}
          </div>

          <div className="border-l-2 border-(--color-accent-2) py-0.5 pl-3.5">
            <p className="text-neutral-700) m-0 text-[12.5px] leading-[1.65]">
              We do not publish anything about your property without your
              written instruction, and the address is never shown on the site —
              only the general location.
            </p>
          </div>

          <Plate
            matted={false}
            className="hidden aspect-4/3 md:grid"
            label={
              <>
                Plate — measuring a shed, Ruiru
                <br />
                1200×900
              </>
            }
          />
        </aside>
      </div>

      <div className="h-8" />
    </>
  )
}
