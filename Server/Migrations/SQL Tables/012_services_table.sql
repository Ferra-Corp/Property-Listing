CREATE TABLE services (
  id               UUID         PRIMARY KEY DEFAULT gen_random_uuid(),
  slug             VARCHAR(120) NOT NULL,
  title            VARCHAR(150) NOT NULL,
  summary          VARCHAR(300),
  description      TEXT,
  icon             VARCHAR(60),
  image_url        TEXT,
  meta_title       VARCHAR(70),
  meta_description VARCHAR(180),
  sort_order       INTEGER      NOT NULL DEFAULT 0,
  is_active        BOOLEAN      NOT NULL DEFAULT TRUE,
  created_at       TIMESTAMPTZ  NOT NULL DEFAULT now(),
  updated_at       TIMESTAMPTZ  NOT NULL DEFAULT now(),
  deleted_at       TIMESTAMPTZ
);
CREATE UNIQUE INDEX services_slug_uq ON services (slug) WHERE deleted_at IS NULL;