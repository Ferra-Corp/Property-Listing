import Link from "next/link"
import { AnimatePresence, motion } from "motion/react"
import { ButtonLink } from "../../../_components/ui/button"
import { Chip } from "../../../_components/ui/filters"
import { Plate } from "../../../_components/ui/plate"
import { Tag } from "../../../_components/ui/tag"
import {
  buildWhatsAppLink,
  formatPrice,
  relativeDate,
} from "../../../_lib/format"
import { useContactPhone } from "../../../_lib/useSiteSettings"
import { useAgentContext } from "../../../_lib/Context/Agent"
import { useSelectedCurrency } from "../../../_lib/Context/SelectedCurrency"
import { useRatesContext } from "../../../_lib/Context/ExchangeRate"
import type { ListingWithThumbnail } from "../../../_lib/Types/Listing"

/** The visitor's selected display currency + the rates to convert into it. */
export function useCurrencyConversion() {
  const { currency } = useSelectedCurrency(),
    { rates } = useRatesContext()

  return { currency, rates }
}

export type Listing = {
  slug: string
  reference: string
  status: string
  title: string
  where: string
  standfirst: string
  spec: string[]
  plate: string
  plateImage: string | null
  plateCount?: number
  exclusive?: boolean
  /** the display figure, e.g. "KES 71" or "On request" */
  price: string
  priceUnit: string
  /** converted or previous figure under the rate */
  priceNote?: string
  priceNoteTone?: "muted" | "lava"
  gross?: string
  /** under-offer listings drop the WhatsApp call */
  registerOnly?: boolean
  /** users.id of the assigned agent, if any — used to resolve who WhatsApp goes to */
  agentId: string | null
}

/**
 * Resolves who a listing enquiry should reach: the assigned agent's
 * WhatsApp number, falling back to their phone, falling back to the
 * office line if no agent is assigned or neither is on file.
 */
export function useListingWhatsAppLink(
  agentId: string | null,
  message: string
): string {
  const { agents } = useAgentContext(),
    ADMIN_WHATSAPP_NUMBER = useContactPhone(),
    agent = agents.find((item) => item.user_id === agentId),
    number = agent?.whatsapp_number || agent?.phone || ADMIN_WHATSAPP_NUMBER

  return buildWhatsAppLink(number, message)
}

const STATUS_LABEL: Record<string, string> = {
  under_offer: "under offer",
  sold: "sold",
  rented: "rented",
  withdrawn: "withdrawn",
}

/** Maps a real backend listing row into the register's display shape. */
export function toRowListing(
  listing: ListingWithThumbnail,
  convertTo?: ReturnType<typeof useCurrencyConversion>
): Listing {
  const { price, priceUnit } = formatPrice(
    listing.price,
    listing.currency_code,
    listing.price_period,
    listing.price_on_request,
    convertTo
  )

  const spec: string[] = []
  if (listing.bedrooms) spec.push(`${listing.bedrooms} bed`)
  if (listing.bathrooms) spec.push(`${listing.bathrooms} bath`)
  if (listing.parking_spaces) spec.push(`${listing.parking_spaces} parking`)
  if (listing.floors) spec.push(`${listing.floors} floors`)
  if (listing.year_built) spec.push(`Built ${listing.year_built}`)

  const areaLabel = listing.floor_area
    ? `${Number(listing.floor_area).toLocaleString()} ${listing.floor_area_unit ?? "sqft"} under roof`
    : listing.land_area
      ? `${Number(listing.land_area).toLocaleString()} ${listing.land_area_unit ?? "acre"}`
      : null

  return {
    slug: listing.slug,
    reference: listing.reference_code,
    status: STATUS_LABEL[listing.status] ?? relativeDate(listing.created_at),
    title: listing.title,
    where: areaLabel
      ? `${listing.location_label} · ${areaLabel}`
      : listing.location_label,
    standfirst: listing.summary ?? "",
    spec,
    plate: listing.title,
    plateImage: listing.thumbnail_url,
    exclusive: listing.is_exclusive,
    price,
    priceUnit,
    registerOnly: listing.status === "under_offer",
    agentId: listing.agent_id ?? null,
  }
}

/**
 * A listing on the register: plate on the left, the description in the
 * measure, and the figures standing in the right margin.
 */
export function ListingRow({
  listing,
  last,
}: {
  listing: Listing
  last?: boolean
}) {
  const whatsappHref = useListingWhatsAppLink(
    listing.agentId,
    `Hi, I'm interested in ${listing.title} (Ref: ${listing.reference}). Is it still available?`
  )
  const { currency } = useSelectedCurrency()

  return (
    <article
      className={
        // Added 'group' to orchestrate hover states across the whole row
        "group grid items-start gap-3 border-b border-(--color-divider) py-5 transition-colors md:grid-cols-[300px_1fr_190px] md:gap-6 md:py-6" +
        (last ? " md:border-b-0" : "")
      }
    >
      <Link
        href={`/system/listings/${listing.slug}`}
        // Modern image container matching the homepage card
        className="relative block overflow-hidden rounded-xl bg-neutral-100 shadow-sm transition-shadow group-hover:shadow-md dark:bg-neutral-800"
      >
        <Plate
          matted={false}
          className="aspect-16/10 w-full rounded-none! transition-transform duration-500 ease-out group-hover:scale-105"
          label={listing.plate}
          src={listing.plateImage}
          alt={listing.title}
          sizes="(min-width: 1024px) 300px, (min-width: 768px) 40vw, 100vw"
        />

        {/* Subtle gradient overlay to ensure tags are always readable */}
        <div className="absolute inset-0 bg-linear-to-b from-black/20 to-transparent opacity-60" />

        {listing.exclusive ? (
          <Tag
            variant="mark"
            className="absolute top-3 left-3 rounded-md px-2 py-1 text-[10px] font-medium tracking-wide shadow-sm backdrop-blur-md"
          >
            Exclusive
          </Tag>
        ) : null}

        {listing.plateCount ? (
          <Tag className="cl-fig cl-mono absolute right-3 bottom-3 rounded-md border border-white/20 bg-black/60 px-2 py-1 text-[9.5px] text-white shadow-sm backdrop-blur-md">
            {listing.plateCount} plates
          </Tag>
        ) : null}
      </Link>

      <div className="flex flex-col pt-1 md:pt-0">
        <div className="cl-k cl-fig cl-mono tracking-wider text-neutral-600 uppercase">
          {listing.reference} · {listing.status}
        </div>

        <Link href={`/system/listings/${listing.slug}`} className="contents">
          <h3 className="mt-2 mb-0 text-[21px] leading-tight font-medium transition-opacity group-hover:opacity-80 md:text-[25px]">
            {listing.title}
          </h3>
        </Link>

        <p className="mt-1.5 mb-0 text-[13px] text-neutral-700 md:text-[13.5px]">
          {listing.where}
        </p>

        <p className="mt-2.5 mb-0 hidden max-w-[56ch] text-[13px] leading-[1.65] text-neutral-700 md:block">
          {listing.standfirst}
        </p>

        <div className="mt-3 hidden flex-wrap gap-1.75 md:flex">
          {listing.spec.map((item) => (
            <Chip
              key={item}
              className="rounded-md bg-neutral-100 px-2.5 py-1 text-[12px] font-medium"
            >
              {item}
            </Chip>
          ))}
        </div>
      </div>

      {/* figures — right margin on desktop, a baseline row on mobile */}
      <div className="mt-4 flex flex-wrap items-end justify-between gap-3 pt-1 md:mt-0 md:block md:text-right">
        <div className="min-w-0">
          <AnimatePresence mode="wait" initial={false}>
            <motion.div
              key={`${currency}-${listing.price}`}
              initial={{ opacity: 0, y: 4 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -4 }}
              transition={{ duration: 0.18, ease: [0.22, 1, 0.36, 1] }}
              className="cl-fig font-(family-name:--font-heading) text-[25px] leading-[1.1] md:text-[31px]"
            >
              {listing.price}
            </motion.div>
          </AnimatePresence>
          <div className="cl-fig mt-1 text-[12px] text-neutral-700">
            {listing.priceUnit}
          </div>
          {listing.priceNote ? (
            <div
              className={
                "cl-fig mt-1.5 text-[12px] " +
                (listing.priceNoteTone === "lava"
                  ? "text-(--color-accent-2)"
                  : "text-neutral-600")
              }
            >
              {listing.priceNote}
            </div>
          ) : null}
          {listing.gross ? (
            <div className="cl-fig mt-2.5 border-t border-(--color-divider) pt-2.5 text-[11.5px] text-neutral-700 md:text-[12.5px]">
              {listing.gross}
            </div>
          ) : null}
        </div>

        <div className="flex flex-none flex-col gap-1.75 md:mt-4">
          {listing.registerOnly ? (
            <ButtonLink
              href={`/system/listings/${listing.slug}`}
              variant="secondary"
              className="rounded-lg transition-transform hover:scale-[1.02] active:scale-95"
            >
              Register interest
            </ButtonLink>
          ) : (
            <ButtonLink
              href={whatsappHref}
              target="_blank"
              rel="noopener noreferrer"
              variant="primary"
              className="rounded-lg transition-transform hover:scale-[1.02] active:scale-95"
            >
              WhatsApp
            </ButtonLink>
          )}
          <ButtonLink
            href={`/system/listings/${listing.slug}`}
            variant="secondary"
            className="hidden rounded-lg transition-transform hover:scale-[1.02] active:scale-95 md:inline-flex"
          >
            View listing
          </ButtonLink>
        </div>
      </div>
    </article>
  )
}
