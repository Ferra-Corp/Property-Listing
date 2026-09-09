CREATE TABLE agent_profiles (
  id                UUID         PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id           UUID         NOT NULL UNIQUE REFERENCES users(id) ON DELETE CASCADE,
  slug              VARCHAR(160) NOT NULL,   -- /agents/dennis-onyiego
  display_name      VARCHAR(150) NOT NULL,
  title             VARCHAR(120),             -- 'Commercial Property Consultant'
  bio               TEXT,
  photo_url         TEXT,
  license_number    VARCHAR(64),              -- EARB registration, if displayable
  phone             VARCHAR(32),
  whatsapp_number   VARCHAR(32),
  email_public      CITEXT,
  specializations   TEXT[]       NOT NULL DEFAULT '{}',  -- {'go_downs','retail'}
  languages         TEXT[]       NOT NULL DEFAULT '{}',
  years_experience  SMALLINT,
  linkedin_url      TEXT,
  instagram_url     TEXT,
  meta_title        VARCHAR(70),
  meta_description  VARCHAR(180),
  is_active         BOOLEAN      NOT NULL DEFAULT TRUE,
  sort_order        INTEGER      NOT NULL DEFAULT 0,
  created_at        TIMESTAMPTZ  NOT NULL DEFAULT now(),
  updated_at        TIMESTAMPTZ  NOT NULL DEFAULT now(),
  deleted_at        TIMESTAMPTZ
);

CREATE UNIQUE INDEX agent_slug_uq ON agent_profiles (slug) WHERE deleted_at IS NULL;