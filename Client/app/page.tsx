"use client"

import * as React from "react"
import Link from "next/link"
import { ButtonLink } from "./_components/ui/button"
import { Card, CardKicker, CardTitle } from "./_components/ui/card"
import { Input, Segmented, Select } from "./_components/ui/field"
import { Plate } from "./_components/ui/plate"
import { Disclosure, IndexRow, SectionHead } from "./_components/ui/section"
import { Tag } from "./_components/ui/tag"
import { useListingContext } from "./_lib/Context/Listing"
import { useAgentContext } from "./_lib/Context/Agent"
import { useInsightContext } from "./_lib/Context/Insight"
import { useServiceContext } from "./_lib/Context/Service"
import { buildWhatsAppLink } from "./_lib/format"
import { useContactPhone } from "./_lib/useSiteSettings"
import {
  toRowListing,
  useCurrencyConversion,
} from "./system/listings/_components/listing-row"
import type { ListingPurpose } from "./_lib/Types/Listing"

const PURPOSE_OPTIONS = ["Lease", "Buy", "Rent"] as const

const PURPOSE_MAP: Record<(typeof PURPOSE_OPTIONS)[number], ListingPurpose> = {
  Lease: "lease",
  Buy: "sale",
  Rent: "rent",
}

const PROPERTY_KIND_OPTIONS = [
  { label: "Go-down / warehouse", subtypes: ["go_down", "warehouse"] },
  { label: "Office", subtypes: ["office"] },
  { label: "Retail / showroom", subtypes: ["retail", "showroom"] },
  { label: "Yard / plot", subtypes: ["yard", "plot"] },
  { label: "Residential", category: "residential" },
] as const

const SUBTYPE_LABEL: Record<string, string> = {
  apartment: "Apartments",
  townhouse: "Townhouses",
  villa: "Villas",
  maisonette: "Maisonettes",
  bungalow: "Bungalows",
  studio: "Studios",
  office: "Offices",
  retail: "Retail",
  shop: "Shops",
  showroom: "Showrooms",
  mixed_use: "Mixed use",
  go_down: "Go-downs",
  warehouse: "Warehousing",
  industrial_park: "Industrial park units",
  yard: "Yards & hardstanding",
  plot: "Plots",
  farm: "Farms",
  development_site: "Development sites",
}

const STATUS_LABEL: Record<string, string> = {
  sold: "Sold",
  rented: "Let",
  let: "Let",
}

const PRINCIPLES = [
  {
    title: "One poster, one standard",
    body: "Every listing is written, measured and photographed by the same hand before it is published. Nothing goes up unreviewed, and nothing stays up once it is gone.",
  },
  {
    title: "Figures in your currency",
    body: "Rates are quoted in shillings and converted for KES, USD, GBP and AED at the day's rate — useful if you are buying from Houston or Dubai.",
  },
  {
    title: "No account, no gate",
    body: "Ask by WhatsApp, phone or the form. You will speak to the agent holding the mandate, not a call centre reading a script.",
  },
]

const FAQ = [
  {
    q: "Do I need an account to enquire?",
    a: "No — and you never will. A name and a phone number is enough for us to send you what fits.",
  },
  {
    q: "How are commercial rates quoted?",
    a: "Per square foot per month, with the service charge shown separately and the gross monthly figure worked out for you on the listing.",
  },
  {
    q: "Can you act for a buyer abroad?",
    a: "Yes. We film walkthroughs, send measured plans and deal with your advocate here — several of our sales complete without the buyer landing.",
  },
  {
    q: "What does a valuation cost?",
    a: "Nothing when it comes with an instruction to let or sell. A standalone written valuation is quoted on the size and use of the property.",
  },
]

export default function HomePage() {
  const { listings } = useListingContext(),
    { agents } = useAgentContext(),
    { insights: allInsights } = useInsightContext(),
    { services } = useServiceContext(),
    convertTo = useCurrencyConversion(),
    ADMIN_WHATSAPP_NUMBER = useContactPhone(),
    whatsappHref = buildWhatsAppLink(
      ADMIN_WHATSAPP_NUMBER,
      "Hi, I'd like some help finding a property."
    )

  const published = listings.filter((l) => l.status === "published"),
    featured = [...published]
      .sort((a, b) => Number(b.is_exclusive) - Number(a.is_exclusive))
      .slice(0, 3)
      .map((l) => toRowListing(l, convertTo)),
    mosaic = published.slice(0, 5),
    transacted = listings
      .filter((l) => ["sold", "rented"].includes(l.status))
      .slice(0, 3)
      .map((l) => toRowListing(l, convertTo)),
    insights = allInsights
      .filter((i) => i.status === "published")
      .sort(
        (a, b) =>
          new Date(b.published_at ?? b.created_at).getTime() -
          new Date(a.published_at ?? a.created_at).getTime()
      )
      .slice(0, 3)

  const byUse = (() => {
    const counts = new Map<string, number>()
    for (const l of published) {
      if (!l.property_subtype) continue
      counts.set(l.property_subtype, (counts.get(l.property_subtype) ?? 0) + 1)
    }
    return Array.from(counts, ([value, count]) => ({
      label: SUBTYPE_LABEL[value] ?? value,
      count,
    }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 5)
  })()

  const places = (() => {
    const counts = new Map<string, number>()
    for (const l of published) {
      const key = l.city ?? l.location_label
      counts.set(key, (counts.get(key) ?? 0) + 1)
    }
    return Array.from(counts, ([label, count]) => ({ label, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 8)
  })()

  const [searchPurpose, setSearchPurpose] = React.useState<
      (typeof PURPOSE_OPTIONS)[number] | ""
    >(""),
    [searchKind, setSearchKind] = React.useState(""),
    [searchLocation, setSearchLocation] = React.useState("")

  const selectedKind = PROPERTY_KIND_OPTIONS.find(
    (kind) => kind.label === searchKind
  )

  // Same base set and vocabulary the listings page itself filters on, so
  // this count is exactly what clicking through will show — not a guess.
  const matchingListings = listings.filter((listing) => {
    if (searchPurpose && listing.purpose !== PURPOSE_MAP[searchPurpose])
      return false
    if (
      selectedKind &&
      "subtypes" in selectedKind &&
      !(selectedKind.subtypes as readonly string[]).includes(
        listing.property_subtype ?? ""
      )
    )
      return false
    if (
      selectedKind &&
      "category" in selectedKind &&
      listing.property_type !== selectedKind.category
    )
      return false
    if (
      searchLocation &&
      (listing.city ?? listing.location_label) !== searchLocation
    )
      return false
    return true
  })

  const searchHref = (() => {
    const params = new URLSearchParams()
    if (searchPurpose) params.set("purpose", PURPOSE_MAP[searchPurpose])
    if (selectedKind && "subtypes" in selectedKind)
      params.set("subtype", selectedKind.subtypes.join(","))
    if (selectedKind && "category" in selectedKind)
      params.set("type", selectedKind.category)
    if (searchLocation) params.set("location", searchLocation)

    const query = params.toString()
    return `/system/listings${query ? `?${query}` : ""}`
  })()

  return (
    <>
      {/* ── Mosaic: real listings open the site the way they open a listing ── */}
      <section className="relative mt-4 grid grid-cols-2 grid-rows-[200px_96px] gap-1 px-3 pt-3 md:grid-cols-[2.1fr_1fr_1fr] md:grid-rows-[196px_196px] md:gap-1.25 md:px-6 md:pt-1.25">
        {mosaic.length > 0 ? (
          mosaic.map((listing, index) => (
            <Plate
              key={listing.id}
              className={
                (index === 0
                  ? "col-span-2 border-0 md:col-span-1 md:row-span-2 md:border-4"
                  : "border-0 md:border-4") +
                (index >= 3 ? " hidden md:grid" : "")
              }
              label={listing.title}
              src={listing.thumbnail_url}
              alt={listing.title}
            />
          ))
        ) : (
          <Plate
            className="col-span-2 border-0 md:col-span-1 md:row-span-2 md:border-4"
            label="Entity"
          />
        )}

        <div className="absolute top-5.5 left-5.5 flex gap-1.75 md:left-8.5">
          <Tag variant="mark">Exclusive mandates</Tag>
          <Tag className="hidden border border-(--color-divider) bg-(--color-bg) text-[9.5px] font-(--font-mono-cl) tracking-[0.12em] uppercase md:inline-flex">
            Nairobi metropolitan
          </Tag>
        </div>
        <div className="absolute right-5.5 bottom-5.5 hidden md:right-8.5 md:block">
          <ButtonLink
            href="/system/listings"
            variant="secondary"
            className="bg-(--color-bg)"
          >
            Browse all {listings.length} listings
          </ButtonLink>
        </div>
      </section>

      {/* ── The sentence ── */}
      <section className="grid grid-cols-1 items-start gap-8 px-3 pt-5 md:grid-cols-[1fr_340px] md:gap-14 md:px-6 md:pt-9.5 md:pb-8.5">
        <div>
          <div className="cl-k text-neutral-600">
            Commercial &amp; upmarket residential · leasing and sale
          </div>
          <h1 className="mt-3 mb-0 max-w-[24ch] text-[30px] leading-[1.15] font-normal text-pretty md:mt-4 md:text-[48px] md:leading-[1.1]">
            Space that is photographed properly, priced plainly, and shown by
            the agent who holds it.
          </h1>
          <p className="mt-2.5 mb-0 max-w-[60ch] text-[14px] leading-[1.7] text-neutral-700 md:mt-4 md:text-[16px]">
            Go-downs, offices, retail and yards across the Nairobi metropolitan
            area, alongside a short list of upmarket homes. Every enquiry
            reaches an agent directly — there is no account to open.
          </p>
        </div>
        <div className="border-l-2 border-(--color-accent) py-1 pl-4">
          <div className="cl-k text-neutral-600">Talk to us first</div>
          <p className="mt-2 mb-3.5 text-[13.5px] leading-[1.65]">
            Tell us what you need and we will send only what fits — usually the
            same day.
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
              Send a requirement
            </ButtonLink>
          </div>
        </div>
      </section>

      {/* ── Search, as a hairline row under the pictures ── */}
      <section className="mx-3 mt-6 flex flex-col gap-2 rounded-(--cl-radius-lg) border border-(--color-divider) bg-neutral-100 p-3 md:mx-6 md:mt-0 md:flex-row md:items-center md:gap-3 md:px-4 md:py-3.5">
        <Segmented
          name="purpose"
          options={[...PURPOSE_OPTIONS]}
          value={searchPurpose}
          onChange={(value) =>
            setSearchPurpose(
              searchPurpose === value
                ? ""
                : (value as (typeof PURPOSE_OPTIONS)[number])
            )
          }
          fill
          className="md:flex-none"
        />
        <Select
          className="text-[13px] md:w-42.5 md:flex-none"
          value={searchKind}
          onChange={(e) => setSearchKind(e.target.value)}
        >
          <option value="">All property types</option>
          {PROPERTY_KIND_OPTIONS.map((kind) => (
            <option key={kind.label}>{kind.label}</option>
          ))}
        </Select>
        <Select
          className="text-[13px] md:w-40 md:flex-none"
          value={searchLocation}
          onChange={(e) => setSearchLocation(e.target.value)}
        >
          <option value="">Any location</option>
          {places.slice(0, 5).map((place) => (
            <option key={place.label}>{place.label}</option>
          ))}
        </Select>
        <span className="hidden flex-1 md:block" />
        <ButtonLink
          href={searchHref}
          variant="primary"
          className="w-full justify-center md:w-auto md:flex-none"
        >
          Search {matchingListings.length} listings
        </ButtonLink>
      </section>

      {/* ── Featured ── */}
      {featured.length > 0 ? (
        <section className="px-3 pt-8 md:px-6 md:pt-9.5">
          <SectionHead
            title="Featured this week"
            href="/system/listings"
            linkLabel="All listings"
          />
          <div className="mt-4 grid gap-5 md:mt-6 md:grid-cols-3 md:gap-6">
            {featured.map((item) => (
              <Link
                key={item.slug}
                href={`/system/listings/${item.slug}`}
                className="group contents"
              >
                <Card className="flex h-full flex-col overflow-hidden rounded-xl p-0 text-(--color-text) shadow-sm transition-transform duration-300 hover:-translate-y-1 hover:shadow-md">
                  <div className="relative overflow-hidden bg-neutral-100 dark:bg-neutral-800">
                    <Plate
                      matted={false}
                      className="aspect-16/10 w-full rounded-none! transition-transform duration-500 ease-out group-hover:scale-105"
                      label={item.plate}
                      src={item.plateImage}
                      alt={item.title}
                    />

                    <div className="absolute inset-0 bg-linear-to-b from-black/20 to-transparent opacity-60" />

                    {item.exclusive ? (
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
                      {item.where}
                    </CardKicker>

                    <CardTitle className="mt-1.5 text-lg leading-tight font-medium">
                      {item.title}
                    </CardTitle>

                    <div className="mt-auto pt-5">
                      <div className="cl-fig text-neutral-700) flex items-baseline gap-1 text-[13px]">
                        {item.price} {item.priceUnit}
                      </div>
                    </div>
                  </div>
                </Card>
              </Link>
            ))}
          </div>
        </section>
      ) : null}

      {/* ── The book, by use ── */}
      {byUse.length > 0 ? (
        <section className="grid items-start gap-6 px-3 pt-8 md:grid-cols-[1fr_400px] md:gap-12 md:px-6 md:pt-10">
          <div>
            <div className="cl-k text-neutral-600)">The book, by use</div>
            <div className="mt-3.5 border-t border-(--color-divider)">
              {byUse.map((row) => (
                <IndexRow
                  key={row.label}
                  href="/system/listings"
                  label={row.label}
                  figure={`${row.count} listing${row.count === 1 ? "" : "s"}`}
                />
              ))}
            </div>
          </div>
          <Plate
            className="hidden aspect-4/3 md:grid md:border-4"
            label="Industrial Area, morning"
          />
        </section>
      ) : null}

      {/* ── What we do ── */}
      {services.length > 0 ? (
        <section className="px-3 pt-8 md:px-6 md:pt-9.5">
          <SectionHead
            title="What we do"
            href="/system/services"
            linkLabel="All services"
          />
          <div className="mt-3.5 grid gap-3.5 md:mt-5 md:grid-cols-4 md:gap-x-8.5">
            {services.slice(0, 4).map((service, index, arr) => (
              <div
                key={service.id}
                className={
                  index < arr.length - 1
                    ? "md:border-r md:border-(--color-divider) md:pr-8.5"
                    : undefined
                }
              >
                <div className="cl-k cl-fig cl-mono text-(--color-accent)">
                  {String(index + 1).padStart(2, "0")}
                </div>
                <h4 className="mt-2 mb-0 text-[19px] font-normal md:text-[20px]">
                  {service.title}
                </h4>
                {service.summary ? (
                  <p className="mt-2 mb-0 text-[13px] leading-[1.65] text-neutral-700">
                    {service.summary}
                  </p>
                ) : null}
              </div>
            ))}
          </div>
        </section>
      ) : null}

      {/* ── Where we work ── */}
      {places.length > 0 ? (
        <section className="px-3 pt-8 md:px-6 md:pt-9.5">
          <SectionHead
            title="Where we work"
            aside="Nairobi metropolitan area"
          />
          <div className="mt-3 grid grid-cols-2 gap-x-4.5 md:mt-4 md:grid-cols-4 md:gap-x-8.5">
            {places.map((place) => (
              <IndexRow
                key={place.label}
                href="/system/listings"
                label={place.label}
                figure={place.count}
                className="py-2.5 text-[13.5px] md:text-[14px]"
              />
            ))}
          </div>
        </section>
      ) : null}

      {/* ── Owner's call to action ── */}
      <section className="mt-8 grid items-center gap-6 border-y border-(--color-divider) bg-neutral-200 px-3 py-6 md:mt-10 md:grid-cols-2 md:gap-12 md:px-6 md:py-8.5">
        <div>
          <h3 className="mb-0 text-[21px] font-normal md:text-[27px]">
            Sell or let your property
          </h3>
          <p className="text-neutral-700) mt-2.5 mb-0 max-w-[48ch] text-[13.5px] leading-[1.7] md:text-[14.5px]">
            Send the address and the size and we will value it, photograph it
            and bring you a shortlist of tenants or buyers. No fee until it is
            let or sold.
          </p>
        </div>
        <div className="grid gap-2.5 md:grid-cols-2">
          <ButtonLink
            href="/system/valuation-requests"
            variant="primary"
            className="md:col-span-2"
            block
          >
            Request a valuation
          </ButtonLink>
        </div>
      </section>

      {/* ── Recently let and sold ── */}
      {transacted.length > 0 ? (
        <section className="px-3 pt-8 md:px-6 md:pt-9.5">
          <SectionHead title="Recently let and sold" aside="Last ninety days" />
          <div className="mt-3 grid md:mt-1.5 md:grid-cols-3 md:gap-x-8.5">
            {transacted.map((item, index, arr) => (
              <div
                key={item.slug}
                className={
                  index < arr.length - 1
                    ? "border-b border-(--color-divider) py-2.5 md:border-r md:border-b-0 md:py-0 md:pr-8.5"
                    : "py-2.5 md:py-0"
                }
              >
                <div className="cl-midx border-b-0 py-0 text-[13.5px] md:py-3.25 md:text-[14px]">
                  <span>{item.title}</span>
                </div>
                <div className="cl-fig cl-k text-neutral-600) mt-1.5 md:mt-0">
                  {STATUS_LABEL[item.status] ?? item.status} · {item.price}{" "}
                  {item.priceUnit}
                </div>
              </div>
            ))}
          </div>
        </section>
      ) : null}

      {/* ── Three principles ── */}
      <section className="grid gap-4 px-3 pt-8 md:grid-cols-3 md:gap-x-8.5 md:px-6 md:pt-8.5">
        {PRINCIPLES.map((principle) => (
          <div
            key={principle.title}
            className="border-t-2 border-(--color-accent) pt-3"
          >
            <h4 className="mb-0 text-[19px] font-normal md:text-[21px]">
              {principle.title}
            </h4>
            <p className="text-neutral-700) mt-2 mb-0 text-[13px] leading-[1.7]">
              {principle.body}
            </p>
          </div>
        ))}
      </section>

      {/* ── Agents ── */}
      {agents.length > 0 ? (
        <section className="px-3 pt-8 md:px-6 md:pt-9">
          <SectionHead
            title="The people who hold the mandates"
            href="/system/agents"
            linkLabel="All agents"
          />
          <div className="mt-3.5 flex flex-col gap-3.5 md:mt-5 md:grid md:grid-cols-3 md:gap-5">
            {agents.slice(0, 3).map((agent) => (
              <Link
                key={agent.slug}
                href={`/system/agents/${agent.slug}`}
                className="flex items-start gap-3 text-(--color-text) md:gap-3.5"
              >
                <Plate
                  matted={false}
                  className="h-20 w-16 flex-none md:h-24 md:w-19.5"
                  label={agent.display_name}
                  src={agent.photo_url}
                  alt={agent.display_name}
                />
                <div>
                  <div className="font-(family-name:--font-heading) text-[19px] md:text-[20px]">
                    {agent.display_name}
                  </div>
                  {agent.title ? (
                    <div className="cl-k text-neutral-600) mt-1">
                      {agent.title}
                    </div>
                  ) : null}
                  {agent.specializations.length > 0 ? (
                    <p className="text-neutral-700) mt-1.5 mb-0 text-[12.5px] leading-[1.6]">
                      {agent.specializations.join(", ")}
                    </p>
                  ) : null}
                </div>
              </Link>
            ))}
          </div>
        </section>
      ) : null}

      {/* ── Insights ── */}
      {insights.length > 0 ? (
        <section className="px-3 pt-8 md:px-6 md:pt-9">
          <SectionHead
            title="Market insights & area notes"
            href="/system/insights"
            linkLabel="All insights"
          />
          <div className="mt-3.5 grid gap-3.5 md:mt-4.5 md:grid-cols-3 md:gap-x-8.5">
            {insights.map((insight, index, arr) => (
              <Link
                key={insight.slug}
                href={`/system/insights/${insight.slug}`}
                className={
                  "block text-(--color-text) " +
                  (index < arr.length - 1
                    ? "border-b border-(--color-divider) pb-3.5 md:border-r md:border-b-0 md:pr-8.5 md:pb-0"
                    : "")
                }
              >
                {insight.tags[0] ? (
                  <div className="cl-k text-(--color-accent)">
                    {insight.tags[0].name}
                  </div>
                ) : null}
                <h4 className="mt-2 mb-0 text-[18px] leading-[1.3] font-normal md:text-[19px]">
                  {insight.title}
                </h4>
                {insight.summary ? (
                  <p className="text-neutral-700) mt-2 mb-0 hidden text-[13px] leading-[1.65] md:block">
                    {insight.summary}
                  </p>
                ) : null}
                <div className="cl-k cl-fig text-neutral-600) mt-2.5">
                  {insight.read_minutes} min read
                </div>
              </Link>
            ))}
          </div>
        </section>
      ) : null}

      {/* ── FAQ + subscribe ── */}
      <section className="grid items-start gap-6 px-3 pt-8 md:grid-cols-[1fr_380px] md:gap-12 md:px-6 md:pt-9.5">
        <div>
          <div className="cl-sechead">
            <h3 className="text-[20px] md:text-[25px]">
              Questions we are asked
            </h3>
          </div>
          <div className="mt-1.5">
            {FAQ.map((item) => (
              <Disclosure key={item.q} question={item.q}>
                {item.a}
              </Disclosure>
            ))}
          </div>
        </div>
        <div className="rounded-(--cl-radius-lg) border border-(--color-divider) bg-neutral-100 p-4 md:p-5">
          <div className="cl-k text-neutral-600)">New listings, by email</div>
          <h4 className="mt-2 mb-0 text-[19px] font-normal md:text-[22px]">
            One note a fortnight, only what is new
          </h4>
          <p className="text-neutral-700) mt-2 mb-3.5 text-[13px] leading-[1.65]">
            Choose a segment and we will send new mandates and rate movements as
            they happen. Unsubscribe in one click.
          </p>
          <div className="flex flex-col gap-2">
            <Select defaultValue="">
              <option value="">Which space interests you?</option>
              <option>Go-downs &amp; warehousing</option>
              <option>Offices</option>
              <option>Retail</option>
              <option>Residential</option>
            </Select>
            <Input placeholder="Email address" type="email" />
            <ButtonLink href="/system/contact" variant="primary" block>
              Send me new listings
            </ButtonLink>
          </div>
          <div className="cl-k text-neutral-600) mt-3">
            We hold your details only to answer you · DPA 2019
          </div>
        </div>
      </section>

      <div className="h-6" />
      <p className="px-3 pb-2 text-center text-[13px] md:hidden">
        <Link href="/system/listings">
          Browse all {listings.length} listings →
        </Link>
      </p>
    </>
  )
}
