CREATE TABLE users (
  id                  UUID         PRIMARY KEY DEFAULT gen_random_uuid(),
  name                VARCHAR(150) NOT NULL,
  email               CITEXT         NOT NULL,
  phone               VARCHAR(32),
  whatsapp_number     VARCHAR(32),          -- click-to-WhatsApp is the primary CTA
  password_hash       TEXT         NOT NULL,  -- argon2id or bcrypt cost 12
  google_auth_secret  TEXT,
  role                user_role    NOT NULL DEFAULT 'viewer',
  is_active           BOOLEAN      NOT NULL DEFAULT TRUE,
  email_verified_at   TIMESTAMPTZ,
  last_login_at       TIMESTAMPTZ,
  failed_login_count  SMALLINT     NOT NULL DEFAULT 0,
  locked_until        TIMESTAMPTZ,
  created_at          TIMESTAMPTZ  NOT NULL DEFAULT now(),
  updated_at          TIMESTAMPTZ  NOT NULL DEFAULT now(),
  deleted_at          TIMESTAMPTZ
);

CREATE UNIQUE INDEX users_email_uq ON users (email) WHERE deleted_at IS NULL;
CREATE INDEX users_role_idx  ON users (role) WHERE deleted_at IS NULL;