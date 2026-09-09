CREATE TABLE listings (
  id                UUID         PRIMARY KEY DEFAULT gen_random_uuid(),

  -- ── identity ────────────────────────────────────────────────
  reference_code    VARCHAR(24)  NOT NULL,   -- 'FC-IND-000042', quoted on calls
  slug              VARCHAR(200) NOT NULL,   -- 'go-down-mombasa-road-18000-sqft'
  title             VARCHAR(200) NOT NULL,
  summary           VARCHAR(300),             -- card blurb, not the meta description
  description       TEXT         NOT NULL,

  -- ── classification ──────────────────────────────────────────
  property_type     property_type    NOT NULL,
  property_subtype  property_subtype,
  purpose           listing_purpose  NOT NULL,
  status            listing_status   NOT NULL DEFAULT 'draft',

  -- ── location: structured for geo landing pages + schema.org ──
  country_code      CHAR(2)      NOT NULL DEFAULT 'KE',
  state_region      VARCHAR(100),             -- county, or U.S. state
  city              VARCHAR(100),
  neighbourhood     VARCHAR(120),             -- 'Karen', 'Westlands'
  location_label    VARCHAR(200) NOT NULL,   -- what the agent types, shown as-is
  address_line      VARCHAR(200),             -- admin-only, never rendered publicly
  postal_code       VARCHAR(20),
  latitude          NUMERIC(9,6),             -- nullable; maps deferred by the client
  longitude         NUMERIC(9,6),

  -- ── pricing ─────────────────────────────────────────────────
  price             NUMERIC(16,2),
  currency_code     CHAR(3)       NOT NULL DEFAULT 'KES',
  price_period      price_period  NOT NULL DEFAULT 'total',
  price_on_request  BOOLEAN       NOT NULL DEFAULT FALSE,
  service_charge    NUMERIC(16,2),
  service_charge_period price_period,

  -- ── filterable attributes, promoted out of JSONB ────────────
  bedrooms          SMALLINT,
  bathrooms         SMALLINT,
  parking_spaces    SMALLINT,
  floor_area        NUMERIC(12,2),
  floor_area_unit   area_unit,
  land_area         NUMERIC(12,2),
  land_area_unit    area_unit,
  floors            SMALLINT,
  year_built        SMALLINT,
  features          JSONB        NOT NULL DEFAULT '{}',  -- long tail ONLY

  -- ── ownership & merchandising ───────────────────────────────
  agent_id          UUID         NOT NULL REFERENCES users(id),
  created_by        UUID         REFERENCES users(id),
  is_exclusive      BOOLEAN      NOT NULL DEFAULT FALSE,
  is_featured       BOOLEAN      NOT NULL DEFAULT FALSE,
  view_count        INTEGER      NOT NULL DEFAULT 0,

  -- ── SEO ─────────────────────────────────────────────────────
  meta_title        VARCHAR(70),
  meta_description  VARCHAR(180),
  og_image_url      TEXT,
  canonical_url     TEXT,
  noindex           BOOLEAN      NOT NULL DEFAULT FALSE,

  search_vector     TSVECTOR GENERATED ALWAYS AS (
      setweight(to_tsvector('english', coalesce(title,'')), 'A') ||
      setweight(to_tsvector('english', coalesce(location_label,'')), 'B') ||
      setweight(to_tsvector('english', coalesce(description,'')), 'C')
  ) STORED,

  published_at      TIMESTAMPTZ,
  sold_at           TIMESTAMPTZ,
  created_at        TIMESTAMPTZ  NOT NULL DEFAULT now(),
  updated_at        TIMESTAMPTZ  NOT NULL DEFAULT now(),
  deleted_at        TIMESTAMPTZ,

  CONSTRAINT price_present CHECK (price_on_request OR price IS NOT NULL),
  CONSTRAINT area_unit_paired CHECK (
    (floor_area IS NULL) = (floor_area_unit IS NULL)
  )
);

CREATE UNIQUE INDEX listings_slug_uq ON listings (slug) WHERE deleted_at IS NULL;
CREATE UNIQUE INDEX listings_ref_uq  ON listings (reference_code);
CREATE INDEX listings_live_idx  ON listings (published_at DESC)
  WHERE status = 'published' AND deleted_at IS NULL;
CREATE INDEX listings_facet_idx ON listings (property_type, purpose, status);
CREATE INDEX listings_geo_idx   ON listings (country_code, state_region, city);
CREATE INDEX listings_price_idx ON listings (currency_code, price)
  WHERE status = 'published' AND deleted_at IS NULL;
CREATE INDEX listings_beds_idx  ON listings (bedrooms, bathrooms);
CREATE INDEX listings_agent_idx ON listings (agent_id);
CREATE INDEX listings_search_ix ON listings USING GIN (search_vector);
CREATE INDEX listings_feat_ix   ON listings USING GIN (features);