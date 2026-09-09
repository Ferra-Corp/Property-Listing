import { ServiceError } from "../../../Utilities/Http.js";
import { Cache, CacheKeys, Resource } from "../../../../Configurations/Cache.js";
import type {
  createListingMediaDTO,
  ListingMedia,
  MediaRepository,
  MediaService,
  UpdateListingMediaDTO,
} from "./media.types.js";

export class MediaServ implements MediaService {
  constructor(
    private repo: MediaRepository,
    private cache: Cache,
  ) {}

  /** Media is embedded in a cached Listing/Listings response, so a listing's own cache is stale too. */
  private async invalidateListingCache(listingId: string): Promise<void> {
    await this.cache.invalidate(
      CacheKeys.single(Resource.Listing, listingId),
      CacheKeys.all(Resource.Listing),
    );
  }

  async createMedia(details: createListingMediaDTO): Promise<ListingMedia> {
    if (!details)
      throw new ServiceError("Listing media details must be provided", 400);

    const allowedFields: (keyof createListingMediaDTO)[] = [
      "listing_id",
      "url",
    ];

    for (let key of allowedFields) {
      const value = details[key];

      if (value == undefined || value == null)
        throw new ServiceError(`${key} has an invalid value`, 400);
    }

    const newMedia = await this.repo.createMedia(details);

    await this.cache.invalidate(CacheKeys.all(Resource.ListingMedia));
    await this.invalidateListingCache(newMedia.listing_id);

    return newMedia;
  }

  async editMedia(
    id: string,
    details: UpdateListingMediaDTO,
  ): Promise<ListingMedia> {
    if (!id || !details)
      throw new ServiceError(
        "Listing media id and details must be provided",
        400,
      );

    const allowedFields: (keyof UpdateListingMediaDTO)[] = [
      "type",
      "url",
      "thumbnail_url",
      "watermarked_url",
      "provider",
      "provider_public_id",
      "alt_text",
      "caption",
      "width",
      "height",
      "bytes",
      "duration_seconds",
      "is_primary",
      "sort_order",
    ];

    let filteredDetails: UpdateListingMediaDTO = {};

    for (let key of allowedFields) {
      const value = details[key];

      if (value == undefined || value == null) continue;

      filteredDetails[key] = value as never;
    }

    if (Object.keys(filteredDetails).length == 0)
      throw new ServiceError("Nothing to update", 400);

    const patchedMedia = await this.repo.editMedia(id, filteredDetails);

    await this.cache.invalidate(CacheKeys.all(Resource.ListingMedia));
    await this.invalidateListingCache(patchedMedia.listing_id);

    return patchedMedia;
  }

  async getMedia(): Promise<ListingMedia[]> {
    return this.cache.remember(CacheKeys.all(Resource.ListingMedia), () =>
      this.repo.getMedia(),
    );
  }

  async deleteMedia(id: string): Promise<void> {
    if (!id) throw new ServiceError("Listing media id must be provided", 404);

    const listingId = await this.repo.deleteMedia(id);

    await this.cache.invalidate(CacheKeys.all(Resource.ListingMedia));

    if (listingId) await this.invalidateListingCache(listingId);
  }
}
