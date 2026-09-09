CREATE TABLE insight_views (
  id           BIGSERIAL   PRIMARY KEY,
  insight_id   UUID        NOT NULL REFERENCES insights(id) ON DELETE CASCADE,
  session_hash VARCHAR(64),
  country_code CHAR(2),
  referrer     TEXT,
  utm_source   VARCHAR(120),
  device       VARCHAR(20),
  created_at   TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX insight_views_insight_idx ON insight_views (insight_id, created_at DESC);
CREATE INDEX insight_views_geo_idx     ON insight_views (country_code, created_at DESC);
