CREATE TABLE insight_tags (
  insight_id UUID NOT NULL REFERENCES insights(id) ON DELETE CASCADE,
  tag_id     UUID NOT NULL REFERENCES tags(id)     ON DELETE CASCADE,
  PRIMARY KEY (insight_id, tag_id)
);