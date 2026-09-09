CREATE TABLE redirects (
  id          UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  from_path   VARCHAR(400) NOT NULL UNIQUE,
  to_path     VARCHAR(400) NOT NULL,
  status_code SMALLINT    NOT NULL DEFAULT 301,
  hits        INTEGER     NOT NULL DEFAULT 0,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);