CREATE TABLE leads (
  id                 UUID          PRIMARY KEY DEFAULT gen_random_uuid(),

  -- ── who ─────────────────────────────────────────────────────
  full_name          VARCHAR(150)  NOT NULL,
  email              CITEXT,
  phone              VARCHAR(32)   NOT NULL,
  whatsapp_number    VARCHAR(32),
  country_code       CHAR(2),                   -- diaspora buyers: 'US', 'GB', 'AE'
  state_region       VARCHAR(100),
  city               VARCHAR(100),

  -- ── what they want ──────────────────────────────────────────
  intent             lead_intent   NOT NULL DEFAULT 'general',
  property_type      property_type,
  property_subtype   property_subtype,
  preferred_location VARCHAR(200),
  budget_min         NUMERIC(16,2),
  budget_max         NUMERIC(16,2),
  currency_code      CHAR(3)       NOT NULL DEFAULT 'KES',
  requirements       TEXT,                      -- free text from the form
  listing_id         UUID          REFERENCES listings(id),  -- null = no match yet
  user_id            UUID          REFERENCES users(id),     -- rarely set

  -- ── attribution: how you prove the SEO spend worked ─────────
  source             lead_source   NOT NULL DEFAULT 'contact_form',
  source_page        TEXT,
  referrer           TEXT,
  utm_source         VARCHAR(120),
  utm_medium         VARCHAR(120),
  utm_campaign       VARCHAR(120),
  utm_term           VARCHAR(120),
  utm_content        VARCHAR(120),

  -- ── pipeline ────────────────────────────────────────────────
  status             lead_status   NOT NULL DEFAULT 'new',
  assigned_agent_id  UUID          REFERENCES users(id),
  first_contacted_at TIMESTAMPTZ,
  lost_reason        VARCHAR(200),

  ip_address         INET,
  user_agent         TEXT,
  consent_marketing  BOOLEAN       NOT NULL DEFAULT FALSE,

  created_at         TIMESTAMPTZ   NOT NULL DEFAULT now(),
  updated_at         TIMESTAMPTZ   NOT NULL DEFAULT now(),
  deleted_at         TIMESTAMPTZ,

  CONSTRAINT lead_reachable CHECK (email IS NOT NULL OR phone IS NOT NULL)
);

CREATE INDEX leads_status_idx  ON leads (status, created_at DESC) WHERE deleted_at IS NULL;
CREATE INDEX leads_agent_idx   ON leads (assigned_agent_id, status);
CREATE INDEX leads_listing_idx ON leads (listing_id);
CREATE INDEX leads_attrib_idx  ON leads (utm_source, utm_campaign, created_at DESC);
CREATE INDEX leads_phone_idx   ON leads (phone);