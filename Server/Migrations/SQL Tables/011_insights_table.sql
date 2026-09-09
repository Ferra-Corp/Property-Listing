CREATE TABLE insights (
  id                  UUID           PRIMARY KEY DEFAULT gen_random_uuid(),
  slug                VARCHAR(200)   NOT NULL,
  title               VARCHAR(200)   NOT NULL,
  summary             VARCHAR(300),
  content             TEXT           NOT NULL,
  cover_image_url     TEXT,
  cover_image_alt     VARCHAR(180),
  author_id           UUID           REFERENCES users(id),
  status              content_status NOT NULL DEFAULT 'draft',

  -- geo targeting — this is the SEO mechanism, not metadata
  target_country_code CHAR(2),
  target_state_region VARCHAR(100),
  target_city         VARCHAR(100),

  meta_title          VARCHAR(70),
  meta_description    VARCHAR(180),
  canonical_url       TEXT,
  og_image_url        TEXT,
  noindex             BOOLEAN        NOT NULL DEFAULT FALSE,

  word_count          INTEGER        NOT NULL DEFAULT 0,
  read_minutes        INTEGER GENERATED ALWAYS AS (
                        GREATEST(1, CEIL(COALESCE(word_count,0) / 200.0)::int)
                      ) STORED,
  view_count          INTEGER        NOT NULL DEFAULT 0,

  published_at        TIMESTAMPTZ,
  created_at          TIMESTAMPTZ    NOT NULL DEFAULT now(),
  updated_at          TIMESTAMPTZ    NOT NULL DEFAULT now(),
  deleted_at          TIMESTAMPTZ
);

CREATE UNIQUE INDEX insights_slug_uq ON insights (slug) WHERE deleted_at IS NULL;
CREATE INDEX insights_live_idx ON insights (published_at DESC)
  WHERE status = 'published' AND deleted_at IS NULL;
