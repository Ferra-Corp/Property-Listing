import { ServiceError } from "../../../Utilities/Http.js";
import { ErrorMsg } from "../../../Utilities/Logger.js";
import { REDIRECT_LINK } from "../../../../Configurations/Env.js";
import {
  Cache,
  CacheKeys,
  Resource,
} from "../../../../Configurations/Cache.js";
import type {
  createListingDTO,
  Listing,
  ListingRepository,
  ListingService,
  ListingWithMedia,
  ListingWithThumbnail,
  UpdateListingDTO,
} from "./listing.types.js";
import type { MediaService } from "../Media/media.types.js";
import type { SubscriberService } from "../../Demand/Subscribers/subscriber.types.js";

/** Falls back to Title Case of the raw value — good enough for the handful
 * of subtypes ("mixed_use", "development_site"...) a nicer label was never
 * worth hand-writing for. */
function titleCase(value: string): string {
  return value
    .split("_")
    .map((word) => word[0]!.toUpperCase() + word.slice(1))
    .join(" ");
}

const LISTING_FIELDS: (keyof createListingDTO)[] = [
  "reference_code",
  "slug",
  "title",
  "summary",
  "description",
  "property_type",
  "property_subtype",
  "purpose",
  "status",
  "country_code",
  "state_region",
  "city",
  "neighbourhood",
  "location_label",
  "address_line",
  "postal_code",
  "latitude",
  "longitude",
  "price",
  "currency_code",
  "price_period",
  "price_on_request",
  "service_charge",
  "service_charge_period",
  "bedrooms",
  "bathrooms",
  "parking_spaces",
  "floor_area",
  "floor_area_unit",
  "land_area",
  "land_area_unit",
  "floors",
  "year_built",
  "features",
  "agent_id",
  "created_by",
  "is_exclusive",
  "is_featured",
  "meta_title",
  "meta_description",
  "og_image_url",
  "canonical_url",
  "noindex",
  "published_at",
  "sold_at",
];

const REQUIRED_LISTING_FIELDS: (keyof createListingDTO)[] = [
  "reference_code",
  "slug",
  "title",
  "description",
  "property_type",
  "purpose",
  "location_label",
  "agent_id",
];

export class ListingServ implements ListingService {
  constructor(
    private repo: ListingRepository,
    private mediaService: MediaService,
    private cache: Cache,
    private subscriberService: SubscriberService,
  ) {}

  async createListing(details: createListingDTO): Promise<Listing> {
    if (!details)
      throw new ServiceError("Listing details must be provided", 400);

    for (let key of REQUIRED_LISTING_FIELDS) {
      const value = details[key];

      if (value == undefined || value == null)
        throw new ServiceError(`${key} has an invalid value`, 400);
    }

    if (
      !details.price_on_request &&
      (details.price == null || details.price == undefined)
    )
      throw new ServiceError(
        "price is required unless price_on_request is true",
        400,
      );

    const floorAreaGiven = details.floor_area != null,
      floorUnitGiven = details.floor_area_unit != null;

    if (floorAreaGiven !== floorUnitGiven)
      throw new ServiceError(
        "floor_area and floor_area_unit must be provided together",
        400,
      );

    const newListing = await this.repo.createListing(details);

    if (Array.isArray(details.media) && details.media.length > 0) {
      const results = await Promise.allSettled(
        details.media.map((media) =>
          this.mediaService.createMedia({
            ...media,
            listing_id: newListing.id,
          }),
        ),
      );

      for (let result of results) {
        if (result.status === "rejected")
          ErrorMsg(
            new Error(
              `Failed to attach media to listing ${newListing.id}: ${
                result.reason instanceof Error
                  ? result.reason.message
                  : String(result.reason)
              }`,
            ),
          );
      }
    }

    await this.cache.invalidate(
      CacheKeys.all(Resource.Listing),
      `${CacheKeys.all(Resource.Listing)}:public`,
    );

    return newListing;
  }

  async editListing(id: string, details: UpdateListingDTO): Promise<Listing> {
    if (!id || !details)
      throw new ServiceError("Listing id and details must be provided", 400);

    let filteredDetails: UpdateListingDTO = {};

    for (let key of LISTING_FIELDS) {
      const value = details[key];

      if (value == undefined || value == null) continue;

      filteredDetails[key] = value as never;
    }

    if (Object.keys(filteredDetails).length == 0)
      throw new ServiceError("Nothing to update", 400);

    // Only a status edit can turn a listing into a fresh publish, and only
    // a listing that WASN'T already published counts as one — otherwise an
    // unrelated field edit on an already-live listing would re-announce it.
    const wasAlreadyPublished =
      filteredDetails.status === "published"
        ? (await this.repo.getListing(id))?.status === "published"
        : true;

    const patchedListing = await this.repo.editListing(id, filteredDetails);

    await this.cache.invalidate(
      CacheKeys.single(Resource.Listing, id),
      `${CacheKeys.single(Resource.Listing, id)}:public`,
      CacheKeys.all(Resource.Listing),
      `${CacheKeys.all(Resource.Listing)}:public`,
    );

    if (patchedListing.status === "published" && !wasAlreadyPublished) {
      // Announcing a fresh publish is best-effort and can take a while with
      // many subscribers — the caller gets their response as soon as the
      // listing itself is saved, not after every email has gone out.
      this.subscriberService
        .notifyListingPublished({
          property_type: patchedListing.property_type,
          property_subtype: patchedListing.property_subtype,
          address:
            patchedListing.address_line ?? patchedListing.location_label,
          price: patchedListing.price_on_request
            ? "Price on request"
            : patchedListing.price != null
              ? `${patchedListing.currency_code} ${patchedListing.price.toLocaleString()}`
              : "",
          beds: patchedListing.bedrooms?.toString() ?? "",
          baths: patchedListing.bathrooms?.toString() ?? "",
          sqft:
            patchedListing.floor_area != null && patchedListing.floor_area_unit
              ? `${patchedListing.floor_area.toLocaleString()} ${patchedListing.floor_area_unit}`
              : "",
          description: patchedListing.description,
          link: `${REDIRECT_LINK}/system/listings/${patchedListing.slug}`,
          propertyType: titleCase(
            patchedListing.property_subtype ?? patchedListing.property_type,
          ),
          photo: patchedListing.og_image_url ?? "",
        })
        .catch((error) => ErrorMsg(error as Error));
    }

    return patchedListing;
  }

  async getListing(
    id: string,
    publicOnly = false,
  ): Promise<ListingWithMedia> {
    if (!id) throw new ServiceError("Listing id must be provided", 400);

    const cacheKey = publicOnly
      ? `${CacheKeys.single(Resource.Listing, id)}:public`
      : CacheKeys.single(Resource.Listing, id);

    return this.cache.remember(cacheKey, async () => {
      const listing = await this.repo.getListing(id, publicOnly);

      if (!listing) throw new ServiceError("Listing not found", 404);

      return listing;
    });
  }

  async getListings(publicOnly = false): Promise<ListingWithThumbnail[]> {
    const cacheKey = publicOnly
      ? `${CacheKeys.all(Resource.Listing)}:public`
      : CacheKeys.all(Resource.Listing);

    return this.cache.remember(cacheKey, () =>
      this.repo.getListings(publicOnly),
    );
  }

  async deleteListing(id: string): Promise<void> {
    if (!id) throw new ServiceError("Listing id must be provided", 404);

    await this.repo.deleteListing(id);

    await this.cache.invalidate(
      CacheKeys.single(Resource.Listing, id),
      `${CacheKeys.single(Resource.Listing, id)}:public`,
      CacheKeys.all(Resource.Listing),
      `${CacheKeys.all(Resource.Listing)}:public`,
    );
  }
}
