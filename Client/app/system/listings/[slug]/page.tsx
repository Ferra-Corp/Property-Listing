"use client"

import * as React from "react"
import { useParams } from "next/navigation"
import Link from "next/link"
import { ButtonLink } from "../../../_components/ui/button"
import { Card, CardKicker, CardTitle } from "../../../_components/ui/card"
import { Plate } from "../../../_components/ui/plate"
import { Tag } from "../../../_components/ui/tag"
import { useListingContext } from "../../../_lib/Context/Listing"
import { useAgentContext } from "../../../_lib/Context/Agent"
import {
  buildWhatsAppLink,
  formatPrice,
  relativeDate,
  toWhatsAppDigits,
} from "../../../_lib/format"
import { ADMIN_WHATSAPP_NUMBER } from "../../../_lib/config"
import { toRowListing, useCurrencyConversion } from "../_components/listing-row"
import type { ListingWithMedia } from "../../../_lib/Types/Listing"

function buildHeadline(listing: ListingWithMedia) {
  const headline: { label: string; figure: string; unit: string }[] = []

  if (listing.floor_area)
    headline.push({
      label: "Under roof",
      figure: Number(listing.floor_area).toLocaleString(),
      unit: ` ${listing.floor_area_unit ?? "sqft"}`,
    })
  if (listing.land_area)
    headline.push({
      label: "Site",
      figure: Number(listing.land_area).toLocaleString(),
      unit: ` ${listing.land_area_unit ?? "acres"}`,
    })
  if (listing.bedrooms)
    headline.push({
      label: "Bedrooms",
      figure: String(listing.bedrooms),
      unit: "",
    })
  if (listing.bathrooms)
    headline.push({
      label: "Bathrooms",
      figure: String(listing.bathrooms),
      unit: "",
    })
  if (listing.parking_spaces)
    headline.push({
      label: "Parking",
      figure: String(listing.parking_spaces),
      unit: " bays",
    })
  if (listing.floors)
    headline.push({ label: "Floors", figure: String(listing.floors), unit: "" })

  return headline.slice(0, 4)
}

function buildSpec(listing: ListingWithMedia): [string, string][] {
  const spec: [string, string][] = []

  if (listing.year_built) spec.push(["Year built", String(listing.year_built)])
  if (listing.service_charge)
    spec.push([
      "Service charge",
      `${listing.currency_code} ${Number(listing.service_charge).toLocaleString()}`,
    ])
  if (listing.parking_spaces)
    spec.push(["Parking", `${listing.parking_spaces} bays`])
  if (listing.floor_area)
    spec.push([
      "Floor area",
      `${Number(listing.floor_area).toLocaleString()} ${listing.floor_area_unit ?? "sqft"}`,
    ])
  if (listing.land_area)
    spec.push([
      "Land area",
      `${Number(listing.land_area).toLocaleString()} ${listing.land_area_unit ?? "acre"}`,
    ])

  return spec
}

export default function ListingDetailPage() {
  const { slug } = useParams<{ slug: string }>(),
    { listings, fetchListing } = useListingContext(),
    { agents } = useAgentContext(),
    convertTo = useCurrencyConversion(),
    [listing, setListing] = React.useState<ListingWithMedia | null>(null),
    [status, setStatus] = React.useState<"loading" | "found" | "not-found">(
      "loading"
    )

  React.useEffect(() => {
    const summary = listings.find((item) => item.slug === slug)

    if (!summary) {
      if (listings.length === 0) return
      setStatus("not-found")
      return
    }

    fetchListing(summary.id).then((full) => {
      if (!full) {
        setStatus("not-found")
        return
      }
      setListing(full)
      setStatus("found")
    })
  }, [slug, listings, fetchListing])

  const comparable = listing
    ? listings
        .filter(
          (item) =>
            item.id !== listing.id &&
            item.property_type === listing.property_type
        )
        .slice(0, 3)
        .map((item) => toRowListing(item, convertTo))
    : []

  if (status === "loading")
    return (
      <div className="text-neutral-600) px-3 py-16 text-center text-[13.5px] md:px-6">
        Loading…
      </div>
    )

  if (status === "not-found" || !listing)
    return (
      <div className="px-3 py-16 text-center md:px-6">
        <h1 className="mb-2 text-[24px] font-normal">Listing not found</h1>
        <p className="mb-4 text-[13.5px] text-neutral-600">
          This listing may have been let, sold or withdrawn.
        </p>
        <Link href="/system/listings" className="text-[13.5px]">
          ← Back to listings
        </Link>
      </div>
    )

  const headline = buildHeadline(listing),
    spec = buildSpec(listing),
    { price, priceUnit } = formatPrice(
      listing.price,
      listing.currency_code,
      listing.price_period,
      listing.price_on_request,
      convertTo
    ),
    plates = listing.media.length > 0 ? listing.media : null,
    agent = agents.find((item) => item.user_id === listing.agent_id),
    whatsappNumber =
      agent?.whatsapp_number || agent?.phone || ADMIN_WHATSAPP_NUMBER,
    callNumber =
      agent?.phone || agent?.whatsapp_number || ADMIN_WHATSAPP_NUMBER,
    whatsappHref = buildWhatsAppLink(
      whatsappNumber,
      `Hi, I'm interested in ${listing.title} (Ref: ${listing.reference_code}). Is it still available?`
    ),
    callHref = `tel:+${toWhatsAppDigits(callNumber)}`,
    agentFirstName = agent?.display_name.split(" ")[0]

  // Intelligent Image Mosaic Layout Logic
  const plateCount = plates?.length || 1
  let mosaicContainerClasses = ""

  if (plateCount === 1) {
    mosaicContainerClasses = "grid grid-cols-1 md:h-[500px]"
  } else if (plateCount === 2) {
    mosaicContainerClasses =
      "grid grid-cols-1 grid-rows-[250px_250px] md:grid-cols-2 md:grid-rows-1 md:h-[500px]"
  } else {
    mosaicContainerClasses =
      "grid grid-cols-2 grid-rows-[200px_120px] md:grid-cols-[2.1fr_1fr_1fr] md:grid-rows-[200px_200px]"
  }

  const getPlateClass = (index: number) => {
    const base = "border-0 md:border-4 object-cover w-full h-full"
    if (plateCount <= 2) return base
    if (index === 0) return `${base} col-span-2 md:col-span-1 md:row-span-2`
    if (index >= 3) return `${base} hidden md:grid`
    return base
  }

  return (
    <>
      {/* ── Mosaic: Dynamically adjusts to 1, 2, or 3+ images matching header bounds ── */}
      <section
        className={`relative mt-4 gap-1 px-3 pt-3 md:gap-1.25 md:px-6 md:pt-1.25 ${mosaicContainerClasses}`}
      >
        {plates ? (
          plates
            .slice(0, 5)
            .map((media, index) => (
              <Plate
                key={media.id}
                className={getPlateClass(index)}
                label={media.alt_text ?? listing.title}
                src={media.url}
                alt={media.alt_text ?? listing.title}
              />
            ))
        ) : (
          <Plate className={getPlateClass(0)} label={listing.title} />
        )}

        <div className="absolute top-6 left-5 flex gap-1.75 md:left-9">
          {listing.is_exclusive ? (
            <Tag
              variant="mark"
              className="rounded-md px-2 py-1 shadow-sm backdrop-blur-md"
            >
              Exclusive mandate
            </Tag>
          ) : null}
          <Tag className="hidden rounded-md border border-(--color-divider) bg-(--color-bg)/90 px-2 py-1 text-[9.5px] font-(--font-mono-cl) tracking-[0.12em] uppercase shadow-sm backdrop-blur-md md:inline-flex">
            {listing.purpose === "sale" ? "For sale" : "For lease"}
          </Tag>
        </div>
      </section>

      <div className="grid items-start gap-8 px-3 pt-6 pb-10 md:grid-cols-[1fr_320px] md:gap-14 md:px-6 md:pt-10 md:pb-11.5">
        {/* ── The description ── */}
        <div>
          <div className="flex items-baseline gap-3.5">
            <div className="cl-k cl-fig cl-mono text-neutral-600">
              {listing.reference_code}
            </div>
            <span className="h-px flex-1 bg-(--color-divider)" />
            <div className="cl-k text-neutral-600">
              Listed {relativeDate(listing.created_at)}
            </div>
          </div>

          <h1 className="mt-4 mb-0 max-w-[20ch] text-[28px] leading-[1.1] font-normal md:mt-4.5 md:text-[46px]">
            {listing.title}
          </h1>
          <p className="mt-2.5 mb-0 text-[13.5px] text-neutral-700 md:mt-3 md:text-[16px]">
            {listing.location_label}
          </p>

          {/* headline figures */}
          {headline.length > 0 ? (
            <div className="mt-5 grid grid-cols-2 border-t border-(--color-divider) md:mt-7.5 md:grid-cols-4 md:border-b">
              {headline.map((item, index) => (
                <div
                  key={item.label}
                  className={
                    "border-b border-(--color-divider) p-3 md:border-b-0 md:p-4 " +
                    (index % 2 === 1
                      ? "border-l border-(--color-divider)"
                      : "pl-0 md:pl-4") +
                    (index === 0
                      ? " md:pl-0"
                      : " md:border-l md:border-(--color-divider)")
                  }
                >
                  <div className="cl-k text-neutral-600">{item.label}</div>
                  <div className="cl-fig mt-1.5 font-(family-name:--font-heading) text-[22px] md:text-[26px]">
                    {item.figure}
                    <span className="font-(family-name:--font-body) text-[13px] text-neutral-700">
                      {item.unit}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          ) : null}

          <p className="mt-5 mb-3 text-[14px] leading-[1.7] [hyphens:auto] md:mt-7 md:text-justify md:text-[15px] md:leading-[1.75]">
            {listing.description}
          </p>

          {spec.length > 0 ? (
            <>
              <h4 className="mt-7 mb-1 text-[19px] font-normal md:mt-8 md:text-[21px]">
                Full specification
              </h4>
              <div className="grid md:grid-cols-2 md:gap-x-11">
                {spec.map(([label, value]) => (
                  <div
                    key={label}
                    className="cl-fig flex justify-between border-b border-(--color-divider) py-2.5 text-[13.5px] md:py-2.75"
                  >
                    <span className="text-neutral-700">{label}</span>
                    <span>{value}</span>
                  </div>
                ))}
              </div>
            </>
          ) : null}
        </div>

        {/* ── The figures rail ── */}
        <aside className="flex flex-col gap-4 md:sticky md:top-18.5">
          <div className="cl-card flex flex-col gap-0 rounded-2xl border border-(--color-divider) p-6 shadow-sm">
            <div className="cl-k text-neutral-600)">
              {listing.purpose === "sale" ? "Asking price" : "Asking rent"}
            </div>
            <div className="cl-fig mt-2.5 flex items-baseline gap-2">
              <span className="font-(family-name:--font-heading) text-[36px] leading-none md:text-[40px]">
                {price}
              </span>
              <span className="text-[13px] text-neutral-700">{priceUnit}</span>
            </div>
            {agent ? (
              <div className="cl-fig mt-2 text-[12.5px] text-neutral-700">
                Listed by{" "}
                <Link
                  href={`/system/agents/${agent.slug}`}
                  className="font-medium text-(--color-text) transition-colors hover:text-(--color-accent)"
                >
                  {agent.display_name}
                </Link>
              </div>
            ) : null}
            <hr className="cl-hr my-5" />
            <div className="mt-1 flex flex-col gap-2.5">
              <ButtonLink
                href={whatsappHref}
                target="_blank"
                rel="noopener noreferrer"
                variant="primary"
                className="rounded-xl py-2.5 transition-transform hover:scale-[1.02] active:scale-[0.98]"
                block
              >
                WhatsApp {agentFirstName ?? "us"}
              </ButtonLink>
              <ButtonLink
                href={callHref}
                variant="secondary"
                className="rounded-xl py-2.5 transition-transform hover:scale-[1.02] active:scale-[0.98]"
                block
              >
                Call {agentFirstName ?? "the office"}
              </ButtonLink>
              <ButtonLink
                href={`/system/viewing-requests?listing=${listing.slug}`}
                variant="secondary"
                className="rounded-xl py-2.5 transition-transform hover:scale-[1.02] active:scale-[0.98]"
                block
              >
                Request a viewing
              </ButtonLink>
            </div>
          </div>

          <div className="border-l-2 border-(--color-accent) py-1 pl-4">
            <p className="m-0 text-[12.5px] leading-[1.65] text-neutral-700">
              Enquiries need no account. Quote{" "}
              <span className="cl-fig cl-mono font-medium text-(--color-text)">
                {listing.reference_code}
              </span>{" "}
              when you call.
            </p>
          </div>
        </aside>
      </div>

      {/* ── Comparable space ── */}
      {comparable.length > 0 ? (
        <section
          id="plates"
          className="border-t border-(--color-divider) px-3 py-8 md:px-6 md:pt-8.5 md:pb-11"
        >
          <div className="flex items-baseline justify-between gap-4">
            <h3 className="m-0 text-[20px] font-normal md:text-[24px]">
              Comparable space
            </h3>
            <Link
              href="/system/listings"
              className="text-[13px] font-medium transition-opacity hover:opacity-70"
            >
              All listings →
            </Link>
          </div>
          <div className="mt-4 grid gap-5 md:mt-6 md:grid-cols-3 md:gap-6">
            {comparable.map((item) => (
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
                      <div className="cl-fig flex items-baseline gap-1 text-[13px] text-neutral-700">
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

      {/* ── Sticky figure + contact bar, small screens ── */}
      <div className="sticky bottom-16 z-10 border-t border-(--color-divider) bg-[color-mix(in_srgb,var(--color-bg)_90%,transparent)] px-3 py-3 shadow-[0_-4px_12px_rgba(0,0,0,0.05)] backdrop-blur-md md:hidden">
        <div className="flex items-baseline justify-between">
          <span className="cl-fig font-(family-name:--font-heading) text-[24px]">
            {price}{" "}
            <span className="font-(family-name:--font-body) text-[12px] text-neutral-700">
              {priceUnit}
            </span>
          </span>
        </div>
      </div>
    </>
  )
}
