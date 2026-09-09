CREATE TABLE valuation_requests (
  id                    UUID          PRIMARY KEY DEFAULT gen_random_uuid(),
  lead_id               UUID          NOT NULL REFERENCES leads(id) ON DELETE CASCADE,

  property_type         property_type NOT NULL,
  property_subtype      property_subtype,
  location_label        VARCHAR(200)  NOT NULL,
  country_code          CHAR(2)       NOT NULL DEFAULT 'KE',
  state_region          VARCHAR(100),
  city                  VARCHAR(100),
  neighbourhood         VARCHAR(120),
  bedrooms              SMALLINT,
  bathrooms             SMALLINT,
  floor_area            NUMERIC(12,2),
  floor_area_unit       area_unit,
  land_area             NUMERIC(12,2),
  land_area_unit        area_unit,
  owner_expectation     NUMERIC(16,2),             -- what the owner hopes for

  -- ── filled in by the agent after the site visit ─────────────
  visit_scheduled_at    TIMESTAMPTZ,
  condition             property_condition,
  evaluation_notes      TEXT,
  estimated_value       NUMERIC(16,2),
  currency_code         CHAR(3)       NOT NULL DEFAULT 'KES',
  valued_at             TIMESTAMPTZ,
  valued_by             UUID          REFERENCES users(id),

  -- ── outcome ─────────────────────────────────────────────────
  list_out              BOOLEAN       NOT NULL DEFAULT FALSE,
  converted_listing_id  UUID          REFERENCES listings(id),
  assigned_agent_id     UUID          REFERENCES users(id),
  status                request_status NOT NULL DEFAULT 'pending',
  message               TEXT,
  created_at            TIMESTAMPTZ   NOT NULL DEFAULT now(),
  updated_at            TIMESTAMPTZ   NOT NULL DEFAULT now(),
  deleted_at            TIMESTAMPTZ
);

CREATE INDEX valuations_queue_idx ON valuation_requests (status, created_at DESC);
CREATE INDEX valuations_agent_idx ON valuation_requests (assigned_agent_id);