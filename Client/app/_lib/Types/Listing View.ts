export type ListingView = {
  id: number
  listing_id: string
  session_hash: string | null
  country_code: string | null
  referrer: string | null
  utm_source: string | null
  device: string | null
  created_at: string
}

export type createListingViewDTO = Omit<ListingView, "id" | "created_at">

export interface ViewRepository {
  createView: (details: createListingViewDTO) => Promise<ListingView>
  getViews: () => Promise<ListingView[]>
}

export interface ViewService {
  createView: (details: createListingViewDTO) => Promise<ListingView>
  getViews: () => Promise<ListingView[]>
}

export type ListingViewContext = {
  views: ListingView[]
  createView: (details: createListingViewDTO) => Promise<void>
  getViews: () => Promise<void>
}
