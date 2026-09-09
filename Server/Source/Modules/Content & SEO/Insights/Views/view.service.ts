import { ServiceError } from "../../../../Utilities/Http.js";
import {
  Cache,
  CacheKeys,
  Resource,
} from "../../../../../Configurations/Cache.js";
import type {
  createInsightViewDTO,
  InsightView,
  InsightViewRepository,
  InsightViewService,
} from "./view.types.js";

export class InsightViewServ implements InsightViewService {
  constructor(
    private repo: InsightViewRepository,
    private cache: Cache,
  ) {}

  async createView(details: createInsightViewDTO): Promise<InsightView> {
    if (!details)
      throw new ServiceError("Insight view details must be provided", 400);

    if (!details.insight_id)
      throw new ServiceError("insight_id has an invalid value", 400);

    const newView = await this.repo.createView(details);

    await this.cache.invalidate(CacheKeys.all(Resource.InsightView));

    // Deliberately NOT invalidating the Insight's own cache here — view_count lives
    // on that cached object, but invalidating it on every single view would mean the
    // most-viewed insights (the ones caching helps most) would almost never get a
    // cache hit. view_count on a cached Insight is eventually consistent, up to the
    // cache's TTL — the insight_views table itself is always exact.

    return newView;
  }

  async getViews(): Promise<InsightView[]> {
    return this.cache.remember(CacheKeys.all(Resource.InsightView), () =>
      this.repo.getViews(),
    );
  }
}
