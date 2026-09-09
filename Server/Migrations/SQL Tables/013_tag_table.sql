CREATE TABLE tags (
  id   UUID         PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(80)  NOT NULL,
  slug VARCHAR(90)  NOT NULL UNIQUE
);