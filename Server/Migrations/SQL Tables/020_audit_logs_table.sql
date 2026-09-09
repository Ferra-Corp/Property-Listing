CREATE TABLE audit_logs (
  id          BIGSERIAL   PRIMARY KEY,
  user_id     UUID        REFERENCES users(id),
  entity_type TEXT        NOT NULL,
  entity_id   TEXT        NOT NULL,
  action      TEXT        NOT NULL,   -- created | updated | deleted | published
  changes     JSONB,                    -- { field: [before, after] }
  ip_address  INET,
  user_agent  TEXT,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX audit_entity_idx ON audit_logs (entity_type, entity_id, created_at DESC);