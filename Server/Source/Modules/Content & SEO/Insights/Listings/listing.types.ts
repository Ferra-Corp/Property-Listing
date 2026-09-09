/** Mirrors `insight_listings` exactly — a pure many-to-many join, no surrogate id, no timestamps. */
export type InsightListing = {
  insight_id: string;
  listing_id: string;
  sort_order: number;
};

export type attachListingDTO = {
  insight_id: string;
  listing_id: string;
  sort_order?: number;
};

export interface InsightListingRepository {
  attachListing: (details: attachListingDTO) => Promise<InsightListing>;
  detachListing: (insightId: string, listingId: string) => Promise<void>;
  getListingsForInsight: (insightId: string) => Promise<InsightListing[]>;
}

export interface InsightListingService {
  attachListing: (details: attachListingDTO) => Promise<InsightListing>;
  detachListing: (insightId: string, listingId: string) => Promise<void>;
  getListingsForInsight: (insightId: string) => Promise<InsightListing[]>;
}
