/** Mirrors `insight_tags` exactly — a pure many-to-many join, no surrogate id, no timestamps. */
export type InsightTag = {
  insight_id: string
  tag_id: string
}

export type attachTagDTO = {
  tag_id: string
}

export type InsightTagContext = {
  attachTag: (insightId: string, details: attachTagDTO) => Promise<void>
  detachTag: (insightId: string, tagId: string) => Promise<void>
  getTagsForInsight: (insightId: string) => Promise<InsightTag[]>
}
