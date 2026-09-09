import { ServiceError } from "../../../Utilities/Http.js";
import { Cache, CacheKeys, Resource } from "../../../../Configurations/Cache.js";
import type {
  createListingViewDTO,
  ListingView,
  ViewRepository,
  ViewService,
} from "./view.types.js";

export class ViewServ implements ViewService {
  constructor(
    private repo: ViewRepository,
    private cache: Cache,
  ) {}

  async createView(details: createListingViewDTO): Promise<ListingView> {
    if (!details)
      throw new ServiceError("Listing view details must be provided", 400);

    if (details.listing_id == undefined || details.listing_id == null)
      throw new ServiceError("listing_id has an invalid value", 400);

    const newView = await this.repo.createView(details);

    await this.cache.invalidate(CacheKeys.all(Resource.ListingView));

    return newView;
  }

  async getViews(): Promise<ListingView[]> {
    return this.cache.remember(CacheKeys.all(Resource.ListingView), () =>
      this.repo.getViews(),
    );
  }
}
