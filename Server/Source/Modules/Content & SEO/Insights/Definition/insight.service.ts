import { ServiceError } from "../../../../Utilities/Http.js";
import {
  Cache,
  CacheKeys,
  Resource,
} from "../../../../../Configurations/Cache.js";
import type {
  createInsightDTO,
  Insight,
  InsightRepository,
  InsightService,
  InsightWithTags,
  UpdateInsightDTO,
} from "./insight.types.js";

const REQUIRED_INSIGHT_FIELDS: (keyof createInsightDTO)[] = [
  "slug",
  "title",
  "content",
];

const UPDATABLE_INSIGHT_FIELDS: (keyof UpdateInsightDTO)[] = [
  "slug",
  "title",
  "summary",
  "content",
  "cover_image_url",
  "cover_image_alt",
  "author_id",
  "status",
  "target_country_code",
  "target_state_region",
  "target_city",
  "meta_title",
  "meta_description",
  "canonical_url",
  "og_image_url",
  "noindex",
  "word_count",
  "published_at",
  "read_minutes",
];

export class InsightServ implements InsightService {
  constructor(
    private repo: InsightRepository,
    private cache: Cache,
  ) {}

  private countWords(sentence: string): number {
    const words = sentence.split(" ");
    return words.length;
  }

  async createInsight(details: createInsightDTO): Promise<Insight> {
    if (!details)
      throw new ServiceError("Insight details must be provided", 400);

    for (let key of REQUIRED_INSIGHT_FIELDS) {
      const value = details[key];

      if (value == undefined || value == null)
        throw new ServiceError(`${key} has an invalid value`, 400);
    }

    const newInsight = await this.repo.createInsight({
      ...details,
      word_count: this.countWords(details.content),
    });

    await this.cache.invalidate(
      CacheKeys.all(Resource.Insight),
      `${CacheKeys.all(Resource.Insight)}:public`,
    );

    return newInsight;
  }

  async editInsight(id: string, details: UpdateInsightDTO): Promise<Insight> {
    if (!id || !details)
      throw new ServiceError("Insight id and details must be provided", 400);

    let filteredDetails: UpdateInsightDTO = {};

    for (let key of UPDATABLE_INSIGHT_FIELDS) {
      const value = details[key];

      if (value == undefined || value == null) continue;

      filteredDetails[key] = value as never;
    }

    if (Object.keys(filteredDetails).length == 0)
      throw new ServiceError("Nothing to update", 400);

    if (details.status == "published")
      filteredDetails["published_at"] = new Date().toUTCString();
    else if (details.status == "draft" || details.status == "archived")
      filteredDetails["published_at"] = null;

    const patchedInsight = await this.repo.editInsight(id, filteredDetails);

    await this.cache.invalidate(
      CacheKeys.single(Resource.Insight, id),
      `${CacheKeys.single(Resource.Insight, id)}:public`,
      CacheKeys.all(Resource.Insight),
      `${CacheKeys.all(Resource.Insight)}:public`,
    );

    return patchedInsight;
  }

  async getInsight(
    id: string,
    publicOnly = false,
  ): Promise<InsightWithTags> {
    if (!id) throw new ServiceError("Insight id must be provided", 400);

    const cacheKey = publicOnly
      ? `${CacheKeys.single(Resource.Insight, id)}:public`
      : CacheKeys.single(Resource.Insight, id);

    return this.cache.remember(cacheKey, async () => {
      const insight = await this.repo.getInsight(id, publicOnly);

      if (!insight) throw new ServiceError("Insight not found", 404);

      return insight;
    });
  }

  async getInsights(publicOnly = false): Promise<InsightWithTags[]> {
    const cacheKey = publicOnly
      ? `${CacheKeys.all(Resource.Insight)}:public`
      : CacheKeys.all(Resource.Insight);

    return this.cache.remember(cacheKey, () =>
      this.repo.getInsights(publicOnly),
    );
  }

  async deleteInsight(id: string): Promise<void> {
    if (!id) throw new ServiceError("Insight id must be provided", 404);

    await this.repo.deleteInsight(id);

    await this.cache.invalidate(
      CacheKeys.single(Resource.Insight, id),
      `${CacheKeys.single(Resource.Insight, id)}:public`,
      CacheKeys.all(Resource.Insight),
      `${CacheKeys.all(Resource.Insight)}:public`,
    );
  }
}
