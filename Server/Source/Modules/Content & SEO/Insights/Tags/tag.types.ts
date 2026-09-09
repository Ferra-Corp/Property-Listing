/** Mirrors `insight_tags` exactly — a pure many-to-many join, no surrogate id, no timestamps. */
export type InsightTag = {
  insight_id: string;
  tag_id: string;
};

export type attachTagDTO = {
  insight_id: string;
  tag_id: string;
};

export interface InsightTagRepository {
  attachTag: (details: attachTagDTO) => Promise<InsightTag>;
  detachTag: (insightId: string, tagId: string) => Promise<void>;
  getTagsForInsight: (insightId: string) => Promise<InsightTag[]>;
}

export interface InsightTagService {
  attachTag: (details: attachTagDTO) => Promise<InsightTag>;
  detachTag: (insightId: string, tagId: string) => Promise<void>;
  getTagsForInsight: (insightId: string) => Promise<InsightTag[]>;
}
