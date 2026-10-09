-- Client testimonials shown on the public site. `created_at` doubles as the
-- date the testimonial was written. `profile_picture` is a Cloudinary URL.
-- `is_active` lets staff hold a testimonial back without deleting it.
CREATE TABLE testimonials (
  id               UUID         PRIMARY KEY DEFAULT gen_random_uuid(),
  name             TEXT         NOT NULL,
  quote            TEXT         NOT NULL,
  rating           SMALLINT     NOT NULL DEFAULT 5 CHECK (rating BETWEEN 1 AND 5),
  company_name     TEXT,
  profile_picture  TEXT,
  is_active        BOOLEAN      NOT NULL DEFAULT TRUE,
  created_at       TIMESTAMPTZ  NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at       TIMESTAMPTZ  NOT NULL DEFAULT CURRENT_TIMESTAMP,
  deleted_at       TIMESTAMPTZ
);

CREATE INDEX testimonials_active_idx ON testimonials (created_at DESC)
  WHERE deleted_at IS NULL;
