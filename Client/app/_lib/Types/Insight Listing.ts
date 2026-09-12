/** Mirrors `insight_listings` exactly — a pure many-to-many join, no surrogate id, no timestamps. */
export type InsightListing = {
  insight_id: string
  listing_id: string
  sort_order: number
}

export type attachListingDTO = {
  listing_id: string
  sort_order?: number
}

export type InsightListingContext = {
  attachListing: (
    insightId: string,
    details: attachListingDTO,
  ) => Promise<void>
  detachListing: (insightId: string, listingId: string) => Promise<void>
  getListingsForInsight: (insightId: string) => Promise<InsightListing[]>
}
