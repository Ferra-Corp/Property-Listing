export type InsightView = {
  id: number;
  insight_id: string;
  session_hash: string | null;
  country_code: string | null;
  referrer: string | null;
  utm_source: string | null;
  device: string | null;
  created_at: string;
};

export type createInsightViewDTO = {
  insight_id: string;
  session_hash?: string | null;
  country_code?: string | null;
  referrer?: string | null;
  utm_source?: string | null;
  device?: string | null;
};

export interface InsightViewRepository {
  createView: (details: createInsightViewDTO) => Promise<InsightView>;
  getViews: () => Promise<InsightView[]>;
}

export interface InsightViewService {
  createView: (details: createInsightViewDTO) => Promise<InsightView>;
  getViews: () => Promise<InsightView[]>;
}
