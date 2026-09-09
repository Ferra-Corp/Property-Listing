CREATE TABLE insight_listings (
  insight_id UUID    NOT NULL REFERENCES insights(id) ON DELETE CASCADE,
  listing_id UUID    NOT NULL REFERENCES listings(id) ON DELETE CASCADE,
  sort_order INTEGER NOT NULL DEFAULT 0,
  PRIMARY KEY (insight_id, listing_id)
);
