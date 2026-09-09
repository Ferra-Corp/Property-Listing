import { ServiceError } from "../../../../Utilities/Http.js";
import {
  Cache,
  CacheKeys,
  Resource,
} from "../../../../../Configurations/Cache.js";
import type {
  attachListingDTO,
  InsightListing,
  InsightListingRepository,
  InsightListingService,
} from "./listing.types.js";

export class InsightListingServ implements InsightListingService {
  constructor(
    private repo: InsightListingRepository,
    private cache: Cache,
  ) {}

  async attachListing(details: attachListingDTO): Promise<InsightListing> {
    if (!details || !details.insight_id || !details.listing_id)
      throw new ServiceError("insight_id and listing_id are required", 400);

    const link = await this.repo.attachListing(details);

    await this.cache.invalidate(
      CacheKeys.scoped(Resource.InsightListing, details.insight_id),
    );

    return link;
  }

  async detachListing(insightId: string, listingId: string): Promise<void> {
    if (!insightId || !listingId)
      throw new ServiceError("insight_id and listing_id are required", 400);

    await this.repo.detachListing(insightId, listingId);

    await this.cache.invalidate(
      CacheKeys.scoped(Resource.InsightListing, insightId),
    );
  }

  async getListingsForInsight(insightId: string): Promise<InsightListing[]> {
    if (!insightId) throw new ServiceError("insight_id is required", 400);

    return this.cache.remember(
      CacheKeys.scoped(Resource.InsightListing, insightId),
      () => this.repo.getListingsForInsight(insightId),
    );
  }
}
