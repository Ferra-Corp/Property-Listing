"use client"

import Link from "next/link"
import { ButtonLink } from "../../_components/ui/button"
import { Plate } from "../../_components/ui/plate"
import { useListingContext } from "../../_lib/Context/Listing"
import { useAgentContext } from "../../_lib/Context/Agent"
import EntityTeam from "./../../../public/Team.jpg"

const HOW = [
  {
    n: "01",
    title: "We visit and measure",
    body: "Under-roof area, eaves, bay widths, yard, power. Taken on site, not from the landlord's brochure.",
  },
  {
    n: "02",
    title: "We photograph it",
    body: "Twelve plates or more, in daylight, including the parts nobody flatters — loading yard, roof, drains.",
  },
  {
    n: "03",
    title: "One poster writes it",
    body: "The same hand writes every listing, so the vocabulary and the units mean the same thing site-wide.",
  },
  {
    n: "04",
    title: "It is reviewed, then published",
    body: "Nothing goes live unread, and it comes down the day the space is taken.",
  },
]

const NEVER = [
  "Re-use a photograph from a previous season",
  "Quote a rate we have not seen agreed",
  "Publish an address without instruction",
  "Pass your details to a list broker",
  "Ask a visitor to open an account",
]

export default function AboutPage() {
  const { listings } = useListingContext(),
    { agents } = useAgentContext()

  const published = listings.filter((l) => l.status === "published"),
    transacted = listings.filter((l) =>
      ["sold", "rented", "let"].includes(l.status)
    ),
    combinedExperience = agents.reduce(
      (total, agent) => total + (agent.years_experience ?? 0),
      0
    ),
    industrialShot = published.find((l) => l.property_type === "industrial")

  const FIGURES = [
    { label: "Listings live", figure: String(published.length), unit: "" },
    {
      label: "Exclusive mandates",
      figure: String(published.filter((l) => l.is_exclusive).length),
      unit: "",
    },
    { label: "Let & sold", figure: String(transacted.length), unit: "" },
    combinedExperience > 0
      ? {
          label: "Combined experience",
          figure: String(combinedExperience),
          unit: " yrs",
        }
      : null,
  ].filter((item) => item !== null)

  const IN_SHORT = [
    ["Founded", "2026, Nairobi"],
    ["Agents", String(agents.length || "—")],
    ["Office", "Westlands"],
  ] as const

  const places = (() => {
    const counts = new Map<string, number>()
    for (const l of published) {
      const key = l.city ?? l.location_label
      counts.set(key, (counts.get(key) ?? 0) + 1)
    }
    return Array.from(
      counts,
      ([area, count]) =>
        [area, `${count} listing${count === 1 ? "" : "s"}`] as const
    ).sort((a, b) => Number(b[1]) - Number(a[1]))
  })()

  return (
    <div className="mx-auto max-w-360 bg-(--color-bg) pb-16">
      {/* ── Two plates ── */}
      <section className="grid gap-2 px-3 pt-4 md:grid-cols-[1.6fr_1fr] md:gap-4 md:px-6 md:pt-8">
        <Plate
          className="aspect-16/10 rounded-2xl border border-(--color-divider) md:aspect-auto md:h-95"
          label={
            <>
              Plate 01 — The industrial belt, early morning
              <br />
              <span className="italic">1600×1000</span>
            </>
          }
          src={industrialShot?.thumbnail_url}
          alt={industrialShot?.title ?? "The industrial belt"}
        />
        <Plate
          className="hidden rounded-2xl border border-(--color-divider) md:grid md:h-95"
          label="02 · The team, on site"
          src={EntityTeam}
          alt="The Entity team, on site"
        />
      </section>

      {/* ── The argument ── */}
      <section className="grid items-start gap-8 px-3 pt-10 md:grid-cols-[1fr_360px] md:gap-16 md:px-6 md:pt-14">
        <div>
          <div className="cl-k mb-4 text-neutral-500">About · The Entity</div>
          <h1 className="mt-0 mb-0 max-w-[24ch] text-[32px] leading-[1.12] font-normal text-(--color-text) md:text-[48px] md:leading-[1.08]">
            A small agency that measures the building before it writes about it
          </h1>
          <p className="mt-5 mb-5 text-justify text-[15px] leading-[1.75] [hyphens:auto] text-neutral-700 md:text-[16px]">
            We source and let commercial space across the Nairobi metropolitan
            area — go-downs, industrial park units, offices, retail and yards —
            and sell a short list of upmarket homes alongside it.{" "}
            {agents.length > 0
              ? `${agents.length} agent${agents.length === 1 ? "" : "s"}, one designated poster, and no listing published that one of us has not stood inside.`
              : "One designated poster, and no listing published that one of us has not stood inside."}
          </p>
          <p className="mb-0 text-justify text-[15px] leading-[1.75] [hyphens:auto] text-neutral-700 md:text-[16px]">
            The trade has a habit of recycling photographs, quoting rates that
            were true two years ago and describing a shed as clear-span because
            nobody went to look. That is the standard we are competing against,
            and the reason this site reads the way it does: a rate per square
            foot, the service charge next to it, the eaves height in metres, and
            photographs taken this season.
          </p>
        </div>

        <div className="border-l border-(--color-divider) py-2 pl-6">
          <div className="cl-k mb-4 text-neutral-500">In Short</div>
          {IN_SHORT.map(([label, value], index) => (
            <div
              key={label}
              className={
                "flex items-center justify-between border-b border-(--color-divider) py-3 text-[14px] text-(--color-text)" +
                (index === IN_SHORT.length - 1 ? " border-b-0" : "")
              }
            >
              <span className="text-neutral-600">{label}</span>
              <span className="text-(--color-text) italic">{value}</span>
            </div>
          ))}
          <div className="mt-6">
            <ButtonLink
              href="/system/contact"
              variant="primary"
              block
              className="rounded-xl border border-(--color-text) py-3.5 text-[11px] tracking-[0.15em] uppercase shadow-none transition-transform hover:scale-[1.02] active:scale-[0.98]"
            >
              Talk to Us
            </ButtonLink>
          </div>
        </div>
      </section>

      {/* ── Credentials as figures ── */}
      {FIGURES.length > 0 ? (
        <section className="mx-3 mt-12 grid grid-cols-2 border-t border-b border-(--color-divider) md:mx-6 md:mt-16 md:grid-cols-4">
          {FIGURES.map((item, index) => (
            <div
              key={item.label}
              className={
                "border-b border-(--color-divider) px-3 py-6 md:border-b-0 md:px-6 md:py-8 " +
                (index % 2 === 1 ? "border-l md:border-l" : "pl-0 md:pl-6") +
                (index === 0
                  ? " pl-0 md:pl-0"
                  : " md:border-l md:border-(--color-divider)")
              }
            >
              <div className="cl-k text-neutral-500">{item.label}</div>
              <div className="mt-2 text-[28px] font-normal text-(--color-text) md:text-[36px]">
                {item.figure}
                {item.unit ? (
                  <span className="ml-1 text-[14px] text-neutral-600 italic md:text-[16px]">
                    {item.unit}
                  </span>
                ) : null}
              </div>
            </div>
          ))}
        </section>
      ) : null}

      {/* ── How a listing gets made ── */}
      <section className="px-3 pt-12 md:px-6 md:pt-16">
        <div className="flex items-center justify-between border-b border-(--color-divider) pb-3">
          <span className="text-[20px] text-(--color-text)">
            How a Listing Gets Made
          </span>
          <span className="cl-k hidden text-neutral-500 md:inline">
            Four steps, in this order, every time
          </span>
        </div>
        <div className="mt-8 grid gap-8 md:grid-cols-4 md:gap-x-8">
          {HOW.map((step, index) => (
            <div
              key={step.n}
              className={
                index < HOW.length - 1
                  ? "md:border-r md:border-(--color-divider) md:pr-8"
                  : undefined
              }
            >
              <div className="text-[16px] text-neutral-500 italic">
                {step.n}
                <span className="cl-k ml-2 text-(--color-text) not-italic md:hidden">
                  · {step.title}
                </span>
              </div>
              <h4 className="mt-3 mb-2 hidden text-[20px] font-normal text-(--color-text) md:block">
                {step.title}
              </h4>
              <p className="mt-2 mb-0 text-[14px] leading-[1.7] text-neutral-600">
                {step.body}
              </p>
            </div>
          ))}
        </div>
      </section>

      {/* ── The people ── */}
      {agents.length > 0 ? (
        <section className="px-3 pt-14 md:px-6 md:pt-20">
          <div className="flex items-center justify-between border-b border-(--color-divider) pb-3">
            <span className="text-[20px] text-(--color-text)">
              {agents.length <= 3 ? "The People Behind It" : "Some of the Team"}
            </span>
            <Link
              href="/system/agents"
              className="text-[14px] text-(--color-text) italic underline-offset-4 hover:underline"
            >
              All agents →
            </Link>
          </div>
          <div className="mt-8 flex flex-col gap-8 md:grid md:grid-cols-3 md:gap-8">
            {agents.slice(0, 3).map((agent) => (
              <div key={agent.slug} className="flex items-start gap-4">
                <Plate
                  matted={false}
                  className="h-27.5 w-22 flex-none rounded-xl border border-(--color-divider) md:h-35 md:w-27.5"
                  label={agent.display_name}
                  src={agent.photo_url}
                  alt={agent.display_name}
                />
                <div>
                  <div className="text-[21px] text-(--color-text)">
                    {agent.display_name}
                  </div>
                  {agent.title ? (
                    <div className="cl-k mt-1 text-neutral-500">
                      {agent.title}
                    </div>
                  ) : null}
                  {agent.bio ? (
                    <p className="mt-2 mb-0 line-clamp-3 text-[13.5px] leading-[1.6] text-neutral-600 italic">
                      {agent.bio}
                    </p>
                  ) : null}
                  <Link
                    href={`/system/agents/${agent.slug}`}
                    className="mt-3 inline-block text-[13px] text-(--color-text) underline decoration-neutral-300 underline-offset-4 transition-colors hover:decoration-(--color-text)"
                  >
                    Profile →
                  </Link>
                </div>
              </div>
            ))}
          </div>
        </section>
      ) : null}

      {/* ── Standards and coverage ── */}
      <section className="grid gap-12 px-3 pt-16 md:grid-cols-2 md:gap-16 md:px-6 md:pt-20">
        <div>
          <div className="border-b border-(--color-divider) pb-3 text-[20px] text-(--color-text)">
            What We Will Not Do
          </div>
          {NEVER.map((line, index) => (
            <div
              key={line}
              className={
                "flex items-center justify-between border-b border-(--color-divider) py-3.5 text-[14px]" +
                (index === NEVER.length - 1 ? " border-b-0" : "")
              }
            >
              <span className="text-(--color-text)">{line}</span>
              <span className="cl-k text-neutral-500">Never</span>
            </div>
          ))}
        </div>
        {places.length > 0 ? (
          <div>
            <div className="border-b border-(--color-divider) pb-3 text-[20px] text-(--color-text)">
              Where We Work
            </div>
            {places.map(([area, count], index) => (
              <Link
                key={area}
                href="/system/listings"
                className={
                  "flex items-center justify-between border-b border-(--color-divider) py-3.5 text-[14px] transition-colors hover:text-(--color-accent-700)" +
                  (index === places.length - 1 ? " border-b-0" : "")
                }
              >
                <span className="text-neutral-700">{area}</span>
                <span className="text-(--color-text) italic">{count}</span>
              </Link>
            ))}
          </div>
        ) : null}
      </section>

      {/* ── Two ways to start ── */}
      <section className="mx-3 mt-16 flex flex-col items-center justify-between gap-8 rounded-2xl border border-(--color-divider) bg-neutral-100 px-6 py-12 md:mx-6 md:mt-20 md:flex-row md:px-12">
        <div className="max-w-[56ch]">
          <h3 className="mb-0 text-[26px] font-normal text-(--color-text) md:text-[30px]">
            Two Ways to Start
          </h3>
          <p className="mt-3 mb-0 text-[15px] leading-relaxed text-neutral-600 italic">
            If you need space, send the specification and we will come back with
            a shortlist. If you own something you would let or sell, we will
            value it, photograph it and tell you honestly what it should fetch.
          </p>
        </div>
        <div className="flex w-full flex-none flex-col gap-3 md:w-70">
          <ButtonLink
            href="/system/contact"
            variant="primary"
            block
            className="rounded-xl border border-(--color-text) py-4 text-[11px] tracking-[0.15em] uppercase shadow-none transition-transform hover:scale-[1.02] active:scale-[0.98]"
          >
            Send a requirement
          </ButtonLink>
          <ButtonLink
            href="/system/valuation-requests"
            variant="secondary"
            block
            className="rounded-xl border border-(--color-divider) bg-transparent py-4 text-[11px] tracking-[0.15em] text-(--color-text) uppercase shadow-none transition-transform hover:scale-[1.02] hover:bg-neutral-100 active:scale-[0.98]"
          >
            Sell or value property
          </ButtonLink>
        </div>
      </section>

      <div className="h-8" />
    </div>
  )
}
