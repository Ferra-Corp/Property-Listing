import type { ListingWithThumbnail } from "./Types/Listing"

/** Lowercases and turns punctuation/hyphens into spaces, so "go-down" and
 * "go down" — or "Two-bedroom, Kilimani" and "Two bedroom - Kilimani" —
 * normalize to the same word set. */
export function normalize(text: string): string {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, " ")
    .trim()
}

/** Matches when every word in the query appears somewhere in the listing's
 * searchable text, in any order — not one exact contiguous substring. */
export function matchesListing(
  listing: ListingWithThumbnail,
  query: string
): boolean {
  const haystack = normalize(
      `${listing.title} ${listing.location_label} ${listing.reference_code} ${listing.property_subtype ?? ""}`
    ),
    words = normalize(query).split(" ").filter(Boolean)

  return words.length > 0 && words.every((word) => haystack.includes(word))
}

/** Shared by the desktop inline dropdown and the mobile search dialog, so
 * "type this, see that" behaves identically in both places. */
export function searchListings(
  listings: ListingWithThumbnail[],
  query: string,
  limit: number
): ListingWithThumbnail[] {
  const trimmed = query.trim()
  if (!trimmed) return []
  return listings.filter((listing) => matchesListing(listing, trimmed)).slice(0, limit)
}
