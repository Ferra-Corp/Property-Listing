import { ServiceError } from "../../../../Utilities/Http.js";
import {
  Cache,
  CacheKeys,
  Resource,
} from "../../../../../Configurations/Cache.js";
import type {
  attachTagDTO,
  InsightTag,
  InsightTagRepository,
  InsightTagService,
} from "./tag.types.js";

export class InsightTagServ implements InsightTagService {
  constructor(
    private repo: InsightTagRepository,
    private cache: Cache,
  ) {}

  /** Tags are embedded in a cached Insight/Insights response, so an insight's own cache is stale too. */
  private async invalidateInsightCache(insightId: string): Promise<void> {
    await this.cache.invalidate(
      CacheKeys.single(Resource.Insight, insightId),
      CacheKeys.all(Resource.Insight),
    );
  }

  async attachTag(details: attachTagDTO): Promise<InsightTag> {
    if (!details || !details.insight_id || !details.tag_id)
      throw new ServiceError("insight_id and tag_id are required", 400);

    const link = await this.repo.attachTag(details);

    await this.cache.invalidate(
      CacheKeys.scoped(Resource.InsightTag, details.insight_id),
    );
    await this.invalidateInsightCache(details.insight_id);

    return link;
  }

  async detachTag(insightId: string, tagId: string): Promise<void> {
    if (!insightId || !tagId)
      throw new ServiceError("insight_id and tag_id are required", 400);

    await this.repo.detachTag(insightId, tagId);

    await this.cache.invalidate(
      CacheKeys.scoped(Resource.InsightTag, insightId),
    );
    await this.invalidateInsightCache(insightId);
  }

  async getTagsForInsight(insightId: string): Promise<InsightTag[]> {
    if (!insightId) throw new ServiceError("insight_id is required", 400);

    return this.cache.remember(
      CacheKeys.scoped(Resource.InsightTag, insightId),
      () => this.repo.getTagsForInsight(insightId),
    );
  }
}
