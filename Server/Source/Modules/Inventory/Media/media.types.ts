export type MediaType =
  | "image"
  | "video"
  | "floor_plan"
  | "virtual_tour"
  | "brochure";

export type ListingMedia = {
  id: string;
  listing_id: string;
  type: MediaType;
  url: string;
  thumbnail_url: string | null;
  watermarked_url: string | null;
  provider: string;
  provider_public_id: string | null;
  alt_text: string | null;
  caption: string | null;
  width: number | null;
  height: number | null;
  bytes: number | null;
  duration_seconds: number | null;
  is_primary: boolean;
  sort_order: number;
  created_at: string;
  deleted_at: string | null;
};

export type createListingMediaDTO = {
  listing_id: string;
  type?: MediaType;
  url: string;
  thumbnail_url?: string | null;
  watermarked_url?: string | null;
  provider?: string;
  provider_public_id?: string | null;
  alt_text?: string | null;
  caption?: string | null;
  width?: number | null;
  height?: number | null;
  bytes?: number | null;
  duration_seconds?: number | null;
  is_primary?: boolean;
  sort_order?: number;
};

export type UpdateListingMediaDTO = Partial<
  Omit<createListingMediaDTO, "listing_id">
>;

export interface MediaRepository {
  createMedia: (details: createListingMediaDTO) => Promise<ListingMedia>;
  editMedia: (
    id: string,
    details: UpdateListingMediaDTO,
  ) => Promise<ListingMedia>;
  getMedia: () => Promise<ListingMedia[]>;
  /** Returns the affected row's listing_id (for cache invalidation), or null if nothing was deleted. */
  deleteMedia: (id: string) => Promise<string | null>;
}

export interface MediaService {
  createMedia: (details: createListingMediaDTO) => Promise<ListingMedia>;
  editMedia: (
    id: string,
    details: UpdateListingMediaDTO,
  ) => Promise<ListingMedia>;
  getMedia: () => Promise<ListingMedia[]>;
  deleteMedia: (id: string) => Promise<void>;
}
