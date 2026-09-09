CREATE TABLE listing_media (
  id                  UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  listing_id          UUID        NOT NULL REFERENCES listings(id) ON DELETE CASCADE,
  type                media_type  NOT NULL DEFAULT 'image',
  url                 TEXT        NOT NULL,
  thumbnail_url       TEXT,
  watermarked_url     TEXT,                   -- anti-scrape; serve this publicly
  provider            VARCHAR(40) NOT NULL DEFAULT 'cloudinary',
  provider_public_id  TEXT,                   -- required to delete or transform later
  alt_text            VARCHAR(180),           -- image SEO, and accessibility
  caption             VARCHAR(200),
  width               INTEGER,
  height              INTEGER,                -- reserve space; protects Core Web Vitals
  bytes               BIGINT,
  duration_seconds    INTEGER,                -- video only
  is_primary          BOOLEAN     NOT NULL DEFAULT FALSE,
  sort_order          INTEGER     NOT NULL DEFAULT 0,
  created_at          TIMESTAMPTZ NOT NULL DEFAULT now(),
  deleted_at          TIMESTAMPTZ
);

-- exactly one cover image per listing
CREATE UNIQUE INDEX media_primary_uq ON listing_media (listing_id)
  WHERE is_primary AND deleted_at IS NULL;
CREATE INDEX media_order_idx ON listing_media (listing_id, sort_order)
  WHERE deleted_at IS NULL;