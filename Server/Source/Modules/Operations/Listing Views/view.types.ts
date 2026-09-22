export type ListingView = {
  id: number;
  listing_id: string;
  session_hash: string | null;
  country_code: string | null;
  referrer: string | null;
  utm_source: string | null;
  device: string | null;
  created_at: string;
};

export type createListingViewDTO = Omit<ListingView, "id" | "created_at">;

export type RecordedListingView = {
  view: ListingView;
  /** False when this visitor already has a view logged for this listing
   * within the dedup window — `view` is that earlier row, not a new one,
   * and `listings.view_count` was left untouched. */
  counted: boolean;
};

export interface ViewRepository {
  createView: (details: createListingViewDTO) => Promise<RecordedListingView>;
  getViews: () => Promise<ListingView[]>;
}

export interface ViewService {
  createView: (details: createListingViewDTO) => Promise<RecordedListingView>;
  getViews: () => Promise<ListingView[]>;
}
