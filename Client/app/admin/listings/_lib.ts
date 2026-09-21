import type {
  ListingStatus,
  ListingWithThumbnail,
  PropertySubtype,
  PropertyType,
} from "../../_lib/Types/Listing"
import type { StatusTone } from "../../_components/Admin/ui"
import { formatPrice } from "../../_lib/format"

export const STATUS_LABEL: Record<ListingStatus, string> = {
  draft: "Draft",
  pending_review: "Pending review",
  published: "Published",
  under_offer: "Under offer",
  sold: "Sold",
  rented: "Rented",
  withdrawn: "Withdrawn",
}

export const STATUS_TONE: Record<ListingStatus, StatusTone> = {
  draft: "pending",
  pending_review: "mark",
  published: "published",
  under_offer: "pending",
  sold: "outline",
  rented: "outline",
  withdrawn: "neutral",
}

export const PROPERTY_TYPE_LABEL: Record<PropertyType, string> = {
  residential: "Residential",
  commercial: "Commercial",
  industrial: "Industrial",
  land: "Land",
}

export const SUBTYPES_BY_TYPE: Record<PropertyType, PropertySubtype[]> = {
  residential: [
    "apartment",
    "townhouse",
    "villa",
    "maisonette",
    "bungalow",
    "studio",
  ],
  commercial: ["office", "retail", "shop", "showroom", "mixed_use"],
  industrial: ["go_down", "warehouse", "industrial_park", "yard"],
  land: ["plot", "farm", "development_site"],
}

export function titleCase(value: string): string {
  return value
    .split("_")
    .map((w) => w[0]!.toUpperCase() + w.slice(1))
    .join(" ")
}

export function priceLabel(listing: ListingWithThumbnail): {
  price: string
  priceUnit: string
} {
  return formatPrice(
    listing.price,
    listing.currency_code,
    listing.price_period,
    listing.price_on_request
  )
}

export function dateLabel(iso: string): string {
  return new Date(iso).toLocaleDateString("en-GB", {
    day: "numeric",
    month: "short",
    year: "numeric",
  })
}

const TYPE_PREFIX: Record<PropertyType, string> = {
  residential: "RES",
  commercial: "COM",
  industrial: "IND",
  land: "LAND",
}

/** A sensible next reference code — never a hard rule (the field is
 * free-text and just needs to be unique), just a starting point so nobody
 * has to invent one from scratch. */
export function suggestReferenceCode(
  listings: ListingWithThumbnail[],
  propertyType: PropertyType
): string {
  const prefix = TYPE_PREFIX[propertyType],
    pattern = new RegExp(`-${prefix}-(\\d+)$`)

  const maxSeq = listings.reduce((max, l) => {
    const match = l.reference_code.match(pattern)
    if (!match) return max
    return Math.max(max, parseInt(match[1], 10))
  }, 0)

  return `D&G-${prefix}-${String(maxSeq + 1).padStart(4, "0")}`
}
