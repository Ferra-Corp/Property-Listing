import type { createListingMediaDTO, ListingMedia } from "../Media/media.types.js";

export type PropertyType = "residential" | "commercial" | "industrial" | "land";

export type PropertySubtype =
  | "apartment"
  | "townhouse"
  | "villa"
  | "maisonette"
  | "bungalow"
  | "studio"
  | "office"
  | "retail"
  | "shop"
  | "showroom"
  | "mixed_use"
  | "go_down"
  | "warehouse"
  | "industrial_park"
  | "yard"
  | "plot"
  | "farm"
  | "development_site";

export type ListingPurpose = "sale" | "rent" | "lease";

export type PricePeriod =
  | "total"
  | "per_month"
  | "per_year"
  | "per_sqft_month"
  | "per_sqft_year"
  | "per_acre";

export type ListingStatus =
  | "draft"
  | "pending_review"
  | "published"
  | "under_offer"
  | "sold"
  | "rented"
  | "withdrawn";

export type AreaUnit = "sqft" | "sqm" | "acre" | "hectare";

export type Listing = {
  id: string;
  reference_code: string;
  slug: string;
  title: string;
  summary: string | null;
  description: string;
  property_type: PropertyType;
  property_subtype: PropertySubtype | null;
  purpose: ListingPurpose;
  status: ListingStatus;
  country_code: string;
  state_region: string | null;
  city: string | null;
  neighbourhood: string | null;
  location_label: string;
  address_line: string | null;
  postal_code: string | null;
  latitude: number | null;
  longitude: number | null;
  price: number | null;
  currency_code: string;
  price_period: PricePeriod;
  price_on_request: boolean;
  service_charge: number | null;
  service_charge_period: PricePeriod | null;
  bedrooms: number | null;
  bathrooms: number | null;
  parking_spaces: number | null;
  floor_area: number | null;
  floor_area_unit: AreaUnit | null;
  land_area: number | null;
  land_area_unit: AreaUnit | null;
  floors: number | null;
  year_built: number | null;
  features: Record<string, any>;
  agent_id: string;
  created_by: string | null;
  is_exclusive: boolean;
  is_featured: boolean;
  view_count: number;
  meta_title: string | null;
  meta_description: string | null;
  og_image_url: string | null;
  canonical_url: string | null;
  noindex: boolean;
  published_at: string | null;
  sold_at: string | null;
  created_at: string;
  updated_at: string;
  deleted_at: string | null;
};

export type createListingDTO = {
  reference_code: string;
  slug: string;
  title: string;
  summary?: string | null;
  description: string;
  property_type: PropertyType;
  property_subtype?: PropertySubtype | null;
  purpose: ListingPurpose;
  status?: ListingStatus;
  country_code?: string;
  state_region?: string | null;
  city?: string | null;
  neighbourhood?: string | null;
  location_label: string;
  address_line?: string | null;
  postal_code?: string | null;
  latitude?: number | null;
  longitude?: number | null;
  price?: number | null;
  currency_code?: string;
  price_period?: PricePeriod;
  price_on_request?: boolean;
  service_charge?: number | null;
  service_charge_period?: PricePeriod | null;
  bedrooms?: number | null;
  bathrooms?: number | null;
  parking_spaces?: number | null;
  floor_area?: number | null;
  floor_area_unit?: AreaUnit | null;
  land_area?: number | null;
  land_area_unit?: AreaUnit | null;
  floors?: number | null;
  year_built?: number | null;
  features?: Record<string, any>;
  agent_id: string;
  created_by?: string | null;
  is_exclusive?: boolean;
  is_featured?: boolean;
  meta_title?: string | null;
  meta_description?: string | null;
  og_image_url?: string | null;
  canonical_url?: string | null;
  noindex?: boolean;
  published_at?: string | null;
  sold_at?: string | null;
  media?: Omit<createListingMediaDTO, "listing_id">[];
};

export type UpdateListingDTO = Partial<createListingDTO>;

export type ListingWithMedia = Listing & { media: ListingMedia[] };

export type ListingWithThumbnail = Listing & { thumbnail_url: string | null };

export interface ListingRepository {
  createListing: (details: createListingDTO) => Promise<Listing>;
  editListing: (id: string, details: UpdateListingDTO) => Promise<Listing>;
  getListing: (
    id: string,
    publicOnly?: boolean,
  ) => Promise<ListingWithMedia | null>;
  getListings: (publicOnly?: boolean) => Promise<ListingWithThumbnail[]>;
  deleteListing: (id: string) => Promise<void>;
}

export interface ListingService {
  createListing: (details: createListingDTO) => Promise<Listing>;
  editListing: (id: string, details: UpdateListingDTO) => Promise<Listing>;
  getListing: (id: string, publicOnly?: boolean) => Promise<ListingWithMedia>;
  getListings: (publicOnly?: boolean) => Promise<ListingWithThumbnail[]>;
  deleteListing: (id: string) => Promise<void>;
}
