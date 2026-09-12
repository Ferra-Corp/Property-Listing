import type { Tag } from "../../Tags/tag.types.js";

export type ContentStatus = "draft" | "published" | "archived";

export type Insight = {
  id: string;
  slug: string;
  title: string;
  summary: string | null;
  content: string;
  cover_image_url: string | null;
  cover_image_alt: string | null;
  author_id: string | null;
  status: ContentStatus;
  target_country_code: string | null;
  target_state_region: string | null;
  target_city: string | null;
  meta_title: string | null;
  meta_description: string | null;
  canonical_url: string | null;
  og_image_url: string | null;
  noindex: boolean;
  word_count: number;
  read_minutes: number;
  view_count: number;
  published_at: string | null;
  created_at: string;
  updated_at: string;
  deleted_at: string | null;
};

export type createInsightDTO = {
  slug: string;
  title: string;
  summary?: string | null;
  content: string;
  cover_image_url?: string | null;
  cover_image_alt?: string | null;
  author_id?: string | null;
  status?: ContentStatus;
  target_country_code?: string | null;
  target_state_region?: string | null;
  target_city?: string | null;
  meta_title?: string | null;
  meta_description?: string | null;
  canonical_url?: string | null;
  og_image_url?: string | null;
  noindex?: boolean;
  word_count?: number;
  published_at?: string | null;
  read_minutes?: string;
};

export type UpdateInsightDTO = Partial<createInsightDTO>;

export type InsightWithTags = Insight & { tags: Tag[] };

export interface InsightRepository {
  createInsight: (details: createInsightDTO) => Promise<Insight>;
  editInsight: (id: string, details: UpdateInsightDTO) => Promise<Insight>;
  getInsight: (
    id: string,
    publicOnly?: boolean,
  ) => Promise<InsightWithTags | null>;
  getInsights: (publicOnly?: boolean) => Promise<InsightWithTags[]>;
  deleteInsight: (id: string) => Promise<void>;
}

export interface InsightService {
  createInsight: (details: createInsightDTO) => Promise<Insight>;
  editInsight: (id: string, details: UpdateInsightDTO) => Promise<Insight>;
  getInsight: (id: string, publicOnly?: boolean) => Promise<InsightWithTags>;
  getInsights: (publicOnly?: boolean) => Promise<InsightWithTags[]>;
  deleteInsight: (id: string) => Promise<void>;
}
