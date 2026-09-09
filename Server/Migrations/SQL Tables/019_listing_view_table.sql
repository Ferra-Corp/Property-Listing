CREATE TABLE listing_views (
  id           BIGSERIAL   PRIMARY KEY,
  listing_id   UUID        NOT NULL REFERENCES listings(id) ON DELETE CASCADE,
  session_hash VARCHAR(64),              -- hashed; no raw IP retained
  country_code CHAR(2),                  -- proves the U.S. traffic, or disproves it
  referrer     TEXT,
  utm_source   VARCHAR(120),
  device       VARCHAR(20),
  created_at   TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX views_listing_idx ON listing_views (listing_id, created_at DESC);
CREATE INDEX views_geo_idx     ON listing_views (country_code, created_at DESC);
