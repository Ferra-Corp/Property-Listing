import { ServiceError } from "../../../Utilities/Http.js";
import { Cache, CacheKeys, Resource } from "../../../../Configurations/Cache.js";
import type {
  createListingViewDTO,
  ListingView,
  RecordedListingView,
  ViewRepository,
  ViewService,
} from "./view.types.js";

export class ViewServ implements ViewService {
  constructor(
    private repo: ViewRepository,
    private cache: Cache,
  ) {}

  async createView(
    details: createListingViewDTO,
  ): Promise<RecordedListingView> {
    if (!details)
      throw new ServiceError("Listing view details must be provided", 400);

    if (details.listing_id == undefined || details.listing_id == null)
      throw new ServiceError("listing_id has an invalid value", 400);

    const recorded = await this.repo.createView(details);

    await this.cache.invalidate(CacheKeys.all(Resource.ListingView));

    // Only a genuinely new (counted) view actually changed the listing's
    // view_count — a deduped repeat left it untouched, so there's nothing
    // stale to clear.
    if (recorded.counted) {
      const { listing_id } = details;
      await this.cache.invalidate(
        CacheKeys.single(Resource.Listing, listing_id),
        `${CacheKeys.single(Resource.Listing, listing_id)}:public`,
        CacheKeys.all(Resource.Listing),
        `${CacheKeys.all(Resource.Listing)}:public`,
      );
    }

    return recorded;
  }

  async getViews(): Promise<ListingView[]> {
    return this.cache.remember(CacheKeys.all(Resource.ListingView), () =>
      this.repo.getViews(),
    );
  }
}
